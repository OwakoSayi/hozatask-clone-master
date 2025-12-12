import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, ChevronDown, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { CATEGORY_GROUPS, getCategoriesByGroup } from "@/config/categories";

export const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null);
  const [isSupplier, setIsSupplier] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkSupplierStatus(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkSupplierStatus(session.user.id);
      } else {
        setIsSupplier(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSupplierStatus = async (userId: string) => {
    const { data } = await supabase
      .from("suppliers")
      .select("status")
      .eq("user_id", userId)
      .eq("status", "Active")
      .maybeSingle();
    
    setIsSupplier(!!data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    setIsOpen(false);
    navigate("/");
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const MobileNav = () => (
    <div className="flex flex-col gap-2 mt-8">
      <Button variant="ghost" onClick={() => handleNavigate("/post-project")} className="w-full justify-start">
        Get Quotes
      </Button>
      <Button variant="ghost" onClick={() => handleNavigate("/pros")} className="w-full justify-start">
        Find Pros
      </Button>
      <Button variant="ghost" onClick={() => handleNavigate("/cost-guides")} className="w-full justify-start">
        Cost Guides
      </Button>
      
      <div className="border-t border-border my-4" />
      
      {!user && (
        <>
          <Button variant="ghost" onClick={() => handleNavigate("/become-pro")} className="w-full justify-start">
            Join as a pro
          </Button>
          <Button variant="outline" onClick={() => handleNavigate("/auth")} className="w-full">
            Sign up
          </Button>
          <Button onClick={() => handleNavigate("/auth")} className="w-full">
            Log in
          </Button>
        </>
      )}
      
      {user && isSupplier && (
        <>
          <Button variant="ghost" onClick={() => handleNavigate("/leads")} className="w-full justify-start">
            Leads
          </Button>
          <Button variant="ghost" onClick={() => handleNavigate("/pro-dashboard")} className="w-full justify-start">
            Dashboard
          </Button>
          <Button variant="ghost" onClick={() => handleNavigate("/buy-credits")} className="w-full justify-start">
            Buy Credits
          </Button>
        </>
      )}
      
      {user && (
        <>
          <Button variant="ghost" onClick={() => handleNavigate("/messages")} className="w-full justify-start">
            Messages
          </Button>
          {!isSupplier && (
            <>
              <Button variant="ghost" onClick={() => handleNavigate("/my-projects")} className="w-full justify-start">
                My Projects
              </Button>
              <Button variant="ghost" onClick={() => handleNavigate("/account")} className="w-full justify-start">
                Account
              </Button>
            </>
          )}
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            Log out
          </Button>
        </>
      )}
    </div>
  );

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <h1
          className="text-xl md:text-2xl font-bold text-foreground cursor-pointer"
          onClick={() => navigate("/")}
        >
          HozaTask<span className="text-primary">®</span>
        </h1>
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="flex items-center gap-2">
            {/* Explore Services Dropdown */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-muted">
                    Explore Services
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid grid-cols-3 gap-4 p-6 w-[600px]">
                      {CATEGORY_GROUPS.slice(0, 6).map((group) => (
                        <div key={group}>
                          <h4 className="font-semibold text-sm text-foreground mb-2">{group}</h4>
                          <ul className="space-y-1">
                            {getCategoriesByGroup(group).slice(0, 4).map((cat) => (
                              <li key={cat.slug}>
                                <button
                                  className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                                  onClick={() => handleNavigate(`/post-project?category=${encodeURIComponent(cat.name)}`)}
                                >
                                  {cat.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Join as a pro */}
            {!isSupplier && (
              <Button variant="ghost" onClick={() => handleNavigate("/become-pro")}>
                Join as a pro
              </Button>
            )}

            {/* Pro Links */}
            {user && isSupplier && (
              <>
                <Button variant="ghost" onClick={() => handleNavigate("/leads")}>
                  Leads
                </Button>
                <Button variant="ghost" onClick={() => handleNavigate("/pro-dashboard")}>
                  Dashboard
                </Button>
              </>
            )}

            {/* Auth Buttons */}
            {!user ? (
              <div className="flex items-center gap-2 ml-4">
                <Button variant="outline" onClick={() => handleNavigate("/auth")}>
                  Sign up
                </Button>
                <Button variant="ghost" onClick={() => handleNavigate("/auth")}>
                  Log in
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {!isSupplier && (
                    <>
                      <DropdownMenuItem onClick={() => handleNavigate("/my-projects")}>
                        My Projects
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleNavigate("/account")}>
                        Account
                      </DropdownMenuItem>
                    </>
                  )}
                  {isSupplier && (
                    <DropdownMenuItem onClick={() => handleNavigate("/buy-credits")}>
                      Buy Credits
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleNavigate("/messages")}>
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        )}

        {/* Mobile Hamburger Menu */}
        {isMobile && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background">
              <MobileNav />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  );
};
