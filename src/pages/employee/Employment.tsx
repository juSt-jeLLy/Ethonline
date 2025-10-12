import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, DollarSign, CheckCircle2, Clock, Loader2, User, ExternalLink, RefreshCw, Bell } from "lucide-react";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { ProfileService } from "@/lib/profileService";

interface EmploymentData {
  id: string;
  company: string;
  companyEmail: string;
  employee: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  monthlyPayment: number;
  paymentFrequency: string;
  chain: string;
  token: string;
  status: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  hash: string;
  timestamp: string;
  value: string;
  valueFormatted: string;
  from: string;
  to: string;
  status: string;
  method: string;
  gasUsed: string;
  blockNumber: number;
  isPayment?: boolean;
}

const Employment = () => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [employmentData, setEmploymentData] = useState<EmploymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentTransactions, setPaymentTransactions] = useState<Transaction[]>([]);
  const [employerTransactions, setEmployerTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringCleanup, setMonitoringCleanup] = useState<(() => void) | null>(null);

  // For testing - use well-known addresses
  const TEST_EMPLOYER_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // Vitalik's address for testing

  // Load employment data on component mount
  useEffect(() => {
    const loadEmploymentData = async () => {
      if (!address || !isConnected) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const result = await ProfileService.getEmploymentByWallet(address);
        if (result.success) {
          setEmploymentData(result.data);
          console.log('Loaded employment data:', result.data);
        } else {
          console.error('Failed to load employment data:', result.error);
          toast({
            title: "Error",
            description: "Failed to load employment data. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error loading employment data:', error);
        toast({
          title: "Error",
          description: "Failed to load employment data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEmploymentData();
  }, [address, isConnected, toast]);

  // Load transaction data
  const loadTransactionData = async () => {
    if (!address || !isConnected) return;

    setIsLoadingTransactions(true);
    try {
      // Load payment transactions (incoming to employee)
      const paymentResult = await ProfileService.getPaymentTransactions(address, TEST_EMPLOYER_ADDRESS, 10);
      if (paymentResult.success) {
        setPaymentTransactions(paymentResult.data);
        console.log('Loaded payment transactions:', paymentResult.data);
      }

      // Load employer transactions (outgoing from employer)
      const employerResult = await ProfileService.getEmployerTransactions(TEST_EMPLOYER_ADDRESS, 20);
      if (employerResult.success) {
        setEmployerTransactions(employerResult.data);
        console.log('Loaded employer transactions:', employerResult.data);
      }
    } catch (error) {
      console.error('Error loading transaction data:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Start/stop transaction monitoring
  const toggleMonitoring = () => {
    if (isMonitoring) {
      // Stop monitoring
      if (monitoringCleanup) {
        monitoringCleanup();
        setMonitoringCleanup(null);
      }
      setIsMonitoring(false);
      toast({
        title: "Monitoring Stopped",
        description: "Real-time transaction monitoring has been stopped.",
      });
    } else {
      // Start monitoring
      if (address && isConnected) {
        const cleanup = ProfileService.setupTransactionMonitoring(
          address,
          TEST_EMPLOYER_ADDRESS,
          (newTransaction) => {
            toast({
              title: "New Payment Received!",
              description: `Received ${newTransaction.valueFormatted} ETH from your employer.`,
            });
            // Refresh transaction data
            loadTransactionData();
          }
        );
        setMonitoringCleanup(() => cleanup);
        setIsMonitoring(true);
        toast({
          title: "Monitoring Started",
          description: "Real-time transaction monitoring is now active.",
        });
      }
    }
  };

  // Load transactions when employment data is loaded
  useEffect(() => {
    if (employmentData) {
      loadTransactionData();
    }
  }, [employmentData]);

  // Cleanup monitoring on unmount
  useEffect(() => {
    return () => {
      if (monitoringCleanup) {
        monitoringCleanup();
      }
    };
  }, [monitoringCleanup]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <Navbar role="employee" />
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading employment data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employmentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <Navbar role="employee" />
        <div className="container mx-auto px-6 py-12">
          <div className="text-center py-12">
            <div className="p-6 bg-white/50 rounded-xl max-w-md mx-auto">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Employment Found</h3>
              <p className="text-muted-foreground mb-4">
                {!isConnected 
                  ? "Please connect your wallet to view employment information."
                  : "You don't have any active employment records. Contact your employer to get started."
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <Navbar role="employee" />
      
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-8"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold gradient-text">Current Employment</h1>
            <p className="text-muted-foreground">View your employment details and payment history</p>
          </div>

          {/* Current Employment Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card p-8 hover-lift bg-gradient-to-br from-white/80 to-white/60">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-primary to-blue-500 rounded-xl">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{employmentData.company}</h2>
                    <p className="text-sm text-muted-foreground">{employmentData.companyEmail}</p>
                    <Badge className="mt-2 bg-green-500/20 text-green-700 hover:bg-green-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {employmentData.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <DollarSign className="h-4 w-4" />
                    {employmentData.paymentFrequency === 'monthly' ? 'Monthly' : 'Payment'} Amount
                  </div>
                  <div className="text-2xl font-bold gradient-text">
                    {employmentData.monthlyPayment.toLocaleString()} {employmentData.token.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    Payment Frequency
                  </div>
                  <div className="text-2xl font-bold">
                    {employmentData.paymentFrequency}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Building2 className="h-4 w-4" />
                    Role
                  </div>
                  <div className="text-2xl font-bold">
                    {employmentData.role}
                  </div>
                </div>
              </div>

              {/* Employee Info */}
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <User className="h-4 w-4" />
                  Employee Information
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-semibold">{employmentData.employee.first_name} {employmentData.employee.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-semibold">{employmentData.employee.email || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Payment History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                Payment History
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={loadTransactionData}
                  disabled={isLoadingTransactions}
                  variant="outline"
                  size="sm"
                  className="glass-card border-white/20"
                >
                  {isLoadingTransactions ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh
                </Button>
                <Button
                  onClick={toggleMonitoring}
                  variant={isMonitoring ? "destructive" : "default"}
                  size="sm"
                  className={isMonitoring ? "bg-red-500 hover:bg-red-600" : "bg-gradient-to-r from-primary to-blue-500 hover:opacity-90"}
                >
                  <Bell className="h-4 w-4 mr-1" />
                  {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
                </Button>
              </div>
            </div>

            {isLoadingTransactions ? (
              <Card className="glass-card p-8">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span className="text-muted-foreground">Loading transaction data...</span>
                </div>
              </Card>
            ) : paymentTransactions.length > 0 ? (
              <div className="space-y-3">
                {paymentTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.hash}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <Card className="glass-card p-6 hover-lift">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-green-500/20 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-semibold">
                              Payment Received - {new Date(transaction.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transaction.timestamp).toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {transaction.hash.slice(0, 10)}...{transaction.hash.slice(-8)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg gradient-text">
                            {transaction.valueFormatted} ETH
                          </div>
                          <Badge className="bg-green-500/20 text-green-700 hover:bg-green-500/30">
                            {transaction.status}
                          </Badge>
                          <div className="mt-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`https://eth.blockscout.com/tx/${transaction.hash}`, '_blank')}
                              className="text-xs"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View on Blockscout
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="glass-card p-8">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Payment History Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    No payments have been detected from your employer yet.
                  </p>
                  <div className="mt-4 p-4 bg-blue-50/50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Expected Payment:</strong> {employmentData.monthlyPayment.toLocaleString()} {employmentData.token.toUpperCase()} {employmentData.paymentFrequency}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      <strong>Test Employer:</strong> {TEST_EMPLOYER_ADDRESS.slice(0, 10)}...{TEST_EMPLOYER_ADDRESS.slice(-8)}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>

          {/* Employer Transaction Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Employer Activity Summary
            </h2>

            {employerTransactions.length > 0 ? (
              <Card className="glass-card p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Recent Employer Transactions</h3>
                    <Badge className="bg-blue-500/20 text-blue-700">
                      {employerTransactions.length} transactions
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {employerTransactions.slice(0, 10).map((transaction, index) => (
                      <div key={transaction.hash} className="flex items-center justify-between p-3 bg-white/20 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {new Date(transaction.timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {transaction.hash.slice(0, 10)}...{transaction.hash.slice(-8)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            {transaction.valueFormatted} ETH
                          </div>
                          <div className="text-xs text-muted-foreground">
                            to {transaction.to.slice(0, 6)}...{transaction.to.slice(-4)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://eth.blockscout.com/address/${TEST_EMPLOYER_ADDRESS}`, '_blank')}
                      className="glass-card border-white/20"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Full History on Blockscout
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="glass-card p-6">
                <div className="text-center py-4">
                  <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No employer transactions found</p>
                </div>
              </Card>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Employment;
