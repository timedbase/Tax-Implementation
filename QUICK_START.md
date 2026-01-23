# Quick Start Guide - PancakeSwap Integration

## What's New

Your token creator platform now includes:
1. **One-Click Launch** - Add liquidity and buy tokens in a single operation
2. **Two Wallet System** - Use separate private keys for liquidity and trading

## Setup

1. Install dependencies:
```bash
cd interface
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Usage

### Complete Token Launch in One Click

The platform now features a streamlined workflow that executes both liquidity addition and token purchase with a single button click.

#### Step 1: Create Your Token
1. Click "Create Token" tab
2. Fill in token details (name, symbol, supply)
3. Set tax parameters
4. Deploy the token
5. Copy the token address from the success message

#### Step 2: Add Liquidity & Buy Tokens (One Click!)
1. Click "Add Liquidity & Buy" tab
2. Enter **Private Key #1** (liquidity provider wallet)
3. Enter **Private Key #2** (trader wallet)
4. Paste your token address
5. Set liquidity amounts:
   - Token amount (e.g., 1000000)
   - BNB amount (e.g., 1.0)
6. Set buy amount:
   - BNB to spend (e.g., 0.1)
7. Set slippage tolerance (default: 0.5%)
8. Click **"Execute: Add Liquidity → Buy Tokens"**

**What Happens:**
- Step 1: Liquidity is added using Private Key #1
- 5-second wait for liquidity to register
- Step 2: Tokens are purchased using Private Key #2
- Both transaction hashes are displayed

## Two Private Keys Strategy

**Why use two different private keys?**

- **Wallet 1 (Liquidity Provider)**:
  - Holds the bulk of tokens
  - Provides initial liquidity
  - Should be kept more secure

- **Wallet 2 (Trader)**:
  - Used for testing trades
  - Executes buy/sell orders
  - Can be used for automated trading

## Security Checklist

- [ ] Never share private keys
- [ ] Store private keys securely (not in code)
- [ ] Test with small amounts first
- [ ] Verify all addresses before transactions
- [ ] Check transaction on BscScan
- [ ] Use separate wallets for different functions

## Common Issues

**Error: "Insufficient BNB balance"**
- Ensure wallet has enough BNB for transaction + gas fees

**Error: "Insufficient token balance"**
- Check token address is correct
- Verify wallet holds the tokens

**Transaction Pending Too Long**
- Check BSC network status
- Increase slippage tolerance if needed

**Error: "Invalid private key format"**
- Private key should be 64 hex characters (or 66 with 0x prefix)
- No spaces or extra characters

## Network Information

- **Network**: BSC Mainnet
- **Chain ID**: 56
- **RPC**: https://bsc-dataseed.binance.org/
- **PancakeSwap Router**: 0x10ED43C718714eb63d5aA57B78B54704E256024E
- **Explorer**: https://bscscan.com

## Example Private Key Format

```
Valid formats:
- 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
- 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

## Transaction Links

All successful transactions provide a BscScan link for verification:
- View transaction details
- Check gas used
- Confirm token transfers
- Verify liquidity addition

## Need Help?

1. Check [PANCAKESWAP_INTEGRATION.md](./PANCAKESWAP_INTEGRATION.md) for detailed documentation
2. Verify transaction on BscScan
3. Ensure you're on BSC Mainnet
4. Test with small amounts first

## Warnings

⚠️ **IMPORTANT:**
- This is for BSC Mainnet only
- Real funds are at risk
- Always verify addresses
- Test thoroughly before large transactions
- Never share your private keys
- Use at your own risk
