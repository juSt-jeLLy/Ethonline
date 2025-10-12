import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, DollarSign, CheckCircle2, Clock, Loader2, User } from "lucide-react";
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

const Employment = () => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [employmentData, setEmploymentData] = useState<EmploymentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              Payment History
            </h2>

            <Card className="glass-card p-8">
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Payment History Yet</h3>
                <p className="text-muted-foreground">
                  Payment history will appear here once payments are processed through the system.
                </p>
                <div className="mt-4 p-4 bg-blue-50/50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Expected Payment:</strong> {employmentData.monthlyPayment.toLocaleString()} {employmentData.token.toUpperCase()} {employmentData.paymentFrequency}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Employment;
