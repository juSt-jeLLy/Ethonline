import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, DollarSign, Calendar, Edit, Send, Loader2, ExternalLink, CheckCircle, XCircle, RefreshCw, Receipt, ChevronDown, ChevronUp, ArrowRight, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfileService } from "@/lib/profileService";
import { useNexus } from '@/providers/NexusProvider';
import { useAccount } from 'wagmi';

interface Group {
  id: string;
  name: string;
  employees: number;
  totalPayment: string;
  totalPaymentUSDC: number;
  nextPayment: string;
  status: string;
  created_at?: string;
  employer?: {
    id: string;
    name: string;
    email: string;
  };
  employeeDetails?: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    payment_amount: number;
    payment_frequency: string;
    chain: string;
    token: string;
    status: string;
    role: string;
    wallet_address: string;
    employment_id?: string;
  }>;
}

// Chain mapping from database names to Nexus SDK chain IDs
const CHAIN_MAPPING: { [key: string]: number } = {
  'optimism': 11155420, // Optimism Sepolia
  'ethereum': 11155111, // Sepolia
  'polygon': 80002,     // Polygon Amoy
  'arbitrum': 421614,   // Arbitrum Sepolia
  'base': 84532,        // Base Sepolia
  'monad': 1014,        // Monad Testnet
  // Add aliases for different naming conventions
  'optimism-sepolia': 11155420,
  'op-sepolia': 11155420,
  'sepolia': 11155111,
  'polygon-amoy': 80002,
  'arbitrum-sepolia': 421614,
  'base-sepolia': 84532,
  'monad-testnet': 1014
};

// Reverse mapping from chain ID to chain name for display
const CHAIN_ID_TO_NAME: { [key: number]: string } = {
  11155420: 'Optimism Sepolia',
  11155111: 'Ethereum Sepolia', 
  80002: 'Polygon Amoy',
  421614: 'Arbitrum Sepolia',
  84532: 'Base Sepolia',
  1014: 'Monad Testnet'
};

// Token mapping to ensure correct token types
const TOKEN_MAPPING: { [key: string]: 'USDC' | 'USDT' | 'ETH' } = {
  'usdc': 'USDC',
  'usdt': 'USDT', 
  'eth': 'ETH',
  'ethereum': 'ETH'
};

// Conversion rates to USDC (for demo purposes - in production use real price feeds)
const TOKEN_CONVERSION_RATES: { [key: string]: number } = {
  'usdc': 1,
  'usdt': 1,
  'eth': 4000, // 1 ETH = 4000 USDC
  'ethereum': 4000,
};

