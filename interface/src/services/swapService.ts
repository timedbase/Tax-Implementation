import { parseEther, formatEther, type Address, type Hash } from 'viem';
import { createWalletFromPrivateKey } from '@/utils/walletManager';
import {
  PANCAKESWAP_ROUTER_ADDRESS,
  PANCAKESWAP_ROUTER_ABI,
  ERC20_ABI,
  WBNB_ADDRESS,
  PANCAKESWAP_MEV_RPC,
} from '@/config/pancakeswap';

export interface BuyTokenParams {
  privateKey: `0x${string}`;
  tokenAddress: Address;
  bnbAmount: string; // Amount of BNB to spend
  slippageTolerance?: number; // default 0.5%
}

export interface SellTokenParams {
  privateKey: `0x${string}`;
  tokenAddress: Address;
  tokenAmount: string; // Amount of tokens to sell
  slippageTolerance?: number; // default 0.5%
}

export interface SwapResult {
  success: boolean;
  txHash?: Hash;
  error?: string;
  amountIn?: bigint;
  amountOut?: bigint;
  estimatedOutput?: string;
}

/**
 * Get expected output amount for a swap
 */
export async function getAmountsOut(
  amountIn: bigint,
  path: Address[],
  privateKey: `0x${string}`
): Promise<readonly bigint[]> {
  const { readClient } = createWalletFromPrivateKey(privateKey);

  const amounts = await readClient.readContract({
    address: PANCAKESWAP_ROUTER_ADDRESS,
    abi: PANCAKESWAP_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [amountIn, path],
  });

  return amounts;
}

/**
 * Buy tokens with exact BNB using swapExactETHForTokens (fast, no quote needed)
 * Uses MEV RPC for write, regular RPC for reads
 */
