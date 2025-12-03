import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthRedirectHandler } from "./components/AuthRedirectHandler";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import BrowseServices from "./pages/BrowseServices";
import CategoryListings from "./pages/CategoryListings";
import BookingForm from "./pages/BookingForm";
import BookingConfirmation from "./pages/BookingConfirmation";
import SupplierSubmission from "./pages/SupplierSubmission";
import SupplierProfile from "./pages/SupplierProfile";
import SupplierDashboard from "./pages/SupplierDashboard";

import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSetup from "./pages/AdminSetup";
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
          <Route path="/browse" element={<BrowseServices />} />
          <Route path="/category/:category" element={<CategoryListings />} />
          <Route path="/booking" element={<BookingForm />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route path="/supplier-submission" element={<SupplierSubmission />} />
          <Route path="/supplier/:id" element={<SupplierProfile />} />
          <Route path="/supplier-dashboard" element={<SupplierDashboard />} />
          
          <Route path="/admin/setup" element={<AdminSetup />} />
          <Route path="/admin/login" element={<AdminAuth />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/my-account" element={<CustomerAccount />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
