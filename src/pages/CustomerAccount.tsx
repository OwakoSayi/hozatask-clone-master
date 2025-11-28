import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Star, Camera, Edit2, MapPin, Phone, Mail, User, CheckCircle2 } from "lucide-react";
import { ImageCropDialog } from "@/components/ImageCropDialog";

interface Booking {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  event_date: string;
  event_time: string;
  status: string;
  matched_supplier_name: string;
  matched_supplier_id: string;
  notes: string;
  created_at: string;
}

interface Review {
  id: string;
  booking_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  avatar_url?: string;
}

export default function CustomerAccount() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<{ [key: string]: Review }>({});
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    await Promise.all([
      fetchProfile(session.user.id),
      fetchBookings(session.user.id)
    ]);
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
      setEditedProfile(data);
    }
  };

  const fetchBookings = async (userId: string) => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } else {
      setBookings(data || []);
      if (data && data.length > 0) {
        const bookingIds = data.map(b => b.id);
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("*")
          .in("booking_id", bookingIds)
          .eq("customer_id", userId);
        
        if (reviewsData) {
          const reviewsMap: { [key: string]: Review } = {};
          reviewsData.forEach(review => {
            reviewsMap[review.booking_id] = review;
          });
          setReviews(reviewsMap);
        }
      }
    }
    
    setLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setShowImageCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageCropped = async (croppedImage: Blob) => {
    if (!user) return;

    try {
      const fileExt = "jpg";
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedImage, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast({
        title: "Success",
        description: "Profile picture updated",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to update profile picture",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!editedProfile || !user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editedProfile.full_name,
        phone: editedProfile.phone,
        address: editedProfile.address,
        city: editedProfile.city,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      setProfile(editedProfile);
      setIsEditMode(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedBooking || !user) return;

    const { error } = await supabase
      .from("reviews")
      .insert({
        booking_id: selectedBooking.id,
        supplier_id: selectedBooking.matched_supplier_id,
        customer_id: user.id,
        customer_name: selectedBooking.customer_name,
        rating: reviewRating,
        comment: reviewComment,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Review submitted successfully",
      });
      setReviewRating(5);
      setReviewComment("");
      setSelectedBooking(null);
      await fetchBookings(user.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500";
      case "Confirmed":
        return "bg-blue-500";
      case "New":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const calculateProfileCompleteness = () => {
    if (!profile) return 0;
    let completed = 0;
    let total = 5;
    
    if (profile.full_name) completed++;
    if (profile.phone) completed++;
    if (profile.address) completed++;
    if (profile.city) completed++;
    if (profile.avatar_url) completed++;
    
    return Math.round((completed / total) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-lg">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const completeness = calculateProfileCompleteness();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Profile Section */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>My Profile</CardTitle>
                  <CardDescription>Manage your account details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-4">
                    {/* Avatar */}
                    <div className="relative group">
                      <Avatar className="h-32 w-32">
                        <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                        <AvatarFallback className="text-3xl">
                          {profile?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <label
                        htmlFor="avatar-upload"
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                      >
                        <Camera className="h-8 w-8 text-white" />
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageSelect}
                        />
                      </label>
                    </div>

                    {/* Profile Completeness */}
                    <div className="w-full">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Profile Completeness</span>
                        <span className="font-semibold">{completeness}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                    </div>

                    {/* Profile Info */}
                    {isEditMode && editedProfile ? (
                      <div className="w-full space-y-4">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={editedProfile.full_name}
                            onChange={(e) =>
                              setEditedProfile({ ...editedProfile, full_name: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={editedProfile.phone}
                            onChange={(e) =>
                              setEditedProfile({ ...editedProfile, phone: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={editedProfile.address}
                            onChange={(e) =>
                              setEditedProfile({ ...editedProfile, address: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={editedProfile.city}
                            onChange={(e) =>
                              setEditedProfile({ ...editedProfile, city: e.target.value })
                            }
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveProfile} className="flex-1">
                            Save Changes
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditMode(false);
                              setEditedProfile(profile);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full space-y-3">
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-medium">{profile?.full_name}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-medium">{profile?.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="font-medium">{profile?.address}</p>
                            <p className="text-sm text-muted-foreground">{profile?.city}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full mt-4"
                          onClick={() => setIsEditMode(true)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Bookings</span>
                      <span className="font-semibold text-lg">{bookings.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Reviews Given</span>
                      <span className="font-semibold text-lg">{Object.keys(reviews).length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Completed</span>
                      <span className="font-semibold text-lg">
                        {bookings.filter(b => b.status === "Completed").length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bookings Section */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">Booking History</h2>
                  <p className="text-muted-foreground">Track and review your bookings</p>
                </div>
                <Button onClick={() => navigate("/browse")}>
                  New Booking
                </Button>
              </div>

              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">No bookings yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Start booking services to see your history here
                        </p>
                        <Button onClick={() => navigate("/browse")}>
                          Browse Services
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">
                              {booking.matched_supplier_name || "Pending Match"}
                            </CardTitle>
                            <CardDescription>
                              {new Date(booking.event_date).toLocaleDateString()} at {booking.event_time || "TBD"}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p><strong>Location:</strong> {booking.address}</p>
                          {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
                          <p className="text-xs text-muted-foreground">
                            Booked on {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        {booking.status === "Completed" && (
                          <div className="mt-4 pt-4 border-t">
                            {reviews[booking.id] ? (
                              <div className="bg-secondary/50 p-4 rounded-lg">
                                <div className="flex items-center gap-1 mb-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < reviews[booking.id].rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <p className="text-sm">{reviews[booking.id].comment}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Reviewed on {new Date(reviews[booking.id].created_at).toLocaleDateString()}
                                </p>
                              </div>
                            ) : (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    onClick={() => setSelectedBooking(booking)}
                                  >
                                    Leave a Review
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Leave a Review</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Rating</Label>
                                      <div className="flex gap-2 mt-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`h-8 w-8 cursor-pointer ${
                                              star <= reviewRating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                            onClick={() => setReviewRating(star)}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <Label htmlFor="comment">Comment</Label>
                                      <Textarea
                                        id="comment"
                                        placeholder="Share your experience..."
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        rows={4}
                                      />
                                    </div>
                                    <Button onClick={handleSubmitReview} className="w-full">
                                      Submit Review
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <ImageCropDialog
        image={selectedImage || ""}
        open={showImageCrop}
        onClose={() => {
          setShowImageCrop(false);
          setSelectedImage(null);
        }}
        onCropComplete={handleImageCropped}
        aspectRatio={1}
      />
    </div>
  );
}
