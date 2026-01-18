'use client';

import { useReadContracts } from 'wagmi';
import { formatEther } from 'viem';
import { FACTORY_ADDRESS, FACTORY_ABI } from '@/config/contracts';

export function FactoryStats() {
  const { data: results } = useReadContracts({
    contracts: [
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'getDeployedTokensCount',
      },
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'deploymentFee',
      },
      {
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'defaultRouter',
      },
    ],
  });

  const tokenCount = results?.[0]?.result as bigint | undefined;
  const deploymentFee = results?.[1]?.result as bigint | undefined;
  const router = results?.[2]?.result as string | undefined;

  const stats = [
    {
      label: 'Tokens Created',
      value: tokenCount !== undefined ? tokenCount.toString() : '...',
    },
    {
      label: 'Deployment Fee',
      value: deploymentFee ? `${formatEther(deploymentFee)} BNB` : '...',
    },
    {
      label: 'DEX Router',
      value: router === '0x10ED43C718714eb63d5aA57B78B54704E256024E' ? 'PancakeSwap V2' : 'Custom',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3 md:p-4 text-center"
        >
          <p className="text-lg md:text-2xl font-semibold mb-0.5 md:mb-1 tabular-nums">{stat.value}</p>
          <p className="text-xs md:text-sm text-[#666]">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
