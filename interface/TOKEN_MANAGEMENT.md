# Token Management Guide

This guide explains how to use the token management features in the TaxToken Factory interface.

## Overview

The token management system allows token owners to configure and control their deployed tokens through an intuitive web interface. All management functions are secured and only accessible by the token owner.

## Features

### 1. Tax Configuration
Configure buy and sell taxes independently with real-time validation.

**Available Tax Categories:**
- **Marketing Tax** - Funds sent to marketing wallet
- **Team Tax** - Funds sent to team wallet
- **Treasury Tax** - Funds sent to treasury wallet
- **Burn Tax** - Tokens sent to burn address (deflationary)
- **Liquidity Tax** - Funds added as liquidity

**Constraints:**
- Each tax is a percentage (0-25%)
- Total buy tax cannot exceed 25%
- Total sell tax cannot exceed 25%
- Taxes are in basis points (100 = 1%)

**Example:**
```
Buy Taxes:
- Marketing: 2%
- Team: 1%
- Treasury: 1%
- Burn: 0.5%
- Liquidity: 0.5%
Total: 5%
```

### 2. Wallet Management
Update the wallet addresses that receive tax distributions.

**Configurable Wallets:**
- **Marketing Wallet** - Receives marketing tax
- **Team Wallet** - Receives team tax
- **Treasury Wallet** - Receives treasury tax

**Requirements:**
- All addresses must be valid Ethereum addresses
- Cannot use zero address (0x0000...)
- All three wallets must be set

### 3. Settings

#### Swap & Liquify
Configure automatic token swapping and liquidity provision.

**Swap Threshold:**
- Set as percentage of total supply (e.g., 0.02%)
- When contract accumulates this amount, auto-swap triggers
- Converts tokens to BNB and distributes to wallets
- Lower threshold = more frequent swaps, higher gas costs
- Higher threshold = less frequent swaps, larger distributions

**Swap Enabled:**
- Toggle automatic swapping on/off
- Disable during high volatility or maintenance
- Can still trigger manual swaps when disabled

**Manual Swap:**
- Manually trigger swap & distribution anytime
- Useful when auto-swap is disabled
- Processes all accumulated tokens in contract

#### Contract Information
View important contract details:
- PancakeSwap pair address
- Links to BscScan for verification

#### Emergency Functions
Critical recovery tools (use with caution):

**Rescue BNB:**
- Withdraws all BNB from token contract to owner
- Use if BNB gets stuck in contract
- Common after failed transactions

**Rescue Tokens:**
- Withdraw accidentally sent tokens (not implemented in UI yet)
- Cannot withdraw own token

### 4. Ownership Management

#### Transfer Ownership
Transfer full control of the token to another address.

**Process:**
1. Enter new owner address
2. Confirm transaction
3. New owner gains all management rights
4. You lose all management access

**Use Cases:**
- Transferring to multisig wallet
- Handing off to team
- Moving to more secure address

**Warning:** This action is irreversible!

#### Renounce Ownership
Permanently remove all owner privileges.

**Effects:**
- No one can change taxes
- No one can update wallets
- No one can modify settings
- Token becomes fully decentralized
- **PERMANENT & IRREVERSIBLE**

**Process:**
1. Click "Renounce Ownership"
2. Confirm first warning
3. Confirm second warning
4. Transaction executes
5. Token is now community-owned

**When to Renounce:**
- After fair launch completion
- When committing to community control
- Never renounce if you need future updates

## How to Use

### Accessing Management Panel

1. **Connect Your Wallet**
   - Click "Connect" in the header
   - Select your wallet provider
   - Approve connection

2. **View Your Tokens**
   - Scroll to "My Tokens" section
   - See all tokens you've deployed
   - Each token shows:
     - Name & Symbol
     - Total Supply
     - Current Buy Tax
     - Current Sell Tax
     - Token Address

3. **Open Management**
   - Click "Manage" button on any token
   - Management panel opens as modal overlay
   - Only works if you're the token owner

### Managing Your Token

1. **Select Tab**
   - Tax Configuration
   - Wallet Management
   - Settings
   - Ownership

2. **Make Changes**
   - Fill in new values
   - Real-time validation shows errors
   - See total tax calculations

3. **Submit Transaction**
   - Click update button
   - Approve in wallet
   - Wait for confirmation
   - Changes take effect immediately

4. **Verify Changes**
   - Data auto-refreshes after transaction
   - Check BscScan for confirmation
   - Test with small trade if needed

## Best Practices