export async function buyTokenExact(params: BuyTokenParams): Promise<SwapResult> {
  const { privateKey, tokenAddress, bnbAmount } = params;

  try {
    const { writeClient, readClient, address } = createWalletFromPrivateKey(privateKey, PANCAKESWAP_MEV_RPC);
    const bnbAmountBigInt = parseEther(bnbAmount);
    const path: Address[] = [WBNB_ADDRESS, tokenAddress];
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

    // swapExactETHForTokens with amountOutMin = 0 (accept any amount)
    // Uses MEV-protected RPC for sending transaction
    const hash = await writeClient.writeContract({
      address: PANCAKESWAP_ROUTER_ADDRESS,
      abi: PANCAKESWAP_ROUTER_ABI,
      functionName: 'swapExactETHForTokens',
      args: [BigInt(0), path, address, deadline],
      value: bnbAmountBigInt,
    });

    // Use regular RPC for reading receipt
    const receipt = await readClient.waitForTransactionReceipt({ hash });

    return {
      success: receipt.status === 'success',
      txHash: hash,
      error: receipt.status !== 'success' ? 'Transaction failed' : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Buy tokens with BNB on PancakeSwap V2 (with slippage protection)
 */
export async function buyToken(params: BuyTokenParams): Promise<SwapResult> {
  const { privateKey, tokenAddress, bnbAmount, slippageTolerance = 0.5 } = params;

  try {
    const { writeClient, readClient, address } = createWalletFromPrivateKey(privateKey);

    const bnbAmountBigInt = parseEther(bnbAmount);

    // Check BNB balance
    const bnbBalance = await readClient.getBalance({ address });

    if (bnbBalance < bnbAmountBigInt) {
      return {
        success: false,
        error: `Insufficient BNB balance. Required: ${bnbAmount}, Available: ${formatEther(bnbBalance)}`,
      };
    }

    // Get expected output
    const path: Address[] = [WBNB_ADDRESS, tokenAddress];
    const amounts = await getAmountsOut(bnbAmountBigInt, path, privateKey);
    const expectedOutput = amounts[1];

    // Calculate minimum output with slippage
    const slippageMultiplier = BigInt(Math.floor((100 - slippageTolerance) * 100));
    const amountOutMin = (expectedOutput * slippageMultiplier) / BigInt(10000);

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

    // Execute swap
    const hash = await writeClient.writeContract({
      address: PANCAKESWAP_ROUTER_ADDRESS,
      abi: PANCAKESWAP_ROUTER_ABI,
      functionName: 'swapExactETHForTokensSupportingFeeOnTransferTokens',
      args: [amountOutMin, path, address, deadline],
      value: bnbAmountBigInt,
    });

    const receipt = await readClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      return {
        success: true,
        txHash: hash,
        amountIn: bnbAmountBigInt,
        estimatedOutput: formatEther(expectedOutput),
      };
    } else {
      return {
        success: false,
        error: 'Transaction failed',
        txHash: hash,
      };
    }
  } catch (error: any) {
    console.error('Buy token error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Sell tokens for BNB on PancakeSwap V2
 */
export async function sellToken(params: SellTokenParams): Promise<SwapResult> {
  const { privateKey, tokenAddress, tokenAmount, slippageTolerance = 0.5 } = params;

  try {
    const { writeClient, readClient, address } = createWalletFromPrivateKey(privateKey);

    // Get token decimals
    const decimals = await readClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'decimals',
    });

    const tokenAmountBigInt = parseEther(tokenAmount) / BigInt(10 ** (18 - decimals));

    // Check token balance
    const tokenBalance = await readClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    });

    if (tokenBalance < tokenAmountBigInt) {
      return {
        success: false,
        error: `Insufficient token balance. Required: ${tokenAmount}, Available: ${tokenBalance}`,
      };
    }

    // Check and approve token if needed
    const allowance = await readClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [address, PANCAKESWAP_ROUTER_ADDRESS],
    });

    if (allowance < tokenAmountBigInt) {
      const approveHash = await writeClient.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [PANCAKESWAP_ROUTER_ADDRESS, tokenAmountBigInt],
      });
      await readClient.waitForTransactionReceipt({ hash: approveHash });
    }

    // Get expected output
    const path: Address[] = [tokenAddress, WBNB_ADDRESS];
    const amounts = await getAmountsOut(tokenAmountBigInt, path, privateKey);
    const expectedOutput = amounts[1];

    const slippageMultiplier = BigInt(Math.floor((100 - slippageTolerance) * 100));
    const amountOutMin = (expectedOutput * slippageMultiplier) / BigInt(10000);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

    const hash = await writeClient.writeContract({
      address: PANCAKESWAP_ROUTER_ADDRESS,
      abi: PANCAKESWAP_ROUTER_ABI,
      functionName: 'swapExactTokensForETHSupportingFeeOnTransferTokens',
      args: [tokenAmountBigInt, amountOutMin, path, address, deadline],
    });

    const receipt = await readClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      return {
        success: true,
        txHash: hash,
        amountIn: tokenAmountBigInt,
        estimatedOutput: formatEther(expectedOutput),
      };
    } else {
      return {
        success: false,
        error: 'Transaction failed',
        txHash: hash,
      };
    }
  } catch (error: any) {
    console.error('Sell token error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Get quote for buying tokens with BNB
 */
export async function getQuoteBuyToken(
  tokenAddress: Address,
  bnbAmount: string,
  privateKey: `0x${string}`
): Promise<{ expectedOutput: string; priceImpact: number } | null> {
  try {
    const bnbAmountBigInt = parseEther(bnbAmount);
    const path: Address[] = [WBNB_ADDRESS, tokenAddress];
    const amounts = await getAmountsOut(bnbAmountBigInt, path, privateKey);

    return {
      expectedOutput: formatEther(amounts[1]),
      priceImpact: 0, // You can calculate price impact if needed
    };
  } catch (error) {
    console.error('Get quote error:', error);
    return null;
  }
}

/**
 * Get quote for selling tokens for BNB
 */
export async function getQuoteSellToken(
  tokenAddress: Address,
  tokenAmount: string,
  privateKey: `0x${string}`
): Promise<{ expectedOutput: string; priceImpact: number } | null> {
  try {
    const { readClient } = createWalletFromPrivateKey(privateKey);

    const decimals = await readClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'decimals',
    });

    const tokenAmountBigInt = parseEther(tokenAmount) / BigInt(10 ** (18 - decimals));
    const path: Address[] = [tokenAddress, WBNB_ADDRESS];
    const amounts = await getAmountsOut(tokenAmountBigInt, path, privateKey);

    return {
      expectedOutput: formatEther(amounts[1]),
      priceImpact: 0,
    };
  } catch (error) {
    console.error('Get quote error:', error);
    return null;
  }
}
