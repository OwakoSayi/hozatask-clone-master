import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { ProSidebar } from "@/components/pro/ProSidebar";
import { ProStatsCards } from "@/components/pro/ProStatsCards";
import { ProLeadsSection } from "@/components/pro/ProLeadsSection";
import { ProServicesSection } from "@/components/pro/ProServicesSection";
import { ProBookingsSection } from "@/components/pro/ProBookingsSection";
import { ProReviewsSection } from "@/components/pro/ProReviewsSection";
import { ProProfileSection } from "@/components/pro/ProProfileSection";
import { ProVerificationSection } from "@/components/pro/ProVerificationSection";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface Supplier {
  id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  whatsapp: string | null;
  description: string | null;
  images: string[] | null;
  location: string | null;
  status: string;
  title: string;
  category: string;
  years_in_business: number | null;
}

interface ProAccount {
  id: string;
  credits: number;
  verification_status: "none" | "pending" | "verified" | "top_pro";
  license_verified: boolean;
  background_check_completed: boolean;
  total_hires: number;
  response_rate: number;
}

interface ServiceOption {
  id: string;
  title: string;
  description: string;
  price: number;
  time_frame: string;
  category: string;
  location_area: string;
  images: string[];
  is_active: boolean;
}

interface ProjectRequest {
  id: string;
  category: string;
  title: string;
  description: string;
  location: string;
  preferred_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  created_at: string;
  lead_cost_credits: number | null;
}

interface SentQuote {
  id: string;
  price: number;
  message: string;
  status: string;
  created_at: string;
  project_request: ProjectRequest;
}

