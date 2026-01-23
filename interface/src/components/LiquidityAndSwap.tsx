'use client';

import { useState } from 'react';
import { addLiquidity } from '@/services/liquidityService';
import { buyTokenExact } from '@/services/swapService';
import { isValidPrivateKey, formatPrivateKey } from '@/utils/walletManager';
import type { Address } from 'viem';

export default function LiquidityAndSwap() {
  // Private keys
  const [liquidityPrivateKey, setLiquidityPrivateKey] = useState('');
  const [traderPrivateKey, setTraderPrivateKey] = useState('');

  // Token info
  const [tokenAddress, setTokenAddress] = useState('');

  // Liquidity params
  const [liquidityTokenAmount, setLiquidityTokenAmount] = useState('');
  const [liquidityBnbAmount, setLiquidityBnbAmount] = useState('');

  // Swap params
  const [swapBnbAmount, setSwapBnbAmount] = useState('');

  // Settings
  const [slippage, setSlippage] = useState('0.5');
  const [loading, setLoading] = useState(false);

  // Results
  const [results, setResults] = useState<{
    liquidity?: { success: boolean; message: string; txHash?: string };
    swap?: { success: boolean; message: string; txHash?: string };
  }>({});

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults({});

    try {
      // Validate inputs
      if (!liquidityPrivateKey || !traderPrivateKey || !tokenAddress ||
          !liquidityTokenAmount || !liquidityBnbAmount || !swapBnbAmount) {
        setResults({
          liquidity: {
            success: false,
            message: 'Please fill in all fields',
          },
        });
        setLoading(false);
        return;
      }

      // Validate private keys
      const formattedLiquidityKey = formatPrivateKey(liquidityPrivateKey);
      const formattedTraderKey = formatPrivateKey(traderPrivateKey);

      if (!isValidPrivateKey(formattedLiquidityKey)) {
        setResults({
          liquidity: {
            success: false,
            message: 'Invalid liquidity provider private key format',
          },
        });
        setLoading(false);
        return;
      }

      if (!isValidPrivateKey(formattedTraderKey)) {
        setResults({
          liquidity: {
            success: false,
            message: 'Invalid trader private key format',
          },
        });
        setLoading(false);
        return;
      }

      // Step 1: Add Liquidity
      console.log('Step 1: Adding liquidity...');
      const liquidityResponse = await addLiquidity({
        privateKey: formattedLiquidityKey,
        tokenAddress: tokenAddress as Address,
        tokenAmount: liquidityTokenAmount,
        bnbAmount: liquidityBnbAmount,
        slippageTolerance: parseFloat(slippage),
      });

      setResults({
        liquidity: {
          success: liquidityResponse.success,
          message: liquidityResponse.success
            ? 'Liquidity added successfully!'
            : liquidityResponse.error || 'Failed to add liquidity',
          txHash: liquidityResponse.txHash,
        },
      });

      if (!liquidityResponse.success) {
        setLoading(false);
        return;
      }

      // Wait 100ms for liquidity to register
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 2: Buy tokens using swapExactETHForTokens
      console.log('Step 2: Buying tokens...');
      const swapResponse = await buyTokenExact({
        privateKey: formattedTraderKey,
        tokenAddress: tokenAddress as Address,
        bnbAmount: swapBnbAmount,
      });

      setResults(prev => ({
        ...prev,
        swap: {
          success: swapResponse.success,
          message: swapResponse.success
            ? 'Purchase successful!'
            : swapResponse.error || 'Failed to execute swap',
          txHash: swapResponse.txHash,
        },
      }));

    } catch (error: any) {
      setResults({
        liquidity: {
          success: false,
          message: error.message || 'An error occurred',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 md:p-6 max-w-3xl mx-auto">
      <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Add Liquidity & Buy Tokens</h2>

      <form onSubmit={handleExecute} className="space-y-3 md:space-y-4">
        {/* Private Keys */}
        <div>
          <label className="block text-xs md:text-sm text-[#888] mb-1.5 md:mb-2">
            Private Key #1 (Liquidity Provider)
          </label>
          <input
            type="password"
            value={liquidityPrivateKey}
            onChange={(e) => setLiquidityPrivateKey(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg text-sm md:text-base"
            disabled={loading}
          />
          <p className="text-xs text-[#666] mt-1">Needs tokens + BNB</p>
        </div>

        <div>
          <label className="block text-xs md:text-sm text-[#888] mb-1.5 md:mb-2">
            Private Key #2 (Trader)
          </label>
          <input
            type="password"
            value={traderPrivateKey}
            onChange={(e) => setTraderPrivateKey(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg text-sm md:text-base"
            disabled={loading}
          />
          <p className="text-xs text-[#666] mt-1">Needs BNB</p>
        </div>

        {/* Token Address */}
        <div>
          <label className="block text-xs md:text-sm text-[#888] mb-1.5 md:mb-2">Token Address</label>
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg text-sm md:text-base"
            disabled={loading}
          />
        </div>

        {/* Liquidity Amounts */}
        <div className="p-3 md:p-4 bg-[#111] rounded-lg">
          <p className="text-xs md:text-sm text-[#888] mb-3">Step 1: Liquidity</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#666] mb-1">Token Amount</label>
              <input
                type="text"
                value={liquidityTokenAmount}
                onChange={(e) => setLiquidityTokenAmount(e.target.value)}
                placeholder="1000000"
                className="w-full px-3 py-2 rounded-lg text-sm tabular-nums"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs text-[#666] mb-1">BNB Amount</label>
              <input
                type="text"
                value={liquidityBnbAmount}
                onChange={(e) => setLiquidityBnbAmount(e.target.value)}
                placeholder="1.0"
                className="w-full px-3 py-2 rounded-lg text-sm tabular-nums"
                disabled={loading}
              />
            </div>
          </div>
          <p className="text-xs text-[#666] mt-2">Slippage: {slippage}%</p>
        </div>

        {/* Swap Amount */}
        <div className="p-3 md:p-4 bg-[#111] rounded-lg">
          <p className="text-xs md:text-sm text-[#888] mb-3">Step 2: Buy (swapExactETHForTokens)</p>
          <div>
            <label className="block text-xs text-[#666] mb-1">BNB to Spend</label>
            <input
              type="text"
              value={swapBnbAmount}
              onChange={(e) => setSwapBnbAmount(e.target.value)}
              placeholder="0.1"
              className="w-full px-3 py-2 rounded-lg text-sm tabular-nums"
              disabled={loading}
            />
          </div>
        </div>

        {/* Slippage for Liquidity */}
        <div>
          <label className="block text-xs md:text-sm text-[#888] mb-1.5 md:mb-2">
            Liquidity Slippage (%)
          </label>
          <input
            type="text"
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
            placeholder="0.5"
            className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg text-sm md:text-base tabular-nums"
            disabled={loading}
          />
        </div>

        {/* Execute Button */}
        <div className="pt-1 md:pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 md:py-3 px-4 text-sm md:text-base bg-white text-black font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Processing...' : 'Execute'}
          </button>
        </div>
      </form>

      {/* Results */}
      {(results.liquidity || results.swap) && (
        <div className="mt-3 md:mt-4 space-y-3">
          {results.liquidity && (
            <div className={`p-3 md:p-4 rounded-lg ${results.liquidity.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <p className={`text-xs md:text-sm ${results.liquidity.success ? 'text-green-400' : 'text-red-400'}`}>
                Step 1: {results.liquidity.message}
              </p>
              {results.liquidity.txHash && (
                <a href={`https://bscscan.com/tx/${results.liquidity.txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block">
                  View on BscScan →
                </a>
              )}
            </div>
          )}

          {results.swap && (
            <div className={`p-3 md:p-4 rounded-lg ${results.swap.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <p className={`text-xs md:text-sm ${results.swap.success ? 'text-green-400' : 'text-red-400'}`}>
                Step 2: {results.swap.message}
              </p>
              {results.swap.txHash && (
                <a href={`https://bscscan.com/tx/${results.swap.txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block">
                  View on BscScan →
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
