import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Upload, Star, TrendingUp, DollarSign, CheckCircle, X, Check, XCircle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { CategoryCombobox } from "@/components/CategoryCombobox";

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

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ completed: 0, pending: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceOption | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<'profile' | 'service'>('profile');
  const [declinedBookings, setDeclinedBookings] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    time_frame: "per hour",
    category: "",
    location_area: "",
    images: [] as string[],
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
    
    // Set up realtime subscription for new bookings
    const channel = supabase
      .channel('booking-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          // Reload bookings when a new one is created
          loadSupplierData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          // Reload bookings when one is updated
          loadSupplierData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSupplierData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

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
      
      setProfileData({
        business_name: supplierData.business_name || "",
        contact_name: supplierData.contact_name || "",
        phone: supplierData.phone || "",
        whatsapp: supplierData.whatsapp || "",
        description: supplierData.description || "",
        location: supplierData.location || "",
        images: supplierData.images ? supplierData.images.join(", ") : "",
      });

      const { data: optionsData, error: optionsError } = await supabase
        .from("service_options")
        .select("*")
        .eq("supplier_id", supplierData.id)
        .order("created_at", { ascending: false });

      if (optionsError) throw optionsError;
      setServiceOptions(optionsData || []);

      // Get all service option IDs for this supplier
      const serviceOptionIds = optionsData?.map(opt => opt.id) || [];

      // Fetch bookings where:
      // 1. Their service is selected AND not yet matched (opportunities)
      // 2. OR they are the matched supplier (their bookings)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .or(
          `and(selected_option_ids.cs.{${serviceOptionIds.join(',')}},matched_supplier_id.is.null),matched_supplier_id.eq.${supplierData.id}`
        )
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("supplier_id", supplierData.id)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      const completed = bookingsData?.filter(b => b.status === "Completed").length || 0;
      const pending = bookingsData?.filter(b => b.status === "New" || b.status === "InProgress").length || 0;
      const avgRating = reviewsData && reviewsData.length > 0
        ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
        : 0;

      setStats({ completed, pending, rating: avgRating });
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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>, target: 'profile' | 'service') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    if (target === 'service') {
      // Direct upload for service images (no cropping)
      handleServiceImageUpload(file);
    } else {
      // Cropping for profile photos
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setCropTarget(target);
        setCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
    
    event.target.value = '';
  };

  const handleServiceImageUpload = async (file: File) => {
    setUploadingImage(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const fileName = `${session.user.id}-${Date.now()}-${file.name}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData({ ...formData, images: [...formData.images, publicUrl] });

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    setUploadingImage(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const fileName = `${session.user.id}-${Date.now()}.jpg`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedImage, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (cropTarget === 'profile') {
        const currentImages = profileData.images ? profileData.images.split(',').map(s => s.trim()).filter(Boolean) : [];
        currentImages.unshift(publicUrl);
        setProfileData({ ...profileData, images: currentImages.join(', ') });
      } else {
        setFormData({ ...formData, images: [...formData.images, publicUrl] });
      }

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveServiceImage = (index: number) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplier) return;

    try {
      const serviceData = {
        supplier_id: supplier.id,
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
        price: "",
        time_frame: "per hour",
        category: "",
        location_area: "",
        images: [],
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
      price: service.price.toString(),
      time_frame: service.time_frame || "per hour",
      category: service.category || "",
      location_area: service.location_area || "",
      images: service.images || [],
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

  const handleAcceptBooking = async (bookingId: string) => {
    if (!supplier) return;

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          matched_supplier_id: supplier.id,
          matched_supplier_name: supplier.business_name,
          matched_supplier_contact: supplier.phone,
          status: "Matched",
        })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking Accepted!",
        description: "Customer will be notified. Contact them to finalize details.",
      });
      loadSupplierData();
    } catch (error) {
      console.error("Error accepting booking:", error);
      toast({
        title: "Error",
        description: "Failed to accept booking",
        variant: "destructive",
      });
    }
  };

  const handleDeclineBooking = (bookingId: string) => {
    if (!confirm("Are you sure you want to decline this booking opportunity?")) return;

    setDeclinedBookings([...declinedBookings, bookingId]);
    toast({
      title: "Booking Declined",
      description: "This opportunity has been removed from your list",
    });
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const profileImagesArray = profileData.images
    ? profileData.images.split(",").map((url) => url.trim()).filter(Boolean)
    : supplier?.images || [];
  const profileImage = (profileImagesArray as string[])[0] || "/placeholder.svg";
  const initials = supplier?.business_name.substring(0, 2).toUpperCase() || "SP";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 flex-1 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-primary/20 flex-shrink-0">
              <AvatarImage src={profileImage} alt={supplier?.business_name} />
              <AvatarFallback className="text-lg sm:text-xl bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl font-bold text-foreground truncate">{supplier?.contact_name}</h1>
              <p className="text-sm sm:text-base text-muted-foreground truncate">{supplier?.business_name}</p>
            </div>
          </div>
          <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="default" className="w-full sm:w-auto">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Your Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="flex flex-col items-center gap-4 py-4">
                  <Avatar className="h-24 w-24 border-2 border-primary/20">
                    <AvatarImage src={profileImage} alt={supplier?.business_name} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e, 'profile')}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    <Label htmlFor="profile-image" className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingImage}
                        onClick={() => document.getElementById('profile-image')?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploadingImage ? "Uploading..." : "Upload Photo"}
                      </Button>
                    </Label>
                  </div>
                </div>
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
                  <Label htmlFor="contact_name">Your Name</Label>
                  <Input
                    id="contact_name"
                    value={profileData.contact_name}
                    onChange={(e) => setProfileData({ ...profileData, contact_name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp Number</Label>
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
                    placeholder="Tell clients about your experience, skills, and what makes you stand out..."
                  />
                </div>
                <div>
                  <Label htmlFor="location">Service Location</Label>
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    placeholder="e.g., Johannesburg, Gauteng"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setProfileDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Card className="border-border shadow-sm">
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Completed</p>
                  <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.completed}</p>
                </div>
                <CheckCircle className="h-6 w-6 sm:h-10 sm:w-10 text-accent flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Pending</p>
                  <p className="text-xl sm:text-3xl font-bold text-foreground">{stats.pending}</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-10 sm:w-10 text-primary flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Rating</p>
                  <p className="text-xl sm:text-3xl font-bold text-foreground">
                    {stats.rating > 0 ? stats.rating.toFixed(1) : "N/A"}
                  </p>
                </div>
                <Star className="h-6 w-6 sm:h-10 sm:w-10 text-primary fill-primary flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm">
            <CardContent className="p-3 sm:pt-6 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Services</p>
                  <p className="text-xl sm:text-3xl font-bold text-foreground">
                    {serviceOptions.filter(s => s.is_active).length}
                  </p>
                </div>
                <DollarSign className="h-6 w-6 sm:h-10 sm:w-10 text-accent flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto">
            <TabsTrigger value="services" className="text-xs sm:text-sm py-2">Services</TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs sm:text-sm py-2">Bookings</TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs sm:text-sm py-2">Reviews</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Your Services</CardTitle>
                    <CardDescription>Manage your service offerings</CardDescription>
                  </div>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingService(null);
                        setFormData({
                          title: "",
                          description: "",
                          price: "",
                          time_frame: "per hour",
                          category: supplier?.category || "",
                          location_area: "",
                          images: [],
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
                            placeholder="e.g., Plumbing Repair"
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
                            placeholder="Describe what this service includes..."
                          />
                        </div>
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
                              <SelectValue placeholder="Select time frame" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="per hour">Per Hour</SelectItem>
                              <SelectItem value="per day">Per Day</SelectItem>
                              <SelectItem value="per week">Per Week</SelectItem>
                              <SelectItem value="per month">Per Month</SelectItem>
                              <SelectItem value="per service">Per Service</SelectItem>
                              <SelectItem value="per project">Per Project</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="category">Service Category</Label>
                          <CategoryCombobox
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                            placeholder="Search or select a category..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="location_area">Service Area</Label>
                          <Input
                            id="location_area"
                            value={formData.location_area}
                            onChange={(e) => setFormData({ ...formData, location_area: e.target.value })}
                            placeholder="e.g., Sandton, Johannesburg"
                          />
                        </div>
                        
                        {/* Image Management */}
                        <div>
                          <Label>Service Photos</Label>
                           <div className="grid grid-cols-3 gap-3 mt-2 mb-3">
                            {formData.images.map((imageUrl, index) => (
                              <div key={index} className="relative rounded-lg overflow-hidden border border-border">
                                <img 
                                  src={imageUrl} 
                                  alt={`Service ${index + 1}`}
                                  className="w-full h-auto"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 h-6 w-6"
                                  onClick={() => handleRemoveServiceImage(index)}
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
                            onChange={(e) => handleImageSelect(e, 'service')}
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
              </CardHeader>
              <CardContent>
                {serviceOptions.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-muted-foreground mb-4">No services yet</p>
                    <p className="text-sm text-muted-foreground">Add your first service to start receiving bookings</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {serviceOptions.map((service) => (
                      <Card key={service.id} className="border-border">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            {service.images && service.images.length > 0 && (
                              <img
                                src={service.images[0]}
                                alt={service.title}
                                className="w-full sm:w-20 h-32 sm:h-20 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                                <h3 className="font-semibold text-base sm:text-lg text-foreground">{service.title}</h3>
                                <Badge variant={service.is_active ? "default" : "secondary"} className="text-xs">
                                  {service.is_active ? "Active" : "Inactive"}
                                </Badge>
                                {service.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {service.category}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">{service.description}</p>
                              <p className="font-semibold text-sm sm:text-base text-foreground">
                                R{service.price} {service.time_frame && `/ ${service.time_frame.replace('per ', '')}`}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(service)}
                                className="flex-1 sm:flex-none"
                              >
                                <Edit className="h-4 w-4 sm:mr-0" />
                                <span className="sm:hidden ml-1">Edit</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleActive(service.id, service.is_active)}
                                className="flex-1 sm:flex-none text-xs sm:text-sm"
                              >
                                {service.is_active ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(service.id)}
                                className="flex-1 sm:flex-none"
                              >
                                <Trash2 className="h-4 w-4 text-destructive sm:mr-0" />
                                <span className="sm:hidden ml-1">Delete</span>
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
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <div className="space-y-6">
              {/* Active Opportunities */}
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Active Opportunities</CardTitle>
                  <CardDescription>Customers who selected your services - respond quickly to win the booking!</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.filter(b => !b.matched_supplier_id && !declinedBookings.includes(b.id)).length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No active opportunities</p>
                    </div>
                  ) : (
                  <div className="space-y-3 sm:space-y-4">
                      {bookings.filter(b => !b.matched_supplier_id && !declinedBookings.includes(b.id)).map((booking) => (
                        <Card key={booking.id} className="border-primary/20 bg-primary/5">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">New Opportunity</Badge>
                                </div>
                                <p className="font-semibold text-sm sm:text-base text-foreground">{booking.customer_name}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">{booking.phone}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground break-all">{booking.email}</p>
                                <p className="text-xs sm:text-sm text-foreground mt-2">
                                  <span className="font-medium">Date:</span> {new Date(booking.event_date).toLocaleDateString()}
                                </p>
                                <p className="text-xs sm:text-sm text-foreground">
                                  <span className="font-medium">Address:</span> {booking.address}
                                </p>
                                {booking.event_type && (
                                  <p className="text-xs sm:text-sm text-foreground">
                                    <span className="font-medium">Type:</span> {booking.event_type}
                                  </p>
                                )}
                                {booking.notes && (
                                  <p className="text-xs sm:text-sm text-muted-foreground mt-2 italic">"{booking.notes}"</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleAcceptBooking(booking.id)}
                                  size="sm"
                                  className="bg-accent hover:bg-accent/90 flex-1 sm:flex-none"
                                >
                                  <Check className="mr-1 h-4 w-4" />
                                  Accept
                                </Button>
                                <Button
                                  onClick={() => handleDeclineBooking(booking.id)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <XCircle className="mr-1 h-4 w-4" />
                                  Decline
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

              {/* Booking History */}
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Your Matched Bookings</CardTitle>
                  <CardDescription>Bookings where you were selected by the customer</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.filter(b => b.matched_supplier_id === supplier?.id).length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <p className="text-muted-foreground">No matched bookings yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {bookings.filter(b => b.matched_supplier_id === supplier?.id).map((booking) => (
                        <Card key={booking.id} className="border-border">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1 sm:mb-0">
                                  <p className="font-semibold text-sm sm:text-base text-foreground">{booking.customer_name}</p>
                                  <Badge className="sm:hidden" variant={
                                    booking.status === "Completed" ? "default" :
                                    booking.status === "Confirmed" ? "default" :
                                    booking.status === "New" ? "secondary" : "outline"
                                  }>
                                    {booking.status}
                                  </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground">{booking.phone}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground break-all">{booking.email}</p>
                                <p className="text-xs sm:text-sm text-foreground mt-2">
                                  <span className="font-medium">Date:</span> {new Date(booking.event_date).toLocaleDateString()}
                                </p>
                                <p className="text-xs sm:text-sm text-foreground">
                                  <span className="font-medium">Address:</span> {booking.address}
                                </p>
                                {booking.notes && (
                                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">{booking.notes}</p>
                                )}
                              </div>
                              <Badge className="hidden sm:inline-flex" variant={
                                booking.status === "Completed" ? "default" :
                                booking.status === "Confirmed" ? "default" :
                                booking.status === "New" ? "secondary" : "outline"
                              }>
                                {booking.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
                <CardDescription>See what your clients say</CardDescription>
              </CardHeader>
                <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-muted-foreground">No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id} className="border-border">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                                {review.customer_name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                                <p className="font-semibold text-sm sm:text-base text-foreground truncate">{review.customer_name}</p>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                        i < review.rating
                                          ? "fill-primary text-primary"
                                          : "text-muted-foreground/30"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                              {review.comment && (
                                <p className="text-xs sm:text-sm text-foreground mt-2">{review.comment}</p>
                              )}
                            </div>
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

      {/* Image Crop Dialog */}
      {imageToCrop && (
        <ImageCropDialog
          image={imageToCrop}
          open={cropDialogOpen}
          onClose={() => {
            setCropDialogOpen(false);
            setImageToCrop(null);
          }}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}
    </div>
  );
};

export default SupplierDashboard;
