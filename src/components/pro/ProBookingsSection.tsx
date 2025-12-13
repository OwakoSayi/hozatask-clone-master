import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, XCircle } from "lucide-react";

interface Booking {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  event_date: string;
  event_time: string | null;
  event_type: string | null;
  notes: string | null;
  status: string;
  matched_supplier_id: string | null;
  selected_option_ids: string[] | null;
}

interface ProBookingsSectionProps {
  bookings: Booking[];
  supplierId: string;
  supplierBusinessName: string;
  supplierPhone: string;
  onRefresh: () => void;
}

export function ProBookingsSection({
  bookings,
  supplierId,
  supplierBusinessName,
  supplierPhone,
  onRefresh,
}: ProBookingsSectionProps) {
  const { toast } = useToast();
  const [declinedBookings, setDeclinedBookings] = useState<string[]>([]);

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          matched_supplier_id: supplierId,
          matched_supplier_name: supplierBusinessName,
          matched_supplier_contact: supplierPhone,
          status: "Matched",
        })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking Accepted!",
        description: "Customer will be notified. Contact them to finalize details.",
      });
      onRefresh();
    } catch (error) {
      console.error("Error accepting booking:", error);
      toast({ title: "Error", description: "Failed to accept booking", variant: "destructive" });
    }
  };

  const handleDeclineBooking = (bookingId: string) => {
    if (!confirm("Decline this booking opportunity?")) return;
    setDeclinedBookings([...declinedBookings, bookingId]);
    toast({ title: "Booking Declined", description: "Removed from your list" });
  };

  const opportunities = bookings.filter(b => !b.matched_supplier_id && !declinedBookings.includes(b.id));
  const matchedBookings = bookings.filter(b => b.matched_supplier_id === supplierId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed": return "default";
      case "Matched": return "default";
      case "New": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Opportunities */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Active Opportunities</CardTitle>
          <CardDescription>Customers who selected your services</CardDescription>
        </CardHeader>
        <CardContent>
          {opportunities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No active opportunities</p>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((booking) => (
                <Card key={booking.id} className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <Badge variant="secondary" className="bg-primary/10 text-primary mb-2">
                          New Opportunity
                        </Badge>
                        <p className="font-semibold">{booking.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{booking.phone}</p>
                        {booking.email && (
                          <p className="text-sm text-muted-foreground">{booking.email}</p>
                        )}
                        <p className="text-sm mt-2">
                          <strong>Date:</strong> {new Date(booking.event_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm">
                          <strong>Address:</strong> {booking.address}
                        </p>
                        {booking.event_type && (
                          <p className="text-sm"><strong>Type:</strong> {booking.event_type}</p>
                        )}
                        {booking.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">"{booking.notes}"</p>
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

      {/* Matched Bookings */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Your Matched Bookings</CardTitle>
          <CardDescription>Bookings where you were selected</CardDescription>
        </CardHeader>
        <CardContent>
          {matchedBookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No matched bookings yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matchedBookings.map((booking) => (
                <Card key={booking.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{booking.customer_name}</p>
                          <Badge variant={getStatusBadge(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{booking.phone}</p>
                        <p className="text-sm mt-2">
                          <strong>Date:</strong> {new Date(booking.event_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm"><strong>Address:</strong> {booking.address}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
