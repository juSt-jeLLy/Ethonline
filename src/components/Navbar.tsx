import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";

interface NavbarProps {
  role: "employee" | "admin";
  walletAddress?: string;
  isWalletConnected?: boolean;
}

export const Navbar = ({ role, walletAddress, isWalletConnected = false }: NavbarProps) => {
  const location = useLocation();

  const employeeLinks = [
    { path: "/employee/home", label: "Home" },
    { path: "/employee/employment", label: "Current Employment" },
    { path: "/employee/profile", label: "Profile" },
  ];

  const adminLinks = [
    { path: "/admin/home", label: "Home" },
    { path: "/admin/create-group", label: "Create Group" },
    { path: "/admin/groups", label: "All Groups" },
    { path: "/admin/profile", label: "Profile" },
  ];

  const links = role === "employee" ? employeeLinks : adminLinks;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass-card sticky top-0 z-50 border-b"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-bold gradient-text"
              >
                PayStream
              </motion.div>
            </Link>
            <div className="px-3 py-1 rounded-full glass-card text-xs font-medium text-primary">
              {role === "employee" ? "Employee" : "Admin"}
            </div>
          </div>

          <div className="flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative group"
              >
                <span
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </span>
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-[1.15rem] left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-blue-500 to-cyan-500"
                  />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isWalletConnected && walletAddress ? (
              <div className="glass-card px-4 py-2 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-sm font-mono">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            ) : (
              <Button className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90">
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            )}
            <Button variant="ghost" size="icon">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
