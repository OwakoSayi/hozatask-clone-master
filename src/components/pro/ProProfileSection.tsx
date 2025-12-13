import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Upload, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageCropDialog } from "@/components/ImageCropDialog";

interface Supplier {
  id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  whatsapp: string | null;
  description: string | null;
  images: string[] | null;
  location: string | null;
  category: string;
}

interface ProProfileSectionProps {
  supplier: Supplier;
  onRefresh: () => void;
}

export function ProProfileSection({ supplier, onRefresh }: ProProfileSectionProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    business_name: supplier.business_name,
    contact_name: supplier.contact_name,
    phone: supplier.phone,
    whatsapp: supplier.whatsapp || "",
    description: supplier.description || "",
    location: supplier.location || "",
    images: supplier.images?.join(", ") || "",
  });

  const profileImage = supplier.images?.[0] || "/placeholder.svg";
  const initials = supplier.business_name.substring(0, 2).toUpperCase();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      toast({ title: "Invalid file", description: "Please upload an image under 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleCropComplete = async (croppedImage: Blob) => {
    setUploadingImage(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const fileName = `${session.user.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedImage, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const currentImages = formData.images ? formData.images.split(',').map(s => s.trim()).filter(Boolean) : [];
      currentImages.unshift(publicUrl);
      setFormData({ ...formData, images: currentImages.join(', ') });

      toast({ title: "Success", description: "Photo uploaded" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload Failed", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const imagesArray = formData.images
        ? formData.images.split(",").map((url) => url.trim()).filter(Boolean)
        : [];

      const { error } = await supabase
        .from("suppliers")
        .update({
          business_name: formData.business_name,
          contact_name: formData.contact_name,
          phone: formData.phone,
          whatsapp: formData.whatsapp || null,
          description: formData.description || null,
          location: formData.location || null,
          images: imagesArray.length > 0 ? imagesArray : null,
        })
        .eq("id", supplier.id);

      if (error) throw error;

      toast({ title: "Success", description: "Profile updated" });
      setDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  const profileImagesArray = formData.images
    ? formData.images.split(",").map((url) => url.trim()).filter(Boolean)
    : supplier.images || [];
  const displayImage = profileImagesArray[0] || "/placeholder.svg";

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Manage your public profile information</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Your Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col items-center gap-4 py-4">
                    <Avatar className="h-24 w-24 border-2 border-primary/20">
                      <AvatarImage src={displayImage} alt={supplier.business_name} />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        disabled={uploadingImage}
                        className="hidden"
                      />
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
                    </div>
                  </div>
                  <div>
                    <Label>Business Name</Label>
                    <Input
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Your Name</Label>
                    <Input
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>WhatsApp</Label>
                      <Input
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>About Your Business</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label>Service Location</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Johannesburg, Gauteng"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6">
            <Avatar className="h-24 w-24 border-2 border-primary/20 flex-shrink-0">
              <AvatarImage src={profileImage} alt={supplier.business_name} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="text-xl font-semibold">{supplier.business_name}</h3>
                <p className="text-muted-foreground">{supplier.contact_name}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Phone:</span> {supplier.phone}
                </div>
                {supplier.whatsapp && (
                  <div>
                    <span className="text-muted-foreground">WhatsApp:</span> {supplier.whatsapp}
                  </div>
                )}
                {supplier.location && (
                  <div>
                    <span className="text-muted-foreground">Location:</span> {supplier.location}
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Category:</span> {supplier.category}
                </div>
              </div>
              {supplier.description && (
                <p className="text-sm">{supplier.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
    </>
  );
}
