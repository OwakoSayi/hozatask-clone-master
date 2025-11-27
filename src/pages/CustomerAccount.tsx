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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

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

export default function CustomerAccount() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<{ [key: string]: Review }>({});
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

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
    await fetchBookings(session.user.id);
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
      // Fetch existing reviews for these bookings
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">My Account</h1>
          <p className="text-muted-foreground mb-8">{user?.email}</p>

          <h2 className="text-2xl font-semibold mb-4">Booking History</h2>
          
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No bookings yet</p>
                <Button className="mt-4" onClick={() => navigate("/browse")}>
                  Browse Services
                </Button>
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
                          {new Date(booking.event_date).toLocaleDateString()} at {booking.event_time}
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
      </main>
      <Footer />
    </div>
  );
}