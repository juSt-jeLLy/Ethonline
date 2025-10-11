import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Web3Provider from "@/providers/Web3Provider";
import { WalletGuard } from "@/components/WalletGuard";
import Landing from "./pages/Landing";
import EmployeeHome from "./pages/employee/Home";
import EmployeeProfile from "./pages/employee/Profile";
import Employment from "./pages/employee/Employment";
import AdminHome from "./pages/admin/Home";
import AdminProfile from "./pages/admin/Profile";
import CreateGroup from "./pages/admin/CreateGroup";
import Groups from "./pages/admin/Groups";
import EditGroup from "./pages/admin/EditGroup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Web3Provider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            
            {/* Employee Routes - Protected */}
            <Route 
              path="/employee/home" 
              element={
                <WalletGuard>
                  <EmployeeHome />
                </WalletGuard>
              } 
            />
            <Route 
              path="/employee/employment" 
              element={
                <WalletGuard>
                  <Employment />
                </WalletGuard>
              } 
            />
            <Route 
              path="/employee/profile" 
              element={
                <WalletGuard>
                  <EmployeeProfile />
                </WalletGuard>
              } 
            />
            
            {/* Admin Routes - Protected */}
            <Route 
              path="/admin/home" 
              element={
                <WalletGuard>
                  <AdminHome />
                </WalletGuard>
              } 
            />
            <Route 
              path="/admin/create-group" 
              element={
                <WalletGuard>
                  <CreateGroup />
                </WalletGuard>
              } 
            />
            <Route 
              path="/admin/groups" 
              element={
                <WalletGuard>
                  <Groups />
                </WalletGuard>
              } 
            />
            <Route 
              path="/admin/edit-group/:id" 
              element={
                <WalletGuard>
                  <EditGroup />
                </WalletGuard>
              } 
            />
            <Route 
              path="/admin/profile" 
              element={
                <WalletGuard>
                  <AdminProfile />
                </WalletGuard>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </Web3Provider>
  </QueryClientProvider>
);

export default App;