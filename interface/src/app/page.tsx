import { Header } from '@/components/Header';
import { CreateTokenForm } from '@/components/CreateTokenForm';
import { MyTokens } from '@/components/MyTokens';
import { FactoryStats } from '@/components/FactoryStats';
import { ContractAddressWarning } from '@/components/ContractAddressWarning';

export default function Home() {
  return (
    <div className="min-h-dvh bg-black">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-balance">
            Deploy Your Tax Token
          </h1>
          <p className="text-[#888] max-w-xl mx-auto text-pretty">
            Create your own ERC20 token with configurable buy/sell taxes on BSC.
            No coding required. Full control over your token settings.
          </p>
        </div>

        {/* Contract Address Warning */}
        <ContractAddressWarning />

        {/* Stats */}
        <FactoryStats />

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          <CreateTokenForm />
          <MyTokens />
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
            <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-4" aria-hidden="true">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2 text-balance">Configurable Taxes</h3>
            <p className="text-sm text-[#666] text-pretty">
              Set custom buy & sell taxes for marketing, team, treasury, burn, & liquidity.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
            <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-4" aria-hidden="true">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2 text-balance">Full Ownership</h3>
            <p className="text-sm text-[#666] text-pretty">
              You have complete control. Update wallets, taxes, router, & more anytime.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
            <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center mb-4" aria-hidden="true">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2 text-balance">Instant Deploy</h3>
            <p className="text-sm text-[#666] text-pretty">
              Deploy in seconds using our gas-efficient tool
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-[#1a1a1a] text-center">
          <p className="text-sm text-[#666]">
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
