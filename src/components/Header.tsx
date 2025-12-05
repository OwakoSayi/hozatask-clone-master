import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "./ui/sheet";

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

  const NavItems = () => (
    <>
      <Button variant="ghost" onClick={() => handleNavigate("/browse")} className="w-full md:w-auto justify-start md:justify-center">
        Browse Services
      </Button>
      {!isSupplier && (
        <Button variant="outline" size="sm" onClick={() => handleNavigate("/supplier-submission")} className="w-full md:w-auto">
          List Your Service
        </Button>
      )}
      {user && isSupplier && (
        <Button variant="ghost" onClick={() => handleNavigate("/supplier-dashboard")} className="w-full md:w-auto justify-start md:justify-center">
          My Dashboard
        </Button>
      )}
      {user && !isSupplier && (
        <Button variant="ghost" onClick={() => handleNavigate("/my-account")} className="w-full md:w-auto justify-start md:justify-center">
          My Account
        </Button>
      )}
      {user ? (
        <Button onClick={handleLogout} className="w-full md:w-auto">
          Logout
        </Button>
      ) : (
        <Button onClick={() => handleNavigate("/auth")} className="w-full md:w-auto">
          Login
        </Button>
      )}
    </>
  );

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1
          className="text-2xl font-bold text-primary cursor-pointer"
          onClick={() => navigate("/")}
        >
          HozaTask
        </h1>
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="flex gap-4 items-center">
            <NavItems />
          </nav>
        )}

        {/* Mobile Hamburger Menu */}
        {isMobile && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background">
              <nav className="flex flex-col gap-4 mt-8">
                <NavItems />
              </nav>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  );
};
