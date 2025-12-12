import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Zap, Crown, Shield, Star } from "lucide-react";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  bonus_credits: number;
  is_popular: boolean;
}

interface SubscriptionPlan {
  id: string;
  plan: string;
  name: string;
  price_cents_monthly: number;
  leads_per_month: number | null;
  features: any;
}

interface ProAccount {
  credits: number;
  subscription_plan: string;
  subscription_expires_at: string | null;
}

const BuyCredits = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [proAccount, setProAccount] = useState<ProAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { state: { returnTo: "/buy-credits" } });
        return;
      }

      // Check if user is a supplier
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!supplier) {
        toast({
          title: "Not a Pro",
          description: "You need to be a registered pro to buy credits",
          variant: "destructive",
        });
        navigate("/supplier-submission");
        return;
      }

      // Load pro account
      const { data: account } = await supabase
        .from("pro_accounts")
        .select("credits, subscription_plan, subscription_expires_at")
        .eq("supplier_id", supplier.id)
        .maybeSingle();

      if (account) {
        setProAccount(account);
      }

      // Load packages
      const { data: packagesData } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("credits", { ascending: true });

      setPackages(packagesData || []);

      // Load subscription plans
      const { data: plansData } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price_cents_monthly", { ascending: true });

      setPlans(plansData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load pricing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = async (pkg: CreditPackage) => {
    setPurchasing(pkg.id);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Initialize Paystack payment
      const { data, error } = await supabase.functions.invoke('create-paystack-payment', {
        body: {
          email: session.user.email,
          amount: pkg.price_cents / 100,
          reference: `credits_${pkg.id}_${Date.now()}`,
          metadata: {
            type: 'credits',
            package_id: pkg.id,
            credits: pkg.credits + pkg.bonus_credits,
          }
        }
      });

      if (error || !data?.authorization_url) {
        throw new Error("Failed to initialize payment");
      }

      // Store purchase info for callback
      sessionStorage.setItem('pendingCreditPurchase', JSON.stringify({
        package_id: pkg.id,
        credits: pkg.credits + pkg.bonus_credits,
      }));

      window.location.href = data.authorization_url;
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to start payment",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setPurchasing(plan.id);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Initialize Paystack payment for subscription
      const { data, error } = await supabase.functions.invoke('create-paystack-payment', {
        body: {
          email: session.user.email,
          amount: plan.price_cents_monthly / 100,
          reference: `sub_${plan.plan}_${Date.now()}`,
          metadata: {
            type: 'subscription',
            plan: plan.plan,
            leads_per_month: plan.leads_per_month,
          }
        }
      });

      if (error || !data?.authorization_url) {
        throw new Error("Failed to initialize payment");
      }

      sessionStorage.setItem('pendingSubscription', JSON.stringify({
        plan: plan.plan,
        leads_per_month: plan.leads_per_month,
      }));

      window.location.href = data.authorization_url;
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to start payment",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Grow Your Business</h1>
            <p className="text-muted-foreground">
              Buy credits to respond to leads or subscribe for unlimited access
            </p>
            {proAccount && (
              <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                <Zap className="h-4 w-4" />
                <span className="font-semibold">{proAccount.credits} credits available</span>
              </div>
            )}
          </div>

          <Tabs defaultValue="credits" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="credits">Buy Credits</TabsTrigger>
              <TabsTrigger value="subscription">Subscribe</TabsTrigger>
            </TabsList>

            <TabsContent value="credits">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {packages.map((pkg) => (
                  <Card 
                    key={pkg.id} 
                    className={`relative ${pkg.is_popular ? 'border-primary shadow-lg' : ''}`}
                  >
                    {pkg.is_popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                        Most Popular
                      </Badge>
                    )}
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <div className="text-3xl font-bold mt-2">
                        R{(pkg.price_cents / 100).toFixed(0)}
                      </div>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <div>
                        <p className="text-2xl font-semibold text-primary">
                          {pkg.credits} credits
                        </p>
                        {pkg.bonus_credits > 0 && (
                          <p className="text-sm text-green-600">
                            +{pkg.bonus_credits} bonus credits!
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        R{((pkg.price_cents / 100) / (pkg.credits + pkg.bonus_credits)).toFixed(0)} per lead
                      </p>
                      <Button 
                        className="w-full" 
                        onClick={() => handleBuyCredits(pkg)}
                        disabled={purchasing === pkg.id}
                      >
                        {purchasing === pkg.id ? "Processing..." : "Buy Now"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="subscription">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id}
                    className={`relative ${plan.plan === 'pro' ? 'border-primary shadow-lg' : ''}`}
                  >
                    {plan.plan === 'pro' && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                        Best Value
                      </Badge>
                    )}
                    <CardHeader className="text-center pb-2">
                      <div className="flex justify-center mb-2">
                        {plan.plan === 'unlimited' ? (
                          <Crown className="h-8 w-8 text-yellow-500" />
                        ) : plan.plan === 'pro' ? (
                          <Star className="h-8 w-8 text-primary" />
                        ) : plan.plan === 'basic' ? (
                          <Zap className="h-8 w-8 text-blue-500" />
                        ) : (
                          <Shield className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <CardTitle>{plan.name}</CardTitle>
                      <div className="text-3xl font-bold mt-2">
                        R{(plan.price_cents_monthly / 100).toFixed(0)}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <p className="font-semibold text-primary">
                          {plan.leads_per_month === null ? 'Unlimited' : plan.leads_per_month} leads/month
                        </p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {plan.features?.instant_match && (
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Instant Match
                          </li>
                        )}
                        {plan.features?.priority_listing && (
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Priority Listing
                          </li>
                        )}
                        {plan.features?.verified_badge && (
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Verified Badge
                          </li>
                        )}
                        {plan.features?.top_pro_eligible && (
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Top Pro Eligible
                          </li>
                        )}
                      </ul>
                      <Button 
                        className="w-full" 
                        variant={plan.plan === 'free' ? 'outline' : 'default'}
                        onClick={() => plan.plan !== 'free' && handleSubscribe(plan)}
                        disabled={purchasing === plan.id || plan.plan === 'free' || proAccount?.subscription_plan === plan.plan}
                      >
                        {proAccount?.subscription_plan === plan.plan 
                          ? 'Current Plan' 
                          : plan.plan === 'free' 
                          ? 'Free' 
                          : purchasing === plan.id 
                          ? 'Processing...' 
                          : 'Subscribe'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BuyCredits;
