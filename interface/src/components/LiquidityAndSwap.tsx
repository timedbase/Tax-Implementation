'use client';

import { useState } from 'react';
import { prepareLiquidity, sendAddLiquidity } from '@/services/liquidityService';
import { prepareBuyToken, sendBuyToken } from '@/services/swapService';
import { isValidPrivateKey, formatPrivateKey } from '@/utils/walletManager';
import type { Address } from 'viem';

export default function LiquidityAndSwap() {
  // Private keys
  const [liquidityPrivateKey, setLiquidityPrivateKey] = useState('');
  const [traderPrivateKey, setTraderPrivateKey] = useState('');
  const [showLiquidityKey, setShowLiquidityKey] = useState(false);
  const [showTraderKey, setShowTraderKey] = useState(false);

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

      // Prepare both transactions (liquidity may need approval first)
      console.log('Preparing transactions...');

      const liquidityParams = {
        privateKey: formattedLiquidityKey,
        tokenAddress: tokenAddress as Address,
        tokenAmount: liquidityTokenAmount,
        bnbAmount: liquidityBnbAmount,
        slippageTolerance: parseFloat(slippage),
      };

      const swapParams = {
        privateKey: formattedTraderKey,
        tokenAddress: tokenAddress as Address,
        bnbAmount: swapBnbAmount,
      };

      // Prepare liquidity (includes approval if needed) and swap client
      const [liquidityPrepared, swapPrepared] = await Promise.all([
        prepareLiquidity(liquidityParams),
        Promise.resolve(prepareBuyToken(swapParams)),
      ]);

      // Fire both transactions simultaneously
      console.log('Sending both transactions...');
      const [liquidityHash, swapHash] = await Promise.all([
        sendAddLiquidity(
          liquidityPrepared.writeClient,
          tokenAddress as Address,
          liquidityPrepared.tokenAmountBigInt,
          liquidityPrepared.bnbAmountBigInt,
          liquidityPrepared.address
        ),
        sendBuyToken(
          swapPrepared.writeClient,
          swapPrepared.bnbAmountBigInt,
          swapPrepared.path,
          swapPrepared.address
        ),
      ]);

      console.log('Liquidity tx hash:', liquidityHash);
      console.log('Swap tx hash:', swapHash);

      // Update UI with pending hashes
      setResults({
        liquidity: {
          success: true,
          message: 'Transaction sent, waiting for confirmation...',
          txHash: liquidityHash,
        },
        swap: {
          success: true,
          message: 'Transaction sent, waiting for confirmation...',
          txHash: swapHash,
        },
      });

      // Wait for both receipts in parallel
      const [liquidityReceipt, swapReceipt] = await Promise.all([
        liquidityPrepared.readClient.waitForTransactionReceipt({ hash: liquidityHash }),
        swapPrepared.readClient.waitForTransactionReceipt({ hash: swapHash }),
      ]);

      // Update with final results
      setResults({
        liquidity: {
          success: liquidityReceipt.status === 'success',
          message: liquidityReceipt.status === 'success'
            ? 'Liquidity added successfully!'
            : 'Liquidity transaction failed',
          txHash: liquidityHash,
        },
        swap: {
          success: swapReceipt.status === 'success',
          message: swapReceipt.status === 'success'
            ? 'Purchase successful!'
            : 'Swap transaction failed',
          txHash: swapHash,
        },
      });

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
          <div className="relative">
            <input
              type={showLiquidityKey ? 'text' : 'password'}
              value={liquidityPrivateKey}
              onChange={(e) => setLiquidityPrivateKey(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2.5 md:px-4 md:py-3 pr-10 rounded-lg text-sm md:text-base"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowLiquidityKey(!showLiquidityKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition-colors"
            >
              {showLiquidityKey ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-[#666] mt-1">Needs tokens + BNB</p>
        </div>

        <div>
          <label className="block text-xs md:text-sm text-[#888] mb-1.5 md:mb-2">
            Private Key #2 (Trader)
          </label>
          <div className="relative">
            <input
              type={showTraderKey ? 'text' : 'password'}
              value={traderPrivateKey}
              onChange={(e) => setTraderPrivateKey(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2.5 md:px-4 md:py-3 pr-10 rounded-lg text-sm md:text-base"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowTraderKey(!showTraderKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition-colors"
            >
              {showTraderKey ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
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
