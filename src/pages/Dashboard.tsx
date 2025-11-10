import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";

interface Booking {
  id: string;
  booking_date: string;
  hours: number;
  total_amount: number;
  status: string;
  notes: string | null;
  tasks: {
    title: string;
    location: string;
    hourly_rate: number;
  };
  client_profile: {
    full_name: string;
  };
  tasker_profile: {
    full_name: string;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [taskerBookings, setTaskerBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);

  const loadBookings = async () => {
    try {
      // Load bookings as client
      const { data: clientData, error: clientError } = await supabase
        .from("bookings")
        .select(`
          *,
          tasks(title, location, hourly_rate),
          tasker_profile:profiles!bookings_tasker_id_fkey(full_name),
          client_profile:profiles!bookings_client_id_fkey(full_name)
        `)
        .eq("client_id", user.id)
        .order("booking_date", { ascending: false });

      if (clientError) throw clientError;

      // Load bookings as tasker
      const { data: taskerData, error: taskerError } = await supabase
        .from("bookings")
        .select(`
          *,
          tasks(title, location, hourly_rate),
          client_profile:profiles!bookings_client_id_fkey(full_name),
          tasker_profile:profiles!bookings_tasker_id_fkey(full_name)
        `)
        .eq("tasker_id", user.id)
        .order("booking_date", { ascending: false });

      if (taskerError) throw taskerError;

      setMyBookings(clientData as any || []);
      setTaskerBookings(taskerData as any || []);
    } catch (error: any) {
      console.error("Error loading bookings:", error.message);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus as any })
        .eq("id", bookingId);

      if (error) throw error;

      toast.success(`Booking ${newStatus} successfully`);
      loadBookings();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: "secondary",
      accepted: "default",
      in_progress: "default",
      completed: "default",
      cancelled: "destructive",
    };

    return <Badge variant={variants[status] || "secondary"}>{status.replace("_", " ")}</Badge>;
  };

  const BookingCard = ({ booking, isTasker }: { booking: Booking; isTasker: boolean }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{booking.tasks.title}</CardTitle>
            <CardDescription>
              {isTasker ? `Client: ${booking.client_profile.full_name}` : `Tasker: ${booking.tasker_profile.full_name}`}
            </CardDescription>
          </div>
          {getStatusBadge(booking.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{new Date(booking.booking_date).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{booking.hours} hours</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">R{booking.total_amount}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{booking.tasks.location}</span>
          </div>
        </div>

        {booking.notes && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">{booking.notes}</p>
          </div>
        )}

        <div className="flex gap-2">
          {isTasker && booking.status === "pending" && (
            <>
              <Button
                size="sm"
                onClick={() => updateBookingStatus(booking.id, "accepted")}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateBookingStatus(booking.id, "cancelled")}
              >
                Decline
              </Button>
            </>
          )}
          {isTasker && booking.status === "accepted" && (
            <Button
              size="sm"
              onClick={() => updateBookingStatus(booking.id, "in_progress")}
            >
              Start Task
            </Button>
          )}
          {isTasker && booking.status === "in_progress" && (
            <Button
              size="sm"
              onClick={() => updateBookingStatus(booking.id, "completed")}
            >
              Mark Complete
            </Button>
          )}
          {!isTasker && booking.status === "completed" && (
            <Button
              size="sm"
              onClick={() => navigate(`/review/${booking.id}`)}
            >
              Leave Review
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">My Dashboard</h1>

          <Tabs defaultValue="client" className="w-full">
            <TabsList>
              <TabsTrigger value="client">My Bookings</TabsTrigger>
              <TabsTrigger value="tasker">Tasker Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="client" className="mt-6">
              {myBookings.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground mb-4">You haven't made any bookings yet.</p>
                    <Button onClick={() => navigate("/browse")}>Browse Services</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {myBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} isTasker={false} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasker" className="mt-6">
              {taskerBookings.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">No booking requests yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {taskerBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} isTasker={true} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}