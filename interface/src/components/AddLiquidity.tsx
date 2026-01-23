'use client';

import { useState } from 'react';
import { addLiquidity } from '@/services/liquidityService';
import { isValidPrivateKey, formatPrivateKey } from '@/utils/walletManager';
import type { Address } from 'viem';

export default function AddLiquidity() {
  const [privateKey, setPrivateKey] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [bnbAmount, setBnbAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    txHash?: string;
  } | null>(null);

  const handleAddLiquidity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Validate inputs
      if (!privateKey || !tokenAddress || !tokenAmount || !bnbAmount) {
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

      // Add liquidity
      const response = await addLiquidity({
        privateKey: formattedKey,
        tokenAddress: tokenAddress as Address,
        tokenAmount,
        bnbAmount,
        slippageTolerance: parseFloat(slippage),
      });

      if (response.success) {
        setResult({
          success: true,
          message: 'Liquidity added successfully!',
          txHash: response.txHash,
        });
        // Clear form
        setTokenAmount('');
        setBnbAmount('');
      } else {
        setResult({
          success: false,
          message: response.error || 'Failed to add liquidity',
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
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Add Liquidity to PancakeSwap</h2>

      <form onSubmit={handleAddLiquidity} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Private Key (Liquidity Provider)
          </label>
          <input
            type="password"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          <p className="text-xs text-gray-500 mt-1">
            Private key for the wallet that will provide liquidity
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Token Amount</label>
          <input
            type="text"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            placeholder="1000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">BNB Amount</label>
          <input
            type="text"
            value={bnbAmount}
            onChange={(e) => setBnbAmount(e.target.value)}
            placeholder="0.1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
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
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          } transition-colors`}
        >
          {loading ? 'Adding Liquidity...' : 'Add Liquidity'}
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
          the correct token address and amounts before proceeding.
        </p>
      </div>
    </div>
  );
}
