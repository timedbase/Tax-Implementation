'use client';

import { useState } from 'react';
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { TOKEN_ABI } from '@/config/contracts';
import { formatUnits, parseUnits, isAddress } from 'viem';

interface TokenManagementProps {
  tokenAddress: `0x${string}`;
  onClose: () => void;
}

export function TokenManagement({ tokenAddress, onClose }: TokenManagementProps) {
  const { address: userAddress } = useAccount();
  const [activeTab, setActiveTab] = useState<'taxes' | 'wallets' | 'settings' | 'ownership'>('taxes');

  // Fetch all token data
  const { data: tokenData, refetch } = useReadContracts({
    contracts: [
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'name' },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'symbol' },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'owner' },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'totalSupply' },
      // Buy taxes
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'buyMarketingTax' },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'buyTeamTax' },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'buyTreasuryTax' },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'buyBurnTax' },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'buyLiquidityTax' },
      // Sell taxes
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'sellMarketingTax' },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'sellTeamTax' },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'sellTreasuryTax' },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'sellBurnTax' },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'sellLiquidityTax' },
      // Wallets
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'marketingWallet' },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'teamWallet' },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'treasuryWallet' },
      // Settings
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'swapThreshold' },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'swapEnabled' },
      { address: tokenAddress, abi: TOKEN_ABI, functionName: 'pancakePair' },
    ],
  });

  const name = tokenData?.[0]?.result as string | undefined;
  const symbol = tokenData?.[1]?.result as string | undefined;
  const owner = tokenData?.[2]?.result as string | undefined;
  const totalSupply = tokenData?.[3]?.result as bigint | undefined;

  const buyMarketingTax = Number(tokenData?.[4]?.result || 0);
  const buyTeamTax = Number(tokenData?.[5]?.result || 0);
  const buyTreasuryTax = Number(tokenData?.[6]?.result || 0);
  const buyBurnTax = Number(tokenData?.[7]?.result || 0);
  const buyLiquidityTax = Number(tokenData?.[8]?.result || 0);

  const sellMarketingTax = Number(tokenData?.[9]?.result || 0);
  const sellTeamTax = Number(tokenData?.[10]?.result || 0);
  const sellTreasuryTax = Number(tokenData?.[11]?.result || 0);
  const sellBurnTax = Number(tokenData?.[12]?.result || 0);
  const sellLiquidityTax = Number(tokenData?.[13]?.result || 0);

  const marketingWallet = tokenData?.[14]?.result as string | undefined;
  const teamWallet = tokenData?.[15]?.result as string | undefined;
  const treasuryWallet = tokenData?.[16]?.result as string | undefined;

  const swapThreshold = tokenData?.[17]?.result as bigint | undefined;
  const swapEnabled = tokenData?.[18]?.result as boolean | undefined;
  const pancakePair = tokenData?.[19]?.result as string | undefined;

  const isOwner = owner?.toLowerCase() === userAddress?.toLowerCase();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Refetch data when transaction succeeds
  if (isSuccess) {
    refetch();
  }

  const tabs = [
    { id: 'taxes' as const, label: 'Taxes' },
    { id: 'wallets' as const, label: 'Wallets' },
    { id: 'settings' as const, label: 'Settings' },
    { id: 'ownership' as const, label: 'Ownership' },
  ];

  if (!isOwner) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 max-w-sm w-full">
          <h2 className="text-lg font-semibold mb-3">Access Denied</h2>
          <p className="text-sm text-[#888] mb-4">You are not the owner of this token.</p>
          <button
            onClick={onClose}
            className="w-full py-1.5 px-3 text-xs bg-[#1a1a1a] rounded hover:bg-[#2e2e2e] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 overflow-y-auto">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 max-w-2xl w-full my-3 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-2.5">
          <div className="min-w-0 flex-1 mr-2">
            <h2 className="text-sm font-semibold mb-0.5 text-balance truncate">{name || 'Loading...'}</h2>
            <p className="text-[10px] text-[#888] truncate">{symbol} · {tokenAddress?.slice(0, 6)}...{tokenAddress?.slice(-4)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-white transition-colors min-h-[20px] min-w-[20px] text-lg flex-shrink-0"
            aria-label="Close management panel"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-2.5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-black'
                  : 'bg-[#1a1a1a] hover:bg-[#2e2e2e] text-[#888]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'taxes' && (
            <TaxConfiguration
              tokenAddress={tokenAddress}
              buyTaxes={{ marketing: buyMarketingTax, team: buyTeamTax, treasury: buyTreasuryTax, burn: buyBurnTax, liquidity: buyLiquidityTax }}
              sellTaxes={{ marketing: sellMarketingTax, team: sellTeamTax, treasury: sellTreasuryTax, burn: sellBurnTax, liquidity: sellLiquidityTax }}
              writeContract={writeContract}
              isPending={isPending}
              isConfirming={isConfirming}
              isSuccess={isSuccess}
              error={error}
            />
          )}

          {activeTab === 'wallets' && (
            <WalletManagement
              tokenAddress={tokenAddress}
              marketingWallet={marketingWallet}
              teamWallet={teamWallet}
              treasuryWallet={treasuryWallet}
              writeContract={writeContract}
              isPending={isPending}
              isConfirming={isConfirming}
              isSuccess={isSuccess}
              error={error}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              tokenAddress={tokenAddress}
              swapThreshold={swapThreshold}
              swapEnabled={swapEnabled}
              pancakePair={pancakePair}
              totalSupply={totalSupply}
              writeContract={writeContract}
              isPending={isPending}
              isConfirming={isConfirming}
              isSuccess={isSuccess}
              error={error}
            />
          )}

          {activeTab === 'ownership' && (
            <OwnershipManagement
              tokenAddress={tokenAddress}
              currentOwner={owner}
              writeContract={writeContract}
              isPending={isPending}
              isConfirming={isConfirming}
              isSuccess={isSuccess}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Tax Configuration Component
function TaxConfiguration({ tokenAddress, buyTaxes, sellTaxes, writeContract, isPending, isConfirming, isSuccess, error }: any) {
  const [buyForm, setBuyForm] = useState({
    marketing: buyTaxes.marketing / 100,
    team: buyTaxes.team / 100,
    treasury: buyTaxes.treasury / 100,
    burn: buyTaxes.burn / 100,
    liquidity: buyTaxes.liquidity / 100,
  });

  const [sellForm, setSellForm] = useState({
    marketing: sellTaxes.marketing / 100,
    team: sellTaxes.team / 100,
    treasury: sellTaxes.treasury / 100,
    burn: sellTaxes.burn / 100,
    liquidity: sellTaxes.liquidity / 100,
  });

  const buyTotal = Object.values(buyForm).reduce((a, b) => a + b, 0);
  const sellTotal = Object.values(sellForm).reduce((a, b) => a + b, 0);
  const maxTax = 25; // 25%

  const handleUpdateBuyTaxes = () => {
    if (buyTotal > maxTax) return;
    writeContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'setBuyTaxes',
      args: [
        buyForm.marketing * 100,
        buyForm.team * 100,
        buyForm.treasury * 100,
        buyForm.burn * 100,
        buyForm.liquidity * 100,
      ],
    });
  };

  const handleUpdateSellTaxes = () => {
    if (sellTotal > maxTax) return;
    writeContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'setSellTaxes',
      args: [
        sellForm.marketing * 100,
        sellForm.team * 100,
        sellForm.treasury * 100,
        sellForm.burn * 100,
        sellForm.liquidity * 100,
      ],
    });
  };

  return (
    <div className="space-y-2.5">
      {/* Buy Taxes */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded p-2.5">
        <h3 className="font-medium text-xs mb-2">Buy Taxes</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-1.5 mb-2">
          {['marketing', 'team', 'treasury', 'burn', 'liquidity'].map((key) => (
            <div key={key}>
              <label htmlFor={`buy-${key}`} className="block text-[9px] text-[#888] mb-0.5 capitalize truncate">
                {key === 'marketing' ? 'Mkt' : key === 'treasury' ? 'Trs' : key === 'liquidity' ? 'Liq' : key.slice(0, 3)}
              </label>
              <input
                id={`buy-${key}`}
                type="number"
                min="0"
                max={maxTax}
                step="0.1"
                value={buyForm[key as keyof typeof buyForm]}
                onChange={(e) => setBuyForm({ ...buyForm, [key]: Math.max(0, Math.min(maxTax, parseFloat(e.target.value) || 0)) })}
                className="w-full px-1.5 py-1 rounded text-[10px] tabular-nums"
                disabled={isPending || isConfirming}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[#888]">Total:</span>
          <span className={`text-[10px] font-semibold tabular-nums ${buyTotal > maxTax ? 'text-red-400' : 'text-white'}`}>
            {buyTotal.toFixed(1)}%
          </span>
        </div>
        <button
          onClick={handleUpdateBuyTaxes}
          disabled={isPending || isConfirming || buyTotal > maxTax}
          className="w-full py-1 px-2 text-[10px] bg-white text-black font-medium rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isPending || isConfirming ? 'Updating...' : 'Update'}
        </button>
      </div>

      {/* Sell Taxes */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded p-2.5">
        <h3 className="font-medium text-xs mb-2">Sell Taxes</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-1.5 mb-2">
          {['marketing', 'team', 'treasury', 'burn', 'liquidity'].map((key) => (
            <div key={key}>
              <label htmlFor={`sell-${key}`} className="block text-[9px] text-[#888] mb-0.5 capitalize truncate">
                {key === 'marketing' ? 'Mkt' : key === 'treasury' ? 'Trs' : key === 'liquidity' ? 'Liq' : key.slice(0, 3)}
              </label>
              <input
                id={`sell-${key}`}
                type="number"
                min="0"
                max={maxTax}
                step="0.1"
                value={sellForm[key as keyof typeof sellForm]}
                onChange={(e) => setSellForm({ ...sellForm, [key]: Math.max(0, Math.min(maxTax, parseFloat(e.target.value) || 0)) })}
                className="w-full px-1.5 py-1 rounded text-[10px] tabular-nums"
                disabled={isPending || isConfirming}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-[#888]">Total:</span>
          <span className={`text-[10px] font-semibold tabular-nums ${sellTotal > maxTax ? 'text-red-400' : 'text-white'}`}>
            {sellTotal.toFixed(1)}%
          </span>
        </div>
        <button
          onClick={handleUpdateSellTaxes}
          disabled={isPending || isConfirming || sellTotal > maxTax}
          className="w-full py-1 px-2 text-[10px] bg-white text-black font-medium rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isPending || isConfirming ? 'Updating...' : 'Update'}
        </button>
      </div>

      {isSuccess && (
        <div className="p-2 bg-green-500/10 border border-green-500/20 rounded">
          <p className="text-green-400 text-[10px]">Taxes updated successfully!</p>
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
          <p className="text-red-400 text-[10px]">Error: {error.message.split('\n')[0]}</p>
        </div>
      )}
    </div>
  );
}

// Wallet Management Component
function WalletManagement({ tokenAddress, marketingWallet, teamWallet, treasuryWallet, writeContract, isPending, isConfirming, isSuccess, error }: any) {
  const [form, setForm] = useState({
    marketing: marketingWallet || '',
    team: teamWallet || '',
    treasury: treasuryWallet || '',
  });

  const allValid = isAddress(form.marketing) && isAddress(form.team) && isAddress(form.treasury);

  const handleUpdate = () => {
    if (!allValid) return;
    writeContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'setWallets',
      args: [form.marketing, form.team, form.treasury],
    });
  };

  return (
    <div className="space-y-2.5">
      <div className="bg-[#111] border border-[#1a1a1a] rounded p-2.5">
        <h3 className="font-medium text-xs mb-2">Tax Wallets</h3>
        <div className="space-y-2">
          <div>
            <label htmlFor="marketing-wallet" className="block text-[10px] text-[#888] mb-1">
              Marketing
            </label>
            <input
              id="marketing-wallet"
              type="text"
              value={form.marketing}
              onChange={(e) => setForm({ ...form, marketing: e.target.value })}
              placeholder="0x..."
              className="w-full px-2 py-1 rounded text-[10px] tabular-nums"
              disabled={isPending || isConfirming}
              autoComplete="off"
              spellCheck="false"
            />
            {form.marketing && !isAddress(form.marketing) && (
              <p className="text-[9px] text-red-400 mt-0.5">Invalid</p>
            )}
          </div>

          <div>
            <label htmlFor="team-wallet" className="block text-[10px] text-[#888] mb-1">
              Team
            </label>
            <input
              id="team-wallet"
              type="text"
              value={form.team}
              onChange={(e) => setForm({ ...form, team: e.target.value })}
              placeholder="0x..."
              className="w-full px-2 py-1 rounded text-[10px] tabular-nums"
              disabled={isPending || isConfirming}
              autoComplete="off"
              spellCheck="false"
            />
            {form.team && !isAddress(form.team) && (
              <p className="text-[9px] text-red-400 mt-0.5">Invalid</p>
            )}
          </div>

          <div>
            <label htmlFor="treasury-wallet" className="block text-[10px] text-[#888] mb-1">
              Treasury
            </label>
            <input
              id="treasury-wallet"
              type="text"
              value={form.treasury}
              onChange={(e) => setForm({ ...form, treasury: e.target.value })}
              placeholder="0x..."
              className="w-full px-2 py-1 rounded text-[10px] tabular-nums"
              disabled={isPending || isConfirming}
              autoComplete="off"
              spellCheck="false"
            />
            {form.treasury && !isAddress(form.treasury) && (
              <p className="text-[9px] text-red-400 mt-0.5">Invalid</p>
            )}
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={isPending || isConfirming || !allValid}
          className="w-full py-1 px-2 text-[10px] bg-white text-black font-medium rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
        >
          {isPending || isConfirming ? 'Updating...' : 'Update'}
        </button>
      </div>

      {isSuccess && (
        <div className="p-2 bg-green-500/10 border border-green-500/20 rounded">
          <p className="text-green-400 text-[10px]">Wallets updated successfully!</p>
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
          <p className="text-red-400 text-[10px]">Error: {error.message.split('\n')[0]}</p>
        </div>
      )}
    </div>
  );
}

// Settings Component
function Settings({ tokenAddress, swapThreshold, swapEnabled, pancakePair, totalSupply, writeContract, isPending, isConfirming, isSuccess, error }: any) {
  const [thresholdPercent, setThresholdPercent] = useState(
    swapThreshold && totalSupply ? (Number(formatUnits(swapThreshold, 18)) / Number(formatUnits(totalSupply, 18)) * 100).toFixed(3) : '0.02'
  );
  const [enabled, setEnabled] = useState(swapEnabled ?? true);

  const handleUpdateThreshold = () => {
    if (!totalSupply) return;
    const thresholdAmount = parseUnits(
      (Number(formatUnits(totalSupply, 18)) * parseFloat(thresholdPercent) / 100).toString(),
      18
    );
    writeContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'setSwapThreshold',
      args: [thresholdAmount],
    });
  };

  const handleToggleSwap = () => {
    writeContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'setSwapEnabled',
      args: [!enabled],
    });
    setEnabled(!enabled);
  };

  const handleManualSwap = () => {
    writeContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'manualSwap',
    });
  };

  const handleRescueBNB = () => {
    if (confirm('This will send all BNB from the token contract to your wallet. Continue?')) {
      writeContract({
        address: tokenAddress,
        abi: TOKEN_ABI,
        functionName: 'rescueBNB',
      });
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Swap Settings */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded p-2.5">
        <h3 className="font-medium text-xs mb-2">Swap Settings</h3>

        <div className="space-y-2">
          <div>
            <label htmlFor="swap-threshold" className="block text-[10px] text-[#888] mb-1">
              Threshold (% of Supply)
            </label>
            <input
              id="swap-threshold"
              type="number"
              min="0.001"
              max="1"
              step="0.01"
              value={thresholdPercent}
              onChange={(e) => setThresholdPercent(e.target.value)}
              className="w-full px-2 py-1 rounded text-[10px] tabular-nums"
              disabled={isPending || isConfirming}
            />
            <p className="text-[9px] text-[#666] mt-0.5">
              {swapThreshold && totalSupply ? Number(formatUnits(swapThreshold, 18)).toLocaleString() : '...'} tokens
            </p>
          </div>

          <button
            onClick={handleUpdateThreshold}
            disabled={isPending || isConfirming}
            className="w-full py-1 px-2 text-[10px] bg-white text-black font-medium rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isPending || isConfirming ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>

      {/* Swap Actions */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded p-2.5">
        <h3 className="font-medium text-xs mb-2">Actions</h3>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between p-1.5 bg-[#0a0a0a] rounded">
            <span className="text-[10px]">Auto Swap</span>
            <button
              onClick={handleToggleSwap}
              disabled={isPending || isConfirming}
              className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                enabled ? 'bg-green-500/20 text-green-400' : 'bg-[#1a1a1a] text-[#666]'
              }`}
            >
              {enabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <button
            onClick={handleManualSwap}
            disabled={isPending || isConfirming}
            className="w-full py-1 px-2 text-[10px] bg-[#1a1a1a] hover:bg-[#2e2e2e] rounded transition-colors"
          >
            Manual Swap
          </button>
        </div>
      </div>

      {/* Contract Info */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded p-2.5">
        <h3 className="font-medium text-xs mb-1.5">Info</h3>
        <div className="text-[10px]">
          <div className="flex justify-between items-center">
            <span className="text-[#666]">Pair</span>
            <a
              href={`https://bscscan.com/address/${pancakePair}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#888] hover:text-white transition-colors tabular-nums truncate max-w-[150px]"
              title={pancakePair}
            >
              {pancakePair?.slice(0, 6)}...{pancakePair?.slice(-4)}
            </a>
          </div>
        </div>
      </div>

      {/* Emergency Functions */}
      <div className="bg-[#111] border border-red-500/20 rounded p-2.5">
        <h3 className="font-medium text-xs mb-1 text-red-400">Emergency</h3>
        <p className="text-[9px] text-[#666] mb-1.5">Use with caution</p>

        <button
          onClick={handleRescueBNB}
          disabled={isPending || isConfirming}
          className="w-full py-1 px-2 text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors"
        >
          Rescue BNB
        </button>
      </div>

      {isSuccess && (
        <div className="p-2 bg-green-500/10 border border-green-500/20 rounded">
          <p className="text-green-400 text-[10px]">Settings updated!</p>
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
          <p className="text-red-400 text-[10px]">Error: {error.message.split('\n')[0]}</p>
        </div>
      )}
    </div>
  );
}

// Ownership Management Component
function OwnershipManagement({ tokenAddress, currentOwner, writeContract, isPending, isConfirming, isSuccess, error }: any) {
  const [newOwner, setNewOwner] = useState('');

  const handleTransfer = () => {
    if (!isAddress(newOwner)) return;
    if (confirm(`Transfer ownership to ${newOwner}? This action cannot be undone.`)) {
      writeContract({
        address: tokenAddress,
        abi: TOKEN_ABI,
        functionName: 'transferOwnership',
        args: [newOwner],
      });
    }
  };

  const handleRenounce = () => {
    if (confirm('Renounce ownership? This will make the contract UNMANAGEABLE FOREVER. Are you absolutely sure?')) {
      if (confirm('This is your last warning. Renouncing ownership is PERMANENT and IRREVERSIBLE.')) {
        writeContract({
          address: tokenAddress,
          abi: TOKEN_ABI,
          functionName: 'renounceOwnership',
        });
      }
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Current Owner */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded p-2.5">
        <h3 className="font-medium text-xs mb-1.5">Current Owner</h3>
        <p className="text-[10px] text-[#888] tabular-nums break-all">{currentOwner}</p>
      </div>

      {/* Transfer Ownership */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded p-2.5">
        <h3 className="font-medium text-xs mb-2">Transfer</h3>
        <div>
          <label htmlFor="new-owner" className="block text-[10px] text-[#888] mb-1">
            New Owner
          </label>
          <input
            id="new-owner"
            type="text"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            placeholder="0x..."
            className="w-full px-2 py-1 rounded text-[10px] tabular-nums mb-1.5"
            disabled={isPending || isConfirming}
            autoComplete="off"
            spellCheck="false"
          />
          {newOwner && !isAddress(newOwner) && (
            <p className="text-[9px] text-red-400 mb-1.5">Invalid</p>
          )}
        </div>

        <button
          onClick={handleTransfer}
          disabled={isPending || isConfirming || !isAddress(newOwner)}
          className="w-full py-1 px-2 text-[10px] bg-white text-black font-medium rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isPending || isConfirming ? 'Transferring...' : 'Transfer'}
        </button>
      </div>

      {/* Renounce Ownership */}
      <div className="bg-[#111] border border-red-500/20 rounded p-2.5">
        <h3 className="font-medium text-xs mb-1 text-red-400">Danger Zone</h3>
        <p className="text-[9px] text-[#666] mb-1.5">
          Renouncing makes token permanently unmanageable. This is irreversible.
        </p>

        <button
          onClick={handleRenounce}
          disabled={isPending || isConfirming}
          className="w-full py-1 px-2 text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors font-medium"
        >
          Renounce (Permanent!)
        </button>
      </div>

      {isSuccess && (
        <div className="p-2 bg-green-500/10 border border-green-500/20 rounded">
          <p className="text-green-400 text-[10px]">Action completed!</p>
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded">
          <p className="text-red-400 text-[10px]">Error: {error.message.split('\n')[0]}</p>
        </div>
      )}
    </div>
  );
}
