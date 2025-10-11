import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Home = () => {
  const stats = [
    {
      label: "Total Employees",
      value: "24",
      icon: Users,
      trend: "+3 this month",
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Active Groups",
      value: "5",
      icon: TrendingUp,
      trend: "+2 new groups",
      color: "from-purple-500 to-pink-500",
    },
    {
      label: "Monthly Payout",
      value: "$45,600",
      icon: DollarSign,
      trend: "+8.2% from last month",
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "Pending Payments",
      value: "12",
      icon: Clock,
      trend: "Due in 5 days",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <Navbar role="admin" walletAddress="0x9876...4321" />
      
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold gradient-text">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage payment groups and employees</p>
            </div>
            <Link to="/admin/create-group">
              <Button size="lg" className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90">
                Create New Group
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-card p-6 hover-lift">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                        <stat.icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-primary font-medium">{stat.trend}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-6 gradient-text">Quick Actions</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link to="/admin/create-group">
                <Card className="p-6 hover-lift cursor-pointer bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20">
                  <h3 className="font-semibold text-lg mb-2">Create Payment Group</h3>
                  <p className="text-sm text-muted-foreground">Set up a new group and add employees</p>
                </Card>
              </Link>
              <Link to="/admin/groups">
                <Card className="p-6 hover-lift cursor-pointer bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                  <h3 className="font-semibold text-lg mb-2">View All Groups</h3>
                  <p className="text-sm text-muted-foreground">Manage existing payment groups</p>
                </Card>
              </Link>
            </div>
          </Card>

          {/* Recent Groups */}
          <Card className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-6 gradient-text">Recent Groups</h2>
            <div className="space-y-4">
              {[
                { name: "Engineering Team", employees: 12, payout: "$24,000", status: "Active" },
                { name: "Marketing Division", employees: 8, payout: "$15,200", status: "Active" },
                { name: "Design Studio", employees: 4, payout: "$6,400", status: "Pending" },
              ].map((group, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center justify-between p-4 glass-card rounded-lg hover-lift"
                >
                  <div>
                    <p className="font-semibold">{group.name}</p>
                    <p className="text-sm text-muted-foreground">{group.employees} employees</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{group.payout}/mo</p>
                    <p className="text-xs text-muted-foreground">{group.status}</p>
                  </div>
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
