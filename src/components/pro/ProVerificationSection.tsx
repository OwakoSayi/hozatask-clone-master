import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Award, 
  FileCheck, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { VerificationBadges } from "./VerificationBadges";

interface ProVerificationSectionProps {
  proAccount: {
    id: string;
    verification_status: "none" | "pending" | "verified" | "top_pro";
    license_verified: boolean;
    background_check_completed: boolean;
    total_hires: number;
    response_rate: number;
  } | null;
  supplierYearsInBusiness: number | null;
  onRefresh: () => void;
}

export function ProVerificationSection({ 
  proAccount, 
  supplierYearsInBusiness,
  onRefresh 
}: ProVerificationSectionProps) {
  const { toast } = useToast();
  const [requestingVerification, setRequestingVerification] = useState<string | null>(null);

  const verificationStatus = proAccount?.verification_status || "none";
  const licenseVerified = proAccount?.license_verified || false;
  const backgroundCheckCompleted = proAccount?.background_check_completed || false;

  const verificationItems = [
    {
      id: "license",
      title: "License Verification",
      description: "Upload your professional license or certification to be verified. Takes 1-2 business days.",
      icon: FileCheck,
      completed: licenseVerified,
      pending: false,
      benefits: ["Build customer trust", "Stand out from competition", "Required for some categories"],
      action: "Request Verification",
    },
    {
      id: "background",
      title: "Background Check",
      description: "Complete a background verification to show customers you're trustworthy. Takes a few days to a week.",
      icon: Shield,
      completed: backgroundCheckCompleted,
      pending: false,
      benefits: ["Increases hire rate by 40%", "Required for home services", "Customer peace of mind"],
      action: "Start Background Check",
    },
    {
      id: "verified",
      title: "Verified Business",
      description: "Get verified by confirming your business details, identity, and years in operation.",
      icon: CheckCircle2,
      completed: verificationStatus === "verified" || verificationStatus === "top_pro",
      pending: verificationStatus === "pending",
      benefits: ["Blue verified badge", "Higher search ranking", "Priority support"],
      action: verificationStatus === "pending" ? "Pending Review" : "Get Verified",
    },
  ];

  // Calculate Top Pro eligibility
  const totalHires = proAccount?.total_hires || 0;
  const responseRate = proAccount?.response_rate || 0;
  const yearsInBusiness = supplierYearsInBusiness || 0;
  
  const topProRequirements = [
    { label: "10+ completed hires", met: totalHires >= 10, current: totalHires },
    { label: "90%+ response rate", met: responseRate >= 90, current: responseRate },
    { label: "2+ years in business", met: yearsInBusiness >= 2, current: yearsInBusiness },
    { label: "Verified business status", met: verificationStatus === "verified" || verificationStatus === "top_pro", current: verificationStatus },
  ];
  
  const topProProgress = (topProRequirements.filter(r => r.met).length / topProRequirements.length) * 100;
  const isTopPro = verificationStatus === "top_pro";

  const handleRequestVerification = async (type: string) => {
    setRequestingVerification(type);
    
    try {
      // In a real app, this would trigger an email to admin or open a form
      // For now, we'll just show a toast with next steps
      
      switch (type) {
        case "license":
          toast({
            title: "License Verification Request",
            description: "Please email your license documents to verify@example.com. We'll review within 1-2 business days.",
          });
          break;
        case "background":
          toast({
            title: "Background Check",
            description: "We'll email you a link to complete your background check. This typically takes a few days.",
          });
          break;
        case "verified":
          if (!proAccount) return;
          
          // Request verified status
          const { error } = await supabase
            .from("pro_accounts")
            .update({ verification_status: "pending" })
            .eq("id", proAccount.id);
          
          if (error) throw error;
          
          toast({
            title: "Verification Requested",
            description: "We're reviewing your business details. You'll be notified once verified.",
          });
          onRefresh();
          break;
      }
    } catch (error) {
      console.error("Verification request error:", error);
      toast({
        title: "Error",
        description: "Failed to request verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRequestingVerification(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Badges Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Your Verification Badges
          </CardTitle>
          <CardDescription>
            Badges help build trust with customers and increase your visibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(licenseVerified || backgroundCheckCompleted || verificationStatus !== "none") ? (
            <div className="flex flex-wrap gap-3">
              <VerificationBadges
                verificationStatus={verificationStatus}
                licenseVerified={licenseVerified}
                backgroundCheckCompleted={backgroundCheckCompleted}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No verification badges yet. Complete verifications below to earn badges and boost your profile.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Options */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {verificationItems.map((item) => (
          <Card 
            key={item.id} 
            className={item.completed ? "border-green-200 bg-green-50/50" : ""}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${item.completed ? "bg-green-100" : "bg-muted"}`}>
                  <item.icon className={`h-5 w-5 ${item.completed ? "text-green-600" : "text-muted-foreground"}`} />
                </div>
                {item.completed && (
                  <Badge className="bg-green-500">Completed</Badge>
                )}
                {item.pending && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg mt-3">{item.title}</CardTitle>
              <CardDescription className="text-sm">
                {item.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 mb-4">
                {item.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
              {!item.completed && !item.pending && (
                <Button 
                  className="w-full" 
                  variant={item.id === "verified" ? "default" : "outline"}
                  onClick={() => handleRequestVerification(item.id)}
                  disabled={requestingVerification === item.id}
                >
                  {requestingVerification === item.id ? "Processing..." : item.action}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {item.pending && (
                <Button className="w-full" variant="outline" disabled>
                  <Clock className="mr-2 h-4 w-4" />
                  Under Review
                </Button>
              )}
              {item.completed && (
                <Button className="w-full" variant="outline" disabled>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  Verified
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Pro Section */}
      <Card className={isTopPro ? "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50" : ""}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isTopPro ? "bg-gradient-to-br from-amber-400 to-yellow-500" : "bg-muted"}`}>
              <Award className={`h-6 w-6 ${isTopPro ? "text-white" : "text-muted-foreground"}`} />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Top Pro Status
                {isTopPro && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                    Earned!
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isTopPro 
                  ? "Congratulations! You're a Top Pro with premium visibility."
                  : "Earn Top Pro status for maximum visibility and premium features"
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isTopPro && (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress to Top Pro</span>
                  <span className="font-medium">{Math.round(topProProgress)}%</span>
                </div>
                <Progress value={topProProgress} className="h-2" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {topProRequirements.map((req, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      req.met ? "bg-green-50 border border-green-200" : "bg-muted/50"
                    }`}
                  >
                    {req.met ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${req.met ? "text-green-700" : "text-muted-foreground"}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
          {isTopPro && (
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                🏆 Priority in search results
              </Badge>
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                ⭐ Featured pro badge
              </Badge>
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                📞 Priority support
              </Badge>
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                💰 Lower lead costs
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
