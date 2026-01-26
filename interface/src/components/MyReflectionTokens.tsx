'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { REFLECTION_FACTORY_ADDRESS, REFLECTION_FACTORY_ABI, REFLECTION_TOKEN_ABI } from '@/config/contracts';
import { formatUnits } from 'viem';
import { ReflectionTokenManagement } from './ReflectionTokenManagement';

function ReflectionTokenCard({ address, onManage }: { address: `0x${string}`; onManage: () => void }) {
  const { data: results } = useReadContracts({
    contracts: [
      { address, abi: REFLECTION_TOKEN_ABI, functionName: 'name' },
      { address, abi: REFLECTION_TOKEN_ABI, functionName: 'symbol' },
      { address, abi: REFLECTION_TOKEN_ABI, functionName: 'totalSupply' },
      { address, abi: REFLECTION_TOKEN_ABI, functionName: 'getTotalBuyTax' },
      { address, abi: REFLECTION_TOKEN_ABI, functionName: 'getTotalSellTax' },
      { address, abi: REFLECTION_TOKEN_ABI, functionName: 'totalFees' },
    ],
  });

  const name = results?.[0]?.result as string | undefined;
  const symbol = results?.[1]?.result as string | undefined;
  const totalSupply = results?.[2]?.result as bigint | undefined;
  const buyTax = results?.[3]?.result as bigint | undefined;
  const sellTax = results?.[4]?.result as bigint | undefined;
  const totalFees = results?.[5]?.result as bigint | undefined;

  return (
    <article className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3 md:p-4 hover:border-purple-500/30 transition-colors">
      <div className="flex items-start justify-between mb-2 md:mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm md:text-base font-semibold">{name || 'Loading...'}</h3>
            <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">RFI</span>
          </div>
          <p className="text-xs md:text-sm text-[#888]">{symbol || '...'}</p>
        </div>
        <div className="flex gap-1.5 md:gap-2">
          <button
            onClick={onManage}
            className="text-xs px-2.5 md:px-3 py-1 bg-white text-black font-medium rounded hover:bg-gray-100 transition-colors min-h-[24px]"
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

      <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
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
        <div className="flex justify-between text-purple-400">
          <span className="text-purple-400/60">Reflected</span>
          <span className="tabular-nums">
            {totalFees ? Number(formatUnits(totalFees, 18)).toLocaleString() : '0'}
          </span>
        </div>
      </div>

      <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-[#1a1a1a]">
        <p className="text-xs text-[#666] tabular-nums truncate" title={address}>{address}</p>
      </div>
    </article>
  );
}

export function MyReflectionTokens() {
  const { address, isConnected } = useAccount();
  const [managingToken, setManagingToken] = useState<`0x${string}` | null>(null);

  const { data: tokens, isLoading } = useReadContract({
    address: REFLECTION_FACTORY_ADDRESS,
    abi: REFLECTION_FACTORY_ABI,
    functionName: 'getTokensByOwner',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  if (!isConnected) {
    return (
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">My Reflection Tokens</h2>
        <div className="text-center py-6 md:py-8">
          <p className="text-[#666] text-xs md:text-sm mb-2 md:mb-3">Connect your wallet to view your tokens</p>
          <p className="text-xs text-[#444]">
            Click "Connect" in the header to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">My Reflection Tokens</h2>

        {isLoading ? (
          <div className="grid gap-3 md:gap-4" role="status" aria-label="Loading tokens">
            {[1, 2].map((i) => (
              <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3 md:p-4 animate-pulse">
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <div className="flex-1">
                    <div className="h-4 md:h-5 bg-[#1a1a1a] rounded w-28 md:w-32 mb-1.5 md:mb-2"></div>
                    <div className="h-3 md:h-4 bg-[#1a1a1a] rounded w-12 md:w-16"></div>
                  </div>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <div className="h-3 md:h-4 bg-[#1a1a1a] rounded"></div>
                  <div className="h-3 md:h-4 bg-[#1a1a1a] rounded"></div>
                  <div className="h-3 md:h-4 bg-[#1a1a1a] rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !tokens || tokens.length === 0 ? (
          <div className="text-center py-6 md:py-8">
            <p className="text-[#666] text-xs md:text-sm mb-2 md:mb-3">You haven&apos;t created any reflection tokens yet</p>
            <p className="text-xs text-[#444]">
              Fill out the form to create your first reflection token
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:gap-4">
            {tokens.map((tokenAddress) => (
              <ReflectionTokenCard
                key={tokenAddress}
                address={tokenAddress}
                onManage={() => setManagingToken(tokenAddress)}
              />
            ))}
          </div>
        )}
      </div>

      {managingToken && (
        <ReflectionTokenManagement
          tokenAddress={managingToken}
          onClose={() => setManagingToken(null)}
        />
      )}
    </>
  );
}
