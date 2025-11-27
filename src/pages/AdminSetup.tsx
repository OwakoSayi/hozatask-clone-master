import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AdminSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Try to sign up first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      let userId: string;

      // If user already exists, try to sign in instead
      if (authError?.message?.includes("already registered")) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        if (!signInData.user) throw new Error("Failed to authenticate");
        
        userId = signInData.user.id;
      } else {
        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create user account");
        userId = authData.user.id;
      }

      // Use the secure function to add admin privileges
      const { error: rpcError } = await supabase.rpc("create_admin_user", {
        user_email: email,
        user_user_id: userId,
      });

      if (rpcError) throw rpcError;

      toast({
        title: "Admin Account Created!",
        description: "You can now log in to the admin dashboard",
      });

      // Sign out and redirect to login
      await supabase.auth.signOut();
      navigate("/admin/login");
    } catch (error: any) {
      console.error("Setup error:", error);
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Admin Setup</CardTitle>
          <CardDescription className="text-center">
            Create your admin account to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hozatask.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Admin Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
