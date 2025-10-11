import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Search, X, Building2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  address: string;
  name: string;
  payment: string;
}

const CreateGroup = () => {
  const { toast } = useToast();
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployee, setNewEmployee] = useState({ address: "", name: "", payment: "" });

  const handleAddEmployee = () => {
    if (newEmployee.address && newEmployee.name && newEmployee.payment) {
      setEmployees([...employees, newEmployee]);
      setNewEmployee({ address: "", name: "", payment: "" });
      toast({
        title: "Employee Added",
        description: `${newEmployee.name} has been added to the group.`,
      });
    }
  };

  const handleRemoveEmployee = (index: number) => {
    const updated = employees.filter((_, i) => i !== index);
    setEmployees(updated);
  };

  const handleCreateGroup = () => {
    if (groupName && employees.length > 0) {
      toast({
        title: "Group Created",
        description: `${groupName} has been created with ${employees.length} employees.`,
      });
    }
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
          <div className="space-y-2">
            <h1 className="text-4xl font-bold gradient-text flex items-center gap-3">
              <Building2 className="h-10 w-10" />
              Create Payment Group
            </h1>
            <p className="text-muted-foreground">Set up a new payment group and add employees</p>
          </div>

          {/* Group Name */}
          <Card className="glass-card p-8 hover-lift">
            <div className="space-y-4">
              <Label htmlFor="groupName" className="text-lg font-semibold">Group Name</Label>
              <Input
                id="groupName"
                placeholder="e.g., Engineering Team Q1"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="glass-card border-white/20 text-lg"
              />
            </div>
          </Card>

          {/* Add Employee */}
          <Card className="glass-card p-8 hover-lift">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Add Employees
            </h2>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by address or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-card border-white/20 pl-10"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  placeholder="Wallet Address"
                  value={newEmployee.address}
                  onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
                  className="glass-card border-white/20 font-mono"
                />
                <Input
                  placeholder="Name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="glass-card border-white/20"
                />
                <Input
                  placeholder="Payment (e.g., 200 USD)"
                  value={newEmployee.payment}
                  onChange={(e) => setNewEmployee({ ...newEmployee, payment: e.target.value })}
                  className="glass-card border-white/20"
                />
              </div>

              <Button
                onClick={handleAddEmployee}
                className="w-full bg-gradient-to-r from-primary to-blue-500 hover:opacity-90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </Card>

          {/* Employee List */}
          {employees.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card p-8 hover-lift">
                <h2 className="text-xl font-bold mb-6">
                  Added Employees ({employees.length})
                </h2>
                <div className="space-y-3">
                  {employees.map((emp, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass-card p-4 flex items-center justify-between hover-lift"
                    >
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
                          <div className="font-bold gradient-text">{emp.payment}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEmployee(index)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Create Button */}
          <Button
            onClick={handleCreateGroup}
            disabled={!groupName || employees.length === 0}
            size="lg"
            className="w-full bg-gradient-to-r from-primary via-blue-500 to-cyan-500 hover:opacity-90 text-lg py-6"
          >
            Create Payment Group
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateGroup;
