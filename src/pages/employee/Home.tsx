import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, Wallet } from "lucide-react";

const Home = () => {
  const stats = [
    {
      label: "Total Earned",
      value: "$12,450",
      icon: DollarSign,
      trend: "+12.5%",
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "Active Contracts",
      value: "3",
      icon: TrendingUp,
      trend: "+1 this month",
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Next Payment",
      value: "5 days",
      icon: Calendar,
      trend: "$850 pending",
      color: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <Navbar role="employee" walletAddress="0x1234...5678" />
      
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
            {stats.map((stat, index) => (
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
            ))}
          </div>

          {/* Recent Activity */}
          <Card className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-6 gradient-text">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { title: "Payment Received", amount: "$850", date: "2 days ago", company: "Tech Corp" },
                { title: "Payment Received", amount: "$1,200", date: "1 month ago", company: "Design Studio" },
                { title: "Contract Started", amount: "$2,000/mo", date: "2 months ago", company: "Startup Inc" },
              ].map((activity, index) => (
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
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