const ProHome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("leads");
  
  // Data states
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [leads, setLeads] = useState<ProjectRequest[]>([]);
  const [sentQuotes, setSentQuotes] = useState<SentQuote[]>([]);
  const [credits, setCredits] = useState(0);
  const [proAccount, setProAccount] = useState<ProAccount | null>(null);
  const [stats, setStats] = useState({ completed: 0, pending: 0, rating: 0 });

  useEffect(() => {
    loadAllData();

    // Realtime subscription for bookings
    const channel = supabase
      .channel('pro-home-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_requests' }, () => loadAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => loadAllData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAllData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth", { state: { returnTo: "/pro-home" } });
        return;
      }

      // Get supplier data
      const { data: supplierData, error: supplierError } = await supabase
        .from("suppliers")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (supplierError) throw supplierError;

      if (!supplierData) {
        toast({ title: "Access Denied", description: "You don't have a pro account" });
        navigate("/become-pro");
        return;
      }

      // Allow all statuses - profiles now go live immediately
      // If status is Pending, still show dashboard but with limited features
      if (supplierData.status === "Inactive") {
        toast({ title: "Account Inactive", description: "Your account has been deactivated. Contact support." });
        navigate("/");
        return;
      }

      setSupplier(supplierData);

      // Load pro account for credits and verification status
      const { data: proAccountData } = await supabase
        .from("pro_accounts")
        .select("id, credits, verification_status, license_verified, background_check_completed, total_hires, response_rate")
        .eq("supplier_id", supplierData.id)
        .maybeSingle();

      if (proAccountData) {
        setProAccount(proAccountData as ProAccount);
        setCredits(proAccountData.credits);
      }

      // Load all data in parallel
      const [servicesRes, bookingsRes, reviewsRes, leadsRes, quotesRes] = await Promise.all([
        supabase
          .from("service_options")
          .select("*")
          .eq("supplier_id", supplierData.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select("*")
          .or(`matched_supplier_id.eq.${supplierData.id}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("reviews")
          .select("*")
          .eq("supplier_id", supplierData.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("project_requests")
          .select("*")
          .eq("category", supplierData.category)
          .eq("status", "open")
          .order("created_at", { ascending: false }),
        supabase
          .from("quotes")
          .select(`*, project_request:project_requests(*)`)
          .eq("supplier_id", supplierData.id)
          .order("created_at", { ascending: false }),
      ]);

      setServiceOptions(servicesRes.data || []);
      setReviews(reviewsRes.data || []);

      // Also get bookings where service was selected
      const serviceOptionIds = servicesRes.data?.map(opt => opt.id) || [];
      if (serviceOptionIds.length > 0) {
        const { data: opportunityBookings } = await supabase
          .from("bookings")
          .select("*")
          .or(`and(selected_option_ids.cs.{${serviceOptionIds.join(',')}},matched_supplier_id.is.null),matched_supplier_id.eq.${supplierData.id}`)
          .order("created_at", { ascending: false });
        setBookings(opportunityBookings || []);
      } else {
        setBookings(bookingsRes.data || []);
      }

      // Filter leads that haven't been quoted on
      const quotedIds = new Set(quotesRes.data?.map(q => q.request_id) || []);
      const availableLeads = (leadsRes.data || []).filter(lead => !quotedIds.has(lead.id));
      setLeads(availableLeads);
      setSentQuotes(quotesRes.data || []);

      // Calculate stats
      const allBookings = bookingsRes.data || [];
      const completed = allBookings.filter(b => b.status === "Completed").length;
      const pending = allBookings.filter(b => b.status === "New" || b.status === "InProgress" || b.status === "Matched").length;
      const avgRating = reviewsRes.data && reviewsRes.data.length > 0
        ? reviewsRes.data.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsRes.data.length
        : 0;

      setStats({ completed, pending, rating: avgRating });
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Error", description: "Failed to load dashboard", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  if (!supplier) return null;

  const renderSection = () => {
    switch (activeSection) {
      case "leads":
        return (
          <ProLeadsSection
            leads={leads}
            sentQuotes={sentQuotes}
            credits={credits}
            supplierId={supplier.id}
            proAccountId={proAccount?.id || null}
            supplierCategory={supplier.category}
            onRefresh={loadAllData}
            onCreditsUpdate={setCredits}
          />
        );
      case "services":
        return (
          <ProServicesSection
            services={serviceOptions}
            supplierId={supplier.id}
            supplierCategory={supplier.category}
            onRefresh={loadAllData}
          />
        );
      case "bookings":
        return (
          <ProBookingsSection
            bookings={bookings}
            supplierId={supplier.id}
            supplierBusinessName={supplier.business_name}
            supplierPhone={supplier.phone}
            onRefresh={loadAllData}
          />
        );
      case "reviews":
        return (
          <ProReviewsSection
            reviews={reviews}
            averageRating={stats.rating}
          />
        );
      case "verifications":
        return (
          <ProVerificationSection
            proAccount={proAccount}
            supplierYearsInBusiness={supplier.years_in_business}
            onRefresh={loadAllData}
          />
        );
      case "profile":
        return (
          <ProProfileSection
            supplier={supplier}
            onRefresh={loadAllData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <SidebarProvider defaultOpen={true}>
        <div className="flex flex-1 w-full">
          <ProSidebar
            supplier={supplier}
            credits={credits}
            leadsCount={leads.length}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          
          <SidebarInset className="flex-1">
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Mobile sidebar trigger */}
              <div className="flex items-center gap-4 mb-6 lg:hidden">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold capitalize">{activeSection}</h1>
              </div>

              {/* Desktop header */}
              <div className="hidden lg:flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold capitalize">{activeSection}</h1>
                <SidebarTrigger />
              </div>

              {/* Stats Cards */}
              <div className="mb-6">
                <ProStatsCards
                  completed={stats.completed}
                  pending={stats.pending}
                  rating={stats.rating}
                  activeServices={serviceOptions.filter(s => s.is_active).length}
                  credits={credits}
                />
              </div>

              {/* Main Content */}
              {renderSection()}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>

      <Footer />
    </div>
  );
};

export default ProHome;
