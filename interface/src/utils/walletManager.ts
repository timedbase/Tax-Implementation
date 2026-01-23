import { createWalletClient, http, publicActions, type Address, type Hash } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';

/**
 * Create a wallet client from a private key
 */
export function createWalletFromPrivateKey(privateKey: `0x${string}`, rpcUrl?: string) {
  const account = privateKeyToAccount(privateKey);

  const client = createWalletClient({
    account,
    chain: bsc,
    transport: http(rpcUrl),
  }).extend(publicActions);

  return {
    client,
    account,
    address: account.address,
  };
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(address: Address, client: ReturnType<typeof createWalletFromPrivateKey>['client']) {
  return await client.getBalance({ address });
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