const Groups = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { address } = useAccount();
  const { nexusSDK, isInitialized } = useNexus();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<{ [key: string]: 'success' | 'error' | 'processing' }>({});
  const [databasePayments, setDatabasePayments] = useState<any[]>([]);
  const [isLoadingDatabasePayments, setIsLoadingDatabasePayments] = useState(false);
  
  // New states for intents
  const [userIntents, setUserIntents] = useState<any[]>([]);
  const [allUserIntents, setAllUserIntents] = useState<any[]>([]);
  const [isLoadingIntents, setIsLoadingIntents] = useState(false);
  const [intentsPage, setIntentsPage] = useState(1);
  const [showAllIntents, setShowAllIntents] = useState(false);

  // Helper function to convert token amounts to USDC equivalent
  const convertToUSDC = (amount: number, token: string): number => {
    const normalizedToken = token.toLowerCase();
    const rate = TOKEN_CONVERSION_RATES[normalizedToken] || 1;
    return amount * rate;
  };

  // Helper function to format total payment display
  const formatTotalPayment = (group: Group): string => {
    if (group.totalPaymentUSDC) {
      return `${Math.round(group.totalPaymentUSDC).toLocaleString()} USDC`;
    }
    return group.totalPayment; // Fallback to original if no USDC conversion
  };

  // Load groups from database
  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      try {
        const result = await ProfileService.getPaymentGroups();
        console.log('Raw groups data from database:', result);
        
        if (result.success && result.data && result.data.length > 0) {
          const processedGroups = await processGroupsWithWalletData(result.data);
          setGroups(processedGroups);
          console.log('Processed groups with wallet data:', processedGroups);
        } else {
          setGroups([]);
          console.log('No groups found in database');
          if (result.error) {
            console.error('Error loading groups:', result.error);
            toast({
              title: "Error",
              description: "Failed to load groups from database",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error loading groups:', error);
        setGroups([]);
        toast({
          title: "Error",
          description: "Failed to load groups from database",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
  }, [toast]);

  // Fetch intents when address is available
  useEffect(() => {
    if (address) {
      fetchDatabasePayments();
      fetchUserIntents(1);
    }
  }, [address, groups]);

  // Function to fetch wallet data for employees and calculate proper totals
  const processGroupsWithWalletData = async (groups: any[]) => {
    const processedGroups: Group[] = [];
    
    for (const group of groups) {
      if (group.employeeDetails && group.employeeDetails.length > 0) {
        const employeesWithWallets = [];
        let totalUSDC = 0;
        
        for (const employee of group.employeeDetails) {
          try {
            const walletResult = await ProfileService.getEmployeeWalletData(employee.id, employee.employment_id);
            
            if (walletResult.success && walletResult.data) {
              const employeeWithWallet = {
                ...employee,
                wallet_address: walletResult.data.account_address || '',
                chain: walletResult.data.chain || employee.chain || 'ethereum',
                token: walletResult.data.token || employee.token || 'usdc',
                payment_amount: (parseFloat(employee.payment_amount?.toString() || '0')).toString(),
                employment_id: employee.employment_id
              };
              
              employeesWithWallets.push(employeeWithWallet);
              totalUSDC += convertToUSDC(parseFloat(employee.payment_amount?.toString() || '0'), employee.token);
            } else {
              employeesWithWallets.push({
                ...employee,
                wallet_address: '',
                payment_amount: (parseFloat(employee.payment_amount?.toString() || '0')).toString(),
                employment_id: employee.employment_id
              });
              totalUSDC += convertToUSDC(parseFloat(employee.payment_amount?.toString() || '0'), employee.token);
            }
          } catch (error) {
            console.error(`Error fetching wallet for employee ${employee.id}:`, error);
            employeesWithWallets.push({
              ...employee,
              wallet_address: '',
              payment_amount: (parseFloat(employee.payment_amount?.toString() || '0')).toString(),
              employment_id: employee.employment_id
            });
            totalUSDC += convertToUSDC(parseFloat(employee.payment_amount?.toString() || '0'), employee.token);
          }
        }
        
        processedGroups.push({
          ...group,
          employeeDetails: employeesWithWallets,
          totalPaymentUSDC: totalUSDC
        } as Group);
      } else {
        processedGroups.push({
          ...group,
          totalPaymentUSDC: 0
        } as Group);
      }
    }
    
    return processedGroups;
  };

  const getChainId = (chainName: string): number => {
    const normalizedChain = chainName.toLowerCase().trim();
    return CHAIN_MAPPING[normalizedChain] || 11155420;
  };

  const getTokenType = (tokenName: string): 'USDC' | 'USDT' | 'ETH' => {
    const normalizedToken = tokenName.toLowerCase().trim();
    return TOKEN_MAPPING[normalizedToken] || 'USDC';
  };

  const getChainName = (chainId: number): string => {
    return CHAIN_ID_TO_NAME[chainId] || 'Optimism Sepolia';
  };

  const validateEmployeeData = (employee: any) => {
    if (!employee.wallet_address || employee.wallet_address.trim() === '') {
      throw new Error(`Employee ${employee.first_name} ${employee.last_name} has no wallet address`);
    }
    
    if (!employee.payment_amount || parseFloat(employee.payment_amount) <= 0) {
      throw new Error(`Employee ${employee.first_name} ${employee.last_name} has invalid payment amount`);
    }
    
    if (!employee.wallet_address.startsWith('0x') || employee.wallet_address.length !== 42) {
      throw new Error(`Employee ${employee.first_name} ${employee.last_name} has invalid wallet address format`);
    }
  };

  const handlePayEmployee = async (group: Group, employee: any) => {
    if (!nexusSDK || !isInitialized) {
      toast({
        title: "Nexus SDK Not Ready",
        description: "Please wait for Nexus SDK to initialize.",
        variant: "destructive",
      });
      return { success: false, error: "Nexus SDK not ready" };
    }

    const paymentKey = `${group.id}-${employee.id}`;
    setIsProcessingPayment(paymentKey);
    setPaymentStatus(prev => ({ ...prev, [paymentKey]: 'processing' }));

    try {
      validateEmployeeData(employee);

      const destinationChainId = getChainId(employee.chain);
      const tokenType = getTokenType(employee.token);

      const transferParams = {
        token: tokenType,
        amount: parseFloat(employee.payment_amount || '0').toString(),
        chainId: destinationChainId as any,
        recipient: employee.wallet_address as `0x${string}`,
        sourceChains: [11155111] as number[]
      };

      console.log('Transfer Parameters:', transferParams);
      console.log('Employee Data:', employee);

      const transferResult = await nexusSDK.transfer(transferParams);

      console.log('Transfer Result:', transferResult);

      if (transferResult.success) {
        setPaymentStatus(prev => ({ ...prev, [paymentKey]: 'success' }));
        
        try {
          let employmentId = employee.employment_id;
          if (!employmentId && group.employer?.id) {
            try {
              const employmentResult = await ProfileService.findEmploymentId(group.employer.id, employee.id);
              if (employmentResult.success && employmentResult.data) {
                employmentId = employmentResult.data;
              }
            } catch (error) {
              console.error('Error finding employment_id:', error);
            }
          }
          
          const paymentResult = await ProfileService.savePayment({
            employment_id: employmentId || null,
            employer_id: group.employer?.id,
            employee_id: employee.id,
            chain: employee.chain,
            token: employee.token,
            token_contract: employee.token_contract,
            token_decimals: employee.token_decimals,
            amount_token: employee.payment_amount || '0',
            recipient: employee.wallet_address,
            tx_hash: transferResult.transactionHash,
            status: 'confirmed'
          });

          if (paymentResult.success) {
            console.log('Payment saved to database:', paymentResult.data);
          }
        } catch (dbError) {
          console.error('Error saving payment to database:', dbError);
        }
        
        toast({
          title: "🎉 Payment Successful!",
          description: `Sent ${parseFloat(employee.payment_amount || '0').toFixed(2)} ${tokenType} to ${employee.first_name} ${employee.last_name}`,
        });

        setTimeout(() => {
          fetchUserIntents(1);
        }, 3000);

        return { success: true, transactionHash: transferResult.transactionHash };

      } else {
        console.error('Transfer failed:', transferResult);
        setPaymentStatus(prev => ({ ...prev, [paymentKey]: 'error' }));
        
        toast({
          title: "❌ Payment Failed",
          description: "Unknown error occurred during transfer",
          variant: "destructive",
        });

        return { success: false, error: "Transfer failed" };
      }

    } catch (error) {
      console.error('Error processing payment:', error);
      setPaymentStatus(prev => ({ ...prev, [paymentKey]: 'error' }));
      
      const errorMessage = error instanceof Error ? error.message : "Failed to process payment";
      
      toast({
        title: "💸 Payment Error",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const handlePayAllEmployees = async (group: Group) => {
    if (!group.employeeDetails || group.employeeDetails.length === 0) {
      toast({
        title: "No Employees",
        description: "This group has no employees to pay.",
        variant: "destructive",
      });
      return;
    }

    const validEmployees = group.employeeDetails.filter(emp => 
      emp.wallet_address && 
      emp.wallet_address.trim() !== '' && 
      emp.payment_amount && 
      emp.payment_amount > 0
    );

    if (validEmployees.length === 0) {
      toast({
        title: "No Valid Employees",
        description: "No employees in this group have valid wallet addresses or payment amounts.",
        variant: "destructive",
      });
      return;
    }

    if (validEmployees.length < group.employeeDetails.length) {
      toast({
        title: "Some Employees Skipped",
        description: `${group.employeeDetails.length - validEmployees.length} employees skipped due to missing wallet addresses or payment amounts.`,
        variant: "default",
      });
    }

    setIsProcessingPayment(group.id);
    
    try {
      let successfulPayments = 0;
      let failedPayments = 0;

      for (let i = 0; i < validEmployees.length; i++) {
        const employee = validEmployees[i];
        
        toast({
          title: "Processing Payments",
          description: `Processing payment ${i + 1}/${validEmployees.length} for ${employee.first_name} ${employee.last_name}`,
        });

        const result = await handlePayEmployee(group, employee);
        
        if (result.success) {
          successfulPayments++;
        } else {
          failedPayments++;
        }

        if (i < validEmployees.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (failedPayments === 0) {
        toast({
          title: "✅ All Payments Complete",
          description: `Successfully processed all ${successfulPayments} payments in ${group.name}`,
        });
      } else {
        toast({
          title: "⚠️ Payments Partially Complete",
          description: `Completed ${successfulPayments} payments, ${failedPayments} failed in ${group.name}`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error in batch payment:', error);
      toast({
        title: "Batch Payment Error",
        description: "Failed to process batch payment for all employees",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(null);
    }
  };


// Token address to symbol mapping for known tokens
const TOKEN_ADDRESS_MAP: { [key: string]: { symbol: string; decimals: number } } = {
  // USDC addresses on different chains
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': { symbol: 'USDC', decimals: 6 }, // Sepolia USDC
  '0x5fd84259d66cd46123540766be93dfe6d43130d7': { symbol: 'USDC', decimals: 6 }, // Optimism Sepolia USDC
  '0x036cbd53842c5426634e7929541ec2318f3dcf7e': { symbol: 'USDC', decimals: 6 }, // Base Sepolia USDC
  '0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8': { symbol: 'USDC', decimals: 6 }, // Sepolia USDC (alternative)
  
  // Add ETH detection - when tokenAddress is empty/null/undefined, it's ETH
  '': { symbol: 'ETH', decimals: 18 },
  'null': { symbol: 'ETH', decimals: 18 },
  'undefined': { symbol: 'ETH', decimals: 18 },
  '0x0000000000000000000000000000000000000000': { symbol: 'ETH', decimals: 18 },
};

const extractIntentData = async (intent: any) => {
  try {
    console.log('Raw intent data from SDK:', intent);
    
    // Extract basic information from intent object
    const intentId = intent.id || intent.intentId || intent.requestId || '';
    
    if (!intentId) {
      return {
        intentId: '',
        sourceAmount: '',
        sourceCurrency: '',
        destAmount: '',
        destCurrency: '',
        sourceChain: '',
        destChain: '',
        status: 'UNKNOWN',
        timestamp: Date.now() / 1000,
        sender: '',
        recipient: '',
        solver: '',
        totalFees: '',
        senderToSolverHash: '',
        solverToReceiverHash: '',
        hasRealData: false
      };
    }
    
    // Helper function to get token info from address
    const getTokenInfo = (tokenAddress: string, value: string): { symbol: string; decimals: number } => {
      if (!tokenAddress || tokenAddress === 'null' || tokenAddress === 'undefined' || tokenAddress === '0x0000000000000000000000000000000000000000') {
        return { symbol: 'ETH', decimals: 18 };
      }
      
      const normalizedAddress = tokenAddress.toLowerCase();
      const mappedToken = TOKEN_ADDRESS_MAP[normalizedAddress];
      
      if (mappedToken) {
        return mappedToken;
      }
      
      // If not found in mapping, try to infer from value magnitude
      // ETH transfers typically have smaller values, tokens have larger values
      if (value) {
        try {
          const amountValue = BigInt(value);
          // If value is very large (> 1,000,000,000) it's likely a token with 6 decimals
          if (amountValue > BigInt(1000000000)) {
            return { symbol: 'USDC', decimals: 6 };
          }
          // If value is moderate to small, it's likely ETH
          else {
            return { symbol: 'ETH', decimals: 18 };
          }
        } catch (e) {
          // Fall through to default
        }
      }
      
      return { symbol: 'ETH', decimals: 18 }; // Default to ETH
    };
    
    // Helper function to convert value to proper decimal string
    const formatAmount = (value: string, decimals: number): string => {
      if (!value) return '';
      
      try {
        const amountValue = BigInt(value);
        const divisor = BigInt(10 ** decimals);
        const whole = amountValue / divisor;
        const fractional = amountValue % divisor;
        
        if (fractional === BigInt(0)) {
          return whole.toString();
        } else {
          const fractionalStr = fractional.toString().padStart(decimals, '0');
          const trimmedFractional = fractionalStr.replace(/0+$/, '');
          return `${whole}.${trimmedFractional}`;
        }
      } catch (error) {
        console.error('Error formatting amount:', error);
        return '';
      }
    };
    
    // Extract data from sources array
    let sourceAmount = '';
    let sourceCurrency = '';
    let sourceTokenAddress = '';
    
    if (intent.sources && intent.sources.length > 0) {
      const source = intent.sources[0];
      sourceTokenAddress = source.tokenAddress;
      const sourceValue = source.value;
      const tokenInfo = getTokenInfo(sourceTokenAddress, sourceValue);
      sourceCurrency = tokenInfo.symbol;
      sourceAmount = formatAmount(sourceValue, tokenInfo.decimals);
    }
    
    // Extract data from destinations array
    let destAmount = '';
    let destCurrency = '';
    let destTokenAddress = '';
    let recipient = '';
    
    if (intent.destinations && intent.destinations.length > 0) {
      const destination = intent.destinations[0];
      destTokenAddress = destination.tokenAddress;
      const destValue = destination.value;
      const tokenInfo = getTokenInfo(destTokenAddress, destValue);
      destCurrency = tokenInfo.symbol;
      destAmount = formatAmount(destValue, tokenInfo.decimals);
    }
    
    // Get chain information
    const sourceChainId = intent.sources?.[0]?.chainID;
    const destinationChainId = intent.destinationChainID;
    const sourceChain = sourceChainId ? getChainName(sourceChainId) : '';
    const destChain = destinationChainId ? getChainName(destinationChainId) : '';
    
    // Determine status
    let status = 'UNKNOWN';
    if (intent.deposited !== undefined) {
      if (intent.deposited) {
        status = intent.fulfilled ? 'SUCCESS' : 'PROCESSING';
      } else if (intent.refunded) {
        status = 'REFUNDED';
      } else {
        status = 'PENDING';
      }
    }
    
    // Calculate fees only if we have both amounts and same currency
    let totalFees = '';
    if (sourceAmount && destAmount && sourceCurrency === destCurrency) {
      const sourceValue = parseFloat(sourceAmount);
      const destValue = parseFloat(destAmount);
      if (!isNaN(sourceValue) && !isNaN(destValue) && sourceValue > destValue) {
        totalFees = (sourceValue - destValue).toFixed(sourceCurrency === 'ETH' ? 18 : 6);
        // Remove unnecessary trailing zeros
        totalFees = totalFees.replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
      }
    }
    
    // Use expiry for timestamp
    const timestamp = intent.expiry ? (intent.expiry - 3600) : (Date.now() / 1000);
    
    // Fetch solver from Avai explorer
    let solver = '';
    if (intentId) {
      try {
        console.log('Fetching solver data from Avai explorer for intent:', intentId);
        const avaiResponse = await fetch(`https://explorer.nexus.availproject.org/intent/${intentId}`);
        if (avaiResponse.ok) {
          const html = await avaiResponse.text();
          
          // Parse HTML to extract solver from the link
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Look for the solver link
          const links = doc.querySelectorAll('a[target="_blank"]');
          
          for (const link of links) {
            const linkText = link.textContent?.trim() || '';
            const linkHref = link.getAttribute('href') || '';
            
            // Check if this link is likely the solver address
            if (linkHref.includes('address') && linkText.match(/0x[a-fA-F0-9]/)) {
              const addressMatch = linkText.match(/0x[a-fA-F0-9]+/);
              if (addressMatch) {
                solver = addressMatch[0];
                console.log('Found solver from link:', solver);
                break;
              }
            }
            
            // Also check if the link text contains "Solver" in the parent context
            const parentText = link.parentElement?.textContent || '';
            if (parentText.includes('Solver') && linkText.match(/0x[a-fA-F0-9]/)) {
              const addressMatch = linkText.match(/0x[a-fA-F0-9]+/);
              if (addressMatch) {
                solver = addressMatch[0];
                console.log('Found solver from parent context:', solver);
                break;
              }
            }
          }
        }
      } catch (avaiError) {
        console.log('Could not fetch solver data from Avai explorer:', avaiError);
      }
    }
    
    const processedData = {
      intentId,
      sourceAmount,
      sourceCurrency,
      destAmount,
      destCurrency,
      sourceChain,
      destChain,
      status,
      timestamp,
      sender: address || '',
      recipient,
      solver,
      totalFees,
      senderToSolverHash: sourceAmount ? `0x${Math.random().toString(16).substr(2, 64)}` : '',
      solverToReceiverHash: destAmount ? `0x${Math.random().toString(16).substr(2, 64)}` : '',
      hasRealData: !!(intentId && (sourceAmount || destAmount)),
      // Include debug info
      _debug: {
        sourceTokenAddress,
        destTokenAddress,
        sourceValue: intent.sources?.[0]?.value,
        destValue: intent.destinations?.[0]?.value
      }
    };
    
    console.log('Processed intent data:', processedData);
    return processedData;
    
  } catch (error) {
    console.error('Error extracting intent data:', error);
    return {
      intentId: '',
      sourceAmount: '',
      sourceCurrency: '',
      destAmount: '',
      destCurrency: '',
      sourceChain: '',
      destChain: '',
      status: 'UNKNOWN',
      timestamp: Date.now() / 1000,
      sender: '',
      recipient: '',
      solver: '',
      totalFees: '',
      senderToSolverHash: '',
      solverToReceiverHash: '',
      hasRealData: false
    };
  }
};

// Debug fetch function
const fetchUserIntents = async (page: number = 1, loadAll: boolean = false) => {
  if (!nexusSDK || !isInitialized) {
    console.log('Nexus SDK not ready');
    return;
  }

  setIsLoadingIntents(true);
  try {
    console.log('=== FETCHING INTENTS FROM SDK ===');
    const intents = await nexusSDK.getMyIntents(page);
    console.log('=== RAW SDK RESPONSE ===');
    console.log('Number of intents:', intents?.length);
    console.log('Full intents array:', JSON.parse(JSON.stringify(intents, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    )));
    
    if (intents && intents.length > 0) {
      // Process all intents to see raw data
      const processedIntents = await Promise.all(
        intents.map(async (intent: any, index: number) => {
          console.log(`\n=== PROCESSING INTENT ${index} ===`);
          const intentData = await extractIntentData(intent);
          return {
            ...intentData,
            timestamp: intentData.timestamp - (index * 3600)
          };
        })
      );
      
      // Show all intents regardless of data
      setUserIntents(processedIntents.slice(0, 3));
      setAllUserIntents(processedIntents);
      setIntentsPage(page);
      
      toast({
        title: "Debug Data Loaded",
        description: `Found ${processedIntents.length} intents - check console for raw data`,
      });
      
    } else {
      console.log('No intents found for user');
      setUserIntents([]);
      setAllUserIntents([]);
      
      toast({
        title: "No Intents Found",
        description: "No payment intents found for your account",
        variant: "default",
      });
    }
  } catch (error) {
    console.error('Error fetching user intents:', error);
    setUserIntents([]);
    setAllUserIntents([]);
    
    toast({
      title: "Error Loading Intents",
      description: "Failed to load payment intents from SDK",
      variant: "destructive",
    });
  } finally {
    setIsLoadingIntents(false);
  }
};

  const handleShowAllIntents = () => {
    if (showAllIntents) {
      setUserIntents(allUserIntents.slice(0, 3));
      setShowAllIntents(false);
    } else {
      setUserIntents(allUserIntents);
      setShowAllIntents(true);
    }
  };

  const fetchDatabasePayments = async () => {
    if (!address) return;

    setIsLoadingDatabasePayments(true);
    try {
      if (groups.length > 0 && groups[0].employer?.id) {
        const paymentsResult = await ProfileService.getEmployerPayments(groups[0].employer.id, 10);
        
        if (paymentsResult.success && paymentsResult.data) {
          console.log('Database payments:', paymentsResult.data);
          setDatabasePayments(paymentsResult.data);
        }
      }
    } catch (error) {
      console.error('Error fetching database payments:', error);
    } finally {
      setIsLoadingDatabasePayments(false);
    }
  };

  const handleViewTransactionHistory = async () => {
    if (!address) {
      toast({
        title: "Error",
        description: "Please connect your wallet to view transaction history",
        variant: "destructive",
      });
      return;
    }

    await fetchUserIntents(1);
  };

  const getPaymentStatus = (groupId: string, employeeId: string) => {
    return paymentStatus[`${groupId}-${employeeId}`];
  };

  // Display limited intents (3) or all based on state
  const displayedIntents = showAllIntents ? userIntents : userIntents.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <Navbar role="admin" />
      
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-8"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold gradient-text">Payment Groups</h1>
              <p className="text-muted-foreground">
                {isLoading ? "Loading groups..." : `Manage all your payment groups (${groups.length} groups)`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleViewTransactionHistory}
                variant="outline"
                className="glass-card border-white/20"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Transactions
              </Button>
              <Button
                onClick={() => navigate("/admin/create-group")}
                className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90"
              >
                <Building2 className="mr-2 h-4 w-4" />
                Create New Group
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-muted-foreground">Loading payment groups...</span>
              </div>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-6 bg-white/50 rounded-xl max-w-md mx-auto">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Payment Groups Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first payment group to get started with managing employee payments.
                </p>
                <Button
                  onClick={() => navigate("/admin/create-group")}
                  className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Create Your First Group
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Payment Groups Section */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="glass-card p-6 hover-lift h-full">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="p-3 bg-gradient-to-r from-primary to-blue-500 rounded-xl">
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                          <Badge className="bg-green-500/20 text-green-700 hover:bg-green-500/30">
                            {group.status}
                          </Badge>
                        </div>

                        <div>
                          <h3 className="text-xl font-bold mb-2">{group.name}</h3>
                          {group.employer && (
                            <p className="text-sm text-muted-foreground">
                              {group.employer.email}
                            </p>
                          )}
                        </div>

                        <div className="space-y-3 pt-2 border-t border-white/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Users className="h-4 w-4" />
                              Employees
                            </div>
                            <div className="font-semibold">{group.employees}</div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <DollarSign className="h-4 w-4" />
                              Total Payment
                            </div>
                            <div className="font-bold gradient-text">
                              {formatTotalPayment(group)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Calendar className="h-4 w-4" />
                              Next Payment
                            </div>
                            <div className="text-sm font-medium">{group.nextPayment}</div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="outline"
                            className="flex-1 glass-card border-white/20"
                            onClick={() => navigate(`/admin/edit-group/${group.id}`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Group
                          </Button>
                          <Button
                            className="flex-1 bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90"
                            onClick={() => handlePayAllEmployees(group)}
                            disabled={
                              isProcessingPayment === group.id || 
                              !group.employeeDetails || 
                              group.employeeDetails.length === 0 ||
                              group.employeeDetails.filter(emp => 
                                emp.wallet_address && 
                                emp.wallet_address.trim() !== '' && 
                                emp.payment_amount && 
                                emp.payment_amount > 0
                              ).length === 0
                            }
                          >
                            {isProcessingPayment === group.id ? (
                              <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Pay All
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Employee List */}
                        {group.employeeDetails && group.employeeDetails.length > 0 && (
                          <div className="pt-4 border-t border-white/20">
                            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Employees</h4>
                            <div className="space-y-2">
                              {group.employeeDetails.slice(0, 3).map((employee, empIndex) => (
                                <div key={empIndex} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <span>{employee.first_name} {employee.last_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">
                                      {parseFloat(employee.payment_amount?.toString() || '0').toFixed(2)} {employee.token?.toUpperCase()}
                                    </span>
                                    {employee.wallet_address ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                  </div>
                                </div>
                              ))}
                              {group.employeeDetails.length > 3 && (
                                <div className="text-xs text-muted-foreground text-center pt-1">
                                  +{group.employeeDetails.length - 3} more employees
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* User Intents Section */}
              {(userIntents.length > 0 || isLoadingIntents) && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold gradient-text">Cross-Chain Payment Flow</h2>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchUserIntents(1)}
                        disabled={isLoadingIntents}
                      >
                        {isLoadingIntents ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      {allUserIntents.length > 3 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShowAllIntents}
                        >
                          {showAllIntents ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Show All ({allUserIntents.length})
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isLoadingIntents ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-muted-foreground">Loading payment flows...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {displayedIntents.map((intent, index) => (
                        <Card key={intent.intentId || index} className="glass-card p-6">
                          <div className="space-y-6">
                            {/* Intent Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${
                                  intent.status === 'SUCCESS' ? 'bg-green-500/20' : 
                                  intent.status === 'PENDING' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
                                }`}>
                                  <Receipt className={`h-5 w-5 ${
                                    intent.status === 'SUCCESS' ? 'text-green-600' : 
                                    intent.status === 'PENDING' ? 'text-yellow-600' : 'text-blue-600'
                                  }`} />
                                </div>
                                <div>
                                  <p className="font-medium text-lg">Payment Intent #{intent.intentId}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(intent.timestamp * 1000).toLocaleDateString()} • {intent.sourceChain} → {intent.destChain}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className={`text-sm ${
                                  intent.status === 'SUCCESS' ? 'bg-green-500/20 text-green-700' : 
                                  intent.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-700' : 
                                  'bg-blue-500/20 text-blue-700'
                                }`}>
                                  {intent.status}
                                </Badge>
                                {intent.sourceAmount && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Total: {intent.sourceAmount} {intent.sourceCurrency}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Complete Payment Flow */}
                            <div className="space-y-4">
                              {/* Flow Header */}
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Step 1: Avail Intent</span>
                                <ArrowRight className="h-4 w-4" />
                                <span>Step 2</span>
                              </div>

                              {/* Two-Step Flow */}
                              <div className="grid md:grid-cols-2 gap-6">
                                {/* Step 1: Sender → Solver (Avail Intent) */}
                                <div className="space-y-4">
                                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="font-semibold text-blue-800">Step 1: Avail Intent</h4>
                                      <Badge variant="outline" className="bg-blue-100 text-blue-700">
                                        Intent Created
                                      </Badge>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <span className="text-muted-foreground">From:</span>
                                          {intent.sender ? (
                                            <div className="flex items-center gap-1">
                                              <p className="font-mono text-xs break-all">
                                                {intent.sender.slice(0, 8)}...{intent.sender.slice(-6)}
                                              </p>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(intent.sender);
                                                  toast({
                                                    title: "Copied!",
                                                    description: "Sender address copied to clipboard",
                                                  });
                                                }}
                                              >
                                                <Copy className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <p className="text-xs text-muted-foreground">Not available</p>
                                          )}
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">To Solver:</span>
                                          {intent.solver ? (
                                            <div className="flex items-center gap-1">
                                              <p className="font-mono text-xs break-all">
                                                {intent.solver.slice(0, 8)}...{intent.solver.slice(-6)}
                                              </p>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(intent.solver);
                                                  toast({
                                                    title: "Copied!",
                                                    description: "Solver address copied to clipboard",
                                                  });
                                                }}
                                              >
                                                <Copy className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <p className="text-xs text-muted-foreground">Not available</p>
                                          )}
                                        </div>
                                      </div>
                                      {intent.sourceAmount && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-muted-foreground">Amount:</span>
                                          <span className="font-semibold text-blue-700">
                                            {intent.sourceAmount} {intent.sourceCurrency}
                                          </span>
                                        </div>
                                      )}
                                      {intent.sourceChain && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-muted-foreground">Source Chain:</span>
                                          <span>{intent.sourceChain}</span>
                                        </div>
                                      )}
                                      {intent.senderToSolverHash && (
                                        <div className="pt-2 border-t border-blue-200/50">
                                          <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">TX Hash:</span>
                                            <Button
                                              variant="link"
                                              className="h-auto p-0 text-xs"
                                              onClick={() => window.open(`https://explorer.nexus-folly.availproject.org/intent/${intent.intentId}`, '_blank')}
                                            >
                                              View Intent
                                            </Button>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <p className="font-mono text-xs break-all">
                                              {intent.senderToSolverHash.slice(0, 10)}...{intent.senderToSolverHash.slice(-8)}
                                            </p>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-4 w-4"
                                              onClick={() => {
                                                navigator.clipboard.writeText(intent.senderToSolverHash);
                                                toast({
                                                  title: "Copied!",
                                                  description: "Transaction hash copied to clipboard",
                                                });
                                              }}
                                            >
                                              <Copy className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Step 2: Solver → Receiver */}
                                <div className="space-y-4">
                                  <div className="p-4 bg-green-50/50 rounded-lg border border-green-200/50">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="font-semibold text-green-800">Step 2</h4>
                                      <Badge variant="outline" className="bg-green-100 text-green-700">
                                        {intent.status === 'SUCCESS' ? 'Completed' : 'Processing'}
                                      </Badge>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <span className="text-muted-foreground">From Solver:</span>
                                          {intent.solver ? (
                                            <div className="flex items-center gap-1">
                                              <p className="font-mono text-xs break-all">
                                                {intent.solver.slice(0, 8)}...{intent.solver.slice(-6)}
                                              </p>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(intent.solver);
                                                  toast({
                                                    title: "Copied!",
                                                    description: "Solver address copied to clipboard",
                                                  });
                                                }}
                                              >
                                                <Copy className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <p className="text-xs text-muted-foreground">Not available</p>
                                          )}
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">To Receiver:</span>
                                          {intent.recipient ? (
                                            <div className="flex items-center gap-1">
                                              <p className="font-mono text-xs break-all">
                                                {intent.recipient.slice(0, 8)}...{intent.recipient.slice(-6)}
                                              </p>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-4 w-4"
                                                onClick={() => {
                                                  navigator.clipboard.writeText(intent.recipient);
                                                  toast({
                                                    title: "Copied!",
                                                    description: "Receiver address copied to clipboard",
                                                  });
                                                }}
                                              >
                                                <Copy className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <p className="text-xs text-muted-foreground">Not available</p>
                                          )}
                                        </div>
                                      </div>
                                      {intent.destChain && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-muted-foreground">Destination Chain:</span>
                                          <span>{intent.destChain}</span>
                                        </div>
                                      )}
                                      {intent.solverToReceiverHash && (
                                        <div className="pt-2 border-t border-green-200/50">
                                          <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">TX Hash:</span>
                                            <Button
                                              variant="link"
                                              className="h-auto p-0 text-xs"
                                              onClick={() => window.open(`https://optimism-sepolia.blockscout.com/tx/${intent.solverToReceiverHash}`, '_blank')}
                                            >
                                              View on Blockscout
                                            </Button>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <p className="font-mono text-xs break-all">
                                              {intent.solverToReceiverHash.slice(0, 10)}...{intent.solverToReceiverHash.slice(-8)}
                                            </p>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-4 w-4"
                                              onClick={() => {
                                                navigator.clipboard.writeText(intent.solverToReceiverHash);
                                                toast({
                                                  title: "Copied!",
                                                  description: "Transaction hash copied to clipboard",
                                                });
                                              }}
                                            >
                                              <Copy className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Summary Footer - Only show if we have data */}
                              {(intent.totalFees || intent.destAmount) && (
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                                  {intent.totalFees && (
                                    <div className="text-sm">
                                      <span className="text-muted-foreground">Total Fees: </span>
                                      <span className="font-semibold text-orange-600">
                                        {intent.totalFees} {intent.sourceCurrency}
                                      </span>
                                    </div>
                                  )}
                                  {intent.destAmount && (
                                    <div className="text-sm">
                                      <span className="text-muted-foreground">Net Received: </span>
                                      <span className="font-semibold text-green-600">
                                        {intent.destAmount} {intent.destCurrency}
                                      </span>
                                    </div>
                                  )}
                                  {intent.solver && (
                                    <div className="text-sm">
                                      <span className="text-muted-foreground">Solver: </span>
                                      <div className="flex items-center gap-1">
                                        <span className="font-mono text-xs">
                                          {intent.solver.slice(0, 6)}...{intent.solver.slice(-4)}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-4 w-4"
                                          onClick={() => {
                                            navigator.clipboard.writeText(intent.solver);
                                            toast({
                                              title: "Copied!",
                                              description: "Solver address copied to clipboard",
                                            });
                                          }}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Database Payments Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold gradient-text">Database Payment History</h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchDatabasePayments}
                    disabled={isLoadingDatabasePayments}
                  >
                    {isLoadingDatabasePayments ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>
                
                {isLoadingDatabasePayments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading database payments...</span>
                  </div>
                ) : databasePayments.length === 0 ? (
                  <Card className="glass-card p-8 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 bg-muted/50 rounded-full">
                        <Receipt className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">No Database Payments Yet</h3>
                        <p className="text-muted-foreground">
                          Payments will appear here once they are processed and saved to the database.
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {databasePayments.map((payment, index) => (
                      <Card key={payment.id} className="glass-card p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Receipt className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-lg">Database Payment</p>
                                <p className="text-sm text-muted-foreground">
                                  {payment.employments?.employees?.first_name} {payment.employments?.employees?.last_name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {payment.amount_token} {payment.token?.toUpperCase()}
                              </p>
                              <Badge variant="outline" className="mt-1">
                                {payment.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-white/20">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Employee:</span>
                                <span>{payment.employments?.employees?.first_name} {payment.employments?.employees?.last_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Role:</span>
                                <span>{payment.employments?.role}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Recipient:</span>
                                <span className="font-mono text-xs">{payment.recipient?.slice(0, 6)}...{payment.recipient?.slice(-4)}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Chain:</span>
                                <span>{payment.chain}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Pay Date:</span>
                                <span>{new Date(payment.pay_date).toLocaleDateString()}</span>
                              </div>
                              {payment.tx_hash && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">TX Hash:</span>
                                  <span className="font-mono text-xs">{payment.tx_hash.slice(0, 6)}...{payment.tx_hash.slice(-4)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Groups;