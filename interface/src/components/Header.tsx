'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-12 md:h-16 max-w-[1200px] items-center justify-between px-3 md:px-6">
        <div className="flex items-center gap-2 md:gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="text-white md:w-6 md:h-6"
            aria-hidden="true"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm md:text-[15px] font-medium tracking-tight">
            Token Creator
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#create"
            className="text-[14px] text-[#a1a1a1] hover:text-white transition-colors"
          >
            Create
          </a>
          <a
            href="#tokens"
            className="text-[14px] text-[#a1a1a1] hover:text-white transition-colors"
          >
            My Tokens
          </a>
          <a
            href="https://bscscan.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] text-[#a1a1a1] hover:text-white transition-colors"
          >
            Explorer
          </a>
        </nav>

        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  style: {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        className="h-8 md:h-9 px-3 md:px-4 text-xs md:text-[14px] font-medium bg-white text-black rounded-md hover:bg-[#e5e5e5] transition-colors"
                      >
                        Connect
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        className="h-8 md:h-9 px-3 md:px-4 text-xs md:text-[14px] font-medium bg-[#e00] text-white rounded-md hover:bg-[#c00] transition-colors"
                      >
                        Wrong network
                      </button>
                    );
                  }

                  return (
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <button
                        onClick={openChainModal}
                        className="h-8 md:h-9 px-2 md:px-3 text-xs md:text-[14px] bg-[#1a1a1a] rounded-md hover:bg-[#2e2e2e] transition-colors flex items-center gap-1.5 md:gap-2"
                        aria-label={`Switch network (currently ${chain.name})`}
                      >
                        {chain.hasIcon && (
                          <div className="w-3.5 h-3.5 md:w-4 md:h-4">
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                className="w-3.5 h-3.5 md:w-4 md:h-4"
                              />
                            )}
                          </div>
                        )}
                      </button>
                      <button
                        onClick={openAccountModal}
                        className="h-8 md:h-9 px-3 md:px-4 text-xs md:text-[14px] font-medium bg-[#1a1a1a] rounded-md hover:bg-[#2e2e2e] transition-colors"
                        aria-label="Open account menu"
                      >
                        {account.displayName}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}
