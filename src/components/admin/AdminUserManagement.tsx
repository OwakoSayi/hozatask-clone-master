import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, User, Mail, Phone, MapPin, Shield, ShieldOff } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  created_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  user_id: string;
}

interface AdminUserManagementProps {
  profiles: Profile[];
  adminUsers: AdminUser[];
  onRefresh: () => void;
}

const AdminUserManagement = ({ profiles, adminUsers, onRefresh }: AdminUserManagementProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredProfiles = profiles.filter((profile) =>
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.phone?.includes(searchTerm)
  );

  const isAdmin = (userId: string) => {
    return adminUsers.some((admin) => admin.user_id === userId);
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Find the user's profile by checking if any profile has this email linked
      // Note: This is a simplified approach - in production you'd query auth.users
      const { data: existingAdmin } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", newAdminEmail.trim())
        .maybeSingle();

      if (existingAdmin) {
        toast({
          title: "Already Admin",
          description: "This user is already an admin",
          variant: "destructive",
        });
        return;
      }

      // Insert new admin
      const { error } = await supabase
        .from("admin_users")
        .insert({ email: newAdminEmail.trim() });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin user added successfully",
      });
      setNewAdminEmail("");
      onRefresh();
    } catch (error) {
      console.error("Error adding admin:", error);
      toast({
        title: "Error",
        description: "Failed to add admin user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Users Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Admin Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter email to add as admin..."
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={handleAddAdmin} disabled={loading}>
              Add Admin
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {adminUsers.map((admin) => (
              <Badge key={admin.id} variant="secondary" className="py-1.5 px-3">
                <Shield className="h-3 w-3 mr-1" />
                {admin.email}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Profiles Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              User Profiles ({filteredProfiles.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.full_name || "—"}</TableCell>
                      <TableCell>{profile.phone || "—"}</TableCell>
                      <TableCell>
                        {profile.city && profile.province
                          ? `${profile.city}, ${profile.province}`
                          : profile.city || profile.province || "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(profile.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {isAdmin(profile.id) ? (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserManagement;
