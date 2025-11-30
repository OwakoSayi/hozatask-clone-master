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
import { Copy } from "lucide-react";

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
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
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
      const [bookingsRes, suppliersRes, serviceOptionsRes] = await Promise.all([
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
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (suppliersRes.error) throw suppliersRes.error;
      if (serviceOptionsRes.error) throw serviceOptionsRes.error;

      setBookings(bookingsRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setServiceOptions(serviceOptionsRes.data || []);
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
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
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Phone:</span> {booking.phone}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(booking.phone, "Phone number")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span> {booking.email}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Event Date:</span> {booking.event_date}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Event Time:</span> {booking.event_time || "Not specified"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Event Type:</span> {booking.event_type || "Not specified"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Location:</span> {booking.address}
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="bg-muted/20 p-3 rounded">
                      <p className="text-sm font-semibold text-muted-foreground mb-1">Notes:</p>
                      <p className="text-sm">{booking.notes}</p>
                    </div>
                  )}

                  {booking.selected_option_ids && booking.selected_option_ids.length > 0 && (
                    <div className="bg-muted/30 p-3 rounded">
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Services Requested:</p>
                      <div className="space-y-3">
                        {booking.selected_option_ids.map((optionId) => {
                          const service = serviceOptions.find(s => s.id === optionId);
                          return service ? (
                            <div key={optionId} className="text-sm bg-background p-3 rounded border border-border space-y-2">
                              <div>
                                <p className="font-medium">{service.title}</p>
                                <p className="text-muted-foreground text-xs">
                                  {service.category} • R{service.price}
                                </p>
                              </div>
                              {service.suppliers && (
                                <div className="border-t border-border pt-2 space-y-1">
                                  <p className="text-xs font-semibold text-muted-foreground">Supplier:</p>
                                  <p className="text-xs font-medium">{service.suppliers.business_name}</p>
                                  <p className="text-xs text-muted-foreground">Contact: {service.suppliers.contact_name}</p>
                                  <div className="flex gap-2 items-center flex-wrap">
                                    <div className="flex items-center gap-1">
                                      <p className="text-xs text-muted-foreground">Phone: {service.suppliers.phone}</p>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0"
                                        onClick={() => copyToClipboard(service.suppliers.phone, "Supplier phone")}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    {service.suppliers.whatsapp && (
                                      <a
                                        href={`https://wa.me/${service.suppliers.whatsapp.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                                      >
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                        </svg>
                                        WhatsApp
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p key={optionId} className="text-xs text-muted-foreground">Service ID: {optionId}</p>
                          );
                        })}
                      </div>
                    </div>
                  )}


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
