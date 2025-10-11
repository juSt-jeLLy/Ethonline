import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, DollarSign, Calendar, Edit, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Groups = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const groups = [
    {
      id: 1,
      name: "Engineering Team Q1",
      employees: 12,
      totalPayment: "24,000 USDC",
      nextPayment: "March 31, 2025",
      status: "Active",
    },
    {
      id: 2,
      name: "Marketing Department",
      employees: 8,
      totalPayment: "16,000 USDC",
      nextPayment: "March 31, 2025",
      status: "Active",
    },
    {
      id: 3,
      name: "Sales Team",
      employees: 15,
      totalPayment: "30,000 USDC",
      nextPayment: "March 31, 2025",
      status: "Active",
    },
  ];

  const handlePayGroup = (groupName: string) => {
    toast({
      title: "Payment Initiated",
      description: `Processing payments for ${groupName}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <Navbar role="admin" walletAddress="0xABCD...EFGH" />
      
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-8"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold gradient-text">Payment Groups</h1>
              <p className="text-muted-foreground">Manage all your payment groups</p>
            </div>
            <Button
              onClick={() => navigate("/admin/create-group")}
              className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Create New Group
            </Button>
          </div>

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
                        Edit
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90"
                        onClick={() => handlePayGroup(group.name)}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Pay
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Groups;
