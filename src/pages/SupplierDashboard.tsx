import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CardDescription } from "@/components/ui/card";

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
}

interface ServiceOption {
  id: string;
  title: string;
  description: string;
  price_min: number;
  price_max: number;
  location_area: string;
  images: string[];
  is_active: boolean;
}

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceOption | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price_min: "",
    price_max: "",
    location_area: "",
    images: "",
  });

  const [profileData, setProfileData] = useState({
    business_name: "",
    contact_name: "",
    phone: "",
    whatsapp: "",
    description: "",
    location: "",
    images: "",
  });

  useEffect(() => {
    loadSupplierData();
  }, []);

  const loadSupplierData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get supplier profile for current user
      const { data: supplierData, error: supplierError } = await supabase
        .from("suppliers")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (supplierError) {
        toast({
          title: "Access Denied",
          description: "You don't have a supplier account",
        });
        navigate("/");
        return;
      }

      if (supplierData.status !== "Active") {
        toast({
          title: "Pending Approval",
          description: "Your supplier account is pending admin approval",
        });
        navigate("/");
        return;
      }

      setSupplier(supplierData);
      
      // Set profile form data
      setProfileData({
        business_name: supplierData.business_name || "",
        contact_name: supplierData.contact_name || "",
        phone: supplierData.phone || "",
        whatsapp: supplierData.whatsapp || "",
        description: supplierData.description || "",
        location: supplierData.location || "",
        images: supplierData.images ? supplierData.images.join(", ") : "",
      });

      // Load service options
      const { data: optionsData, error: optionsError } = await supabase
        .from("service_options")
        .select("*")
        .eq("supplier_id", supplierData.id)
        .order("created_at", { ascending: false });

      if (optionsError) throw optionsError;
      setServiceOptions(optionsData || []);

      // Load bookings for this supplier
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("matched_supplier_id", supplierData.id)
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);
    } catch (error) {
      console.error("Error loading supplier data:", error);
      toast({
        title: "Error",
        description: "Failed to load your dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplier) return;

    try {
      const imagesArray = formData.images
        ? formData.images.split(",").map((url) => url.trim())
        : [];

      const serviceData = {
        supplier_id: supplier.id,
        title: formData.title,
        description: formData.description,
        price_min: parseFloat(formData.price_min),
        price_max: parseFloat(formData.price_max),
        location_area: formData.location_area,
        images: imagesArray,
        is_active: true,
        category: supplier.business_name, // Using business name as category for now
      };

      if (editingService) {
        const { error } = await supabase
          .from("service_options")
          .update(serviceData)
          .eq("id", editingService.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Service updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("service_options")
          .insert(serviceData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Service added successfully",
        });
      }

      setDialogOpen(false);
      setEditingService(null);
      setFormData({
        title: "",
        description: "",
        price_min: "",
        price_max: "",
        location_area: "",
        images: "",
      });
      loadSupplierData();
    } catch (error) {
      console.error("Error saving service:", error);
      toast({
        title: "Error",
        description: "Failed to save service",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (service: ServiceOption) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description || "",
      price_min: service.price_min.toString(),
      price_max: service.price_max.toString(),
      location_area: service.location_area || "",
      images: service.images ? service.images.join(", ") : "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const { error } = await supabase
        .from("service_options")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
      loadSupplierData();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("service_options")
        .update({ is_active: !currentStatus })
        .eq("id", serviceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Service ${!currentStatus ? "activated" : "deactivated"}`,
      });
      loadSupplierData();
    } catch (error) {
      console.error("Error updating service:", error);
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      });
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplier) return;

    try {
      const imagesArray = profileData.images
        ? profileData.images.split(",").map((url) => url.trim())
        : [];

      const { error } = await supabase
        .from("suppliers")
        .update({
          business_name: profileData.business_name,
          contact_name: profileData.contact_name,
          phone: profileData.phone,
          whatsapp: profileData.whatsapp || null,
          description: profileData.description || null,
          location: profileData.location || null,
          images: imagesArray.length > 0 ? imagesArray : null,
        })
        .eq("id", supplier.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setProfileDialogOpen(false);
      loadSupplierData();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
            <p className="text-muted-foreground">
              {supplier?.business_name}
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Supplier Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={profileData.business_name}
                      onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      value={profileData.contact_name}
                      onChange={(e) => setProfileData({ ...profileData, contact_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={profileData.whatsapp}
                        onChange={(e) => setProfileData({ ...profileData, whatsapp: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="profile_description">About Your Business</Label>
                    <Textarea
                      id="profile_description"
                      value={profileData.description}
                      onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                      rows={4}
                      placeholder="Tell clients about your business..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      placeholder="e.g., Johannesburg, South Africa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile_images">Profile Image URLs (comma separated)</Label>
                    <Textarea
                      id="profile_images"
                      value={profileData.images}
                      onChange={(e) => setProfileData({ ...profileData, images: e.target.value })}
                      placeholder="https://example.com/logo.jpg, https://example.com/shop.jpg"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setProfileDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Update Profile
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingService(null);
                setFormData({
                  title: "",
                  description: "",
                  price_min: "",
                  price_max: "",
                  location_area: "",
                  images: "",
                });
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? "Edit Service" : "Add New Service"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Service Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price_min">Min Price (R)</Label>
                    <Input
                      id="price_min"
                      type="number"
                      value={formData.price_min}
                      onChange={(e) => setFormData({ ...formData, price_min: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_max">Max Price (R)</Label>
                    <Input
                      id="price_max"
                      type="number"
                      value={formData.price_max}
                      onChange={(e) => setFormData({ ...formData, price_max: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location_area">Location</Label>
                  <Input
                    id="location_area"
                    value={formData.location_area}
                    onChange={(e) => setFormData({ ...formData, location_area: e.target.value })}
                    placeholder="e.g., Johannesburg, South Africa"
                  />
                </div>
                <div>
                  <Label htmlFor="images">Image URLs (comma separated)</Label>
                  <Textarea
                    id="images"
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingService ? "Update" : "Add"} Service
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="services">My Services</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>Your supplier profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Business Name</h3>
                  <p className="text-muted-foreground">{supplier?.business_name}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Contact Name</h3>
                  <p className="text-muted-foreground">{supplier?.contact_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <p className="text-muted-foreground">{supplier?.phone}</p>
                  </div>
                  {supplier?.whatsapp && (
                    <div>
                      <h3 className="font-semibold mb-1">WhatsApp</h3>
                      <p className="text-muted-foreground">{supplier.whatsapp}</p>
                    </div>
                  )}
                </div>
                {supplier?.description && (
                  <div>
                    <h3 className="font-semibold mb-1">About</h3>
                    <p className="text-muted-foreground">{supplier.description}</p>
                  </div>
                )}
                {supplier?.location && (
                  <div>
                    <h3 className="font-semibold mb-1">Location</h3>
                    <p className="text-muted-foreground">{supplier.location}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="mt-6">
        {serviceOptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                You haven't added any services yet
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceOptions.map((service) => (
              <Card key={service.id}>
                {service.images && service.images.length > 0 && (
                  <img
                    src={service.images[0]}
                    alt={service.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {service.description}
                  </p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">
                      R{service.price_min} - R{service.price_max}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      service.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {service.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(service)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(service.id, service.is_active)}
                      className="flex-1"
                    >
                      {service.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Received Bookings</CardTitle>
                <CardDescription>Manage bookings from customers</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No bookings yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <Card key={booking.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold">{booking.customer_name}</h3>
                              <p className="text-sm text-muted-foreground">{booking.email}</p>
                              <p className="text-sm text-muted-foreground">{booking.phone}</p>
                            </div>
                            <Badge className={
                              booking.status === "Completed" ? "bg-green-500" :
                              booking.status === "Confirmed" ? "bg-blue-500" :
                              "bg-yellow-500"
                            }>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <p><strong>Event Date:</strong> {new Date(booking.event_date).toLocaleDateString()}</p>
                            <p><strong>Event Time:</strong> {booking.event_time}</p>
                            <p><strong>Location:</strong> {booking.address}</p>
                            {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
                            <p className="text-xs text-muted-foreground">
                              Booked on {new Date(booking.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default SupplierDashboard;