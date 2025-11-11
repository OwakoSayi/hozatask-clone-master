import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-primary cursor-pointer" onClick={() => navigate("/")}>
              HozaTask
            </h1>
            <nav className="hidden md:flex items-center gap-6">
              {user && (
                <>
                  <button onClick={() => navigate("/browse")} className="text-sm font-medium hover:text-primary transition-colors">
                    Browse
                  </button>
                  <button onClick={() => navigate("/dashboard")} className="text-sm font-medium hover:text-primary transition-colors">
                    Dashboard
                  </button>
                  <button onClick={() => navigate("/tasker-profile")} className="text-sm font-medium hover:text-primary transition-colors">
                    My Services
                  </button>
                </>
              )}
              {!user && (
                <>
                  <button onClick={() => navigate("/services")} className="text-sm font-medium hover:text-primary transition-colors">
                    Services
                  </button>
                  <button onClick={() => navigate("/how-it-works")} className="text-sm font-medium hover:text-primary transition-colors">
                    How it Works
                  </button>
                  <button onClick={() => navigate("/become-tasker")} className="text-sm font-medium hover:text-primary transition-colors">
                    Become a Tasker
                  </button>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  Welcome back!
                </span>
                <Button variant="ghost" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
                <Button variant="hero" onClick={() => navigate("/auth")}>
                  Sign Up
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
