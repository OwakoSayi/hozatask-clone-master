import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, DollarSign, Star, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [hours, setHours] = useState("1");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    if (user && id) {
      loadTask();
    }
  }, [user, id]);

  const loadTask = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          profiles!tasks_tasker_id_fkey(full_name, bio),
          categories(name, description)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setTask(data);
    } catch (error: any) {
      console.error("Error loading task:", error.message);
      toast.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate || !hours) {
      toast.error("Please fill in all required fields");
      return;
    }

    const hoursNum = parseFloat(hours);
    if (hoursNum <= 0) {
      toast.error("Hours must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      const totalAmount = hoursNum * parseFloat(task.hourly_rate);
      
      const { error } = await supabase.from("bookings").insert({
        task_id: task.id,
        client_id: user.id,
        tasker_id: task.tasker_id,
        booking_date: bookingDate,
        hours: hoursNum,
        total_amount: totalAmount,
        notes: notes || null,
      });

      if (error) throw error;

      toast.success("Booking request sent successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!task) {
    return <div className="min-h-screen flex items-center justify-center">Task not found</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-3xl">{task.title}</CardTitle>
                      <CardDescription className="text-lg mt-2">
                        {task.categories.name}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{task.description}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Hourly Rate</p>
                        <p className="font-semibold">${task.hourly_rate}/hour</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-semibold">{task.location}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      About the Tasker
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      <span className="font-medium">{task.profiles.full_name}</span>
                    </p>
                    {task.profiles.bio && (
                      <p className="text-sm text-muted-foreground">{task.profiles.bio}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Book This Service</CardTitle>
                  <CardDescription>Fill in the details to request a booking</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBooking} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Preferred Date & Time
                      </Label>
                      <Input
                        id="date"
                        type="datetime-local"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hours">Number of Hours</Label>
                      <Input
                        id="hours"
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any special requirements or details..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between mb-4">
                        <span className="text-muted-foreground">Estimated Total</span>
                        <span className="text-2xl font-bold">
                          ${(parseFloat(hours) * parseFloat(task.hourly_rate)).toFixed(2)}
                        </span>
                      </div>
                      <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? "Sending Request..." : "Request Booking"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}