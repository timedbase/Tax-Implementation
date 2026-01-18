# TaxToken Factory Interface

A modern, accessible web interface for deploying and managing ERC20 tokens with configurable buy/sell taxes on Binance Smart Chain (BSC).

## Features

- 🚀 **Easy Token Deployment** - Create tax tokens with no coding required
- 🎛️ **Complete Management** - Configure taxes, wallets, and settings
- 💎 **Beautiful UI** - Built with Vercel Design Guidelines
- ♿ **Fully Accessible** - WCAG compliant with keyboard navigation
- 📱 **Mobile Optimized** - Responsive design for all devices
- 🔒 **Secure** - Owner-only access control for management

## Quick Start

### Prerequisites

- Node.js 18+ installed
- BSC wallet (MetaMask, Trust Wallet, etc.)
- WalletConnect Project ID ([Get one here](https://cloud.walletconnect.com))
- Deployed TaxTokenFactory contract (see [Deployment Checklist](../DEPLOYMENT_CHECKLIST.md))

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd interface

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values
```

### Configuration

Edit `.env` file:

```env
# Get your project ID from https://cloud.walletconnect.com
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Your deployed factory contract address
NEXT_PUBLIC_FACTORY_ADDRESS=0xYourFactoryAddressHere
```

See [ENV_SETUP.md](ENV_SETUP.md) for detailed configuration guide.

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | ✅ Yes | WalletConnect Cloud Project ID |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | ✅ Yes | TaxTokenFactory contract address |

See [ENV_SETUP.md](ENV_SETUP.md) for detailed setup instructions.

## Documentation

- **[TOKEN_MANAGEMENT.md](TOKEN_MANAGEMENT.md)** - Complete token management guide
- **[ENV_SETUP.md](ENV_SETUP.md)** - Environment variable setup
- **[../DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md)** - Deployment checklist

## Deployment

See [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) for complete deployment instructions.

## Support

For issues or questions, please file an issue on GitHub.

---

**Made with ❤️ for the BSC community**
