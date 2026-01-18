# TaxToken Factory Deployment Checklist

## Pre-Deployment

### Smart Contracts

- [ ] **Review TaxToken.sol**
  - [ ] Verify MAX_TOTAL_TAX is set correctly (2500 = 25%)
  - [ ] Check BURN_ADDRESS is correct (0x000000000000000000000000000000000000dEaD)
  - [ ] Verify router address for your network

- [ ] **Review TaxTokenFactory.sol**
  - [ ] Set initial deployment fee
  - [ ] Set fee recipient address
  - [ ] Set default PancakeSwap router address

- [ ] **Compile Contracts**
  ```bash
  # Using Hardhat
  npx hardhat compile

  # Using Foundry
  forge build
  ```

- [ ] **Run Tests** (if you have them)
  ```bash
  # Hardhat
  npx hardhat test

  # Foundry
  forge test
  ```

### Interface Setup

- [ ] **Environment Variables**
  - [ ] Create `.env.local` file
  - [ ] Set `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`
    - Get from: https://cloud.walletconnect.com
  - [ ] Verify WalletConnect Project ID is valid

- [ ] **Update Contract Addresses**
  - [ ] In `src/config/contracts.ts`:
    - Replace `FACTORY_ADDRESS` placeholder with deployed address
    - Verify FACTORY_ABI matches deployed contract
    - Verify TOKEN_ABI matches deployed contract

- [ ] **Test Build**
  ```bash
  npm run build
  ```

## Deployment Steps

### 1. Deploy Contracts to BSC Mainnet

#### Deploy Implementation
```solidity
// 1. Deploy TaxToken implementation
TaxToken implementation = new TaxToken();
```

#### Deploy Factory
```solidity
// 2. Deploy TaxTokenFactory
TaxTokenFactory factory = new TaxTokenFactory(
    feeRecipient,          // Your fee collection address
    implementation,         // TaxToken implementation address
    deploymentFee,         // e.g., 0.00022 BNB
    pancakeRouterV2        // 0x10ED43C718714eb63d5aA57B78B54704E256024E
);
```

**BSC Mainnet Addresses:**
- PancakeSwap V2 Router: `0x10ED43C718714eb63d5aA57B78B54704E256024E`
- WBNB: `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c`

#### Verify on BscScan
```bash
# Verify TaxToken
npx hardhat verify --network bsc <IMPLEMENTATION_ADDRESS>

# Verify TaxTokenFactory
npx hardhat verify --network bsc <FACTORY_ADDRESS> \
  <FEE_RECIPIENT> \
  <IMPLEMENTATION_ADDRESS> \
  <DEPLOYMENT_FEE> \
  <ROUTER_ADDRESS>
```

### 2. Update Interface

- [ ] **Update Factory Address**
  ```typescript
  // src/config/contracts.ts
  export const FACTORY_ADDRESS = '0xYourFactoryAddressHere' as const;
  ```

- [ ] **Test on Testnet First**
  - [ ] Deploy to BSC Testnet
  - [ ] Update addresses in code
  - [ ] Create test token
  - [ ] Test all management functions
  - [ ] Verify gas costs
  - [ ] Check for errors

- [ ] **Build Production**
  ```bash
  npm run build
  ```

### 3. Deploy Interface

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Configuration:**
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**Environment Variables in Vercel:**
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: Your WalletConnect Project ID

#### Option B: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

**Configuration:**
- Build command: `npm run build`
- Publish directory: `.next`
- Functions directory: (leave empty)

#### Option C: Self-Hosted
```bash
# Build
npm run build

# Start
npm start
```

