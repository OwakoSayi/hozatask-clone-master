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

interface Supplier {
  id: string;
  business_name: string;
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
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceOption | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price_min: "",
    price_max: "",
    location_area: "",
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

      // Load service options
      const { data: optionsData, error: optionsError } = await supabase
        .from("service_options")
        .select("*")
        .eq("supplier_id", supplierData.id)
        .order("created_at", { ascending: false });

      if (optionsError) throw optionsError;
      setServiceOptions(optionsData || []);
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
      </div>

      <Footer />
    </div>
  );
};

export default SupplierDashboard;