### Tax Configuration
- **Start Low:** Begin with 0% or low taxes during launch
- **Gradual Increases:** Increase taxes slowly if needed
- **Community Input:** Consider community feedback
- **Market Conditions:** Lower taxes during bear markets
- **Competition:** Stay competitive with similar tokens

### Wallet Management
- **Use Multisig:** For team wallets, use multisig for security
- **Separate Wallets:** Don't reuse same address for all
- **Hardware Wallets:** Use hardware wallets for tax recipients
- **Document Changes:** Keep record of wallet changes
- **Test First:** Send small amount to verify addresses work

### Swap Settings
- **Higher Supply = Higher Threshold:** 0.02% works for most
- **Gas Optimization:** Higher threshold = less frequent gas costs
- **Price Impact:** Lower threshold = smaller price impact per swap
- **Manual Control:** Use manual swap during special events
- **Monitor Gas:** Disable auto-swap during high gas periods

### Security
- **Owner Key Security:** Keep owner private key extremely secure
- **Use Hardware Wallet:** Store owner key on hardware wallet
- **Multisig Consideration:** Transfer to multisig for added security
- **Test Transactions:** Test with small amounts first
- **Verify Addresses:** Triple-check addresses before submitting
- **Document Everything:** Keep records of all changes

## Troubleshooting

### "Access Denied" Message
**Problem:** Can't open management panel
**Solution:**
- Ensure you're connected with the owner wallet
- Check you're on the correct network (BSC)
- Verify you actually deployed this token

### Transaction Failed
**Problem:** Transaction reverts or fails
**Possible Causes:**
- Total tax exceeds 25%
- Invalid wallet address
- Insufficient BNB for gas
- Network congestion

**Solutions:**
- Check all inputs are valid
- Ensure tax totals ≤ 25%
- Add BNB to wallet for gas
- Try again later if network busy

### Changes Don't Appear
**Problem:** Updates don't show in UI
**Solution:**
- Wait for transaction confirmation
- Refresh the page
- Clear browser cache
- Check transaction on BscScan

### Manual Swap Fails
**Problem:** Manual swap transaction fails
**Possible Causes:**
- No tokens in contract
- Insufficient liquidity in pair
- Router not approved
- Pair doesn't exist

**Solutions:**
- Wait for tokens to accumulate
- Add liquidity to pool first
- Check PancakeSwap pair exists

## Advanced Features

### Tax Strategies

**Launch Strategy:**
```
Buy: 0% | Sell: 0%
- Fair launch with no taxes
- Builds trust with community
- Add taxes gradually later
```

**Balanced Strategy:**
```
Buy: 5% (2% Marketing, 2% Liquidity, 1% Team)
Sell: 8% (3% Marketing, 3% Liquidity, 2% Team)
- Rewards holders (lower buy)
- Discourages dumps (higher sell)
```

**Deflationary Strategy:**
```
Buy: 3% (1% Burn, 1% Liquidity, 1% Marketing)
Sell: 5% (2% Burn, 2% Liquidity, 1% Marketing)
- Reduces supply over time
- Creates scarcity
- Long-term value accrual
```

### Multi-Wallet Setup

1. **Marketing Wallet**
   - Pays for advertising
   - Social media campaigns
   - Influencer partnerships

2. **Team Wallet**
   - Developer compensation
   - Operational expenses
   - Team incentives

3. **Treasury Wallet**
   - Long-term reserves
   - Emergency funds
   - Strategic investments
   - Multisig recommended

## Safety Checklist

Before renouncing ownership, verify:
- [ ] All taxes are set correctly
- [ ] All wallets are verified and accessible
- [ ] Swap threshold is appropriate
- [ ] Auto-swap is configured as desired
- [ ] Team has multisig access if needed
- [ ] Community is informed
- [ ] No future updates will be needed

## Support

For issues or questions:
1. Check this documentation first
2. Verify on BscScan
3. Review transaction history
4. Contact via project channels
5. File issue on GitHub if bug found

## Important Notes

- **Gas Fees:** Every change requires BNB for gas
- **Network:** Ensure you're on BSC Mainnet
- **Confirmations:** Wait for full confirmation before assuming success
- **Irreversible:** Some actions cannot be undone (renounce, transfer)
- **Owner Only:** Only token owner can access management
- **Real-time:** Changes take effect immediately after confirmation

---

**Remember:** With great power comes great responsibility. Token ownership gives you full control, but also full accountability to your community. Use these tools wisely and transparently.
