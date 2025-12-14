import { useNavigate } from "react-router-dom";
import { 
  Zap, 
  Briefcase, 
  Calendar, 
  Star, 
  MessageSquare,
  CreditCard,
  User,
  BadgeCheck
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProSidebarProps {
  supplier: {
    business_name: string;
    contact_name: string;
    images: string[] | null;
    category: string;
  } | null;
  credits: number;
  leadsCount: number;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: "leads", title: "Leads", icon: Zap },
  { id: "services", title: "Services", icon: Briefcase },
  { id: "bookings", title: "Bookings", icon: Calendar },
  { id: "reviews", title: "Reviews", icon: Star },
  { id: "verifications", title: "Verifications", icon: BadgeCheck },
  { id: "profile", title: "Profile", icon: User },
];

export function ProSidebar({ 
  supplier, 
  credits, 
  leadsCount, 
  activeSection, 
  onSectionChange 
}: ProSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  
  const profileImage = supplier?.images?.[0] || "/placeholder.svg";
  const initials = supplier?.business_name?.substring(0, 2).toUpperCase() || "PR";

  return (
    <Sidebar 
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarContent>
        {/* Profile Header */}
        {!collapsed && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={profileImage} alt={supplier?.business_name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{supplier?.business_name}</p>
                <p className="text-xs text-muted-foreground truncate">{supplier?.category}</p>
              </div>
            </div>
            
            {/* Credits Display */}
            <div className="mt-4 flex items-center justify-between bg-primary/10 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{credits} credits</span>
              </div>
              <button 
                onClick={() => navigate("/buy-credits")}
                className="text-xs text-primary hover:underline"
              >
                Buy more
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={activeSection === item.id}
                    onClick={() => onSectionChange(item.id)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && (
                      <>
                        <span>{item.title}</span>
                        {item.id === "leads" && leadsCount > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {leadsCount}
                          </Badge>
                        )}
                      </>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/messages")} tooltip="Messages">
                  <MessageSquare className="h-4 w-4" />
                  {!collapsed && <span>Messages</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/buy-credits")} tooltip="Buy Credits">
                  <CreditCard className="h-4 w-4" />
                  {!collapsed && <span>Buy Credits</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
