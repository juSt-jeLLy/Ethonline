// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MultiTokenSwap
 * @dev Contract for bi-directional swaps between ETH, USDC, and PYUSD on Sepolia testnet
 * Only owner can manage liquidity
 */
contract MultiTokenSwap is Ownable, ReentrancyGuard {
    IERC20 public usdc;
    IERC20 public pyusd;
    
    // Exchange rates (scaled by 1e18 for precision)
    // ETH rates
    uint256 public ethToUsdcRate = 2000 * 1e6; // 1 ETH = 2000 USDC (USDC has 6 decimals)
    uint256 public ethToPyusdRate = 2000 * 1e6; // 1 ETH = 2000 PYUSD
    
    // Stablecoin rates (1:1 assumed)
    uint256 public pyusdToUsdcRate = 1 * 1e6; // 1 PYUSD = 1 USDC
    uint256 public usdcToPyusdRate = 1 * 1e6; // 1 USDC = 1 PYUSD
    
    event Swapped(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event RateUpdated(address indexed tokenIn, address indexed tokenOut, uint256 newRate);
    
    event LiquidityAdded(
        address indexed token,
        uint256 amount
    );
    
    event LiquidityRemoved(
        address indexed token,
        uint256 amount
    );
    
    constructor(address _usdc, address _pyusd) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        pyusd = IERC20(_pyusd);
    }
    
    // ============ SWAP FUNCTIONS ============
    
    /**
     * @dev Swap ETH for USDC
     */
    function swapEthForUsdc() external payable nonReentrant {
        require(msg.value > 0, "Must send ETH");
        
        uint256 usdcAmount = (msg.value * ethToUsdcRate) / 1e18;
        require(usdc.balanceOf(address(this)) >= usdcAmount, "Insufficient USDC liquidity");
        
        require(usdc.transfer(msg.sender, usdcAmount), "USDC transfer failed");
        
        emit Swapped(msg.sender, address(0), address(usdc), msg.value, usdcAmount);
    }
    
    /**
     * @dev Swap ETH for PYUSD
     */
    function swapEthForPyusd() external payable nonReentrant {
        require(msg.value > 0, "Must send ETH");
        
        uint256 pyusdAmount = (msg.value * ethToPyusdRate) / 1e18;
        require(pyusd.balanceOf(address(this)) >= pyusdAmount, "Insufficient PYUSD liquidity");
        
        require(pyusd.transfer(msg.sender, pyusdAmount), "PYUSD transfer failed");
        
        emit Swapped(msg.sender, address(0), address(pyusd), msg.value, pyusdAmount);
    }
    
    /**
     * @dev Swap USDC for ETH
     * @param amount Amount of USDC to swap
     */
    function swapUsdcForEth(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 ethAmount = (amount * 1e18) / ethToUsdcRate;
        require(address(this).balance >= ethAmount, "Insufficient ETH liquidity");
        
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "ETH transfer failed");
        
        emit Swapped(msg.sender, address(usdc), address(0), amount, ethAmount);
    }
    
    /**
     * @dev Swap PYUSD for ETH
     * @param amount Amount of PYUSD to swap
     */
    function swapPyusdForEth(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 ethAmount = (amount * 1e18) / ethToPyusdRate;
        require(address(this).balance >= ethAmount, "Insufficient ETH liquidity");
        
        require(pyusd.transferFrom(msg.sender, address(this), amount), "PYUSD transfer failed");
        
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "ETH transfer failed");
        
        emit Swapped(msg.sender, address(pyusd), address(0), amount, ethAmount);
    }
    
    /**
     * @dev Swap USDC for PYUSD
     * @param amount Amount of USDC to swap
     */
    function swapUsdcForPyusd(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 pyusdAmount = (amount * usdcToPyusdRate) / 1e6;
        require(pyusd.balanceOf(address(this)) >= pyusdAmount, "Insufficient PYUSD liquidity");
        
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        require(pyusd.transfer(msg.sender, pyusdAmount), "PYUSD transfer failed");
        
        emit Swapped(msg.sender, address(usdc), address(pyusd), amount, pyusdAmount);
    }
    
    /**
     * @dev Swap PYUSD for USDC
     * @param amount Amount of PYUSD to swap
     */
    function swapPyusdForUsdc(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 usdcAmount = (amount * pyusdToUsdcRate) / 1e6;
        require(usdc.balanceOf(address(this)) >= usdcAmount, "Insufficient USDC liquidity");
        
        require(pyusd.transferFrom(msg.sender, address(this), amount), "PYUSD transfer failed");
        require(usdc.transfer(msg.sender, usdcAmount), "USDC transfer failed");
        
        emit Swapped(msg.sender, address(pyusd), address(usdc), amount, usdcAmount);
    }
    
    // ============ LIQUIDITY FUNCTIONS (OWNER ONLY) ============
    
    /**
     * @dev Add ETH liquidity to the contract
     */
    function addEthLiquidity() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH");
        
        emit LiquidityAdded(address(0), msg.value);
    }
    
    /**
     * @dev Add USDC liquidity to the contract
     * @param amount Amount of USDC to add
     */
    function addUsdcLiquidity(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");
        
        emit LiquidityAdded(address(usdc), amount);
    }
    
    /**
     * @dev Add PYUSD liquidity to the contract
     * @param amount Amount of PYUSD to add
     */
    function addPyusdLiquidity(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        require(pyusd.transferFrom(msg.sender, address(this), amount), "PYUSD transfer failed");
        
        emit LiquidityAdded(address(pyusd), amount);
    }
    
    /**
     * @dev Remove ETH liquidity from the contract
     * @param amount Amount of ETH to remove
     */
    function removeEthLiquidity(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient contract balance");
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");
        
        emit LiquidityRemoved(address(0), amount);
    }
    
    /**
     * @dev Remove USDC liquidity from the contract
     * @param amount Amount of USDC to remove
     */
    function removeUsdcLiquidity(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(usdc.balanceOf(address(this)) >= amount, "Insufficient contract balance");
        
        require(usdc.transfer(msg.sender, amount), "USDC transfer failed");
        
        emit LiquidityRemoved(address(usdc), amount);
    }
    
    /**
     * @dev Remove PYUSD liquidity from the contract
     * @param amount Amount of PYUSD to remove
     */
    function removePyusdLiquidity(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(pyusd.balanceOf(address(this)) >= amount, "Insufficient contract balance");
        
        require(pyusd.transfer(msg.sender, amount), "PYUSD transfer failed");
        
        emit LiquidityRemoved(address(pyusd), amount);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Update ETH to USDC exchange rate
     * @param newRate New rate (scaled by 1e6)
     */
    function updateEthToUsdcRate(uint256 newRate) external onlyOwner {
        ethToUsdcRate = newRate;
        emit RateUpdated(address(0), address(usdc), newRate);
    }
    
    /**
     * @dev Update ETH to PYUSD exchange rate
     * @param newRate New rate (scaled by 1e6)
     */
    function updateEthToPyusdRate(uint256 newRate) external onlyOwner {
        ethToPyusdRate = newRate;
        emit RateUpdated(address(0), address(pyusd), newRate);
    }
    
    /**
     * @dev Update PYUSD to USDC exchange rate
     * @param newRate New rate (scaled by 1e6)
     */
    function updatePyusdToUsdcRate(uint256 newRate) external onlyOwner {
        pyusdToUsdcRate = newRate;
        emit RateUpdated(address(pyusd), address(usdc), newRate);
    }
    
    /**
     * @dev Update USDC to PYUSD exchange rate
     * @param newRate New rate (scaled by 1e6)
     */
    function updateUsdcToPyusdRate(uint256 newRate) external onlyOwner {
        usdcToPyusdRate = newRate;
        emit RateUpdated(address(usdc), address(pyusd), newRate);
    }
    
    /**
     * @dev Withdraw all ETH from contract
     */
    function withdrawAllEth() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Withdraw all USDC from contract
     */
    function withdrawAllUsdc() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(usdc.transfer(owner(), balance), "USDC transfer failed");
    }
    
    /**
     * @dev Withdraw all PYUSD from contract
     */
    function withdrawAllPyusd() external onlyOwner {
        uint256 balance = pyusd.balanceOf(address(this));
        require(pyusd.transfer(owner(), balance), "PYUSD transfer failed");
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get contract's ETH balance
     */
    function getEthBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get contract's USDC balance
     */
    function getUsdcBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
    
    /**
     * @dev Get contract's PYUSD balance
     */
    function getPyusdBalance() external view returns (uint256) {
        return pyusd.balanceOf(address(this));
    }
    
    /**
     * @dev Calculate USDC output for ETH input
     * @param ethAmount Amount of ETH
     */
    function calculateEthToUsdc(uint256 ethAmount) external view returns (uint256) {
        return (ethAmount * ethToUsdcRate) / 1e18;
    }
    
    /**
     * @dev Calculate PYUSD output for ETH input
     * @param ethAmount Amount of ETH
     */
    function calculateEthToPyusd(uint256 ethAmount) external view returns (uint256) {
        return (ethAmount * ethToPyusdRate) / 1e18;
    }
    
    /**
     * @dev Calculate ETH output for USDC input
     * @param usdcAmount Amount of USDC
     */
    function calculateUsdcToEth(uint256 usdcAmount) external view returns (uint256) {
        return (usdcAmount * 1e18) / ethToUsdcRate;
    }
    
    /**
     * @dev Calculate ETH output for PYUSD input
     * @param pyusdAmount Amount of PYUSD
     */
    function calculatePyusdToEth(uint256 pyusdAmount) external view returns (uint256) {
        return (pyusdAmount * 1e18) / ethToPyusdRate;
    }
    
    /**
     * @dev Calculate PYUSD output for USDC input
     * @param usdcAmount Amount of USDC
     */
    function calculateUsdcToPyusd(uint256 usdcAmount) external view returns (uint256) {
        return (usdcAmount * usdcToPyusdRate) / 1e6;
    }
    
    /**
     * @dev Calculate USDC output for PYUSD input
     * @param pyusdAmount Amount of PYUSD
     */
    function calculatePyusdToUsdc(uint256 pyusdAmount) external view returns (uint256) {
        return (pyusdAmount * pyusdToUsdcRate) / 1e6;
    }
    
    // Receive ETH
    receive() external payable {}
}