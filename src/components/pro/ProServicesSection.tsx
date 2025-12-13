import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryCombobox } from "@/components/CategoryCombobox";

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

interface ProServicesSectionProps {
  services: ServiceOption[];
  supplierId: string;
  supplierCategory: string;
  onRefresh: () => void;
}

export function ProServicesSection({
  services,
  supplierId,
  supplierCategory,
  onRefresh,
}: ProServicesSectionProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceOption | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    time_frame: "per hour",
    category: supplierCategory,
    location_area: "",
    images: [] as string[],
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please upload an image", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const fileName = `${session.user.id}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFormData({ ...formData, images: [...formData.images, publicUrl] });
      toast({ title: "Success", description: "Image uploaded" });
    } catch (error) {
      console.error("Error uploading:", error);
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
    event.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const serviceData = {
        supplier_id: supplierId,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        time_frame: formData.time_frame,
        category: formData.category,
        location_area: formData.location_area,
        images: formData.images,
        is_active: true,
      };

      if (editingService) {
        const { error } = await supabase
          .from("service_options")
          .update(serviceData)
          .eq("id", editingService.id);
        if (error) throw error;
        toast({ title: "Success", description: "Service updated" });
      } else {
        const { error } = await supabase
          .from("service_options")
          .insert(serviceData);
        if (error) throw error;
        toast({ title: "Success", description: "Service added" });
      }

      setDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error("Error saving:", error);
      toast({ title: "Error", description: "Failed to save service", variant: "destructive" });
    }
  };

  const handleEdit = (service: ServiceOption) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description || "",
      price: service.price.toString(),
      time_frame: service.time_frame || "per hour",
      category: service.category || supplierCategory,
      location_area: service.location_area || "",
      images: service.images || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Delete this service?")) return;

    try {
      const { error } = await supabase
        .from("service_options")
        .delete()
        .eq("id", serviceId);
      if (error) throw error;
      toast({ title: "Success", description: "Service deleted" });
      onRefresh();
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleToggleActive = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("service_options")
        .update({ is_active: !currentStatus })
        .eq("id", serviceId);
      if (error) throw error;
      toast({ title: "Success", description: `Service ${!currentStatus ? "activated" : "deactivated"}` });
      onRefresh();
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData({
      title: "",
      description: "",
      price: "",
      time_frame: "per hour",
      category: supplierCategory,
      location_area: "",
      images: [],
    });
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Your Services</CardTitle>
            <CardDescription>Manage your service offerings</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
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
                    <Label htmlFor="price">Price (R)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time_frame">Time Frame</Label>
                    <Select 
                      value={formData.time_frame} 
                      onValueChange={(value) => setFormData({ ...formData, time_frame: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per hour">Per Hour</SelectItem>
                        <SelectItem value="per day">Per Day</SelectItem>
                        <SelectItem value="per service">Per Service</SelectItem>
                        <SelectItem value="per project">Per Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <CategoryCombobox
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  />
                </div>
                <div>
                  <Label>Service Area</Label>
                  <Input
                    value={formData.location_area}
                    onChange={(e) => setFormData({ ...formData, location_area: e.target.value })}
                    placeholder="e.g., Sandton, Johannesburg"
                  />
                </div>
                
                {/* Images */}
                <div>
                  <Label>Photos</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2 mb-3">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border">
                        <img src={url} alt="" className="w-full h-20 object-cover" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Input
                    id="service-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingImage}
                    onClick={() => document.getElementById('service-image')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadingImage ? "Uploading..." : "Add Photo"}
                  </Button>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No services yet</p>
            <p className="text-sm text-muted-foreground">Add your first service to start receiving leads</p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <Card key={service.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {service.images?.[0] && (
                      <img
                        src={service.images[0]}
                        alt={service.title}
                        className="w-full sm:w-20 h-32 sm:h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{service.title}</h3>
                        <Badge variant={service.is_active ? "default" : "secondary"}>
                          {service.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                      <p className="font-semibold mt-2">
                        R{service.price} / {service.time_frame?.replace('per ', '')}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(service)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleToggleActive(service.id, service.is_active)}>
                        {service.is_active ? "Pause" : "Activate"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(service.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
