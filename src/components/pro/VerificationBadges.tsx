import { Badge } from "@/components/ui/badge";
import { Shield, Award, FileCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBadgesProps {
  verificationStatus: "none" | "pending" | "verified" | "top_pro";
  licenseVerified: boolean;
  backgroundCheckCompleted: boolean;
  compact?: boolean;
  showLabels?: boolean;
}

export function VerificationBadges({
  verificationStatus,
  licenseVerified,
  backgroundCheckCompleted,
  compact = false,
  showLabels = true,
}: VerificationBadgesProps) {
  const badges = [];

  // Top Pro badge (highest tier)
  if (verificationStatus === "top_pro") {
    badges.push({
      icon: Award,
      label: "Top Pro",
      variant: "default" as const,
      className: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 hover:from-amber-600 hover:to-yellow-600",
      description: "Top rated professional with excellent track record",
    });
  }

  // Verified Business badge
  if (verificationStatus === "verified" || verificationStatus === "top_pro") {
    badges.push({
      icon: CheckCircle2,
      label: "Verified",
      variant: "default" as const,
      className: "bg-blue-500 text-white border-0 hover:bg-blue-600",
      description: "Verified business identity",
    });
  }

  // License Verified badge
  if (licenseVerified) {
    badges.push({
      icon: FileCheck,
      label: "Licensed",
      variant: "outline" as const,
      className: "border-green-500 text-green-600 bg-green-50 hover:bg-green-100",
      description: "Professional license verified",
    });
  }

  // Background Check badge
  if (backgroundCheckCompleted) {
    badges.push({
      icon: Shield,
      label: "Background Check",
      variant: "outline" as const,
      className: "border-purple-500 text-purple-600 bg-purple-50 hover:bg-purple-100",
      description: "Passed background verification",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", compact ? "gap-1" : "gap-2")}>
      {badges.map((badge, index) => (
        <Badge
          key={index}
          variant={badge.variant}
          className={cn(
            "flex items-center gap-1 transition-colors",
            compact ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1",
            badge.className
          )}
          title={badge.description}
        >
          <badge.icon className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
          {showLabels && <span>{badge.label}</span>}
        </Badge>
      ))}
    </div>
  );
}
