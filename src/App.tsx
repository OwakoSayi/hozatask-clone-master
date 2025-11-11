import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Browse from "./pages/Browse";
import TaskDetail from "./pages/TaskDetail";
import Dashboard from "./pages/Dashboard";
import TaskerProfile from "./pages/TaskerProfile";
import Review from "./pages/Review";
import AdminVerifications from "./pages/AdminVerifications";
import HowItWorks from "./pages/HowItWorks";
import BecomeTasker from "./pages/BecomeTasker";
import Services from "./pages/Services";
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
          <Route path="/auth" element={<Auth />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/task/:id" element={<TaskDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasker-profile" element={<TaskerProfile />} />
          <Route path="/review/:bookingId" element={<Review />} />
          <Route path="/admin/verifications" element={<AdminVerifications />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/become-tasker" element={<BecomeTasker />} />
          <Route path="/services" element={<Services />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
