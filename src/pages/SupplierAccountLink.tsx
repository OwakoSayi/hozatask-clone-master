import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";

const SupplierAccountLink = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [unlinkableSuppliers, setUnlinkableSuppliers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Check if user already has a linked supplier account
    const { data: existingSupplier } = await supabase
      .from("suppliers")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "Active")
      .maybeSingle();

    if (existingSupplier) {
      navigate("/supplier-dashboard");
      return;
    }

    // Find suppliers without user_id that match the user's email
    const { data: suppliers } = await supabase
      .from("suppliers")
      .select("*")
      .is("user_id", null)
      .eq("status", "Active");

    setUnlinkableSuppliers(suppliers || []);
  };

  const handleLinkAccount = async (supplierId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("suppliers")
        .update({ user_id: user.id })
        .eq("id", supplierId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your supplier account has been linked successfully!",
      });

      navigate("/supplier-dashboard");
    } catch (error) {
      console.error("Error linking account:", error);
      toast({
        title: "Error",
        description: "Failed to link account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Find supplier by phone and business name
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("*")
        .eq("phone", phone)
        .ilike("business_name", businessName)
        .is("user_id", null)
        .eq("status", "Active")
        .maybeSingle();

      if (!supplier) {
        toast({
          title: "Not Found",
          description: "No matching supplier account found. Please check your details.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("suppliers")
        .update({ user_id: user.id })
        .eq("id", supplier.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your supplier account has been linked successfully!",
      });

      navigate("/supplier-dashboard");
    } catch (error) {
      console.error("Error linking account:", error);
      toast({
        title: "Error",
        description: "Failed to link account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12 flex-1 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Link Your Supplier Account</CardTitle>
            <CardDescription>
              Connect your login account to your approved supplier profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            {unlinkableSuppliers.length > 0 ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We found these approved supplier accounts. Is one of them yours?
                </p>
                <div className="space-y-3">
                  {unlinkableSuppliers.map((supplier) => (
                    <Card key={supplier.id} className="border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-foreground">{supplier.business_name}</h3>
                            <p className="text-sm text-muted-foreground">{supplier.contact_name}</p>
                            <p className="text-sm text-muted-foreground">{supplier.phone}</p>
                            <p className="text-sm text-muted-foreground">{supplier.category}</p>
                          </div>
                          <Button
                            onClick={() => handleLinkAccount(supplier.id)}
                            disabled={loading}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            This is my account
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or link manually
                  </span>
                </div>
              </div>

              <form onSubmit={handleManualLink} className="space-y-4 mt-6">
                <p className="text-sm text-muted-foreground">
                  If you don't see your account above, enter your supplier details to link it:
                </p>
                <div>
                  <Label htmlFor="phone">Phone Number (as registered)</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0123456789"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your Business Name"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Linking..." : "Link Account"}
                </Button>
              </form>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> You can only link accounts that have been approved by our admin team. 
                If you recently submitted your supplier application, please wait for approval first.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default SupplierAccountLink;
