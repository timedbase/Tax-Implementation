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
}

interface IPancakeFactory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

/**
 * @title TaxToken
 * @notice ERC20 token with configurable buy/sell taxes - supports clone pattern
 */
contract TaxToken is IERC20 {
    address private _owner;
    bool private _initialized;

    string private _name;
    string private _symbol;
    uint8 private constant DECIMALS = 18;
    uint256 private _totalSupply;

    uint256 public buyMarketingTax;
    uint256 public buyTeamTax;
    uint256 public buyTreasuryTax;
    uint256 public buyBurnTax;
    uint256 public buyLiquidityTax;

    uint256 public sellMarketingTax;
    uint256 public sellTeamTax;
    uint256 public sellTreasuryTax;
    uint256 public sellBurnTax;
    uint256 public sellLiquidityTax;

    uint256 public constant MAX_TOTAL_TAX = 2500;

    uint256 public swapThreshold;

    address public marketingWallet;
    address public teamWallet;
    address public treasuryWallet;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => bool) private _isExcludedFromFee;

    IPancakeRouter02 public pancakeRouter;
    address public pancakePair;

    bool private inSwap;
    bool public swapEnabled;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event WalletsUpdated(address marketing, address team, address treasury);
    event BuyTaxesUpdated(uint256 marketing, uint256 team, uint256 treasury, uint256 burn, uint256 lp);
    event SellTaxesUpdated(uint256 marketing, uint256 team, uint256 treasury, uint256 burn, uint256 lp);
    event SwapAndLiquify(uint256 tokensSwapped, uint256 bnbReceived);
    event Initialized(address indexed owner, string name, string symbol);

    modifier lockSwap { inSwap = true; _; inSwap = false; }

    modifier onlyOwner() {
        require(_owner == msg.sender, "Not owner");
        _;
    }

    /**
     * @notice Initialize the token (used by factory via clone pattern)
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address[3] memory wallets,      // marketing, team, treasury
        address routerAddress,
        uint256[5] memory buyTaxes,     // marketing, team, treasury, burn, liquidity
        uint256[5] memory sellTaxes,    // marketing, team, treasury, burn, liquidity
        uint256 swapThreshold_,
        address tokenOwner
    ) external {
        require(!_initialized, "Already initialized");
        require(wallets[0] != address(0) && wallets[1] != address(0) && wallets[2] != address(0), "Zero wallet");
        require(routerAddress != address(0), "Zero router");
        require(tokenOwner != address(0), "Zero owner");

        _initialized = true;
        _owner = tokenOwner;

        _name = name_;
        _symbol = symbol_;
        _totalSupply = totalSupply_;

        marketingWallet = wallets[0];
        teamWallet = wallets[1];
        treasuryWallet = wallets[2];

        buyMarketingTax = buyTaxes[0];
        buyTeamTax = buyTaxes[1];
        buyTreasuryTax = buyTaxes[2];
        buyBurnTax = buyTaxes[3];
        buyLiquidityTax = buyTaxes[4];
        require(buyMarketingTax + buyTeamTax + buyTreasuryTax + buyBurnTax + buyLiquidityTax <= MAX_TOTAL_TAX, "Buy tax exceeds max");

        sellMarketingTax = sellTaxes[0];
        sellTeamTax = sellTaxes[1];
        sellTreasuryTax = sellTaxes[2];
        sellBurnTax = sellTaxes[3];
        sellLiquidityTax = sellTaxes[4];
        require(sellMarketingTax + sellTeamTax + sellTreasuryTax + sellBurnTax + sellLiquidityTax <= MAX_TOTAL_TAX, "Sell tax exceeds max");

        swapThreshold = swapThreshold_;
        swapEnabled = true;

        pancakeRouter = IPancakeRouter02(routerAddress);
        pancakePair = IPancakeFactory(pancakeRouter.factory()).createPair(address(this), pancakeRouter.WETH());

        _isExcludedFromFee[tokenOwner] = true;
        _isExcludedFromFee[address(this)] = true;
        _isExcludedFromFee[marketingWallet] = true;
        _isExcludedFromFee[teamWallet] = true;
        _isExcludedFromFee[treasuryWallet] = true;
        _isExcludedFromFee[BURN_ADDRESS] = true;

        _balances[tokenOwner] = _totalSupply;
        emit Transfer(address(0), tokenOwner, _totalSupply);
        emit OwnershipTransferred(address(0), tokenOwner);
        emit Initialized(tokenOwner, name_, symbol_);
    }

    function owner() public view returns (address) { return _owner; }
    function name() public view returns (string memory) { return _name; }
    function symbol() public view returns (string memory) { return _symbol; }
    function decimals() public pure returns (uint8) { return DECIMALS; }
    function totalSupply() public view override returns (uint256) { return _totalSupply; }
    function balanceOf(address account) public view override returns (uint256) { return _balances[account]; }

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
        require(currentAllowance >= amount, "Exceeds allowance");
        unchecked { _approve(sender, msg.sender, currentAllowance - amount); }
        return true;
    }

    function _approve(address owner_, address spender, uint256 amount) private {
        require(owner_ != address(0) && spender != address(0), "Zero address");
        _allowances[owner_][spender] = amount;
        emit Approval(owner_, spender, amount);
    }

    function _transfer(address from, address to, uint256 amount) private {
        require(from != address(0) && to != address(0), "Zero address");
        require(amount > 0 && _balances[from] >= amount, "Invalid amount");

        bool takeFee = !(_isExcludedFromFee[from] || _isExcludedFromFee[to]);

        uint256 contractBalance = _balances[address(this)];
        if (contractBalance >= swapThreshold && !inSwap && from != pancakePair && swapEnabled && takeFee) {
            swapAndDistribute(contractBalance);
        }

        _executeTransfer(from, to, amount, takeFee);
    }

    function _executeTransfer(address sender, address recipient, uint256 amount, bool takeFee) private {
        if (!takeFee) {
            _balances[sender] -= amount;
            _balances[recipient] += amount;
            emit Transfer(sender, recipient, amount);
            return;
        }

        bool isBuy = sender == pancakePair;
        bool isSell = recipient == pancakePair;

        uint256 burnAmount;
        uint256 taxToContract;

        if (isBuy) {
            burnAmount = (amount * buyBurnTax) / 10000;
            taxToContract = (amount * (buyMarketingTax + buyTeamTax + buyTreasuryTax + buyLiquidityTax)) / 10000;
        } else if (isSell) {
            burnAmount = (amount * sellBurnTax) / 10000;
            taxToContract = (amount * (sellMarketingTax + sellTeamTax + sellTreasuryTax + sellLiquidityTax)) / 10000;
        }

        uint256 transferAmount = amount - burnAmount - taxToContract;

        _balances[sender] -= amount;
        _balances[recipient] += transferAmount;
        emit Transfer(sender, recipient, transferAmount);

        if (burnAmount > 0) {
            _balances[BURN_ADDRESS] += burnAmount;
            emit Transfer(sender, BURN_ADDRESS, burnAmount);
        }

        if (taxToContract > 0) {
            _balances[address(this)] += taxToContract;
            emit Transfer(sender, address(this), taxToContract);
        }
    }

    function swapAndDistribute(uint256 tokenAmount) private lockSwap {
        uint256 totalBuyTax = buyMarketingTax + buyTeamTax + buyTreasuryTax + buyLiquidityTax;
        uint256 totalSellTax = sellMarketingTax + sellTeamTax + sellTreasuryTax + sellLiquidityTax;
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
        uint256 bnbForTeam = (receivedBNB * (buyTeamTax + sellTeamTax)) / totalBNBTax;
        uint256 bnbForTreasury = receivedBNB - bnbForLP - bnbForMarketing - bnbForTeam;

        if (halfLP > 0 && bnbForLP > 0) {
            _addLiquidity(halfLP, bnbForLP);
            emit SwapAndLiquify(halfLP, bnbForLP);
        }

        _safeTransferBNB(marketingWallet, bnbForMarketing);
        _safeTransferBNB(teamWallet, bnbForTeam);
        _safeTransferBNB(treasuryWallet, bnbForTreasury);
    }

    function _safeTransferBNB(address to, uint256 amount) private {
        if (amount > 0) {
            (bool success, ) = payable(to).call{value: amount}("");
            require(success, "BNB failed");
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

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    function renounceOwnership() external onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    function setBuyTaxes(uint256 _marketing, uint256 _team, uint256 _treasury, uint256 _burn, uint256 _liquidity) external onlyOwner {
        require(_marketing + _team + _treasury + _burn + _liquidity <= MAX_TOTAL_TAX, "Exceeds max");
        buyMarketingTax = _marketing; buyTeamTax = _team; buyTreasuryTax = _treasury; buyBurnTax = _burn; buyLiquidityTax = _liquidity;
        emit BuyTaxesUpdated(_marketing, _team, _treasury, _burn, _liquidity);
    }

    function setSellTaxes(uint256 _marketing, uint256 _team, uint256 _treasury, uint256 _burn, uint256 _liquidity) external onlyOwner {
        require(_marketing + _team + _treasury + _burn + _liquidity <= MAX_TOTAL_TAX, "Exceeds max");
        sellMarketingTax = _marketing; sellTeamTax = _team; sellTreasuryTax = _treasury; sellBurnTax = _burn; sellLiquidityTax = _liquidity;
        emit SellTaxesUpdated(_marketing, _team, _treasury, _burn, _liquidity);
    }

    function setWallets(address _marketing, address _team, address _treasury) external onlyOwner {
        require(_marketing != address(0) && _team != address(0) && _treasury != address(0), "Zero address");
        marketingWallet = _marketing; teamWallet = _team; treasuryWallet = _treasury;
        emit WalletsUpdated(_marketing, _team, _treasury);
    }

    function setSwapThreshold(uint256 amount) external onlyOwner { swapThreshold = amount; }
    function setSwapEnabled(bool enabled) external onlyOwner { swapEnabled = enabled; }
    function excludeFromFee(address account, bool excluded) external onlyOwner { _isExcludedFromFee[account] = excluded; }

    function setRouter(address newRouter) external onlyOwner {
        require(newRouter != address(0), "Zero address");
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
    function isExcludedFromFee(address account) public view returns (bool) { return _isExcludedFromFee[account]; }
    function getTotalBuyTax() public view returns (uint256) { return buyMarketingTax + buyTeamTax + buyTreasuryTax + buyBurnTax + buyLiquidityTax; }
    function getTotalSellTax() public view returns (uint256) { return sellMarketingTax + sellTeamTax + sellTreasuryTax + sellBurnTax + sellLiquidityTax; }

    function manualSwap() external onlyOwner {
        uint256 contractBalance = _balances[address(this)];
        require(contractBalance > 0, "No tokens");
        swapAndDistribute(contractBalance);
    }

    function rescueBNB() external onlyOwner {
        (bool success, ) = payable(_owner).call{value: address(this).balance}("");
        require(success, "Failed");
    }

    function rescueTokens(address tokenAddress) external onlyOwner {
        require(tokenAddress != address(this), "Cannot rescue own");
        IERC20(tokenAddress).transfer(_owner, IERC20(tokenAddress).balanceOf(address(this)));
    }

    receive() external payable {}
}
