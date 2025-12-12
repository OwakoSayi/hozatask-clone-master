import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthRedirectHandler } from "./components/AuthRedirectHandler";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import SupplierSubmission from "./pages/SupplierSubmission";
import SupplierProfile from "./pages/SupplierProfile";
import SupplierDashboard from "./pages/SupplierDashboard";
import SupplierDirectory from "./pages/SupplierDirectory";
import PostProject from "./pages/PostProject";
import MyProjects from "./pages/MyProjects";
import ProjectDetail from "./pages/ProjectDetail";
import ProLeads from "./pages/ProLeads";
import BuyCredits from "./pages/BuyCredits";
import PaymentCallback from "./pages/PaymentCallback";
import Messages from "./pages/Messages";
import CostGuide from "./pages/CostGuide";
import BecomePro from "./pages/BecomePro";

import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerAccount from "./pages/CustomerAccount";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthRedirectHandler />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Pro directory */}
          <Route path="/pros" element={<SupplierDirectory />} />
          <Route path="/pros/:category" element={<SupplierDirectory />} />
          <Route path="/pro/:id" element={<SupplierProfile />} />
          
          {/* Customer flow - Get quotes */}
          <Route path="/post-project" element={<PostProject />} />
          <Route path="/my-projects" element={<MyProjects />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          
          {/* Pro flow */}
          <Route path="/become-pro" element={<BecomePro />} />
          <Route path="/become-pro/signup" element={<SupplierSubmission />} />
          <Route path="/pro-dashboard" element={<SupplierDashboard />} />
          <Route path="/leads" element={<ProLeads />} />
          <Route path="/buy-credits" element={<BuyCredits />} />
          <Route path="/payment-callback" element={<PaymentCallback />} />
          
          {/* Messaging */}
          <Route path="/messages" element={<Messages />} />
          
          {/* Cost guides */}
          <Route path="/cost-guides" element={<CostGuide />} />
          <Route path="/cost-guides/:category" element={<CostGuide />} />
          
          {/* Admin */}
          <Route path="/admin/login" element={<AdminAuth />} />
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Account */}
          <Route path="/account" element={<CustomerAccount />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
