// src/lib/pyusdSwapService.ts
import { ethers } from "ethers";

// Correct Uniswap V3 addresses on Sepolia
const UNISWAP_V3_ROUTER = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";

// Token addresses on Sepolia - VERIFIED
export const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
export const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

// Uniswap V3 Router ABI
const ROUTER_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"internalType": "address", "name": "tokenIn", "type": "address"},
          {"internalType": "address", "name": "tokenOut", "type": "address"},
          {"internalType": "uint24", "name": "fee", "type": "uint24"},
          {"internalType": "address", "name": "recipient", "type": "address"},
          {"internalType": "uint256", "name": "deadline", "type": "uint256"},
          {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
          {"internalType": "uint256", "name": "amountOutMinimum", "type": "uint256"},
          {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"}
        ],
        "internalType": "struct ISwapRouter.ExactInputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactInputSingle",
    "outputs": [{"internalType": "uint256", "name": "amountOut", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  }
];

// ERC20 ABI
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function transfer(address to, uint256 amount) external returns (bool)"
];

// Common fee tiers (in basis points)
export const FEE_TIERS = {
  LOW: 100,      // 0.01%
  MEDIUM: 500,   // 0.05%
  STANDARD: 3000, // 0.3% - Most common for major pairs
  HIGH: 10000    // 1%
};

export interface SwapParams {
  amountIn: string; // Amount of PYUSD to swap (in token units, e.g., "10.5")
  slippageTolerance?: number; // Slippage tolerance in percentage (default: 0.5%)
  feeTier?: number; // Fee tier (default: 0.3%)
}

