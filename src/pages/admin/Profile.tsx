import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, User, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfileService } from "@/lib/profileService";

const Profile = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });

  // Mock user ID - in a real app, this would come from authentication
  // For demo purposes, using a fixed ID that could exist in your database
  const userId = "55555555-eeee-4444-aaaa-999999999999"; // Fixed UUID for demo

  // Load existing profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      const result = await ProfileService.getEmployerProfile(userId);
      
      if (result.success && result.data) {
        setProfileData({
          name: result.data.name || "",
          email: result.data.email || "",
        });
      }
      setIsLoading(false);
    };

    loadProfile();
  }, [userId]);

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const result = await ProfileService.saveEmployerProfile({
        name: profileData.name,
        email: profileData.email,
        userId: userId,
      });

      if (result.success) {
        toast({
          title: "Profile Updated",
          description: "Your admin profile has been saved successfully.",
        });
      } else {
        throw new Error(result.error || "Failed to save profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
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
      <Navbar role="admin" walletAddress="0x9876...4321" />
      
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold gradient-text">Admin Profile</h1>
            <p className="text-muted-foreground">Manage your admin account information</p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="glass-card p-8 hover-lift">
              <div className="space-y-6">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="glass-card border-white/20"
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
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
                    {isLoading ? "Saving..." : "Save Profile"}
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
