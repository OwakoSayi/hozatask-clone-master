import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Menu, X } from "lucide-react";

export const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isSupplier, setIsSupplier] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    navigate("/");
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1
          className="text-xl md:text-2xl font-bold text-primary cursor-pointer"
          onClick={() => navigate("/")}
        >
          HozaTask
        </h1>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-3 items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate("/browse")}>
            Browse Services
          </Button>
          {user && isSupplier && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/supplier-dashboard")}>
              My Dashboard
            </Button>
          )}
          {user && !isSupplier && (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/my-account")}>
                My Account
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/supplier-submission")}>
                List a Service
              </Button>
            </>
          )}
          {user ? (
            <Button size="sm" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate("/auth")}>
              Login
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background py-4 px-4 space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            onClick={() => { navigate("/browse"); setMobileMenuOpen(false); }}
          >
            Browse Services
          </Button>
          {user && isSupplier && (
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => { navigate("/supplier-dashboard"); setMobileMenuOpen(false); }}
            >
              My Dashboard
            </Button>
          )}
          {user && !isSupplier && (
            <>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => { navigate("/my-account"); setMobileMenuOpen(false); }}
              >
                My Account
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => { navigate("/supplier-submission"); setMobileMenuOpen(false); }}
              >
                List a Service
              </Button>
            </>
          )}
          {user ? (
            <Button className="w-full" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Button className="w-full" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}>
              Login
            </Button>
          )}
        </div>
      )}
    </header>
  );
};
