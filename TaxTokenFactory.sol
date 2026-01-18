// SPDX-License-Identifier: MIT
pragma solidity ^0.8.32;

import "./TaxToken.sol";

/**
 * @title TaxTokenFactory
 * @notice Factory for deploying TaxToken clones using EIP-1167 minimal proxy pattern
 */
contract TaxTokenFactory {
    address private _owner;
    address public implementation;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TokenCreated(address indexed tokenAddress, address indexed tokenOwner, string name, string symbol, uint256 totalSupply);
    event DeploymentFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event ImplementationUpdated(address oldImpl, address newImpl);

    address[] public deployedTokens;
    mapping(address => address[]) public tokensByOwner;

    uint256 public deploymentFee = 0.00022 ether;
    address public feeRecipient;
    address public defaultRouter = 0x10ED43C718714eb63d5aA57B78B54704E256024E;

    modifier onlyOwner() {
        require(_owner == msg.sender, "Not owner");
        _;
    }

    constructor(address _feeRecipient) {
        _owner = msg.sender;
        implementation = address(new TaxToken());
        feeRecipient = _feeRecipient == address(0) ? msg.sender : _feeRecipient;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @notice Create a new token with default settings
     * @param name Token name
     * @param symbol Token symbol
     * @param totalSupply Total supply (with 18 decimals)
     * @dev All taxes start at 0, caller becomes owner and all fee wallets
     * @dev Owner can update taxes and wallets after deployment
     */
    function createToken(
        string calldata name,
        string calldata symbol,
        uint256 totalSupply
    ) external payable returns (address tokenAddress) {
        require(msg.value >= deploymentFee, "Insufficient fee");
        require(bytes(name).length > 0 && bytes(symbol).length > 0, "Empty name/symbol");
        require(totalSupply > 0, "Zero supply");

        tokenAddress = _clone(implementation);

        // Caller is owner and all fee recipients, all taxes start at 0
        TaxToken(payable(tokenAddress)).initialize(
            name,
            symbol,
            totalSupply,
            [msg.sender, msg.sender, msg.sender],  // marketing, team, treasury = caller
            defaultRouter,
            [uint256(0), 0, 0, 0, 0],  // buy taxes all 0
            [uint256(0), 0, 0, 0, 0],  // sell taxes all 0
            totalSupply / 5000,        // 0.02% swap threshold
            msg.sender                 // owner = caller
        );

        deployedTokens.push(tokenAddress);
        tokensByOwner[msg.sender].push(tokenAddress);

        if (msg.value > 0 && feeRecipient != address(0)) {
            (bool success, ) = payable(feeRecipient).call{value: msg.value}("");
            require(success, "Fee transfer failed");
        }

        emit TokenCreated(tokenAddress, msg.sender, name, symbol, totalSupply);
    }

    /**
     * @notice EIP-1167 Minimal Proxy Clone
     */
    function _clone(address impl) internal returns (address instance) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x60, impl))
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            instance := create(0, ptr, 0x37)
        }
        require(instance != address(0), "Clone failed");
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    function owner() public view returns (address) { return _owner; }

    function getDeployedTokensCount() external view returns (uint256) {
        return deployedTokens.length;
    }

    function getAllDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }

    function getDeployedTokensPaginated(uint256 offset, uint256 limit) external view returns (address[] memory tokens) {
        uint256 total = deployedTokens.length;
        if (offset >= total) return new address[](0);

        uint256 end = offset + limit > total ? total : offset + limit;
        tokens = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            tokens[i - offset] = deployedTokens[i];
        }
    }

    function getTokensByOwner(address tokenOwner) external view returns (address[] memory) {
        return tokensByOwner[tokenOwner];
    }

    function getTokenCountByOwner(address tokenOwner) external view returns (uint256) {
        return tokensByOwner[tokenOwner].length;
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    function setImplementation(address newImpl) external onlyOwner {
        require(newImpl != address(0), "Zero address");
        emit ImplementationUpdated(implementation, newImpl);
        implementation = newImpl;
    }

    function setDeploymentFee(uint256 newFee) external onlyOwner {
        emit DeploymentFeeUpdated(deploymentFee, newFee);
        deploymentFee = newFee;
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Zero address");
        emit FeeRecipientUpdated(feeRecipient, newRecipient);
        feeRecipient = newRecipient;
    }

    function setDefaultRouter(address newRouter) external onlyOwner {
        require(newRouter != address(0), "Zero address");
        defaultRouter = newRouter;
    }

    function rescueBNB() external onlyOwner {
        (bool success, ) = payable(_owner).call{value: address(this).balance}("");
        require(success, "Failed");
    }

    receive() external payable {}
}
