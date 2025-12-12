import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    
    if (!reference) {
      setStatus('error');
      setMessage('No payment reference found');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setStatus('error');
        setMessage('Please log in to verify your payment');
        return;
      }

      // Process the payment
      const { data, error } = await supabase.functions.invoke('process-credit-purchase', {
        body: {
          reference,
          user_id: session.user.id,
        }
      });

      if (error || !data?.success) {
        console.error("Payment verification failed:", error || data);
        setStatus('error');
        setMessage(data?.message || 'Payment verification failed');
        return;
      }

      setStatus('success');
      setDetails(data);
      
      if (data.type === 'credits') {
        setMessage(`Successfully added ${data.credits_added} credits to your account!`);
        toast({
          title: "Payment Successful",
          description: `${data.credits_added} credits added. New balance: ${data.new_balance}`,
        });
      } else if (data.type === 'subscription') {
        setMessage(`Successfully subscribed to ${data.plan} plan!`);
        toast({
          title: "Subscription Activated",
          description: `Your ${data.plan} plan is now active`,
        });
      }

      // Clear session storage
      sessionStorage.removeItem('pendingCreditPurchase');
      sessionStorage.removeItem('pendingSubscription');

    } catch (error) {
      console.error("Error verifying payment:", error);
      setStatus('error');
      setMessage('An error occurred while verifying your payment');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'verifying' && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-4" />
              <CardTitle>Verifying Payment...</CardTitle>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-primary">Payment Successful!</CardTitle>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <CardTitle className="text-destructive">Payment Failed</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {status === 'success' && details && (
            <div className="bg-muted p-4 rounded-lg text-left space-y-2">
              {details.type === 'credits' && (
                <>
                  <p className="flex justify-between">
                    <span>Credits Added:</span>
                    <span className="font-semibold text-primary">+{details.credits_added}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>New Balance:</span>
                    <span className="font-semibold">{details.new_balance} credits</span>
                  </p>
                </>
              )}
              {details.type === 'subscription' && (
                <>
                  <p className="flex justify-between">
                    <span>Plan:</span>
                    <span className="font-semibold capitalize">{details.plan}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Valid Until:</span>
                    <span className="font-semibold">
                      {new Date(details.expires_at).toLocaleDateString()}
                    </span>
                  </p>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-center pt-4">
            {status === 'success' && (
              <Button onClick={() => navigate('/leads')} className="flex-1">
                View Leads
              </Button>
            )}
            {status === 'error' && (
              <Button onClick={() => navigate('/buy-credits')} variant="outline" className="flex-1">
                Try Again
              </Button>
            )}
            <Button 
              variant={status === 'success' ? 'outline' : 'default'} 
              onClick={() => navigate('/pro-dashboard')}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;
