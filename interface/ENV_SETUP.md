# Environment Variables Setup Guide

This guide explains how to configure the environment variables for the TaxToken Factory interface.

## Overview

The interface uses environment variables to configure:
1. **WalletConnect Project ID** - For wallet connection functionality
2. **Factory Contract Address** - The deployed TaxTokenFactory contract address

## Setup Instructions

### 1. Create Environment File

Copy the example file to create your local environment configuration:

```bash
cp .env.example .env
```

### 2. Configure Variables

Edit the `.env` file with your actual values:

```env
# WalletConnect Project ID
# Get your project ID from https://cloud.walletconnect.com
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_actual_project_id_here

# Factory Contract Address
# Replace with your deployed factory address after deployment
NEXT_PUBLIC_FACTORY_ADDRESS=0xYourDeployedFactoryAddressHere
```

## Environment Variables Reference

### NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID

**Required:** Yes
**Type:** String
**Example:** `74de2bd663c304ee41802b44ab465fba`

**Description:**
Your WalletConnect Cloud project ID. This is required for wallet connection functionality (MetaMask, Trust Wallet, etc.).

**How to Get:**
1. Visit https://cloud.walletconnect.com
2. Sign up or log in
3. Create a new project
4. Copy the Project ID
5. Paste it into your `.env` file

**Note:** This is already configured in the provided `.env` file, but you should get your own Project ID for production use.

### NEXT_PUBLIC_FACTORY_ADDRESS

**Required:** Yes (for production)
**Type:** Ethereum Address (0x...)
**Example:** `0x1234567890123456789012345678901234567890`

**Description:**
The address of your deployed TaxTokenFactory contract on BSC.

**Default:** `0x0000000000000000000000000000000000000000`

**When to Update:**
- After deploying TaxTokenFactory to BSC Testnet (for testing)
- After deploying TaxTokenFactory to BSC Mainnet (for production)

**How to Get:**
1. Deploy your TaxTokenFactory contract to BSC
2. Copy the contract address from the deployment transaction
3. Update this variable in your `.env` file
4. Restart your development server or rebuild for production

## Contract Address Warning

If `NEXT_PUBLIC_FACTORY_ADDRESS` is not set (or still set to `0x0000...`), the interface will display a warning banner explaining how to configure it.

The warning includes:
- Clear explanation of what needs to be done
- Step-by-step instructions
- Expandable details section

This helps prevent confusion during setup and deployment.

## Environment Files

### `.env` (Local Development)
- **Location:** `/interface/.env`
- **Purpose:** Local development configuration
- **Git:** Ignored (not committed to repository)
- **Contains:** Actual secret values

### `.env.example` (Template)
- **Location:** `/interface/.env.example`
- **Purpose:** Template for other developers
- **Git:** Committed to repository
- **Contains:** Placeholder values and documentation

### `.env.local` (Optional)
- **Purpose:** Override values for local development
- **Git:** Ignored
- **Priority:** Takes precedence over `.env`

### `.env.production` (Optional)
- **Purpose:** Production-specific values
- **Git:** Should be ignored
- **Usage:** Set in your deployment platform

## Deployment Platforms

### Vercel

Add environment variables in your Vercel project settings:

1. Go to your project → Settings → Environment Variables
2. Add each variable:
   - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: Your Project ID
   - `NEXT_PUBLIC_FACTORY_ADDRESS`: Your factory address
3. Redeploy for changes to take effect

**Vercel Dashboard:**
```
Project → Settings → Environment Variables
```

### Netlify

Add environment variables in your Netlify site settings:

1. Go to Site Settings → Environment Variables
2. Add each variable
3. Redeploy for changes to take effect

**Netlify Dashboard:**
```
Site Settings → Build & Deploy → Environment
```

### Other Platforms

Most hosting platforms support environment variables. Check your platform's documentation for specific instructions.

## Development vs Production

### Development

```bash
# Uses .env and .env.local
npm run dev
```

The development server automatically loads variables from `.env` files.

### Production Build

```bash
# Uses environment variables from your deployment platform
npm run build
npm start
```

**Important:** In production, environment variables should be set in your deployment platform, not in `.env` files.

## Validation

### Check Current Configuration

