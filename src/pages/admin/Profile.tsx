import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Building2, Mail, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfileService } from "@/lib/profileService";

interface Company {
  id: string;
  name: string;
  email: string;
}

const Profile = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Load all companies on component mount
  useEffect(() => {
    const loadCompanies = async () => {
      setIsLoading(true);
      try {
        const result = await ProfileService.getAllCompanies();
        if (result.success) {
          setCompanies(result.data);
          console.log('Loaded companies:', result.data);
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
  }, []);

  // Load selected company profile when company is selected
  useEffect(() => {
    if (selectedCompanyId && !isCreatingNew) {
      const loadCompanyProfile = async () => {
        setIsLoading(true);
        try {
          const result = await ProfileService.getEmployerProfile(selectedCompanyId);
          if (result.success && result.data) {
            setProfileData({
              name: result.data.name || "",
              email: result.data.email || "",
            });
          }
        } catch (error) {
          console.error('Error loading company profile:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadCompanyProfile();
    }
  }, [selectedCompanyId, isCreatingNew]);

  const handleCompanySelect = (companyId: string) => {
    if (companyId === "new") {
      setIsCreatingNew(true);
      setSelectedCompanyId("");
      setProfileData({ name: "", email: "" });
    } else {
      setIsCreatingNew(false);
      setSelectedCompanyId(companyId);
    }
  };

  const handleSave = async () => {
    if (!profileData.name.trim() || !profileData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      let result;
      if (isCreatingNew) {
        // Create new company
        result = await ProfileService.createCompany({
          name: profileData.name,
          email: profileData.email,
        });
      } else {
        // Update existing company
        result = await ProfileService.saveEmployerProfile({
          name: profileData.name,
          email: profileData.email,
          userId: selectedCompanyId,
        });
      }

      if (result.success) {
        toast({
          title: isCreatingNew ? "Company Created" : "Company Updated",
          description: `Company profile has been ${isCreatingNew ? 'created' : 'updated'} successfully.`,
        });
        
        if (isCreatingNew && result.data) {
          // Reload companies list and select the new company
          const companiesResult = await ProfileService.getAllCompanies();
          if (companiesResult.success) {
            setCompanies(companiesResult.data);
            setSelectedCompanyId(result.data.id);
            setIsCreatingNew(false);
          }
        }
      } else {
        throw new Error(result.error || "Failed to save profile");
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save company profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <Navbar role="admin" />
      
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold gradient-text">Company Profile</h1>
            <p className="text-muted-foreground">Select a company to manage or create a new one</p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Company Selection */}
            <Card className="glass-card p-8 hover-lift">
              <div className="space-y-6">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Select Company
                  </Label>
                  <Select value={isCreatingNew ? "new" : selectedCompanyId} onValueChange={handleCompanySelect}>
                    <SelectTrigger className="glass-card border-white/20">
                      <SelectValue placeholder="Choose a company to manage" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name} ({company.email})
                        </SelectItem>
                      ))}
                      <SelectItem value="new">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Create New Company
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </div>
            </Card>

            {/* Company Profile Form */}
            {(selectedCompanyId || isCreatingNew) && (
              <Card className="glass-card p-8 hover-lift">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      {isCreatingNew ? "New Company Details" : "Company Information"}
                    </h3>
                  </div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      Company Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter company name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="glass-card border-white/20"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Company Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@company.com"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="glass-card border-white/20"
                    />
                  </motion.div>


                  <motion.div variants={itemVariants}>
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                      size="lg"
                      className="w-full bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      {isLoading ? "Saving..." : (isCreatingNew ? "Create Company" : "Update Company")}
                    </Button>
                  </motion.div>
                </div>
              </Card>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
