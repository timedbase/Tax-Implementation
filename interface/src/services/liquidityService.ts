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
 * Prepare liquidity addition - handles approval if needed
 * Returns the prepared parameters for sending the transaction
 */
export async function prepareLiquidity(params: AddLiquidityParams): Promise<{
  writeClient: ReturnType<typeof createWalletFromPrivateKey>['writeClient'];
  readClient: ReturnType<typeof createWalletFromPrivateKey>['readClient'];
  tokenAmountBigInt: bigint;
  bnbAmountBigInt: bigint;
  address: Address;
}> {
  const { privateKey, tokenAddress, tokenAmount, bnbAmount } = params;

  const { writeClient, readClient, address } = createWalletFromPrivateKey(privateKey, PANCAKESWAP_MEV_RPC);

  // Get token decimals
  const decimals = await readClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  const tokenAmountBigInt = parseEther(tokenAmount) / BigInt(10 ** (18 - decimals));
  const bnbAmountBigInt = parseEther(bnbAmount);

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

  return { writeClient, readClient, tokenAmountBigInt, bnbAmountBigInt, address };
}

/**
 * Send addLiquidityETH transaction - returns hash immediately (no wait)
 */
export async function sendAddLiquidity(
  writeClient: ReturnType<typeof createWalletFromPrivateKey>['writeClient'],
  tokenAddress: Address,
  tokenAmountBigInt: bigint,
  bnbAmountBigInt: bigint,
  address: Address
): Promise<Hash> {
  const tokenAmountMin = BigInt(0);
  const bnbAmountMin = BigInt(0);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

  return await writeClient.writeContract({
    address: PANCAKESWAP_ROUTER_ADDRESS,
    abi: PANCAKESWAP_ROUTER_ABI,
    functionName: 'addLiquidityETH',
    args: [tokenAddress, tokenAmountBigInt, tokenAmountMin, bnbAmountMin, address, deadline],
    value: bnbAmountBigInt,
  });
}

/**
 * Add liquidity to PancakeSwap V2 - sends and returns hash immediately (no wait)
 * Uses MEV RPC for writes, regular BSC RPC for reads
 */
export async function addLiquiditySendOnly(params: AddLiquidityParams): Promise<{ hash: Hash; readClient: ReturnType<typeof createWalletFromPrivateKey>['readClient'] }> {
  const prepared = await prepareLiquidity(params);
  const hash = await sendAddLiquidity(
    prepared.writeClient,
    params.tokenAddress,
    prepared.tokenAmountBigInt,
    prepared.bnbAmountBigInt,
    prepared.address
  );
  return { hash, readClient: prepared.readClient };
}

/**
 * Add liquidity to PancakeSwap V2
 * Uses MEV RPC for writes, regular BSC RPC for reads
 */
export async function addLiquidity(params: AddLiquidityParams): Promise<AddLiquidityResult> {
  try {
    const { hash, readClient } = await addLiquiditySendOnly(params);

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
