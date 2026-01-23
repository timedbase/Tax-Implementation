'use client';

import { useState } from 'react';
import { buyToken, sellToken, getQuoteBuyToken, getQuoteSellToken } from '@/services/swapService';
import { isValidPrivateKey, formatPrivateKey } from '@/utils/walletManager';
import type { Address } from 'viem';

export default function TokenSwap() {
  const [privateKey, setPrivateKey] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [swapType, setSwapType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [quote, setQuote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quotingLoading, setQuotingLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    txHash?: string;
  } | null>(null);

  const handleGetQuote = async () => {
    if (!privateKey || !tokenAddress || !amount) {
      return;
    }

    setQuotingLoading(true);
    setQuote(null);

    try {
      const formattedKey = formatPrivateKey(privateKey);
      if (!isValidPrivateKey(formattedKey)) {
        setQuotingLoading(false);
        return;
      }

      let quoteResult;
      if (swapType === 'buy') {
        quoteResult = await getQuoteBuyToken(tokenAddress as Address, amount, formattedKey);
      } else {
        quoteResult = await getQuoteSellToken(tokenAddress as Address, amount, formattedKey);
      }

      if (quoteResult) {
        setQuote(quoteResult.expectedOutput);
      }
    } catch (error) {
      console.error('Quote error:', error);
    } finally {
      setQuotingLoading(false);
    }
  };

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Validate inputs
      if (!privateKey || !tokenAddress || !amount) {
        setResult({
          success: false,
          message: 'Please fill in all fields',
        });
        setLoading(false);
        return;
      }

      const formattedKey = formatPrivateKey(privateKey);
      if (!isValidPrivateKey(formattedKey)) {
        setResult({
          success: false,
          message: 'Invalid private key format',
        });
        setLoading(false);
        return;
      }

      // Execute swap
      let response;
      if (swapType === 'buy') {
        response = await buyToken({
          privateKey: formattedKey,
          tokenAddress: tokenAddress as Address,
          bnbAmount: amount,
          slippageTolerance: parseFloat(slippage),
        });
      } else {
        response = await sellToken({
          privateKey: formattedKey,
          tokenAddress: tokenAddress as Address,
          tokenAmount: amount,
          slippageTolerance: parseFloat(slippage),
        });
      }

      if (response.success) {
        setResult({
          success: true,
          message: `${swapType === 'buy' ? 'Purchase' : 'Sale'} successful!${
            response.estimatedOutput
              ? ` Estimated output: ${response.estimatedOutput} ${swapType === 'buy' ? 'tokens' : 'BNB'}`
              : ''
          }`,
          txHash: response.txHash,
        });
        // Clear form
        setAmount('');
        setQuote(null);
      } else {
        setResult({
          success: false,
          message: response.error || 'Failed to execute swap',
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Token Swap (PancakeSwap V2)</h2>

      <form onSubmit={handleSwap} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Private Key (Trader)
          </label>
          <input
            type="password"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <p className="text-xs text-gray-500 mt-1">
            Private key for the wallet that will execute the swap
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Token Address</label>
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Swap Type</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="buy"
                checked={swapType === 'buy'}
                onChange={() => {
                  setSwapType('buy');
                  setQuote(null);
                }}
                className="mr-2"
              />
              <span className="text-gray-900">Buy Tokens (with BNB)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="sell"
                checked={swapType === 'sell'}
                onChange={() => {
                  setSwapType('sell');
                  setQuote(null);
                }}
                className="mr-2"
              />
              <span className="text-gray-900">Sell Tokens (for BNB)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {swapType === 'buy' ? 'BNB Amount' : 'Token Amount'}
          </label>
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setQuote(null);
            }}
            placeholder={swapType === 'buy' ? '0.1' : '1000'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <button
            type="button"
            onClick={handleGetQuote}
            disabled={quotingLoading || !amount || !tokenAddress || !privateKey}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            {quotingLoading ? 'Getting quote...' : 'Get Quote'}
          </button>
          {quote && (
            <p className="mt-2 text-sm text-green-600">
              Estimated output: {quote} {swapType === 'buy' ? 'tokens' : 'BNB'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slippage Tolerance (%)
          </label>
          <input
            type="text"
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
            placeholder="0.5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-md text-white font-medium ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : swapType === 'buy'
                ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
          } transition-colors`}
        >
          {loading ? 'Processing...' : swapType === 'buy' ? 'Buy Tokens' : 'Sell Tokens'}
        </button>
      </form>

      {result && (
        <div
          className={`mt-6 p-4 rounded-md ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}
        >
          <p className={`${result.success ? 'text-green-800' : 'text-red-800'} font-medium`}>
            {result.message}
          </p>
          {result.txHash && (
            <a
              href={`https://bscscan.com/tx/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
            >
              View transaction on BscScan
            </a>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800 text-sm">
          <strong>Warning:</strong> Never share your private key with anyone. Make sure you are using
          the correct token address and amounts before proceeding. This component uses PancakeSwap V2
          for swaps.
        </p>
      </div>
    </div>
  );
}
