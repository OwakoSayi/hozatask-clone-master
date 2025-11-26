import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckCircle } from "lucide-react";

const BookingConfirmation = () => {
  const navigate = useNavigate();

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
