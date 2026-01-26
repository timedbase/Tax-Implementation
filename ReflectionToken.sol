// SPDX-License-Identifier: MIT
pragma solidity ^0.8.32;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface IPancakeRouter02 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;
}

interface IPancakeFactory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

/**
 * @title ReflectionToken
 * @notice ERC20 token with reflection rewards distributed to holders
 * @dev Uses RFI-style reflection mechanism where holders earn passive rewards
 */
contract ReflectionToken is IERC20 {
    // Custom errors for gas optimization
    error NotOwner();
    error AlreadyInitialized();
    error ZeroAddress();
    error ZeroAmount();
    error ExceedsMax();
    error ExceedsAllowance();
    error AlreadyExcluded();
    error NotExcluded();
    error TransferFailed();
    error IndexOOB();
    address private _owner;
    bool private _initialized;

    string private _name;
    string private _symbol;
    uint8 private constant DECIMALS = 18;

    uint256 private _tTotal;  // Total supply in t-space (actual tokens)
    uint256 private _rTotal;  // Total supply in r-space (reflection space)
    uint256 private constant MAX = ~uint256(0);

    // Buy taxes (in basis points: 100 = 1%)
    uint256 public buyMarketingTax;
    uint256 public buyTeamTax;
    uint256 public buyLiquidityTax;
    uint256 public buyBurnTax;
    uint256 public buyReflectionTax;

    // Sell taxes
    uint256 public sellMarketingTax;
    uint256 public sellTeamTax;
    uint256 public sellLiquidityTax;
    uint256 public sellBurnTax;
    uint256 public sellReflectionTax;

    uint256 public constant MAX_TOTAL_TAX = 2500; // 25% max

    uint256 public swapThreshold;

    address public marketingWallet;
    address public teamWallet;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // Reflection tracking
    mapping(address => uint256) private _rOwned;  // Reflection balance
    mapping(address => uint256) private _tOwned;  // Token balance (for excluded)
    mapping(address => mapping(address => uint256)) private _allowances;

    mapping(address => bool) private _isExcludedFromFee;
    mapping(address => bool) private _isExcludedFromReflection;
    address[] private _excludedFromReflection;

    uint256 private _tFeeTotal;  // Total fees reflected

    IPancakeRouter02 public pancakeRouter;
    address public pancakePair;

    bool private inSwap;
    bool public swapEnabled;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event WalletsUpdated(address marketing, address team);
    event BuyTaxesUpdated(uint256 marketing, uint256 team, uint256 liquidity, uint256 burn, uint256 reflection);
    event SellTaxesUpdated(uint256 marketing, uint256 team, uint256 liquidity, uint256 burn, uint256 reflection);
    event SwapAndLiquify(uint256 tokensSwapped, uint256 bnbReceived);
    event Initialized(address indexed owner, string name, string symbol);
    event ExcludedFromReflection(address indexed account);
    event IncludedInReflection(address indexed account);

    modifier lockSwap { inSwap = true; _; inSwap = false; }

    modifier onlyOwner() {
        if (_owner != msg.sender) revert NotOwner();
        _;
    }

    /**
     * @notice Initialize the token (used by factory via clone pattern)
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address[2] memory wallets,      // marketing, team
        address routerAddress,
        uint256[5] memory buyTaxes,     // marketing, team, liquidity, burn, reflection
        uint256[5] memory sellTaxes,    // marketing, team, liquidity, burn, reflection
        uint256 swapThreshold_,
        address tokenOwner
    ) external {
        if (_initialized) revert AlreadyInitialized();
        if (wallets[0] == address(0) || wallets[1] == address(0)) revert ZeroAddress();
        if (routerAddress == address(0)) revert ZeroAddress();
        if (tokenOwner == address(0)) revert ZeroAddress();

        _initialized = true;
        _owner = tokenOwner;

        _name = name_;
        _symbol = symbol_;
        _tTotal = totalSupply_;
        _rTotal = (MAX - (MAX % _tTotal));

        marketingWallet = wallets[0];
        teamWallet = wallets[1];

        buyMarketingTax = buyTaxes[0];
        buyTeamTax = buyTaxes[1];
        buyLiquidityTax = buyTaxes[2];
        buyBurnTax = buyTaxes[3];
        buyReflectionTax = buyTaxes[4];
        if (_getTotalBuyTax() > MAX_TOTAL_TAX) revert ExceedsMax();

        sellMarketingTax = sellTaxes[0];
        sellTeamTax = sellTaxes[1];
        sellLiquidityTax = sellTaxes[2];
        sellBurnTax = sellTaxes[3];
        sellReflectionTax = sellTaxes[4];
        if (_getTotalSellTax() > MAX_TOTAL_TAX) revert ExceedsMax();

        swapThreshold = swapThreshold_;
        swapEnabled = true;

        pancakeRouter = IPancakeRouter02(routerAddress);
        pancakePair = IPancakeFactory(pancakeRouter.factory()).createPair(address(this), pancakeRouter.WETH());

        // Exclude from fees
        _isExcludedFromFee[tokenOwner] = true;
        _isExcludedFromFee[address(this)] = true;
        _isExcludedFromFee[marketingWallet] = true;
        _isExcludedFromFee[teamWallet] = true;
        _isExcludedFromFee[BURN_ADDRESS] = true;

        // Exclude from reflection (contract, burn, pair)
        _excludeFromReflection(address(this));
        _excludeFromReflection(BURN_ADDRESS);
        _excludeFromReflection(pancakePair);

        // Mint to owner
        _rOwned[tokenOwner] = _rTotal;
        emit Transfer(address(0), tokenOwner, _tTotal);
        emit OwnershipTransferred(address(0), tokenOwner);
        emit Initialized(tokenOwner, name_, symbol_);
    }

    // ============================================
    // ERC20 STANDARD FUNCTIONS
    // ============================================

    function owner() public view returns (address) { return _owner; }
    function name() public view returns (string memory) { return _name; }
    function symbol() public view returns (string memory) { return _symbol; }
    function decimals() public pure returns (uint8) { return DECIMALS; }
    function totalSupply() public view override returns (uint256) { return _tTotal; }

    function balanceOf(address account) public view override returns (uint256) {
        if (_isExcludedFromReflection[account]) return _tOwned[account];
        return tokenFromReflection(_rOwned[account]);
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function allowance(address owner_, address spender) public view override returns (uint256) {
        return _allowances[owner_][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        _transfer(sender, recipient, amount);
        uint256 currentAllowance = _allowances[sender][msg.sender];
        if (currentAllowance < amount) revert ExceedsAllowance();
        unchecked { _approve(sender, msg.sender, currentAllowance - amount); }
        return true;
    }

    function _approve(address owner_, address spender, uint256 amount) private {
        if (owner_ == address(0) || spender == address(0)) revert ZeroAddress();
        _allowances[owner_][spender] = amount;
        emit Approval(owner_, spender, amount);
    }

    // ============================================
    // REFLECTION FUNCTIONS
    // ============================================

    function tokenFromReflection(uint256 rAmount) public view returns (uint256) {
        if (rAmount > _rTotal) revert ExceedsMax();
        return rAmount / _getRate();
    }

    function reflectionFromToken(uint256 tAmount) public view returns (uint256) {
        if (tAmount > _tTotal) revert ExceedsMax();
        return tAmount * _getRate();
    }

    function totalFees() public view returns (uint256) {
        return _tFeeTotal;
    }

    function isExcludedFromReflection(address account) public view returns (bool) {
        return _isExcludedFromReflection[account];
    }

    function isExcludedFromFee(address account) public view returns (bool) {
        return _isExcludedFromFee[account];
    }

    function _getRate() private view returns (uint256) {
        (uint256 rSupply, uint256 tSupply) = _getCurrentSupply();
        return rSupply / tSupply;
    }

    function _getCurrentSupply() private view returns (uint256, uint256) {
        uint256 rSupply = _rTotal;
        uint256 tSupply = _tTotal;

        for (uint256 i = 0; i < _excludedFromReflection.length; i++) {
            if (_rOwned[_excludedFromReflection[i]] > rSupply || _tOwned[_excludedFromReflection[i]] > tSupply) {
                return (_rTotal, _tTotal);
            }
            rSupply -= _rOwned[_excludedFromReflection[i]];
            tSupply -= _tOwned[_excludedFromReflection[i]];
        }

        if (rSupply < _rTotal / _tTotal) return (_rTotal, _tTotal);
        return (rSupply, tSupply);
    }

    // ============================================
    // TRANSFER LOGIC
    // ============================================

    struct FeeValues {
        uint256 tReflection;
        uint256 tBurn;
        uint256 tToContract;
        uint256 tTotal;
    }

    function _transfer(address from, address to, uint256 amount) private {
        if (from == address(0) || to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        bool takeFee = !(_isExcludedFromFee[from] || _isExcludedFromFee[to]);

        uint256 contractBalance = balanceOf(address(this));
        if (contractBalance >= swapThreshold && !inSwap && from != pancakePair && swapEnabled && takeFee) {
            swapAndDistribute(contractBalance);
        }

        _tokenTransfer(from, to, amount, takeFee);
    }

    function _calculateFees(uint256 tAmount, bool isBuy, bool isSell) private view returns (FeeValues memory) {
        FeeValues memory fees;
        if (isBuy) {
            fees.tReflection = (tAmount * buyReflectionTax) / 10000;
            fees.tBurn = (tAmount * buyBurnTax) / 10000;
            fees.tToContract = (tAmount * (buyMarketingTax + buyTeamTax + buyLiquidityTax)) / 10000;
        } else if (isSell) {
            fees.tReflection = (tAmount * sellReflectionTax) / 10000;
            fees.tBurn = (tAmount * sellBurnTax) / 10000;
            fees.tToContract = (tAmount * (sellMarketingTax + sellTeamTax + sellLiquidityTax)) / 10000;
        }
        fees.tTotal = fees.tReflection + fees.tBurn + fees.tToContract;
        return fees;
    }

    function _tokenTransfer(address sender, address recipient, uint256 tAmount, bool takeFee) private {
        FeeValues memory fees;
        if (takeFee) {
            fees = _calculateFees(tAmount, sender == pancakePair, recipient == pancakePair);
        }

        uint256 tTransferAmount = tAmount - fees.tTotal;
        uint256 currentRate = _getRate();
        uint256 rAmount = tAmount * currentRate;
        uint256 rTransferAmount = rAmount - (fees.tTotal * currentRate);

        // Update sender
        if (_isExcludedFromReflection[sender]) {
            _tOwned[sender] -= tAmount;
        }
        _rOwned[sender] -= rAmount;

        // Update recipient
        if (_isExcludedFromReflection[recipient]) {
            _tOwned[recipient] += tTransferAmount;
        }
        _rOwned[recipient] += rTransferAmount;

        emit Transfer(sender, recipient, tTransferAmount);

        // Process fees
        _processFees(sender, fees, currentRate);
    }

    function _processFees(address sender, FeeValues memory fees, uint256 currentRate) private {
        // Handle reflection (distribute to all holders)
        if (fees.tReflection > 0) {
            _rTotal -= fees.tReflection * currentRate;
            _tFeeTotal += fees.tReflection;
        }

        // Handle burn
        if (fees.tBurn > 0) {
            uint256 rBurn = fees.tBurn * currentRate;
            _rOwned[BURN_ADDRESS] += rBurn;
            _tOwned[BURN_ADDRESS] += fees.tBurn;
            emit Transfer(sender, BURN_ADDRESS, fees.tBurn);
        }

        // Collect taxes to contract for swapping
        if (fees.tToContract > 0) {
            uint256 rToContract = fees.tToContract * currentRate;
            _rOwned[address(this)] += rToContract;
            _tOwned[address(this)] += fees.tToContract;
            emit Transfer(sender, address(this), fees.tToContract);
        }
    }

    // ============================================
    // SWAP AND DISTRIBUTE
    // ============================================

    function swapAndDistribute(uint256 tokenAmount) private lockSwap {
        uint256 totalBuyTax = buyMarketingTax + buyTeamTax + buyLiquidityTax;
        uint256 totalSellTax = sellMarketingTax + sellTeamTax + sellLiquidityTax;
        uint256 totalTax = totalBuyTax + totalSellTax;

        if (totalTax == 0) return;

        uint256 lpTokens = (tokenAmount * (buyLiquidityTax + sellLiquidityTax)) / totalTax;
        uint256 halfLP = lpTokens / 2;
        uint256 tokensToSwap = tokenAmount - halfLP;

        uint256 initialBNB = address(this).balance;
        _swapTokensForBNB(tokensToSwap);
        uint256 receivedBNB = address(this).balance - initialBNB;

        uint256 totalBNBTax = totalTax - (buyLiquidityTax + sellLiquidityTax) / 2;

        uint256 bnbForLP = (receivedBNB * (buyLiquidityTax + sellLiquidityTax) / 2) / totalBNBTax;
        uint256 bnbForMarketing = (receivedBNB * (buyMarketingTax + sellMarketingTax)) / totalBNBTax;
        uint256 bnbForTeam = receivedBNB - bnbForLP - bnbForMarketing;

        if (halfLP > 0 && bnbForLP > 0) {
            _addLiquidity(halfLP, bnbForLP);
            emit SwapAndLiquify(halfLP, bnbForLP);
        }

        _safeTransferBNB(marketingWallet, bnbForMarketing);
        _safeTransferBNB(teamWallet, bnbForTeam);
    }

    function _safeTransferBNB(address to, uint256 amount) private {
        if (amount > 0) {
            (bool success, ) = payable(to).call{value: amount}("");
            if (!success) revert TransferFailed();
        }
    }

    function _swapTokensForBNB(uint256 tokenAmount) private {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = pancakeRouter.WETH();
        _approve(address(this), address(pancakeRouter), tokenAmount);
        pancakeRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(tokenAmount, 0, path, address(this), block.timestamp);
    }

    function _addLiquidity(uint256 tokenAmount, uint256 bnbAmount) private {
        _approve(address(this), address(pancakeRouter), tokenAmount);
        pancakeRouter.addLiquidityETH{value: bnbAmount}(address(this), tokenAmount, 0, 0, BURN_ADDRESS, block.timestamp);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    function renounceOwnership() external onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    function setBuyTaxes(uint256 _marketing, uint256 _team, uint256 _liquidity, uint256 _burn, uint256 _reflection) external onlyOwner {
        if (_marketing + _team + _liquidity + _burn + _reflection > MAX_TOTAL_TAX) revert ExceedsMax();
        buyMarketingTax = _marketing;
        buyTeamTax = _team;
        buyLiquidityTax = _liquidity;
        buyBurnTax = _burn;
        buyReflectionTax = _reflection;
        emit BuyTaxesUpdated(_marketing, _team, _liquidity, _burn, _reflection);
    }

    function setSellTaxes(uint256 _marketing, uint256 _team, uint256 _liquidity, uint256 _burn, uint256 _reflection) external onlyOwner {
        if (_marketing + _team + _liquidity + _burn + _reflection > MAX_TOTAL_TAX) revert ExceedsMax();
        sellMarketingTax = _marketing;
        sellTeamTax = _team;
        sellLiquidityTax = _liquidity;
        sellBurnTax = _burn;
        sellReflectionTax = _reflection;
        emit SellTaxesUpdated(_marketing, _team, _liquidity, _burn, _reflection);
    }

    function setWallets(address _marketing, address _team) external onlyOwner {
        if (_marketing == address(0) || _team == address(0)) revert ZeroAddress();
        marketingWallet = _marketing;
        teamWallet = _team;
        emit WalletsUpdated(_marketing, _team);
    }

    function setSwapThreshold(uint256 amount) external onlyOwner { swapThreshold = amount; }
    function setSwapEnabled(bool enabled) external onlyOwner { swapEnabled = enabled; }
    function excludeFromFee(address account, bool excluded) external onlyOwner { _isExcludedFromFee[account] = excluded; }

    function excludeFromReflection(address account) external onlyOwner {
        if (_isExcludedFromReflection[account]) revert AlreadyExcluded();
        _excludeFromReflection(account);
    }

    function _excludeFromReflection(address account) private {
        if (_rOwned[account] > 0) {
            _tOwned[account] = tokenFromReflection(_rOwned[account]);
        }
        _isExcludedFromReflection[account] = true;
        _excludedFromReflection.push(account);
        emit ExcludedFromReflection(account);
    }

    function includeInReflection(address account) external onlyOwner {
        if (!_isExcludedFromReflection[account]) revert NotExcluded();
        for (uint256 i = 0; i < _excludedFromReflection.length; i++) {
            if (_excludedFromReflection[i] == account) {
                _excludedFromReflection[i] = _excludedFromReflection[_excludedFromReflection.length - 1];
                _excludedFromReflection.pop();
                break;
            }
        }
        _tOwned[account] = 0;
        _isExcludedFromReflection[account] = false;
        emit IncludedInReflection(account);
    }

    function setRouter(address newRouter) external onlyOwner {
        if (newRouter == address(0)) revert ZeroAddress();
        pancakeRouter = IPancakeRouter02(newRouter);
        address factory = pancakeRouter.factory();
        address weth = pancakeRouter.WETH();
        address existingPair = IPancakeFactory(factory).getPair(address(this), weth);
        if (existingPair == address(0)) {
            pancakePair = IPancakeFactory(factory).createPair(address(this), weth);
        } else {
            pancakePair = existingPair;
        }
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    function _getTotalBuyTax() private view returns (uint256) {
        return buyMarketingTax + buyTeamTax + buyLiquidityTax + buyBurnTax + buyReflectionTax;
    }

    function _getTotalSellTax() private view returns (uint256) {
        return sellMarketingTax + sellTeamTax + sellLiquidityTax + sellBurnTax + sellReflectionTax;
    }

    function getTotalBuyTax() public view returns (uint256) { return _getTotalBuyTax(); }
    function getTotalSellTax() public view returns (uint256) { return _getTotalSellTax(); }

    function getExcludedFromReflectionCount() public view returns (uint256) {
        return _excludedFromReflection.length;
    }

    function getExcludedFromReflection(uint256 index) public view returns (address) {
        if (index >= _excludedFromReflection.length) revert IndexOOB();
        return _excludedFromReflection[index];
    }

    // ============================================
    // RESCUE FUNCTIONS
    // ============================================

    function manualSwap() external onlyOwner {
        uint256 contractBalance = balanceOf(address(this));
        if (contractBalance == 0) revert ZeroAmount();
        swapAndDistribute(contractBalance);
    }

    function rescueBNB() external onlyOwner {
        (bool success, ) = payable(_owner).call{value: address(this).balance}("");
        if (!success) revert TransferFailed();
    }

    function rescueTokens(address tokenAddress) external onlyOwner {
        if (tokenAddress == address(this)) revert ZeroAddress();
        IERC20(tokenAddress).transfer(_owner, IERC20(tokenAddress).balanceOf(address(this)));
    }

    receive() external payable {}
}
