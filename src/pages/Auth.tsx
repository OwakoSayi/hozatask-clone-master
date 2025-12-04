import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    // Handle incoming recovery tokens in Auth page
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    if (params.get("type") === "recovery") {
      // This is a password reset link
      console.log("Recovery token detected in Auth page");
      // Store the email if available
      const storedEmail = localStorage.getItem("reset_email");
      if (storedEmail) {
        setEmail(storedEmail);
      }
      // Navigate to reset password
      navigate("/reset-password");
    }
  }, [navigate]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const returnTo = (location.state as any)?.returnTo || "/";
        navigate(returnTo, { state: location.state });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const returnTo = (location.state as any)?.returnTo || "/";
        navigate(returnTo, { state: location.state });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Login Failed",
            description: "Invalid email or password. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const validatePhoneE164 = (phoneNumber: string): boolean => {
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    return e164Regex.test(phoneNumber);
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!otpSent) {
        if (!validatePhoneE164(phone)) {
          toast({
            title: "Invalid Phone Number",
            description: "Please enter a valid phone number with country code (e.g., +27123456789)",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithOtp({
          phone: phone,
        });

        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setOtpSent(true);
          toast({
            title: "OTP Sent",
            description: "Please check your phone for the verification code.",
          });
        }
      } else {
        const { error } = await supabase.auth.verifyOtp({
          phone: phone,
          token: otp,
          type: "sms",
        });

        if (error) {
          toast({
            title: "Verification Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Logged in successfully!",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMethod === "email") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
              phone: phone,
              address: address,
              city: city,
            },
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Please login instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Success",
            description: "Account created successfully! You can now login.",
          });
        }
      } else {
        if (!otpSent) {
          if (!validatePhoneE164(phone)) {
            toast({
              title: "Invalid Phone Number",
              description: "Please enter a valid phone number with country code (e.g., +27123456789)",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          if (!fullName.trim()) {
            toast({
              title: "Name Required",
              description: "Please enter your full name to sign up.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          const { error } = await supabase.auth.signInWithOtp({
            phone: phone,
            options: {
              data: {
                full_name: fullName,
                phone: phone,
                address: address,
                city: city,
              },
            },
          });

          if (error) {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          } else {
            setOtpSent(true);
            toast({
              title: "OTP Sent",
              description: "Please check your phone for the verification code.",
            });
          }
        } else {
          const { error } = await supabase.auth.verifyOtp({
            phone: phone,
            token: otp,
            type: "sms",
          });

          if (error) {
            toast({
              title: "Verification Failed",
              description: error.message,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Success",
              description: "Account created successfully!",
            });
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPhoneAuth = () => {
    setOtpSent(false);
    setOtp("");
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={authMethod === "email" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setAuthMethod("email");
                        resetPhoneAuth();
                      }}
                    >
                      Email
                    </Button>
                    <Button
                      type="button"
                      variant={authMethod === "phone" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setAuthMethod("phone");
                        resetPhoneAuth();
                      }}
                    >
                      Phone
                    </Button>
                  </div>

                  {authMethod === "email" ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handlePhoneLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-phone">Phone Number</Label>
                        <Input
                          id="login-phone"
                          type="tel"
                          placeholder="+27123456789"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          disabled={otpSent}
                        />
                        <p className="text-xs text-muted-foreground">
                          Include country code (e.g., +27 for South Africa)
                        </p>
                      </div>
                      {otpSent && (
                        <div className="space-y-2">
                          <Label htmlFor="login-otp">Verification Code</Label>
                          <Input
                            id="login-otp"
                            type="text"
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            maxLength={6}
                          />
                        </div>
                      )}
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Processing..." : otpSent ? "Verify Code" : "Send Code"}
                      </Button>
                      {otpSent && (
                        <Button type="button" variant="ghost" className="w-full text-sm" onClick={resetPhoneAuth}>
                          Change phone number
                        </Button>
                      )}
                    </form>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="signup">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={authMethod === "email" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setAuthMethod("email");
                        resetPhoneAuth();
                      }}
                    >
                      Email
                    </Button>
                    <Button
                      type="button"
                      variant={authMethod === "phone" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setAuthMethod("phone");
                        resetPhoneAuth();
                      }}
                    >
                      Phone
                    </Button>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>

                    {authMethod === "email" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-phone">Phone Number</Label>
                          <Input
                            id="signup-phone"
                            type="tel"
                            placeholder="+27123456789"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="signup-phone-auth">Phone Number</Label>
                          <Input
                            id="signup-phone-auth"
                            type="tel"
                            placeholder="+27123456789"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            disabled={otpSent}
                          />
                          <p className="text-xs text-muted-foreground">
                            Include country code (e.g., +27 for South Africa)
                          </p>
                        </div>
                        {otpSent && (
                          <div className="space-y-2">
                            <Label htmlFor="signup-otp">Verification Code</Label>
                            <Input
                              id="signup-otp"
                              type="text"
                              placeholder="123456"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              required
                              maxLength={6}
                            />
                          </div>
                        )}
                      </>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="signup-address">Address</Label>
                      <Input
                        id="signup-address"
                        type="text"
                        placeholder="123 Main Street"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-city">City</Label>
                      <Input
                        id="signup-city"
                        type="text"
                        placeholder="Johannesburg"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading
                        ? "Creating account..."
                        : authMethod === "phone" && otpSent
                          ? "Verify & Create Account"
                          : authMethod === "phone"
                            ? "Send Code"
                            : "Create Account"}
                    </Button>
                    {authMethod === "phone" && otpSent && (
                      <Button type="button" variant="ghost" className="w-full text-sm" onClick={resetPhoneAuth}>
                        Change phone number
                      </Button>
                    )}
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;
