'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, parseUnits, formatEther } from 'viem';
import { FACTORY_ADDRESS, FACTORY_ABI } from '@/config/contracts';

export function CreateTokenForm() {
  const { isConnected } = useAccount();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [totalSupply, setTotalSupply] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const { data: deploymentFee } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'deploymentFee',
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !symbol || !totalSupply) return;

    const supplyWithDecimals = parseUnits(totalSupply, 18);

    writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'createToken',
      args: [name, symbol, supplyWithDecimals],
      value: deploymentFee || parseEther('0.00022'),
    });
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Create New Token</h2>

      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
        <div>
          <label htmlFor="token-name" className="block text-xs md:text-sm text-[#888] mb-1.5 md:mb-2">
            Token Name
          </label>
          <input
            id="token-name"
            name="tokenName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Token"
            className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg text-sm md:text-base"
            disabled={!isConnected || isPending || isConfirming}
            autoComplete="off"
            spellCheck="false"
            required
          />
        </div>

        <div>
          <label htmlFor="token-symbol" className="block text-xs md:text-sm text-[#888] mb-1.5 md:mb-2">
            Token Symbol
          </label>
          <input
            id="token-symbol"
            name="tokenSymbol"
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="e.g. MTK"
            className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg text-sm md:text-base"
            disabled={!isConnected || isPending || isConfirming}
            autoComplete="off"
            spellCheck="false"
            required
          />
        </div>

        <div>
          <label htmlFor="total-supply" className="block text-xs md:text-sm text-[#888] mb-1.5 md:mb-2">
            Total Supply
          </label>
          <input
            id="total-supply"
            name="totalSupply"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={totalSupply}
            onChange={(e) => setTotalSupply(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 1000000000"
            className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg tabular-nums text-sm md:text-base"
            disabled={!isConnected || isPending || isConfirming}
            autoComplete="off"
            required
          />
          <p className="text-xs text-[#666] mt-1">
            Enter the total supply without decimals (18 decimals will be added automatically)
          </p>
        </div>

        <div className="pt-1 md:pt-2">
          <div className="flex items-center justify-between text-xs md:text-sm mb-3 md:mb-4 p-2.5 md:p-3 bg-[#111] rounded-lg">
            <span className="text-[#888]">Deployment Fee</span>
            <span className="tabular-nums">
              {deploymentFee ? formatEther(deploymentFee) : '0.00022'} BNB
            </span>
          </div>

          <button
            type="submit"
            disabled={!isConnected || isPending || isConfirming || !name || !symbol || !totalSupply}
            className="w-full py-2.5 md:py-3 px-4 text-sm md:text-base bg-white text-black font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {!isConnected
              ? 'Connect Wallet'
              : isPending
              ? 'Confirm in Wallet...'
              : isConfirming
              ? 'Creating Token...'
              : 'Create Token'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-3 md:mt-4 p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-xs md:text-sm">
            Error: {error.message.split('\n')[0]}
          </p>
        </div>
      )}

      {isSuccess && hash && (
        <div className="mt-3 md:mt-4 p-3 md:p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-xs md:text-sm mb-2">Token created successfully!</p>
          <a
            href={`https://bscscan.com/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#888] hover:text-white transition-colors break-all"
          >
            View transaction: {hash}
          </a>
        </div>
      )}

      <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-[#1a1a1a]">
        <h3 className="text-xs md:text-sm font-medium text-[#888] mb-2 md:mb-3">Default Settings</h3>
        <ul className="text-xs text-[#666] space-y-0.5 md:space-y-1">
          <li>• All taxes start at 0%</li>
          <li>• Marketing, Team & Treasury wallets set to your address</li>
          <li>• Swap threshold: 0.02% of supply</li>
          <li>• You can update all settings after deployment</li>
        </ul>
      </div>
    </div>
  );
}
