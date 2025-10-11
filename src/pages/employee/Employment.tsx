import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, DollarSign, CheckCircle2, Clock } from "lucide-react";

const Employment = () => {
  const employmentData = {
    company: "TechCorp Inc.",
    monthlyPayment: "2000 USDC",
    nextPayment: "March 31, 2025",
    status: "Active",
    paymentHistory: [
      { month: "February 2025", amount: "2000 USDC", status: "Paid", date: "Feb 28, 2025" },
      { month: "January 2025", amount: "2000 USDC", status: "Paid", date: "Jan 31, 2025" },
      { month: "December 2024", amount: "2000 USDC", status: "Paid", date: "Dec 31, 2024" },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <Navbar role="employee" walletAddress="0x1234...5678" />
      
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
                    <Badge className="mt-2 bg-green-500/20 text-green-700 hover:bg-green-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {employmentData.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <DollarSign className="h-4 w-4" />
                    Monthly Payment
                  </div>
                  <div className="text-2xl font-bold gradient-text">
                    {employmentData.monthlyPayment}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    Next Payment
                  </div>
                  <div className="text-2xl font-bold">
                    {employmentData.nextPayment}
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

            <div className="space-y-3">
              {employmentData.paymentHistory.map((payment, index) => (
                <motion.div
                  key={index}
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
                          <div className="font-semibold">{payment.month}</div>
                          <div className="text-sm text-muted-foreground">{payment.date}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg gradient-text">{payment.amount}</div>
                        <Badge className="bg-green-500/20 text-green-700 hover:bg-green-500/30">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Employment;
