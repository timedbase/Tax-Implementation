# PancakeSwap V2 Integration Guide

This document explains how to use the PancakeSwap V2 integration for liquidity addition and token trading using private keys.

## Overview

The project now includes two main features:
1. **Token Creation** - Create custom ERC20 tokens with tax features
2. **Add Liquidity & Buy** - One-click operation to add liquidity and buy tokens using two private keys

## Features

### Single-Click Token Launch

Execute both liquidity addition and token purchase in one operation.

**Use Case:** You've created a token and want to add initial liquidity and immediately buy tokens to test trading.

**Steps:**
1. Navigate to the "Add Liquidity & Buy" tab
2. Enter **Private Key #1** (liquidity provider wallet)
3. Enter **Private Key #2** (trader wallet)
4. Enter the token address
5. Set liquidity parameters:
   - Token amount to add
   - BNB amount to pair
6. Set trading parameters:
   - BNB amount to spend on buying tokens
7. Set slippage tolerance (default: 0.5%)
8. Click "Execute: Add Liquidity → Buy Tokens"

**What happens:**
- **Step 1: Add Liquidity** (using Private Key #1)
  - System approves the router to spend your tokens
  - Creates or adds to the liquidity pool on PancakeSwap V2
  - Returns LP tokens to your wallet
  - Transaction link is provided
- **5-second pause** for liquidity to register on-chain
- **Step 2: Buy Tokens** (using Private Key #2)
  - Executes token purchase using BNB
  - Supports fee-on-transfer tokens (tax tokens)
  - Transaction link is provided

Both operations are tracked and displayed with their individual results.

## Private Key Management

### Security Best Practices

**IMPORTANT SECURITY WARNINGS:**

1. **Never share your private keys** with anyone
2. **Use separate wallets** for different functions:
   - Wallet 1: Liquidity provider (holds tokens and BNB for liquidity)
   - Wallet 2: Trader (executes buy/sell orders)
3. **Store private keys securely** - consider using environment variables or a secure key management system
4. **Never commit private keys** to version control
5. **Use test wallets** with small amounts when testing

### Private Key Format

Private keys must be in hexadecimal format with or without the `0x` prefix:
- Valid: `0x1234567890abcdef...` (66 characters)
- Valid: `1234567890abcdef...` (64 characters)

## Technical Details

### PancakeSwap V2 Router

**Address (BSC Mainnet):** `0x10ED43C718714eb63d5aA57B78B54704E256024E`

### WBNB Address

**Address (BSC Mainnet):** `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c`

### Supported Functions

1. **addLiquidityETH** - Add token/BNB liquidity
2. **swapExactETHForTokensSupportingFeeOnTransferTokens** - Buy tokens with BNB (supports tax tokens)
3. **swapExactTokensForETHSupportingFeeOnTransferTokens** - Sell tokens for BNB (supports tax tokens)

## Workflow Example

### Complete Token Launch Workflow

Here's a typical workflow for launching a token with liquidity:

1. **Create Token**
   - Use "Create Token" tab
   - Set token parameters (name, symbol, supply)
   - Configure tax settings
   - Set wallet addresses
   - Deploy token

2. **Add Initial Liquidity** (Using Wallet 1)
   - Navigate to "Add Liquidity" tab
   - Use liquidity provider wallet's private key
   - Enter token address from step 1
   - Add tokens and BNB (e.g., 1,000,000 tokens + 1 BNB)
   - Execute transaction

3. **Test Trading** (Using Wallet 2)
   - Navigate to "Token Swap" tab
   - Use trader wallet's private key
   - Buy small amount to test (e.g., 0.01 BNB)
   - Verify tokens received
   - Test sell if needed

## Code Structure

### New Files Added

```
interface/src/
├── config/
│   └── pancakeswap.ts          # PancakeSwap V2 router config and ABIs
├── utils/
│   └── walletManager.ts        # Private key wallet utilities
├── services/
│   ├── liquidityService.ts     # Liquidity addition service
│   └── swapService.ts          # Token buy/sell service
└── components/
    ├── AddLiquidity.tsx        # Liquidity addition UI
    └── TokenSwap.tsx           # Token swap UI
```

### Key Functions

**Wallet Management:**
- `createWalletFromPrivateKey()` - Create wallet client from private key
- `isValidPrivateKey()` - Validate private key format
- `formatPrivateKey()` - Format private key with 0x prefix

**Liquidity Service:**
- `addLiquidity()` - Add liquidity to PancakeSwap V2
- `getTokenBalance()` - Check token balance
- `getBNBBalance()` - Check BNB balance

**Swap Service:**
- `buyToken()` - Buy tokens with BNB
- `sellToken()` - Sell tokens for BNB
- `getQuoteBuyToken()` - Get quote for buying tokens
- `getQuoteSellToken()` - Get quote for selling tokens
- `getAmountsOut()` - Get expected output amounts

## Error Handling

Common errors and solutions:

1. **"Insufficient token balance"**
   - Ensure wallet has enough tokens
   - Check token address is correct

2. **"Insufficient BNB balance"**
   - Ensure wallet has enough BNB for transaction
   - Remember to account for gas fees

3. **"Invalid private key format"**
   - Check private key is 64 hex characters (without 0x) or 66 (with 0x)
   - Ensure no extra spaces or characters

4. **"Transaction failed"**
   - Check slippage tolerance (increase if needed)
   - Verify token has liquidity
   - Check gas price and network congestion

## Gas Costs

Typical gas costs on BSC:
- Add Liquidity: ~200,000-300,000 gas
- Buy Tokens: ~150,000-200,000 gas
- Sell Tokens: ~150,000-200,000 gas

Note: Actual costs vary based on network congestion and token complexity.

## Testing Checklist

Before using on mainnet with real funds:

- [ ] Verify all addresses are correct
- [ ] Test with small amounts first
- [ ] Check slippage settings
- [ ] Confirm private keys are stored securely
- [ ] Verify transaction on BscScan before proceeding
- [ ] Test buy and sell functions
- [ ] Monitor gas costs

## Support

For issues or questions:
- Check BscScan for transaction details
- Verify PancakeSwap V2 router address is correct
- Ensure using BSC Mainnet (Chain ID: 56)

## Disclaimer

**Use at your own risk.** This software is provided as-is. Always verify transactions and amounts before confirming. Never invest more than you can afford to lose.
