import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ProfileService } from "@/lib/profileService";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalEarned: number;
  totalPotentialEarnings: number;
  activeEmployments: number;
  activeContracts: number;
  nextPayment: {
    days: number;
    amount: number;
  } | null;
  recentActivity: Array<{
    title: string;
    amount: string;
    date: string;
    company: string;
  }>;
}

const Home = () => {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      loadDashboardStats();
    } else {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  const loadDashboardStats = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      const result = await ProfileService.getEmployeeDashboardStats(address);
      if (result.success && result.data) {
        setDashboardStats(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load dashboard data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stats = dashboardStats ? [
    {
      label: "Total Earned",
      value: `$${dashboardStats.totalEarned.toFixed(6)}`,
      icon: DollarSign,
      trend: dashboardStats.totalPotentialEarnings > 0 ? `$${dashboardStats.totalPotentialEarnings.toFixed(6)} potential` : "No payments yet",
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "Active Employments",
      value: dashboardStats.activeEmployments.toString(),
      icon: TrendingUp,
      trend: `${dashboardStats.activeContracts} with payments`,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Next Payment",
      value: dashboardStats.nextPayment ? `${dashboardStats.nextPayment.days} days` : "No active employments",
      icon: Calendar,
      trend: dashboardStats.nextPayment ? `$${dashboardStats.nextPayment.amount} pending` : "",
      color: "from-purple-500 to-pink-500",
    },
  ] : [];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <Navbar role="employee" />
        <div className="container mx-auto px-6 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold gradient-text">Welcome to PayStream</h1>
            <p className="text-muted-foreground">Please connect your wallet to view your dashboard</p>
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
          className="space-y-8"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold gradient-text">Welcome Back!</h1>
            <p className="text-muted-foreground">Track your payments and employment status</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-card p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-card p-6 hover-lift">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-bold">{stat.value}</p>
                        <p className="text-sm text-primary font-medium">{stat.trend}</p>
                      </div>
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Recent Activity */}
          <Card className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-6 gradient-text">Recent Activity</h2>
            <div className="space-y-4">
              {isLoading ? (
                // Loading skeleton for activity
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))
              ) : dashboardStats && dashboardStats.recentActivity.length > 0 ? (
                dashboardStats.recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center justify-between p-4 glass-card rounded-lg hover-lift"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.company} • {activity.date}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-primary">{activity.amount}</p>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent activity found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your employment history will appear here once you're added to a company
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
