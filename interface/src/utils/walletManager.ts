import { createWalletClient, createPublicClient, http, type Address, type Hash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';

const BSC_RPC = process.env.NEXT_PUBLIC_BSC_RPC || 'https://bsc-dataseed.binance.org';

/**
 * Create wallet and public clients from a private key
 * @param privateKey - The private key
 * @param writeRpcUrl - RPC for write operations only (MEV-protected). Reads always use BSC_RPC
 */
export function createWalletFromPrivateKey(privateKey: `0x${string}`, writeRpcUrl?: string) {
  const account = privateKeyToAccount(privateKey);

  // Write client - uses MEV RPC for sending transactions
  const writeClient = createWalletClient({
    account,
    chain: bsc,
    transport: http(writeRpcUrl || BSC_RPC),
  });

  // Read client - always uses regular BSC RPC
  const readClient = createPublicClient({
    chain: bsc,
    transport: http(BSC_RPC),
  });

  return {
    writeClient,
    readClient,
    account,
    address: account.address,
  };
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(address: Address, readClient: ReturnType<typeof createWalletFromPrivateKey>['readClient']) {
  return await readClient.getBalance({ address });
}

/**
 * Validate private key format
 */
export function isValidPrivateKey(privateKey: string): privateKey is `0x${string}` {
  // Check if it starts with 0x and has 64 hex characters (32 bytes)
  const hexPattern = /^0x[0-9a-fA-F]{64}$/;
  return hexPattern.test(privateKey);
}

/**
 * Format private key to ensure 0x prefix
 */
export function formatPrivateKey(privateKey: string): `0x${string}` {
  if (privateKey.startsWith('0x')) {
    return privateKey as `0x${string}`;
  }
  return `0x${privateKey}` as `0x${string}`;
}
