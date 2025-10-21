// src/lib/pyusdSwapService.ts
import { ethers } from "ethers";

// Uniswap V3 Router address on Sepolia
const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

// Token addresses on Sepolia
export const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
export const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

// Uniswap V3 Router ABI (minimal interface needed for swap)
const ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];

// ERC20 ABI (minimal interface for approve and balanceOf)
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

export interface SwapParams {
  amountIn: string; // Amount of PYUSD to swap (in token units, e.g., "10.5")
  slippageTolerance?: number; // Slippage tolerance in percentage (default: 0.5%)
}

export interface SwapResult {
  success: boolean;
  amountOut?: string; // Amount of USDC received
  transactionHash?: string;
  error?: string;
}

export class PyusdSwapService {
  private provider: ethers.BrowserProvider;
  private signer: ethers.Signer | null = null;

  constructor(ethereumProvider: any) {
    this.provider = new ethers.BrowserProvider(ethereumProvider);
  }

  /**
   * Initialize the signer
   */
  async initializeSigner(): Promise<void> {
    this.signer = await this.provider.getSigner();
  }

  /**
   * Check if user has enough PYUSD balance
   */
  async checkPyusdBalance(amountNeeded: string): Promise<{ hasEnough: boolean; balance: string }> {
    if (!this.signer) await this.initializeSigner();
    
    const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, this.signer!);
    const userAddress = await this.signer!.getAddress();
    
    const balance = await pyusdContract.balanceOf(userAddress);
    const decimals = await pyusdContract.decimals();
    const amountNeededWei = ethers.parseUnits(amountNeeded, decimals);
    
    return {
      hasEnough: balance >= amountNeededWei,
      balance: ethers.formatUnits(balance, decimals)
    };
  }

  /**
   * Approve PYUSD spending by Uniswap Router
   */
  async approvePyusd(amount: string): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      if (!this.signer) await this.initializeSigner();
      
      const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, this.signer!);
      const decimals = await pyusdContract.decimals();
      const amountWei = ethers.parseUnits(amount, decimals);
      
      // Check current allowance
      const userAddress = await this.signer!.getAddress();
      const currentAllowance = await pyusdContract.allowance(userAddress, UNISWAP_V3_ROUTER);
      
      // If allowance is sufficient, no need to approve again
      if (currentAllowance >= amountWei) {
        console.log("Sufficient allowance already exists");
        return { success: true };
      }
      
      console.log(`Approving ${amount} PYUSD for Uniswap Router...`);
      const tx = await pyusdContract.approve(UNISWAP_V3_ROUTER, amountWei);
      await tx.wait();
      
      console.log("PYUSD approval successful:", tx.hash);
      return { success: true, transactionHash: tx.hash };
    } catch (error) {
      console.error("Error approving PYUSD:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to approve PYUSD" 
      };
    }
  }

  /**
   * Swap PYUSD to USDC using Uniswap V3
   */
  async swapPyusdToUsdc(params: SwapParams): Promise<SwapResult> {
    try {
      if (!this.signer) await this.initializeSigner();
      
      const { amountIn, slippageTolerance = 0.5 } = params;
      
      // Get token decimals
      const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, this.signer!);
      const pyusdDecimals = await pyusdContract.decimals();
      const amountInWei = ethers.parseUnits(amountIn, pyusdDecimals);
      
      // Check balance
      const balanceCheck = await this.checkPyusdBalance(amountIn);
      if (!balanceCheck.hasEnough) {
        return {
          success: false,
          error: `Insufficient PYUSD balance. Have: ${balanceCheck.balance}, Need: ${amountIn}`
        };
      }
      
      // Approve PYUSD spending
      const approvalResult = await this.approvePyusd(amountIn);
      if (!approvalResult.success) {
        return {
          success: false,
          error: `Failed to approve PYUSD: ${approvalResult.error}`
        };
      }
      
      // Calculate minimum amount out with slippage tolerance
      // For simplicity, assuming 1:1 ratio (adjust based on actual pool)
      const expectedAmountOut = amountInWei;
      const slippageMultiplier = (100 - slippageTolerance) / 100;
      const amountOutMinimum = (expectedAmountOut * BigInt(Math.floor(slippageMultiplier * 1000))) / BigInt(1000);
      
      // Prepare swap parameters
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes
      const userAddress = await this.signer!.getAddress();
      
      const swapParams = {
        tokenIn: PYUSD_ADDRESS,
        tokenOut: USDC_ADDRESS,
        fee: 3000, // 0.3% fee tier
        recipient: userAddress,
        deadline: deadline,
        amountIn: amountInWei,
        amountOutMinimum: amountOutMinimum,
        sqrtPriceLimitX96: 0
      };
      
      // Execute swap
      console.log("Executing PYUSD to USDC swap...", swapParams);
      const routerContract = new ethers.Contract(UNISWAP_V3_ROUTER, ROUTER_ABI, this.signer!);
      const tx = await routerContract.exactInputSingle(swapParams);
      
      console.log("Swap transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Swap transaction confirmed:", receipt.hash);
      
      // Parse the amount out from logs (simplified - in production you'd parse the actual swap event)
      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, this.signer!);
      const usdcDecimals = await usdcContract.decimals();
      const usdcBalance = await usdcContract.balanceOf(userAddress);
      
      return {
        success: true,
        amountOut: ethers.formatUnits(usdcBalance, usdcDecimals),
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error("Error swapping PYUSD to USDC:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to swap PYUSD to USDC"
      };
    }
  }

  /**
   * Estimate the amount of USDC that will be received for a given PYUSD amount
   * (Simplified version - in production, you'd query the actual pool)
   */
  async estimateSwapOutput(amountIn: string): Promise<{ estimatedOutput: string; error?: string }> {
    try {
      // For now, assuming 1:1 ratio
      // In production, you'd use Uniswap's quoter contract to get accurate estimates
      return {
        estimatedOutput: amountIn
      };
    } catch (error) {
      return {
        estimatedOutput: "0",
        error: error instanceof Error ? error.message : "Failed to estimate swap output"
      };
    }
  }
}

export default PyusdSwapService;