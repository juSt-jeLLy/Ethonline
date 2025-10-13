import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, DollarSign, TrendingUp, Clock, Building2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ProfileService } from "@/lib/profileService";

interface Company {
  id: string;
  name: string;
  email: string;
}

interface DashboardStats {
  totalEmployees: number;
  activeGroups: number;
  monthlyPayout: number;
  pendingPayments: number;
  recentGroups: Array<{
    id: string;
    name: string;
    employees: number;
    payout: number;
    status: string;
    created_at: string;
  }>;
}

const Home = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Load companies on component mount
  useEffect(() => {
    const loadCompanies = async () => {
      setIsLoading(true);
      try {
        const result = await ProfileService.getAllCompanies();
        if (result.success) {
          setCompanies(result.data);
          console.log('Loaded companies:', result.data);
          if (result.data.length > 0) {
            setSelectedCompanyId(result.data[0].id); // Select first company by default
          }
        } else {
          console.error('Failed to load companies:', result.error);
          toast({
            title: "Error",
            description: "Failed to load companies. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error loading companies:', error);
        toast({
          title: "Error",
          description: "Failed to load companies. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanies();
  }, [toast]);

  // Load dashboard stats when company is selected
  useEffect(() => {
    if (selectedCompanyId) {
      const loadDashboardStats = async () => {
        setIsLoadingStats(true);
        try {
          const result = await ProfileService.getCompanyDashboardStats(selectedCompanyId);
          if (result.success) {
            setDashboardStats(result.data);
            console.log('Loaded dashboard stats:', result.data);
          } else {
            console.error('Failed to load dashboard stats:', result.error);
            toast({
              title: "Error",
              description: "Failed to load dashboard statistics. Please try again.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error loading dashboard stats:', error);
          toast({
            title: "Error",
            description: "Failed to load dashboard statistics. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingStats(false);
        }
      };

      loadDashboardStats();
    }
  }, [selectedCompanyId, toast]);

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
  };

  // Create stats array from dashboard data
  const stats = dashboardStats ? [
    {
      label: "Total Employees",
      value: dashboardStats.totalEmployees.toString(),
      icon: Users,
      trend: "Active employees",
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Active Groups",
      value: dashboardStats.activeGroups.toString(),
      icon: TrendingUp,
      trend: "Payment groups",
      color: "from-purple-500 to-pink-500",
    },
    {
      label: "Monthly Payout",
      value: `$${dashboardStats.monthlyPayout.toFixed(6)}`,
      icon: DollarSign,
      trend: "Total monthly",
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "Pending Payments",
      value: dashboardStats.pendingPayments.toString(),
      icon: Clock,
      trend: "Awaiting processing",
      color: "from-orange-500 to-red-500",
    },
  ] : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <Navbar role="admin" />
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading companies...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <Navbar role="admin" />
        <div className="container mx-auto px-6 py-12">
          <div className="text-center py-12">
            <div className="p-6 bg-white/50 rounded-xl max-w-md mx-auto">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Companies Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first company to get started with the admin dashboard.
              </p>
              <Link to="/admin/profile">
                <Button className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90">
                  <Building2 className="mr-2 h-4 w-4" />
                  Create Company
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <Navbar role="admin" />
      
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

          {/* Company Selection */}
          <Card className="glass-card p-6 hover-lift">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Select Company</h2>
              </div>
              <Select value={selectedCompanyId} onValueChange={handleCompanySelect}>
                <SelectTrigger className="glass-card border-white/20">
                  <SelectValue placeholder="Choose a company to view dashboard" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name} ({company.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCompanyId && (
                <div className="text-sm text-muted-foreground">
                  Viewing dashboard for: <span className="font-semibold text-foreground">
                    {companies.find(c => c.id === selectedCompanyId)?.name}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Stats Grid */}
          {isLoadingStats ? (
            <div className="grid md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((index) => (
                <Card key={index} className="glass-card p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-lg bg-gray-200 animate-pulse">
                        <div className="h-5 w-5 bg-gray-300 rounded" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-8 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
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
          )}

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
            <h2 className="text-2xl font-bold mb-6 gradient-text">Company Overview</h2>
            {isLoadingStats ? (
              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="flex items-center justify-between p-4 glass-card rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-5 bg-gray-200 rounded animate-pulse w-24" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : dashboardStats && dashboardStats.recentGroups.length > 0 ? (
              <div className="space-y-4">
                {dashboardStats.recentGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
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
                      <p className="text-lg font-bold text-primary">${group.payout.toFixed(6)}/mo</p>
                      <p className="text-xs text-muted-foreground">{group.status}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                <p className="text-muted-foreground mb-4">
                  This company doesn't have any employees or payment groups yet.
                </p>
                <Link to="/admin/create-group">
                  <Button className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90">
                    <Building2 className="mr-2 h-4 w-4" />
                    Create First Group
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
