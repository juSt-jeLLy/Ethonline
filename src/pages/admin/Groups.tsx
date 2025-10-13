import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, DollarSign, Calendar, Edit, Send, Loader2, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotification, useTransactionPopup } from "@blockscout/app-sdk";
import { ProfileService } from "@/lib/profileService";
import { useNexus } from '@/providers/NexusProvider';

interface Group {
  id: string;
  name: string;
  employees: number;
  totalPayment: string;
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

// Token mapping to ensure correct token types
const TOKEN_MAPPING: { [key: string]: 'USDC' | 'USDT' | 'ETH' } = {
  'usdc': 'USDC',
  'usdt': 'USDT', 
  'eth': 'ETH',
  'ethereum': 'ETH'
};

const Groups = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { openTxToast } = useNotification();
  const { openPopup } = useTransactionPopup();
  const { nexusSDK, isInitialized } = useNexus();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<{ [key: string]: 'success' | 'error' | 'processing' }>({});

  // Load groups from database - NO MOCK DATA
  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      try {
        const result = await ProfileService.getPaymentGroups();
        console.log('Raw groups data from database:', result);
        
        if (result.success && result.data && result.data.length > 0) {
          // Process the groups to ensure we have proper employee details with wallet addresses
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

  // Function to fetch wallet data for employees
  const processGroupsWithWalletData = async (groups: Group[]) => {
    const processedGroups = [];
    
    for (const group of groups) {
      if (group.employeeDetails && group.employeeDetails.length > 0) {
        const employeesWithWallets = [];
        
        for (const employee of group.employeeDetails) {
          try {
            // Fetch wallet data for this employee
            const walletResult = await ProfileService.getEmployeeWalletData(employee.id, employee.employment_id);
            
            if (walletResult.success && walletResult.data) {
              employeesWithWallets.push({
                ...employee,
                wallet_address: walletResult.data.account_address || '',
                chain: walletResult.data.chain || employee.chain || 'ethereum',
                token: walletResult.data.token || employee.token || 'usdc',
                payment_amount: employee.payment_amount || 0
              });
            } else {
              // If no wallet found, use employee data but mark as invalid for payment
              employeesWithWallets.push({
                ...employee,
                wallet_address: '',
                payment_amount: employee.payment_amount || 0
              });
            }
          } catch (error) {
            console.error(`Error fetching wallet for employee ${employee.id}:`, error);
            employeesWithWallets.push({
              ...employee,
              wallet_address: '',
              payment_amount: employee.payment_amount || 0
            });
          }
        }
        
        processedGroups.push({
          ...group,
          employeeDetails: employeesWithWallets
        });
      } else {
        processedGroups.push(group);
      }
    }
    
    return processedGroups;
  };

  const getChainId = (chainName: string): number => {
    const normalizedChain = chainName.toLowerCase().trim();
    return CHAIN_MAPPING[normalizedChain] || 11155420; // Default to Optimism Sepolia
  };

  const getTokenType = (tokenName: string): 'USDC' | 'USDT' | 'ETH' => {
    const normalizedToken = tokenName.toLowerCase().trim();
    return TOKEN_MAPPING[normalizedToken] || 'USDC'; // Default to USDC
  };

  const validateEmployeeData = (employee: any) => {
    if (!employee.wallet_address || employee.wallet_address.trim() === '') {
      throw new Error(`Employee ${employee.first_name} ${employee.last_name} has no wallet address`);
    }
    
    if (!employee.payment_amount || employee.payment_amount <= 0) {
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
      // Validate employee data before processing
      validateEmployeeData(employee);

      // Use actual employee data from database with proper chain mapping
      const destinationChainId = getChainId(employee.chain);
      const tokenType = getTokenType(employee.token);

      const transferParams = {
        token: tokenType,
        amount: employee.payment_amount.toString(),
        chainId: destinationChainId as any,
        recipient: employee.wallet_address as `0x${string}`,
        sourceChains: [11155111] as number[]
      };

      console.log('Transfer Parameters:', transferParams);
      console.log('Employee Data:', employee);

      // Execute the transfer
      console.log('Executing transfer...');
      const transferResult = await nexusSDK.transfer(transferParams);

      console.log('Transfer Result:', transferResult);

      if (transferResult.success) {
        setPaymentStatus(prev => ({ ...prev, [paymentKey]: 'success' }));
        
        toast({
          title: "🎉 Payment Successful!",
          description: `Sent ${employee.payment_amount} ${tokenType} to ${employee.first_name} ${employee.last_name}`,
        });

        // Show transaction in Blockscout if available
        if (transferResult.transactionHash) {
          try {
            await openTxToast(destinationChainId.toString(), transferResult.transactionHash);
          } catch (txError) {
            console.log('Could not open transaction toast:', txError);
          }
        }

        return { success: true, transactionHash: transferResult.transactionHash };

      } else {
        console.error('Transfer failed:', transferResult.error);
        setPaymentStatus(prev => ({ ...prev, [paymentKey]: 'error' }));
        
        toast({
          title: "❌ Payment Failed",
          description: transferResult.error || "Unknown error occurred during transfer",
          variant: "destructive",
        });

        return { success: false, error: transferResult.error };
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

    // Filter out employees without valid wallet addresses
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

      // Process payments for VALID employees in the group ONE BY ONE
      for (let i = 0; i < validEmployees.length; i++) {
        const employee = validEmployees[i];
        console.log(`Processing payment ${i + 1}/${validEmployees.length} for:`, employee.first_name, employee.last_name);
        
        // Show progress toast
        toast({
          title: "Processing Payments",
          description: `Processing payment ${i + 1}/${validEmployees.length} for ${employee.first_name} ${employee.last_name}`,
        });

        // Wait for the current payment to complete before starting the next
        const result = await handlePayEmployee(group, employee);
        
        if (result.success) {
          successfulPayments++;
        } else {
          failedPayments++;
        }

        // Wait 2 seconds before processing next employee (even if previous failed)
        if (i < validEmployees.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Show final summary
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

  const handleViewTransactionHistory = () => {
    openPopup({
      chainId: "11155420",
    });
  };

  const getPaymentStatus = (groupId: string, employeeId: string) => {
    return paymentStatus[`${groupId}-${employeeId}`];
  };

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
                          <div className="font-bold gradient-text">{group.totalPayment}</div>
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
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="mr-2 h-4 w-4" />
                          )}
                          {isProcessingPayment === group.id ? "Processing..." : "Pay All"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Groups;