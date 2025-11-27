import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

export const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isSupplier, setIsSupplier] = useState(false);

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
      .single();
    
    setIsSupplier(!!data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/");
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1
          className="text-2xl font-bold text-primary cursor-pointer"
          onClick={() => navigate("/")}
        >
          HozaTask
        </h1>
        <nav className="flex gap-4 items-center">
          <Button variant="ghost" onClick={() => navigate("/browse")}>
            Browse Services
          </Button>
          <Button variant="ghost" onClick={() => navigate("/suppliers")}>
            Suppliers
          </Button>
          {!user && (
            <Button variant="ghost" onClick={() => navigate("/supplier-submission")}>
              List Service
            </Button>
          )}
          {user && isSupplier && (
            <Button variant="ghost" onClick={() => navigate("/supplier-dashboard")}>
              My Dashboard
            </Button>
          )}
          {user && !isSupplier && (
            <Button variant="ghost" onClick={() => navigate("/my-account")}>
              My Account
            </Button>
          )}
          {user ? (
            <Button onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <Button onClick={() => navigate("/auth")}>
              Login
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};
