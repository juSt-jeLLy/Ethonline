import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Wallet, AlertCircle } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface WalletGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const WalletGuard = ({ children, redirectTo = "/" }: WalletGuardProps) => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected) {
      const timer = setTimeout(() => {
        navigate(redirectTo);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, navigate, redirectTo]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="glass-card p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-orange-500/10 rounded-full">
                <AlertCircle className="h-12 w-12 text-orange-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Wallet Not Connected</h2>
              <p className="text-gray-600">
                You need to connect your wallet to access this page.
              </p>
            </div>

            <div className="space-y-3">
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    className="w-full px-6 py-3 bg-gradient-to-r from-primary to-blue-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Wallet className="h-5 w-5" />
                    Connect Wallet
                  </button>
                )}
              </ConnectButton.Custom>
              
              <p className="text-sm text-gray-500">
                Redirecting to home page in 5 seconds...
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};