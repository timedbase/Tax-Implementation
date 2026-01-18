import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { bsc } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'TaxToken Factory',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [bsc],
  ssr: true,
});
