import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, User, Shield, Trash2, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  const filteredProfiles = profiles.filter((profile) =>
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.phone?.includes(searchTerm)
  );

  const isAdmin = (userId: string) => {
    return adminUsers.some((admin) => admin.user_id === userId);
  };

  const handleAddExistingAdmin = async () => {
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
      const { data: existingAdmin } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", newAdminEmail.trim().toLowerCase())
        .maybeSingle();

      if (existingAdmin) {
        toast({
          title: "Already Admin",
          description: "This user is already an admin",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Insert new admin with email only (user_id will be linked when they sign in)
      const { error } = await supabase
        .from("admin_users")
        .insert({ email: newAdminEmail.trim().toLowerCase() });

      if (error) throw error;

      toast({
        title: "Admin Added",
        description: "Admin privileges granted. User can now access admin dashboard.",
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

  const handleCreateNewAdmin = async () => {
    if (!newAdminForm.email.trim() || !newAdminForm.password.trim() || !newAdminForm.fullName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (newAdminForm.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdminForm.email.trim().toLowerCase(),
        password: newAdminForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/login`,
          data: {
            full_name: newAdminForm.fullName.trim(),
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Add to admin_users table
        const { error: adminError } = await supabase
          .from("admin_users")
          .insert({
            email: newAdminForm.email.trim().toLowerCase(),
            user_id: authData.user.id,
          });

        if (adminError) throw adminError;
      }

      toast({
        title: "Admin Created",
        description: `Admin account created for ${newAdminForm.email}. They can now log in at /admin/login`,
      });
      
      setNewAdminForm({ email: "", password: "", fullName: "" });
      setCreateDialogOpen(false);
      onRefresh();
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string, adminEmail: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("admin_users")
        .delete()
        .eq("id", adminId);

      if (error) throw error;

      toast({
        title: "Admin Removed",
        description: `Admin privileges removed for ${adminEmail}`,
      });
      onRefresh();
    } catch (error) {
      console.error("Error removing admin:", error);
      toast({
        title: "Error",
        description: "Failed to remove admin user",
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
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Users ({adminUsers.length})
            </CardTitle>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create New Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Admin Account</DialogTitle>
                  <DialogDescription>
                    Create a new account with admin privileges. This will create both the user account and grant admin access.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-name">Full Name</Label>
                    <Input
                      id="admin-name"
                      placeholder="John Doe"
                      value={newAdminForm.fullName}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={newAdminForm.email}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="••••••••"
                      value={newAdminForm.password}
                      onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateNewAdmin} disabled={loading}>
                    {loading ? "Creating..." : "Create Admin"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add existing user as admin */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Enter email to grant admin access..."
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddExistingAdmin} disabled={loading} variant="outline">
              Grant Admin Access
            </Button>
          </div>
          
          {/* Admin list */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No admin users found
                    </TableCell>
                  </TableRow>
                ) : (
                  adminUsers.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.email}</TableCell>
                      <TableCell>
                        {admin.user_id ? (
                          <Badge className="bg-primary/10 text-primary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Linked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending Login
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Admin Access?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will revoke admin privileges for {admin.email}. They will no longer be able to access the admin dashboard.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
