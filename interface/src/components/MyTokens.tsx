'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { FACTORY_ADDRESS, FACTORY_ABI, TOKEN_ABI } from '@/config/contracts';
import { formatUnits } from 'viem';
import { TokenManagement } from './TokenManagement';

function TokenCard({ address, onManage }: { address: `0x${string}`; onManage: () => void }) {
  const { data: results } = useReadContracts({
    contracts: [
      { address, abi: TOKEN_ABI, functionName: 'name' },
      { address, abi: TOKEN_ABI, functionName: 'symbol' },
      { address, abi: TOKEN_ABI, functionName: 'totalSupply' },
      { address, abi: TOKEN_ABI, functionName: 'getTotalBuyTax' },
      { address, abi: TOKEN_ABI, functionName: 'getTotalSellTax' },
    ],
  });

  const name = results?.[0]?.result as string | undefined;
  const symbol = results?.[1]?.result as string | undefined;
  const totalSupply = results?.[2]?.result as bigint | undefined;
  const buyTax = results?.[3]?.result as bigint | undefined;
  const sellTax = results?.[4]?.result as bigint | undefined;

  return (
    <article className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#333] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold">{name || 'Loading...'}</h3>
          <p className="text-sm text-[#888]">{symbol || '...'}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onManage}
            className="text-xs px-3 py-1 bg-white text-black font-medium rounded hover:bg-gray-100 transition-colors min-h-[24px]"
            aria-label={`Manage ${name || 'token'}`}
          >
            Manage
          </button>
          <a
            href={`https://bscscan.com/token/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#666] hover:text-white transition-colors focus-visible:text-white min-h-[24px] min-w-[24px] flex items-center justify-center"
            aria-label={`View ${name || 'token'} on BscScan`}
          >
            ↗
          </a>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#666]">Supply</span>
          <span className="tabular-nums">
            {totalSupply ? Number(formatUnits(totalSupply, 18)).toLocaleString() : '...'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666]">Buy Tax</span>
          <span className="tabular-nums">
            {buyTax !== undefined ? `${Number(buyTax) / 100}%` : '...'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666]">Sell Tax</span>
          <span className="tabular-nums">
            {sellTax !== undefined ? `${Number(sellTax) / 100}%` : '...'}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
        <p className="text-xs text-[#666] tabular-nums truncate" title={address}>{address}</p>
      </div>
    </article>
  );
}

export function MyTokens() {
  const { address, isConnected } = useAccount();
  const [managingToken, setManagingToken] = useState<`0x${string}` | null>(null);

  const { data: tokens, isLoading } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'getTokensByOwner',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  if (!isConnected) {
    return (
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">My Tokens</h2>
        <div className="text-center py-8">
          <p className="text-[#666] text-sm mb-3">Connect your wallet to view your tokens</p>
          <p className="text-xs text-[#444]">
            Click "Connect" in the header to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">My Tokens</h2>

        {isLoading ? (
          <div className="grid gap-4" role="status" aria-label="Loading tokens">
            {[1, 2].map((i) => (
              <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 animate-pulse">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="h-5 bg-[#1a1a1a] rounded w-32 mb-2"></div>
                    <div className="h-4 bg-[#1a1a1a] rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-[#1a1a1a] rounded"></div>
                  <div className="h-4 bg-[#1a1a1a] rounded"></div>
                  <div className="h-4 bg-[#1a1a1a] rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !tokens || tokens.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#666] text-sm mb-3">You haven&apos;t created any tokens yet</p>
            <p className="text-xs text-[#444]">
              Fill out the form to create your first token
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tokens.map((tokenAddress) => (
              <TokenCard
                key={tokenAddress}
                address={tokenAddress}
                onManage={() => setManagingToken(tokenAddress)}
              />
            ))}
          </div>
        )}
      </div>

      {managingToken && (
        <TokenManagement
          tokenAddress={managingToken}
          onClose={() => setManagingToken(null)}
        />
      )}
    </>
  );
}
