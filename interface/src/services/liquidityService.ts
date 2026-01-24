import { parseEther, type Address, type Hash } from 'viem';
import { createWalletFromPrivateKey } from '@/utils/walletManager';
import {
  PANCAKESWAP_ROUTER_ADDRESS,
  PANCAKESWAP_ROUTER_ABI,
  ERC20_ABI,
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
 * Uses MEV RPC for writes, regular BSC RPC for reads
 */
export async function addLiquidity(params: AddLiquidityParams): Promise<AddLiquidityResult> {
  const { privateKey, tokenAddress, tokenAmount, bnbAmount, slippageTolerance = 0.5 } = params;

  try {
    const { writeClient, readClient, address } = createWalletFromPrivateKey(privateKey, PANCAKESWAP_MEV_RPC);

    // Get token decimals
    const decimals = await readClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'decimals',
    });

    const tokenAmountBigInt = parseEther(tokenAmount) / BigInt(10 ** (18 - decimals));
    const bnbAmountBigInt = parseEther(bnbAmount);

    const slippageMultiplier = BigInt(Math.floor((100 - slippageTolerance) * 100));
    const tokenAmountMin = (tokenAmountBigInt * slippageMultiplier) / BigInt(10000);
    const bnbAmountMin = (bnbAmountBigInt * slippageMultiplier) / BigInt(10000);

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

    // Add liquidity using MEV RPC
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

    const hash = await writeClient.writeContract({
      address: PANCAKESWAP_ROUTER_ADDRESS,
      abi: PANCAKESWAP_ROUTER_ABI,
      functionName: 'addLiquidityETH',
      args: [tokenAddress, tokenAmountBigInt, tokenAmountMin, bnbAmountMin, address, deadline],
      value: bnbAmountBigInt,
    });

    // Wait for receipt using regular BSC RPC
    const receipt = await readClient.waitForTransactionReceipt({ hash });

    return {
      success: receipt.status === 'success',
      txHash: hash,
      error: receipt.status !== 'success' ? 'Transaction failed' : undefined,
    };
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
  const { readClient } = createWalletFromPrivateKey(privateKey);

  return await readClient.readContract({
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
  const { readClient } = createWalletFromPrivateKey(privateKey);

  return await readClient.getBalance({ address: walletAddress });
}
