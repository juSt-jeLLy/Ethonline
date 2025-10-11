import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Wallet, User, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    walletAddress: "",
    chain: "",
    token: "",
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your payment preferences have been saved successfully.",
    });
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
      <Navbar role="employee" />
      
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold gradient-text">Payment Profile</h1>
            <p className="text-muted-foreground">Your payment preferences and information</p>
          </div>

          {/* Profile Summary Card - Shows when saved */}
          {isSaved && !isEditing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card 
                className="glass-card p-8 hover-lift cursor-pointer"
                onClick={() => setIsEditing(true)}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Name</p>
                        <p className="text-lg font-semibold">{profileData.name || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Wallet Address</p>
                        <p className="text-sm font-mono">{profileData.walletAddress || "Not set"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Chain</p>
                          <p className="font-medium capitalize">{profileData.chain || "Not set"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Token</p>
                          <p className="font-medium uppercase">{profileData.token || "Not set"}</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    Click anywhere to edit your payment details
                  </p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Edit Form - Shows when editing or not saved yet */}
          {(!isSaved || isEditing) && (

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
                  <Label htmlFor="wallet" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    Wallet Address
                  </Label>
                  <Input
                    id="wallet"
                    placeholder="0x..."
                    value={profileData.walletAddress}
                    onChange={(e) => setProfileData({ ...profileData, walletAddress: e.target.value })}
                    className="glass-card border-white/20 font-mono"
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Preferred Chain
                    </Label>
                    <Select value={profileData.chain} onValueChange={(value) => setProfileData({ ...profileData, chain: value })}>
                      <SelectTrigger className="glass-card border-white/20">
                        <SelectValue placeholder="Select chain" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ethereum">Ethereum</SelectItem>
                        <SelectItem value="polygon">Polygon</SelectItem>
                        <SelectItem value="arbitrum">Arbitrum</SelectItem>
                        <SelectItem value="optimism">Optimism</SelectItem>
                        <SelectItem value="base">Base</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Preferred Token
                    </Label>
                    <Select value={profileData.token} onValueChange={(value) => setProfileData({ ...profileData, token: value })}>
                      <SelectTrigger className="glass-card border-white/20">
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usdc">USDC</SelectItem>
                        <SelectItem value="usdt">USDT</SelectItem>
                        <SelectItem value="dai">DAI</SelectItem>
                        <SelectItem value="eth">ETH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 transition-opacity"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </Button>
                  {isEditing && (
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                      size="lg"
                    >
                      Cancel
                    </Button>
                  )}
                </motion.div>
              </div>
            </Card>
          </motion.div>
          )}

          {/* Info Card */}
          {(!isSaved || isEditing) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-card p-6 bg-gradient-to-r from-primary/10 to-blue-500/10">
                <div className="flex gap-4">
                  <div className="text-primary">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Payment Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Your payment details are encrypted and securely stored. You can update them anytime.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