export interface SwapResult {
  success: boolean;
  amountOut?: string; // Amount of USDC received
  transactionHash?: string;
  error?: string;
  gasUsed?: string;
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
  async checkPyusdBalance(amountNeeded: string): Promise<{ hasEnough: boolean; balance: string; formattedNeeded: string }> {
    if (!this.signer) await this.initializeSigner();
    
    try {
      const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, this.signer!);
      const userAddress = await this.signer!.getAddress();
      
      const balance = await pyusdContract.balanceOf(userAddress);
      const decimals = await pyusdContract.decimals();
      const amountNeededWei = ethers.parseUnits(amountNeeded, decimals);
      
      return {
        hasEnough: balance >= amountNeededWei,
        balance: ethers.formatUnits(balance, decimals),
        formattedNeeded: amountNeeded
      };
    } catch (error) {
      console.error("Error checking PYUSD balance:", error);
      return {
        hasEnough: false,
        balance: "0",
        formattedNeeded: amountNeeded
      };
    }
  }

  /**
   * SIMPLIFIED: Estimate output without Quoter (since pool might not exist)
   */
  async estimateSwapOutput(amountIn: string): Promise<{ estimatedOutput: string; error?: string }> {
    try {
      // Since Quoter is failing, assume 1:1 ratio for testing
      // In production, you'd need to check if pool exists first
      const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, this.signer!);
      const pyusdDecimals = await pyusdContract.decimals();
      const amountInWei = ethers.parseUnits(amountIn, pyusdDecimals);
      
      // USDC has 6 decimals, PYUSD has 6 decimals - assuming 1:1 for now
      return {
        estimatedOutput: ethers.formatUnits(amountInWei, 6) // Convert to USDC decimals
      };
    } catch (error) {
      return {
        estimatedOutput: "0",
        error: error instanceof Error ? error.message : "Failed to estimate swap output"
      };
    }
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
      const receipt = await tx.wait();
      
      console.log("PYUSD approval successful:", receipt.hash);
      return { success: true, transactionHash: receipt.hash };
    } catch (error) {
      console.error("Error approving PYUSD:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to approve PYUSD" 
      };
    }
  }

  /**
   * Swap PYUSD to USDC using Uniswap V3 - SIMPLIFIED VERSION
   */
  async swapPyusdToUsdc(params: SwapParams): Promise<SwapResult> {
    try {
      if (!this.signer) await this.initializeSigner();
      
      const { amountIn, slippageTolerance = 0.5, feeTier = FEE_TIERS.STANDARD } = params;
      
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
      
      // Use simplified estimation since Quoter is failing
      const estimate = await this.estimateSwapOutput(amountIn);
      if (!estimate.estimatedOutput) {
        return {
          success: false,
          error: `Failed to estimate swap output: ${estimate.error}`
        };
      }
      
      // Calculate minimum amount out with slippage tolerance
      const expectedAmountOutWei = ethers.parseUnits(estimate.estimatedOutput, 6); // USDC has 6 decimals
      const slippageMultiplier = (100 - slippageTolerance) / 100;
      const amountOutMinimum = (expectedAmountOutWei * BigInt(Math.floor(slippageMultiplier * 10000))) / BigInt(10000);
      
      // Approve PYUSD spending
      const approvalResult = await this.approvePyusd(amountIn);
      if (!approvalResult.success) {
        return {
          success: false,
          error: `Failed to approve PYUSD: ${approvalResult.error}`
        };
      }
      
      // Prepare swap parameters
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      const userAddress = await this.signer!.getAddress();
      
      const swapParams = {
        tokenIn: PYUSD_ADDRESS,
        tokenOut: USDC_ADDRESS,
        fee: feeTier, // Try standard fee tier
        recipient: userAddress,
        deadline: deadline,
        amountIn: amountInWei,
        amountOutMinimum: amountOutMinimum,
        sqrtPriceLimitX96: 0 // No price limit
      };
      
      // Execute swap
      console.log("Executing PYUSD to USDC swap...", swapParams);
      const routerContract = new ethers.Contract(UNISWAP_V3_ROUTER, ROUTER_ABI, this.signer!);
      
      const tx = await routerContract.exactInputSingle(swapParams);
      console.log("Swap transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Swap transaction confirmed:", receipt.hash);
      
      if (!receipt) {
        throw new Error("Transaction receipt is null");
      }
      
      // Get actual USDC balance after swap
      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, this.signer!);
      const finalUsdcBalance = await usdcContract.balanceOf(userAddress);
      
      return {
        success: true,
        amountOut: ethers.formatUnits(finalUsdcBalance, 6), // USDC has 6 decimals
        transactionHash: receipt.hash,
        gasUsed: receipt.gasUsed?.toString() || "0"
      };
    } catch (error) {
      console.error("Error swapping PYUSD to USDC:", error);
      
      let errorMessage = "Failed to swap PYUSD to USDC";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more user-friendly error messages
        if (errorMessage.includes("insufficient funds")) {
          errorMessage = "Insufficient ETH for gas fees";
        } else if (errorMessage.includes("user rejected")) {
          errorMessage = "Transaction was rejected by user";
        } else if (errorMessage.includes("amountOutMinimum")) {
          errorMessage = "Price moved unfavorably. Try increasing slippage tolerance.";
        } else if (errorMessage.includes("Pool does not exist")) {
          errorMessage = "No liquidity pool found for PYUSD/USDC. Pool might not exist on Sepolia.";
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get current USDC balance
   */
  async getUsdcBalance(): Promise<string> {
    try {
      if (!this.signer) await this.initializeSigner();
      
      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, this.signer!);
      const userAddress = await this.signer!.getAddress();
      const balance = await usdcContract.balanceOf(userAddress);
      const decimals = await usdcContract.decimals();
      
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error("Error getting USDC balance:", error);
      return "0";
    }
  }

  /**
   * Get current PYUSD balance
   */
  async getPyusdBalance(): Promise<string> {
    try {
      if (!this.signer) await this.initializeSigner();
      
      const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, this.signer!);
      const userAddress = await this.signer!.getAddress();
      const balance = await pyusdContract.balanceOf(userAddress);
      const decimals = await pyusdContract.decimals();
      
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error("Error getting PYUSD balance:", error);
      return "0";
    }
  }

  /**
   * Check if PYUSD is approved for swapping
   */
  async getAllowance(): Promise<string> {
    try {
      if (!this.signer) await this.initializeSigner();
      
      const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, this.signer!);
      const userAddress = await this.signer!.getAddress();
      const allowance = await pyusdContract.allowance(userAddress, UNISWAP_V3_ROUTER);
      const decimals = await pyusdContract.decimals();
      
      return ethers.formatUnits(allowance, decimals);
    } catch (error) {
      console.error("Error getting allowance:", error);
      return "0";
    }
  }
}

export default PyusdSwapService;