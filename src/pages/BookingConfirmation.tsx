import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      const reference = searchParams.get('reference') || searchParams.get('trxref');
      const pendingBookingStr = sessionStorage.getItem('pendingBooking');

      // If no reference in URL, check if we have a booking ID in state (old flow)
      if (!reference && !pendingBookingStr) {
        setStatus('success');
        return;
      }

      // If we have a reference but no pending booking, show success (already processed)
      if (reference && !pendingBookingStr) {
        setStatus('success');
        return;
      }

      if (!pendingBookingStr) {
        setStatus('success');
        return;
      }

      try {
        const pendingBooking = JSON.parse(pendingBookingStr);

        // Verify payment with Paystack via edge function
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
          'verify-paystack-payment',
          {
            body: { reference: reference || pendingBooking.payment_reference },
          }
        );

        if (verifyError || !verifyData?.success) {
          throw new Error(verifyError?.message || verifyData?.message || "Payment verification failed");
        }

        // Create the booking
        const { error: bookingError } = await supabase
          .from("bookings")
          .insert({
            customer_name: pendingBooking.customer_name,
            phone: pendingBooking.phone,
            email: pendingBooking.email,
            address: pendingBooking.address,
            event_date: pendingBooking.event_date,
            event_time: pendingBooking.event_time,
            event_type: pendingBooking.event_type,
            notes: pendingBooking.notes,
            selected_option_ids: pendingBooking.selected_option_ids,
            booking_fee_paid: true,
            payment_intent_id: reference || pendingBooking.payment_reference,
            status: "New",
            user_id: pendingBooking.user_id,
          });

        if (bookingError) throw bookingError;

        // Clear pending booking
        sessionStorage.removeItem('pendingBooking');
        
        toast({
          title: "Success!",
          description: "Your booking has been confirmed",
        });

        setStatus('success');
      } catch (err) {
        console.error("Error processing payment:", err);
        setError(err instanceof Error ? err.message : "Failed to process payment");
        setStatus('error');
      }
    };

    processPayment();
  }, [searchParams, toast]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex-1 flex items-center justify-center">
          <Card className="max-w-2xl w-full">
            <CardContent className="py-12 text-center">
              <Loader2 className="w-20 h-20 text-primary mx-auto mb-6 animate-spin" />
              <h1 className="text-3xl font-bold mb-4 text-foreground">
                Processing Your Payment...
              </h1>
              <p className="text-muted-foreground text-lg">
                Please wait while we confirm your booking.
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex-1 flex items-center justify-center">
          <Card className="max-w-2xl w-full">
            <CardContent className="py-12 text-center">
              <XCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-4 text-foreground">
                Payment Failed
              </h1>
              <p className="text-muted-foreground mb-6 text-lg">
                {error || "We couldn't process your payment. Please try again."}
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => navigate("/")}>
                  Return to Home
                </Button>
                <Button onClick={() => navigate("/services")}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-16 flex-1 flex items-center justify-center">
        <Card className="max-w-2xl w-full">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4 text-foreground">
              Thank You! Your Booking is Confirmed
            </h1>
            <p className="text-muted-foreground mb-6 text-lg">
              We've received your booking request and payment.
            </p>
            <div className="bg-muted/30 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold mb-3 text-foreground">What Happens Next?</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ Our team is now contacting the suppliers you selected</li>
                <li>✓ Within 30-90 minutes, we will confirm the best available match</li>
                <li>✓ You'll receive their full contact details via SMS/WhatsApp</li>
                <li>✓ You can then coordinate final details directly with them</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              We'll send you an email confirmation shortly with all the details.
            </p>
            <Button size="lg" onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default BookingConfirmation;