**Requirements:**
- Node.js 18+
- Process manager (PM2 recommended)
- Reverse proxy (nginx recommended)
- SSL certificate (Let's Encrypt)

## Post-Deployment

### Verification

- [ ] **Test Contract Interaction**
  - [ ] Connect wallet to interface
  - [ ] Create test token (small amount)
  - [ ] Verify token appears in "My Tokens"
  - [ ] Open management panel
  - [ ] Test changing taxes
  - [ ] Test changing wallets
  - [ ] Test swap settings
  - [ ] Verify all changes on BscScan

- [ ] **Test All Features**
  - [ ] Token creation form validation
  - [ ] Transaction confirmation flow
  - [ ] Success/error messages
  - [ ] Loading states
  - [ ] Mobile responsiveness
  - [ ] Wallet connection
  - [ ] Network switching

- [ ] **Performance Check**
  - [ ] Page load time < 3s
  - [ ] Time to interactive < 5s
  - [ ] All images optimized
  - [ ] No console errors
  - [ ] No React hydration errors

### Security

- [ ] **Smart Contract Security**
  - [ ] Consider audit (Recommended!)
  - [ ] Verify ownership of factory
  - [ ] Verify implementation address
  - [ ] Test owner-only functions
  - [ ] Verify fee collection works

- [ ] **Interface Security**
  - [ ] HTTPS enabled
  - [ ] CSP headers configured
  - [ ] No API keys in frontend code
  - [ ] Environment variables secured
  - [ ] CORS properly configured

### Documentation

- [ ] **Update README**
  - [ ] Add deployed contract addresses
  - [ ] Add interface URL
  - [ ] Update screenshots if needed
  - [ ] Add usage examples

- [ ] **Create User Guide**
  - [ ] How to create token
  - [ ] How to manage token
  - [ ] Fee structure
  - [ ] Support contact

- [ ] **Technical Documentation**
  - [ ] API endpoints (if any)
  - [ ] Contract ABIs
  - [ ] Deployment parameters
  - [ ] Network information

## Marketing & Launch

### Pre-Launch

- [ ] **Create Marketing Materials**
  - [ ] Landing page copy
  - [ ] Social media graphics
  - [ ] Demo video
  - [ ] Tutorial content

- [ ] **Set Up Channels**
  - [ ] Twitter/X account
  - [ ] Telegram group
  - [ ] Discord server
  - [ ] Medium/Blog

- [ ] **Prepare Announcement**
  - [ ] Launch tweet
  - [ ] Telegram message
  - [ ] Blog post
  - [ ] Feature list

### Launch Day

- [ ] **Announce Launch**
  - [ ] Post on social media
  - [ ] Share in crypto communities
  - [ ] Reach out to influencers
  - [ ] Update website

- [ ] **Monitor**
  - [ ] Watch for bugs/issues
  - [ ] Respond to questions
  - [ ] Track usage metrics
  - [ ] Collect feedback

### Post-Launch

- [ ] **Gather Feedback**
  - [ ] User surveys
  - [ ] Community polls
  - [ ] Error tracking
  - [ ] Feature requests

- [ ] **Iterate**
  - [ ] Fix bugs
  - [ ] Add features
  - [ ] Improve UX
  - [ ] Update docs

## Maintenance

### Regular Tasks

**Daily:**
- [ ] Monitor error logs
- [ ] Check user reports
- [ ] Verify service uptime
- [ ] Monitor gas prices

**Weekly:**
- [ ] Review analytics
- [ ] Update dependencies
- [ ] Backup data
- [ ] Security scan

**Monthly:**
- [ ] Review fee collection
- [ ] Analyze user metrics
- [ ] Plan improvements
- [ ] Update documentation

### Emergency Procedures

**If Factory Compromised:**
1. Pause if pause function exists
2. Deploy new factory
3. Update interface
4. Notify users
5. Document incident

**If Interface Down:**
1. Check hosting service
2. Review error logs
3. Rollback if needed
4. Notify via social media
5. Document resolution

**If Bug Discovered:**
1. Assess severity
2. Document reproduction
3. Deploy fix
4. Test thoroughly
5. Notify affected users

## Checklist Summary

### Contracts
- [x] Compiled successfully
- [ ] Deployed to testnet
- [ ] Tested on testnet
- [ ] Deployed to mainnet
- [ ] Verified on BscScan

### Interface
- [x] Build successful
- [ ] Environment configured
- [ ] Contract addresses updated
- [ ] Tested locally
- [ ] Deployed to production

### Testing
- [ ] Create token works
- [ ] Management panel works
- [ ] All features tested
- [ ] Mobile tested
- [ ] Cross-browser tested

### Security
- [ ] Contracts reviewed
- [ ] Interface secured
- [ ] Keys secured
- [ ] Audit completed (optional)

### Documentation
- [ ] README updated
- [ ] User guide created
- [ ] Tech docs complete
- [ ] Support channels ready

### Launch
- [ ] Marketing prepared
- [ ] Announcement ready
- [ ] Monitoring setup
- [ ] Team briefed

---

**Note:** This is a comprehensive checklist. Adjust based on your specific needs and timeline. Always test thoroughly before mainnet deployment!

## Support Contacts

After deployment, set up:
- Support email
- Telegram support group
- Discord support channel
- GitHub issues (for bugs)

## Success Metrics

Track these KPIs:
- Tokens created
- Total value locked
- Unique users
- Transaction volume
- User retention
- Fee revenue

---

**Remember:** Take your time, test thoroughly, and prioritize security over speed!
