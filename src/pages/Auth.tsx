import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isTasker, setIsTasker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [proofOfAddressFile, setProofOfAddressFile] = useState<File | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/browse");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/browse");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const uploadFile = async (file: File, bucket: string, userId: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!isTasker && (!phone || !address || !city)) {
      toast.error("Please fill in your contact details");
      return;
    }

    if (isTasker && (!phone || !address || !city || !idDocumentFile || !proofOfAddressFile)) {
      toast.error("Taskers must provide all verification documents");
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("User creation failed");

      const userId = data.user.id;
      let avatarUrl = null;

      if (avatarFile) {
        avatarUrl = await uploadFile(avatarFile, "avatars", userId);
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          full_name: fullName,
          phone,
          address,
          city,
          province,
          postal_code: postalCode,
          avatar_url: avatarUrl,
        });

      if (profileError) throw profileError;

      const role = isTasker ? "tasker" : "client";
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role,
        });

      if (roleError) throw roleError;

      if (isTasker && idDocumentFile && proofOfAddressFile) {
        const idDocUrl = await uploadFile(idDocumentFile, "verification-docs", userId);
        const proofAddressUrl = await uploadFile(proofOfAddressFile, "verification-docs", userId);

        const { error: verificationError } = await supabase
          .from("tasker_verifications" as any)
          .insert({
            tasker_id: userId,
            id_document_url: idDocUrl,
            proof_of_address_url: proofAddressUrl,
            status: "pending",
          });

        if (verificationError) throw verificationError;

        toast.success("Application submitted! You'll be notified once verified (24-48 hours for background checks).");
      } else {
        toast.success("Account created successfully! Welcome to HozaTask!");
      }

      navigate("/browse");
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success("Signed in successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Welcome to HozaTask</h1>
          <p className="text-muted-foreground">Join South Africa's trusted task marketplace</p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="flex items-center space-x-2 mb-4 p-4 bg-muted rounded-lg">
                <Checkbox
                  id="tasker-role"
                  checked={isTasker}
                  onCheckedChange={(checked) => setIsTasker(checked as boolean)}
                />
                <Label htmlFor="tasker-role" className="cursor-pointer font-medium">
                  I want to offer services as a Tasker
                </Label>
              </div>

              {isTasker && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tasker applications require verification including background checks. You'll need to provide ID and proof of address.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="fullname">Full Name *</Label>
                  <Input
                    id="fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="signup-email">Email *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="signup-password">Password *</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+27 XX XXX XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="postal">Postal Code</Label>
                  <Input
                    id="postal"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="avatar">Profile Picture (Optional)</Label>
                  <div className="mt-2">
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                {isTasker && (
                  <>
                    <div className="col-span-2">
                      <Label htmlFor="id-doc">ID or Passport Photo *</Label>
                      <div className="mt-2">
                        <Input
                          id="id-doc"
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => setIdDocumentFile(e.target.files?.[0] || null)}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="proof-address">Proof of Address *</Label>
                      <div className="mt-2">
                        <Input
                          id="proof-address"
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => setProofOfAddressFile(e.target.files?.[0] || null)}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : isTasker ? "Submit Tasker Application" : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;