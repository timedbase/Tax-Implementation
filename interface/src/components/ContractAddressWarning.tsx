'use client';

import { FACTORY_ADDRESS } from '@/config/contracts';

export function ContractAddressWarning() {
  const isDefaultAddress = FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000';

  if (!isDefaultAddress) {
    return null;
  }

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8">
      <div className="flex items-start gap-3">
        <div className="text-yellow-500 text-xl" aria-hidden="true">⚠️</div>
        <div className="flex-1">
          <h3 className="text-yellow-500 font-semibold mb-1">Factory Contract Not Configured</h3>
          <p className="text-sm text-yellow-500/80 mb-2">
            The factory contract address has not been set. Please deploy your contracts and update the environment variable.
          </p>
          <details className="text-xs text-yellow-500/70">
            <summary className="cursor-pointer hover:text-yellow-500 mb-2">How to fix this</summary>
            <ol className="list-decimal list-inside space-y-1 ml-2 mt-2">
              <li>Deploy TaxToken implementation contract to BSC</li>
              <li>Deploy TaxTokenFactory contract to BSC</li>
              <li>Update <code className="bg-yellow-500/20 px-1 rounded">NEXT_PUBLIC_FACTORY_ADDRESS</code> in your <code className="bg-yellow-500/20 px-1 rounded">.env</code> file</li>
              <li>Restart the development server or rebuild for production</li>
            </ol>
          </details>
        </div>
      </div>
    </div>
  );
}
