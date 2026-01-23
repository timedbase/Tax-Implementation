import { parseEther, type Address, type Hash } from 'viem';
import { createWalletFromPrivateKey } from '@/utils/walletManager';
import {
  PANCAKESWAP_ROUTER_ADDRESS,
  PANCAKESWAP_ROUTER_ABI,
  ERC20_ABI,
  WBNB_ADDRESS,
  PANCAKESWAP_MEV_RPC,
} from '@/config/pancakeswap';

export interface AddLiquidityParams {
  privateKey: `0x${string}`;
  tokenAddress: Address;
  tokenAmount: string; // in token units (will be converted based on decimals)
  bnbAmount: string; // in BNB
  slippageTolerance?: number; // default 0.5%
}

export interface AddLiquidityResult {
  success: boolean;
  txHash?: Hash;
  error?: string;
  amountToken?: bigint;
  amountBNB?: bigint;
  liquidity?: bigint;
}

/**
 * Add liquidity to PancakeSwap V2
 */
export async function addLiquidity(params: AddLiquidityParams): Promise<AddLiquidityResult> {
  const { privateKey, tokenAddress, tokenAmount, bnbAmount, slippageTolerance = 0.5 } = params;

  try {
    // Create wallet client with MEV-protected RPC
    const { client, address } = createWalletFromPrivateKey(privateKey, PANCAKESWAP_MEV_RPC);

    // Get token decimals
    const decimals = await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'decimals',
    });

    // Calculate amounts
    const tokenAmountBigInt = parseEther(tokenAmount) / BigInt(10 ** (18 - decimals));
    const bnbAmountBigInt = parseEther(bnbAmount);

    // Calculate minimum amounts with slippage
    const slippageMultiplier = BigInt(Math.floor((100 - slippageTolerance) * 100));
    const tokenAmountMin = (tokenAmountBigInt * slippageMultiplier) / BigInt(10000);
    const bnbAmountMin = (bnbAmountBigInt * slippageMultiplier) / BigInt(10000);

    // Check balances
    const tokenBalance = await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    });

    const bnbBalance = await client.getBalance({ address });

    if (tokenBalance < tokenAmountBigInt) {
      return {
        success: false,
        error: `Insufficient token balance. Required: ${tokenAmount}, Available: ${tokenBalance}`,
      };
    }

    if (bnbBalance < bnbAmountBigInt) {
      return {
        success: false,
        error: `Insufficient BNB balance. Required: ${bnbAmount}, Available: ${bnbBalance}`,
      };
    }

    // Check and approve token if needed
    const allowance = await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [address, PANCAKESWAP_ROUTER_ADDRESS],
    });

    if (allowance < tokenAmountBigInt) {
      console.log('Approving token...');
      const approveHash = await client.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [PANCAKESWAP_ROUTER_ADDRESS, tokenAmountBigInt],
      });

      // Wait for approval transaction
      await client.waitForTransactionReceipt({ hash: approveHash });
      console.log('Token approved:', approveHash);
    }

    // Add liquidity
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes from now

    console.log('Adding liquidity...', {
      token: tokenAddress,
      tokenAmount: tokenAmountBigInt.toString(),
      tokenAmountMin: tokenAmountMin.toString(),
      bnbAmount: bnbAmountBigInt.toString(),
      bnbAmountMin: bnbAmountMin.toString(),
      to: address,
      deadline: deadline.toString(),
    });

    const hash = await client.writeContract({
      address: PANCAKESWAP_ROUTER_ADDRESS,
      abi: PANCAKESWAP_ROUTER_ABI,
      functionName: 'addLiquidityETH',
      args: [tokenAddress, tokenAmountBigInt, tokenAmountMin, bnbAmountMin, address, deadline],
      value: bnbAmountBigInt,
    });

    // Wait for transaction receipt
    const receipt = await client.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      return {
        success: true,
        txHash: hash,
      };
    } else {
      return {
        success: false,
        error: 'Transaction failed',
        txHash: hash,
      };
    }
  } catch (error: any) {
    console.error('Add liquidity error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Get token balance
 */
export async function getTokenBalance(
  tokenAddress: Address,
  walletAddress: Address,
  privateKey: `0x${string}`
): Promise<bigint> {
  const { client } = createWalletFromPrivateKey(privateKey);

  return await client.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [walletAddress],
  });
}

/**
 * Get BNB balance
 */
export async function getBNBBalance(walletAddress: Address, privateKey: `0x${string}`): Promise<bigint> {
  const { client } = createWalletFromPrivateKey(privateKey);

  return await client.getBalance({ address: walletAddress });
}
