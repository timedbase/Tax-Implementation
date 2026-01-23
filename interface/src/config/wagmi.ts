import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { bsc } from 'wagmi/chains';

const BSC_RPC = process.env.NEXT_PUBLIC_BSC_RPC || 'https://bsc-dataseed.binance.org';

export const config = getDefaultConfig({
  appName: 'TaxToken Factory',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [bsc],
  transports: {
    [bsc.id]: http(BSC_RPC),
  },
  ssr: true,
});
