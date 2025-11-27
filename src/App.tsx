import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CategoryListings from "./pages/CategoryListings";
import BookingForm from "./pages/BookingForm";
import BookingConfirmation from "./pages/BookingConfirmation";
import SupplierSubmission from "./pages/SupplierSubmission";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSetup from "./pages/AdminSetup";
import AdminMFASetup from "./pages/AdminMFASetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/category/:category" element={<CategoryListings />} />
          <Route path="/booking" element={<BookingForm />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route path="/supplier-submission" element={<SupplierSubmission />} />
          <Route path="/admin/setup" element={<AdminSetup />} />
          <Route path="/admin/mfa-setup" element={<AdminMFASetup />} />
          <Route path="/admin/login" element={<AdminAuth />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