The interface includes built-in validation:

1. **Contract Address Warning**: Appears if factory address is not set
2. **WalletConnect**: Will fail to connect if Project ID is invalid
3. **Console Logs**: Check browser console for any configuration errors

### Manual Verification

Verify your configuration:

```bash
# Print current values (development only)
node -e "console.log(process.env.NEXT_PUBLIC_FACTORY_ADDRESS)"
node -e "console.log(process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID)"
```

## Troubleshooting

### Warning: "Factory Contract Not Configured"

**Problem:** Yellow warning banner on the homepage

**Solution:**
1. Deploy your TaxTokenFactory contract
2. Update `NEXT_PUBLIC_FACTORY_ADDRESS` in `.env`
3. Restart dev server: `npm run dev`

### Wallet Connection Fails

**Problem:** Cannot connect wallet

**Causes:**
- Invalid WalletConnect Project ID
- Network issues
- Wrong network selected

**Solutions:**
1. Verify `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` is correct
2. Get a new Project ID from WalletConnect Cloud
3. Ensure you're on BSC network

### Environment Variables Not Loading

**Problem:** Changes to `.env` not taking effect

**Solutions:**
1. Restart development server
2. Clear Next.js cache: `rm -rf .next`
3. Rebuild: `npm run build`
4. Check file is named exactly `.env` (not `.env.txt`)

### Contract Calls Fail

**Problem:** "Contract not found" or similar errors

**Causes:**
- Wrong factory address
- Contract not deployed to BSC
- Wrong network

**Solutions:**
1. Verify factory address on BscScan
2. Ensure you're on correct network (BSC Mainnet/Testnet)
3. Check contract is verified on BscScan
4. Verify ABI matches deployed contract

## Security Best Practices

### DO:
- ✅ Use your own WalletConnect Project ID
- ✅ Keep `.env` files out of git
- ✅ Use environment variables in deployment platform
- ✅ Verify contract addresses before deployment
- ✅ Test on testnet before mainnet

### DON'T:
- ❌ Commit `.env` files to git
- ❌ Share your WalletConnect Project ID publicly
- ❌ Hard-code addresses in source code
- ❌ Use same Project ID for multiple projects
- ❌ Deploy to production without testing

## Example Configurations

### Development (BSC Testnet)

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=abc123...
NEXT_PUBLIC_FACTORY_ADDRESS=0x1234567890123456789012345678901234567890
```

### Production (BSC Mainnet)

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=xyz789...
NEXT_PUBLIC_FACTORY_ADDRESS=0x0987654321098765432109876543210987654321
```

## Testing Configuration

After updating environment variables:

### Local Testing
```bash
# 1. Update .env
# 2. Restart dev server
npm run dev

# 3. Check warning banner is gone
# 4. Test wallet connection
# 5. Try creating a token
```

### Production Testing
```bash
# 1. Set env vars in deployment platform
# 2. Trigger new deployment
# 3. Test on deployed URL
# 4. Verify all functionality works
```

## Additional Notes

### Network Configuration

The interface is configured for BSC (Binance Smart Chain):
- **Mainnet Chain ID:** 56
- **Testnet Chain ID:** 97
- **RPC URLs:** Configured in wagmi config

Make sure your factory is deployed to BSC, not Ethereum or another chain.

### Contract ABI

The contract ABIs are defined in `src/config/contracts.ts`:
- `FACTORY_ABI`: TaxTokenFactory interface
- `TOKEN_ABI`: TaxToken interface

These must match your deployed contracts. If you modify the smart contracts, update the ABIs accordingly.

### Multiple Environments

To manage multiple environments (dev, staging, production):

1. Use separate WalletConnect projects for each
2. Deploy contracts to different networks
3. Use platform-specific environment variables
4. Document which address belongs to which environment

## Quick Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | ✅ Yes | - | WalletConnect Cloud Project ID |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | ✅ Yes | `0x0000...` | TaxTokenFactory contract address |

## Support

If you encounter issues:

1. Check this documentation
2. Verify all environment variables are set correctly
3. Check browser console for errors
4. Verify contracts are deployed and verified
5. Test on BSC Testnet first

---

**Remember:** Always test configuration changes thoroughly before deploying to production!
