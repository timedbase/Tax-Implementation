'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { CreateTokenForm } from '@/components/CreateTokenForm';
import { CreateReflectionTokenForm } from '@/components/CreateReflectionTokenForm';
import { MyTokens } from '@/components/MyTokens';
import { MyReflectionTokens } from '@/components/MyReflectionTokens';
import { FactoryStats } from '@/components/FactoryStats';
import { ContractAddressWarning } from '@/components/ContractAddressWarning';
import LiquidityAndSwap from '@/components/LiquidityAndSwap';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'create' | 'trade'>('create');
  const [tokenType, setTokenType] = useState<'tax' | 'reflection'>('tax');

  return (
    <div className="min-h-dvh bg-black">
      <Header />

      <main className="max-w-6xl mx-auto px-3 py-4 md:px-4 md:py-8">
        {/* Hero Section */}
        <div className="text-center mb-6 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4 text-balance">
            Deploy Your Token
          </h1>
          <p className="text-sm md:text-base text-[#888] max-w-xl mx-auto text-pretty">
            Create Tax Tokens or Reflection Tokens with configurable settings on BSC.
            No coding required. Full control over your token settings.
          </p>
        </div>

        {/* Contract Address Warning */}
        <ContractAddressWarning />

        {/* Stats */}
        <FactoryStats />

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-[#1a1a1a]">
            <nav className="flex gap-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('create')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'create'
                    ? 'border-white text-white'
                    : 'border-transparent text-[#888] hover:text-white hover:border-[#333]'
                }`}
              >
                Create Token
              </button>
              <button
                onClick={() => setActiveTab('trade')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'trade'
                    ? 'border-white text-white'
                    : 'border-transparent text-[#888] hover:text-white hover:border-[#333]'
                }`}
              >
                Add Liquidity & Buy
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === 'create' && (
          <>
            {/* Token Type Selector */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-1">
                <button
                  onClick={() => setTokenType('tax')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    tokenType === 'tax'
                      ? 'bg-white text-black'
                      : 'text-[#888] hover:text-white'
                  }`}
                >
                  Tax Token
                </button>
                <button
                  onClick={() => setTokenType('reflection')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    tokenType === 'reflection'
                      ? 'bg-purple-500 text-white'
                      : 'text-[#888] hover:text-white'
                  }`}
                >
                  Reflection Token
                </button>
              </div>
            </div>

            {/* Token Type Description */}
            <div className="text-center mb-6">
              {tokenType === 'tax' ? (
                <p className="text-xs text-[#666]">
                  Standard tax token with marketing, team, treasury, burn & liquidity taxes
                </p>
              ) : (
                <p className="text-xs text-purple-400/80">
                  RFI-style token that automatically distributes rewards to all holders
                </p>
              )}
            </div>

            {/* Forms based on token type */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-8">
              {tokenType === 'tax' ? (
                <>
                  <CreateTokenForm />
                  <MyTokens />
                </>
              ) : (
                <>
                  <CreateReflectionTokenForm />
                  <MyReflectionTokens />
                </>
              )}
            </div>
          </>
        )}

        {activeTab === 'trade' && <LiquidityAndSwap />}

        {/* Features */}
        <div className="mt-6 md:mt-12 grid md:grid-cols-4 gap-3 md:gap-6">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 md:p-6">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-2 md:mb-4" aria-hidden="true">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2 text-balance">Configurable Taxes</h3>
            <p className="text-xs md:text-sm text-[#666] text-pretty">
              Set custom buy & sell taxes for marketing, team, burn, & liquidity.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-purple-500/20 rounded-xl p-4 md:p-6">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-2 md:mb-4" aria-hidden="true">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2 text-balance text-purple-400">Auto Reflections</h3>
            <p className="text-xs md:text-sm text-[#666] text-pretty">
              RFI tokens auto-distribute rewards to all holders. No claiming needed.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 md:p-6">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-2 md:mb-4" aria-hidden="true">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2 text-balance">Full Ownership</h3>
            <p className="text-xs md:text-sm text-[#666] text-pretty">
              Complete control. Update wallets, taxes, router anytime.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 md:p-6">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-2 md:mb-4" aria-hidden="true">
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-sm md:text-base font-semibold mb-1 md:mb-2 text-balance">Instant Deploy</h3>
            <p className="text-xs md:text-sm text-[#666] text-pretty">
              Deploy in seconds with gas-efficient clones.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 md:mt-16 pt-4 md:pt-8 border-t border-[#1a1a1a] text-center">
          <p className="text-xs md:text-sm text-[#666]">
            Built on BSC • PancakeSwap V2 Compatible •{' '}
            <a
              href="https://bscscan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors focus-visible:text-white"
            >
              View on BscScan
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
