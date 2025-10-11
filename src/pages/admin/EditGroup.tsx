import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Plus, Edit2, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: number;
  address: string;
  name: string;
  payment: string;
}

const EditGroup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [groupName, setGroupName] = useState("Engineering Team Q1");
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, address: "0x1234...5678", name: "John Doe", payment: "2000 USDC" },
    { id: 2, address: "0xABCD...EFGH", name: "Jane Smith", payment: "2500 USDC" },
    { id: 3, address: "0x9876...5432", name: "Bob Johnson", payment: "1800 USDC" },
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedPayment, setEditedPayment] = useState("");

  const handleSavePayment = (id: number) => {
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, payment: editedPayment } : emp
    ));
    setEditingId(null);
    toast({
      title: "Payment Updated",
      description: "Employee payment has been updated successfully.",
    });
  };

  const handleRemoveEmployee = (id: number) => {
    setEmployees(employees.filter(emp => emp.id !== id));
    toast({
      title: "Employee Removed",
      description: "Employee has been removed from the group.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <Navbar role="admin" walletAddress="0xABCD...EFGH" />
      
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-8"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin/groups")}
              className="glass-card"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold gradient-text">Edit Payment Group</h1>
              <p className="text-muted-foreground">Manage employees and update payment details</p>
            </div>
          </div>

          {/* Group Name */}
          <Card className="glass-card p-8 hover-lift">
            <div className="space-y-4">
              <label className="text-lg font-semibold">Group Name</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="glass-card border-white/20 text-lg"
              />
            </div>
          </Card>

          {/* Search & Add */}
          <Card className="glass-card p-6 hover-lift">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search employee by address or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-card border-white/20 pl-10"
                />
              </div>
              <Button className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </Card>

          {/* Employee List */}
          <Card className="glass-card p-8 hover-lift">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Employees ({employees.length})</h2>
              <Badge className="bg-primary/20 text-primary">
                Total: {employees.reduce((acc, emp) => {
                  const amount = parseFloat(emp.payment.replace(/[^0-9.]/g, ''));
                  return acc + amount;
                }, 0).toLocaleString()} USDC
              </Badge>
            </div>

            <div className="space-y-3">
              {employees.map((emp) => (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-4 hover-lift"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Address</div>
                        <div className="font-mono text-sm">{emp.address}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Name</div>
                        <div className="font-semibold">{emp.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Payment</div>
                        {editingId === emp.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editedPayment}
                              onChange={(e) => setEditedPayment(e.target.value)}
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSavePayment(emp.id)}
                              className="h-8 px-2"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="font-bold gradient-text">{emp.payment}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(emp.id);
                          setEditedPayment(emp.payment);
                        }}
                        className="text-primary hover:bg-primary/10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEmployee(emp.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Save Button */}
          <Button
            onClick={() => {
              toast({
                title: "Group Updated",
                description: "Payment group has been updated successfully.",
              });
              navigate("/admin/groups");
            }}
            size="lg"
            className="w-full bg-gradient-to-r from-primary via-blue-500 to-cyan-500 hover:opacity-90 text-lg py-6"
          >
            <Save className="mr-2 h-5 w-5" />
            Save Changes
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default EditGroup;
