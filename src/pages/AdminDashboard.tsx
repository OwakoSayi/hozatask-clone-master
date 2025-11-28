import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Booking {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  event_date: string;
  event_time: string;
  status: string;
  matched_supplier_name: string;
  matched_supplier_contact: string;
  created_at: string;
}

interface Supplier {
  id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  category: string;
  title: string;
  status: string;
  price: number;
  images: string[];
  location: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

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
      const [bookingsRes, suppliersRes] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("suppliers").select("*").order("created_at", { ascending: false }),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (suppliersRes.error) throw suppliersRes.error;

      setBookings(bookingsRes.data || []);
      setSuppliers(suppliersRes.data || []);
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

  const updateBookingStatus = async (id: string, status: string, matchData?: any) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status, ...matchData })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking updated successfully",
      });

      loadData();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    }
  };

  const updateSupplierStatus = async (id: string, status: "Active" | "Inactive" | "Pending") => {
    try {
      // Get the supplier details
      const { data: supplier, error: fetchError } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // When approving a supplier for the first time, check if they submitted with an auth user
      let updateData: any = { status };
      
      if (status === "Active" && !supplier.user_id) {
        // Check if there's an auth user with matching email from supplier submission
        // For now, we'll just approve without linking to user
        // In future, could link based on email matching
      }

      // Update supplier status
      const { error: updateError } = await supabase
        .from("suppliers")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      // If approving (Active), create/update service_option
      if (status === "Active") {
        // Check if service option already exists for this supplier
        const { data: existingOption } = await supabase
          .from("service_options")
          .select("id")
          .eq("supplier_id", supplier.id)
          .maybeSingle();

        if (existingOption) {
          // Update existing service option
          const { error: serviceError } = await supabase
            .from("service_options")
            .update({
              category: supplier.category,
              title: supplier.title,
              description: supplier.description,
              price: supplier.price,
              location_area: supplier.location,
              images: supplier.images,
              is_active: true,
            })
            .eq("id", existingOption.id);

          if (serviceError) throw serviceError;
        } else {
          // Create new service option
          const { error: serviceError } = await supabase
            .from("service_options")
            .insert({
              supplier_id: supplier.id,
              category: supplier.category,
              title: supplier.title,
              description: supplier.description,
              price: supplier.price,
              location_area: supplier.location,
              images: supplier.images,
              is_active: true,
            });

          if (serviceError) throw serviceError;
        }
      }

      // If deactivating, deactivate the service_option
      if (status === "Inactive") {
        await supabase
          .from("service_options")
          .update({ is_active: false })
          .eq("supplier_id", supplier.id);
      }

      toast({
        title: "Success",
        description: `Supplier ${status === "Active" ? "approved" : "updated"} successfully`,
      });

      loadData();
    } catch (error) {
      console.error("Error updating supplier:", error);
      toast({
        title: "Error",
        description: "Failed to update supplier",
        variant: "destructive",
      });
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier? This action cannot be undone.")) {
      return;
    }

    try {
      // First delete associated service options
      await supabase
        .from("service_options")
        .delete()
        .eq("supplier_id", id);

      // Then delete the supplier
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });

      loadData();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <Tabs defaultValue="bookings">
          <TabsList>
            <TabsTrigger value="bookings">
              Bookings ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="suppliers">
              Suppliers ({suppliers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{booking.customer_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge>{booking.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Phone:</span> {booking.phone}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span> {booking.email}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Event Date:</span> {booking.event_date}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Address:</span> {booking.address}
                    </div>
                  </div>

                  {booking.status === "New" && (
                    <div className="space-y-2">
                      <Label>Match Supplier</Label>
                      <div className="flex gap-2">
                        <Input placeholder="Supplier Name" id={`supplier-name-${booking.id}`} />
                        <Input placeholder="Contact" id={`supplier-contact-${booking.id}`} />
                        <Button
                          onClick={() => {
                            const nameInput = document.getElementById(`supplier-name-${booking.id}`) as HTMLInputElement;
                            const contactInput = document.getElementById(`supplier-contact-${booking.id}`) as HTMLInputElement;
                            updateBookingStatus(booking.id, "Matched", {
                              matched_supplier_name: nameInput.value,
                              matched_supplier_contact: contactInput.value,
                            });
                          }}
                        >
                          Match
                        </Button>
                      </div>
                    </div>
                  )}

                  {booking.matched_supplier_name && (
                    <div className="bg-muted/30 p-3 rounded">
                      <p className="text-sm font-semibold">Matched Supplier</p>
                      <p className="text-sm">{booking.matched_supplier_name} - {booking.matched_supplier_contact}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBookingStatus(booking.id, "InProgress")}
                    >
                      Mark In Progress
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBookingStatus(booking.id, "Completed")}
                    >
                      Mark Completed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            {suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{supplier.business_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{supplier.category}</p>
                    </div>
                    <Badge variant={supplier.status === "Active" ? "default" : supplier.status === "Pending" ? "secondary" : "outline"}>
                      {supplier.status === "Active" ? "Approved" : supplier.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="font-semibold">{supplier.title}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Contact:</span> {supplier.contact_name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span> {supplier.phone}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Location:</span> {supplier.location}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span> R{supplier.price}
                    </div>
                  </div>

                  {supplier.images && supplier.images.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2 text-muted-foreground">Service Images:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {supplier.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Service ${index + 1}`}
                            className="w-full h-24 object-cover rounded border border-border"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateSupplierStatus(supplier.id, "Active")}
                      disabled={supplier.status === "Active"}
                    >
                      {supplier.status === "Active" ? "Approved" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateSupplierStatus(supplier.id, "Inactive")}
                      disabled={supplier.status === "Inactive"}
                    >
                      Deactivate
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteSupplier(supplier.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
