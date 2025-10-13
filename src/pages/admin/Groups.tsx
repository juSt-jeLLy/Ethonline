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
  }>;
}

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

  // Mock data with single employee for testing
  const mockGroups: Group[] = [
    {
      id: "mock-1",
      name: "Engineering Team Q1",
      employees: 1,
      totalPayment: "222 USDC",
      nextPayment: "TBD",
      status: "Active",
      employer: {
        id: "1",
        name: "Nexus",
        email: "admin@nexus.com"
      },
      employeeDetails: [
        {
          id: "emp-1",
          first_name: "Kevin",
          last_name: "Larson",
          email: "kevin@walletchat.fun",
          payment_amount: 222,
          payment_frequency: "monthly",
          chain: "optimism-sepolia",
          token: "usdc",
          status: "active",
          role: "developer",
          wallet_address: "0xdB772823f62c009E6EC805BC57A4aFc7B2701F1F"
        }
      ]
    }
  ];

  // Load groups from database
  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      try {
        const result = await ProfileService.getPaymentGroups();
        if (result.success && result.data.length > 0) {
          setGroups(result.data);
          console.log('Loaded groups from database:', result.data);
        } else {
          // Use mock data if no real data or error
          setGroups(mockGroups);
          console.log('Using mock groups data');
          if (result.error) {
            console.error('Error loading groups:', result.error);
            toast({
              title: "Warning",
              description: "Using sample data. Check database connection.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error loading groups:', error);
        setGroups(mockGroups);
        toast({
          title: "Error",
          description: "Failed to load groups. Using sample data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
  }, []);

  const handlePayEmployee = async (group: Group, employee: any) => {
    if (!nexusSDK || !isInitialized) {
      toast({
        title: "Nexus SDK Not Ready",
        description: "Please wait for Nexus SDK to initialize.",
        variant: "destructive",
      });
      return;
    }

    const paymentKey = `${group.id}-${employee.id}`;
    setIsProcessingPayment(paymentKey);
    setPaymentStatus(prev => ({ ...prev, [paymentKey]: 'processing' }));

    try {
      // Exact Nexus SDK structure as per documentation
      const transferParams = {
        token: 'USDC' as const,
        amount: employee.payment_amount.toString(),
        chainId: 11155420 as const,
        recipient: '0xdB772823f62c009E6EC805BC57A4aFc7B2701F1F' as `0x${string}`,
        sourceChains: [11155111] as number[]
      };

      console.log('Transfer Parameters:', transferParams);

      // Optional: Simulate first to preview costs
      console.log('Simulating transfer...');
      const simulation = await nexusSDK.simulateTransfer(transferParams);
      console.log('Simulation Result:', simulation);
      
      if (simulation.intent?.fees) {
        console.log('Estimated fees:', simulation.intent.fees);
      }

      // Execute the actual transfer
      console.log('Executing transfer...');
      const transferResult = await nexusSDK.transfer(transferParams);

      console.log('Transfer Result:', transferResult);

      if (transferResult.success) {
        setPaymentStatus(prev => ({ ...prev, [paymentKey]: 'success' }));
        
        toast({
          title: "🎉 Payment Successful!",
          description: `Sent ${employee.payment_amount} USDC to ${employee.first_name} ${employee.last_name} on Optimism Sepolia`,
        });

        // Show transaction in Blockscout if available
        if (transferResult.transactionHash) {
          try {
            await openTxToast("11155420", transferResult.transactionHash);
          } catch (txError) {
            console.log('Could not open transaction toast:', txError);
          }
        }

        // Log explorer URL for manual checking
        if (transferResult.explorerUrl) {
          console.log('Transaction Explorer:', transferResult.explorerUrl);
        }

      } else {
        console.error('Transfer failed:', transferResult.error);
        setPaymentStatus(prev => ({ ...prev, [paymentKey]: 'error' }));
        
        toast({
          title: "❌ Payment Failed",
          description: transferResult.error || "Unknown error occurred during transfer",
          variant: "destructive",
        });
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
    } finally {
      setIsProcessingPayment(null);
      
      // Clear payment status after 5 seconds
      setTimeout(() => {
        setPaymentStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[paymentKey];
          return newStatus;
        });
      }, 5000);
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

    setIsProcessingPayment(group.id);
    
    try {
      // For now, just pay the first employee (Kevin Larson)
      const employee = group.employeeDetails[0];
      await handlePayEmployee(group, employee);

    } catch (error) {
      console.error('Error in batch payment:', error);
      toast({
        title: "Batch Payment Error",
        description: "Failed to process batch payment",
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
      {/* IntentApprovalModal removed - auto-approval is enabled */}
      
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

                      {/* Employee Details */}
                      {group.employeeDetails && group.employeeDetails.length > 0 && (
                        <div className="pt-4 border-t border-white/20">
                          <h4 className="font-semibold mb-3 text-sm">Employees ({group.employeeDetails.length})</h4>
                          <div className="space-y-3">
                            {group.employeeDetails.map((employee) => {
                              const status = getPaymentStatus(group.id, employee.id);
                              return (
                                <div key={employee.id} className="flex items-center justify-between p-2 bg-white/20 rounded-lg">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-sm truncate">
                                        {employee.first_name} {employee.last_name}
                                      </span>
                                      {status === 'success' && (
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                      )}
                                      {status === 'error' && (
                                        <XCircle className="h-3 w-3 text-red-500" />
                                      )}
                                      {status === 'processing' && (
                                        <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {employee.wallet_address} • {employee.chain} • {employee.payment_amount} {employee.token.toUpperCase()}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handlePayEmployee(group, employee)}
                                    disabled={isProcessingPayment === `${group.id}-${employee.id}`}
                                    className="ml-2"
                                  >
                                    {isProcessingPayment === `${group.id}-${employee.id}` ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Send className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          className="flex-1 glass-card border-white/20"
                          onClick={() => navigate(`/admin/edit-group/${group.id}`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          className="flex-1 bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90"
                          onClick={() => handlePayAllEmployees(group)}
                          disabled={isProcessingPayment === group.id}
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