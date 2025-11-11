import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, XCircle, FileText, Home } from "lucide-react";
import { Header } from "@/components/Header";

interface Verification {
  id: string;
  tasker_id: string;
  id_document_url: string;
  proof_of_address_url: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province: string;
  };
}

const AdminVerifications = () => {
  const navigate = useNavigate();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin" as any)
        .single();

      if (!roles) {
        toast.error("Access denied. Admin only.");
        navigate("/browse");
        return;
      }

      setIsAdmin(true);
      loadVerifications();
    } catch (error) {
      console.error("Access check error:", error);
      navigate("/browse");
    }
  };

  const loadVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from("tasker_verifications" as any)
        .select(`
          *,
          profiles:tasker_id (
            full_name,
            phone,
            address,
            city,
            province
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVerifications((data || []) as any);
    } catch (error: any) {
      toast.error("Failed to load verifications");
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (verificationId: string, taskerId: string, status: "approved" | "rejected") => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error: verificationError } = await supabase
        .from("tasker_verifications" as any)
        .update({
          status: status as any,
          admin_notes: adminNotes[verificationId] || null,
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", verificationId);

      if (verificationError) throw verificationError;

      // Update all tasks for this tasker
      const { error: tasksError } = await supabase
        .from("tasks")
        .update({ verification_status: status as any } as any)
        .eq("tasker_id", taskerId);

      if (tasksError) throw tasksError;

      toast.success(`Application ${status}!`);
      loadVerifications();
    } catch (error: any) {
      toast.error("Failed to update verification");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold mb-8">Tasker Verification Center</h1>

        {verifications.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No pending verifications</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {verifications.map((verification) => (
              <Card key={verification.id} className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">{verification.profiles.full_name}</h3>
                      <Badge variant={
                        verification.status === "approved" ? "default" :
                        verification.status === "rejected" ? "destructive" : "secondary"
                      }>
                        {verification.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p><strong>Phone:</strong> {verification.profiles.phone}</p>
                      <p><strong>Address:</strong> {verification.profiles.address}</p>
                      <p><strong>City:</strong> {verification.profiles.city}</p>
                      <p><strong>Province:</strong> {verification.profiles.province}</p>
                      <p><strong>Applied:</strong> {new Date(verification.created_at).toLocaleDateString()}</p>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(verification.id_document_url, "_blank")}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View ID Document
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(verification.proof_of_address_url, "_blank")}
                      >
                        <Home className="mr-2 h-4 w-4" />
                        View Proof of Address
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`notes-${verification.id}`}>Admin Notes</Label>
                    <Textarea
                      id={`notes-${verification.id}`}
                      className="mt-2 mb-4"
                      placeholder="Add notes about background check, ID verification, etc..."
                      value={adminNotes[verification.id] || verification.admin_notes || ""}
                      onChange={(e) => setAdminNotes({ ...adminNotes, [verification.id]: e.target.value })}
                      disabled={verification.status !== "pending"}
                    />

                    {verification.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => handleVerification(verification.id, verification.tasker_id, "approved")}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleVerification(verification.id, verification.tasker_id, "rejected")}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {verification.admin_notes && verification.status !== "pending" && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Review Notes:</p>
                        <p className="text-sm text-muted-foreground">{verification.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminVerifications;
