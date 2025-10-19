import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Building2, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfileService } from "@/lib/profileService";
import { useNexus } from '@/providers/NexusProvider';
import { useAccount } from 'wagmi';
import { GroupCard } from "@/components/groups/GroupCard";
import { IntentsSection } from "@/components/groups/IntentsSection";
import { PaymentHistory } from "@/components/groups/PaymentHistory";
import { 
  convertToUSDC, 
  formatTotalPayment, 
  getChainId, 
  getTokenType, 
  validateEmployeeData 
} from "@/utils/groupsUtils";
import { extractIntentData } from "@/utils/extractIntentData";

interface Group {
  id: string;
  name: string;
  employees: number;
  totalPayment: string;
  totalPaymentUSDC: number;
  nextPayment: string;
  status: string;
  created_at?: string;
  employer?: { id: string; name: string; email: string };
  employeeDetails?: Array<{
    id: string; first_name: string; last_name: string; email: string;
    payment_amount: number; payment_frequency: string; chain: string;
    token: string; status: string; role: string; wallet_address: string;
    employment_id?: string;
  }>;
}

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
  const [userIntents, setUserIntents] = useState<any[]>([]);
  const [allUserIntents, setAllUserIntents] = useState<any[]>([]);
  const [isLoadingIntents, setIsLoadingIntents] = useState(false);
  const [intentsPage, setIntentsPage] = useState(1);
  const [showAllIntents, setShowAllIntents] = useState(false);

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

  useEffect(() => {
    if (address) {
      fetchDatabasePayments();
      fetchUserIntents(1);
    }
  }, [address, groups]);

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

    // PRINT TRANSFER RESULT TO CONSOLE
    console.log('=== TRANSFER RESULT OBJECT ===');
    console.log('TransferResult:', transferResult);
    console.log('Success:', transferResult.success);
    console.log('All transferResult properties:', Object.keys(transferResult));
    
    if (transferResult.success) {
      console.log('Transaction Hash:', transferResult.transactionHash);
      console.log('Explorer URL:', transferResult.explorerUrl);
      console.log('Intent ID (intentId):', (transferResult as any).intentId);
      console.log('Intent ID (intent_id):', (transferResult as any).intent_id);
      console.log('Intent ID (id):', (transferResult as any).id);
    } else {
      console.log('Error:', "Transfer failed");
    }
    console.log('=== END TRANSFER RESULT ===');

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
        
        // Extract intent ID from transfer result - try multiple possible property names
        const intentId = (transferResult as any).intentId || 
                        (transferResult as any).intent_id || 
                        (transferResult as any).id || 
                        '';
        
        // Extract first transaction hash
        const firstTxHash = transferResult.transactionHash || 
                           (transferResult as any).txHash || 
                           (transferResult as any).hash || 
                           '';
        
        console.log('Extracted intent ID:', intentId);
        console.log('First transaction hash:', firstTxHash);
        
        // If intent ID is still empty, try to extract from explorer URL
        let finalIntentId = intentId;
        if (!finalIntentId && transferResult.explorerUrl) {
          const urlMatch = transferResult.explorerUrl.match(/intent\/([a-zA-Z0-9-_]+)/);
          if (urlMatch && urlMatch[1]) {
            finalIntentId = urlMatch[1];
            console.log('Extracted intent ID from URL:', finalIntentId);
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
          intent_id: finalIntentId,
          first_tx_hash: firstTxHash,
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

      console.log(`=== PROCESSING PAYMENT ${i + 1}/${validEmployees.length} ===`);
      console.log('Employee:', `${employee.first_name} ${employee.last_name}`);
      console.log('Amount:', employee.payment_amount);
      console.log('Recipient:', employee.wallet_address);
      
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
const fetchUserIntents = async (page: number = 1, loadAll: boolean = false) => {
  if (!nexusSDK || !isInitialized) {
    console.log('Nexus SDK not ready');
    return;
  }

  setIsLoadingIntents(true);
  try {
    console.log('=== FETCHING INTENTS FROM SDK ===');
    const intents = await nexusSDK.getMyIntents(page);
    console.log('Number of intents found:', intents?.length);
    
    if (intents && intents.length > 0) {
      const processedIntents = await Promise.all(
        intents.map(async (intent: any, index: number) => {
          // REMOVED: console.log(`\n=== PROCESSING INTENT ${index} ===`);
          const intentData = await extractIntentData(intent, address || '');
          return {
            ...intentData,
            timestamp: intentData.timestamp - (index * 3600)
          };
        })
      );
      
      setUserIntents(processedIntents.slice(0, 3));
      setAllUserIntents(processedIntents);
      setIntentsPage(page);
      
      // Keep this summary log
      toast({
        title: "Debug Data Loaded",
        description: `Found ${processedIntents.length} intents`,
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
                  <GroupCard
                  key={group.id}
                    group={group}
                    index={index}
                    isProcessingPayment={isProcessingPayment}
                    formatTotalPayment={formatTotalPayment}
                    onEdit={(groupId) => navigate(`/admin/edit-group/${groupId}`)}
                    onPayAll={handlePayAllEmployees}
                  />
              ))}
              </div>

              {/* User Intents Section */}
              <IntentsSection
                userIntents={userIntents}
                allUserIntents={allUserIntents}
                isLoadingIntents={isLoadingIntents}
                showAllIntents={showAllIntents}
                onRefresh={() => fetchUserIntents(1)}
                onToggleShowAll={handleShowAllIntents}
              />

              {/* Database Payments Section */}
              <PaymentHistory
                payments={databasePayments}
                isLoading={isLoadingDatabasePayments}
                onRefresh={fetchDatabasePayments}
              />
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Groups;