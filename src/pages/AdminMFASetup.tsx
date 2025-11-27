import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const AdminMFASetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/admin/login");
        return;
      }

      // Check if MFA is already enrolled
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors && factors.totp && factors.totp.length > 0) {
        navigate("/admin");
        return;
      }

      // Enroll for MFA
      await enrollMFA();
    } catch (error: any) {
      console.error("MFA check error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const enrollMFA = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Admin 2FA",
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      }
    } catch (error: any) {
      console.error("Enrollment error:", error);
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const verifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (!factors.data?.totp?.[0]?.id) {
        throw new Error("No factor found");
      }

      const factorId = factors.data.totp[0].id;

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Two-factor authentication is now enabled",
      });

      navigate("/admin");
    } catch (error: any) {
      console.error("Verification error:", error);
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (enrolling) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Set Up Two-Factor Authentication</CardTitle>
          <CardDescription className="text-center">
            Scan the QR code with Google Authenticator or Authy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {qrCode && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Or enter this code manually:
                </p>
                <code className="text-xs bg-muted px-3 py-2 rounded">
                  {secret}
                </code>
              </div>
            </div>
          )}

          <form onSubmit={verifyMFA} className="space-y-4">
            <div>
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                required
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                pattern="[0-9]{6}"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify and Enable 2FA"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMFASetup;
