import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, LayoutDashboard, Users, Building2, CalendarCheck, BarChart3 } from "lucide-react";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminSupplierApprovals from "@/components/admin/AdminSupplierApprovals";
import AdminBookings from "@/components/admin/AdminBookings";
import AdminAnalytics from "@/components/admin/AdminAnalytics";

interface Booking {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  event_date: string;
  event_time: string;
  event_type: string;
  notes: string;
  status: string;
  matched_supplier_name: string;
  matched_supplier_contact: string;
  created_at: string;
  selected_option_ids: string[];
}

interface ServiceOption {
  id: string;
  title: string;
  category: string;
  price: number;
  supplier_id: string;
  suppliers: {
    business_name: string;
    contact_name: string;
    phone: string;
    whatsapp: string;
  };
}

interface Supplier {
  id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  whatsapp?: string;
  category: string;
  title: string;
  description?: string;
  status: string;
  price: number;
  images: string[];
  location: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  created_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  user_id: string;
}

interface ProjectRequest {
  id: string;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [projectRequests, setProjectRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/admin/login");
      return;
    }

    const { data: adminData } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!adminData) {
      toast({
        title: "Access Denied",
        description: "Admin privileges required",
        variant: "destructive",
      });
      await supabase.auth.signOut();
      navigate("/admin/login");
      return;
    }

    loadData();
  };

  const loadData = async () => {
    try {
      const [
        bookingsRes, 
        suppliersRes, 
        serviceOptionsRes, 
        profilesRes, 
        adminUsersRes,
        projectsRes
      ] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("suppliers").select("*").order("created_at", { ascending: false }),
        supabase.from("service_options").select(`
          id, 
          title, 
          category, 
          price,
          supplier_id,
          suppliers (
            business_name,
            contact_name,
            phone,
            whatsapp
          )
        `),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("admin_users").select("*"),
        supabase.from("project_requests").select("id, status, created_at").order("created_at", { ascending: false }),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (suppliersRes.error) throw suppliersRes.error;
      if (serviceOptionsRes.error) throw serviceOptionsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (adminUsersRes.error) throw adminUsersRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setBookings(bookingsRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setServiceOptions(serviceOptionsRes.data || []);
      setProfiles(profilesRes.data || []);
      setAdminUsers(adminUsersRes.data || []);
      setProjectRequests(projectsRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  // Calculate analytics data
  const getAnalyticsData = () => {
    // Bookings by status
    const bookingsByStatus = ["New", "Matched", "InProgress", "Completed"].map((status) => ({
      status,
      count: bookings.filter((b) => b.status === status).length,
    }));

    // Suppliers by category
    const categoryMap = new Map<string, number>();
    suppliers.forEach((s) => {
      categoryMap.set(s.category, (categoryMap.get(s.category) || 0) + 1);
    });
    const suppliersByCategory = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Bookings over time (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });
    const bookingsOverTime = last7Days.map((date) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: bookings.filter((b) => b.created_at.startsWith(date)).length,
    }));

    // Projects by status
    const projectStatusMap = new Map<string, number>();
    projectRequests.forEach((p) => {
      projectStatusMap.set(p.status, (projectStatusMap.get(p.status) || 0) + 1);
    });
    const projectsByStatus = Array.from(projectStatusMap.entries()).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }));

    return { bookingsByStatus, suppliersByCategory, bookingsOverTime, projectsByStatus };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingSuppliers = suppliers.filter((s) => s.status === "Pending").length;
  const activeSuppliers = suppliers.filter((s) => s.status === "Active").length;
  const completedBookings = bookings.filter((b) => b.status === "Completed").length;
  const openProjects = projectRequests.filter((p) => p.status === "open").length;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">Manage your platform</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 lg:w-auto lg:inline-grid gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4 hidden sm:block" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4 hidden sm:block" />
              Users
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-2 relative">
              <Building2 className="h-4 w-4 hidden sm:block" />
              Suppliers
              {pendingSuppliers > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center">
                  {pendingSuppliers}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2">
              <CalendarCheck className="h-4 w-4 hidden sm:block" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4 hidden sm:block" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminStatsCards
              totalUsers={profiles.length}
              totalSuppliers={suppliers.length}
              activeSuppliers={activeSuppliers}
              pendingSuppliers={pendingSuppliers}
              totalBookings={bookings.length}
              completedBookings={completedBookings}
              totalProjects={projectRequests.length}
              openProjects={openProjects}
            />
            <AdminAnalytics data={getAnalyticsData()} />
          </TabsContent>

          <TabsContent value="users">
            <AdminUserManagement
              profiles={profiles}
              adminUsers={adminUsers}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="suppliers">
            <AdminSupplierApprovals suppliers={suppliers} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="bookings">
            <AdminBookings
              bookings={bookings}
              serviceOptions={serviceOptions}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics data={getAnalyticsData()} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
