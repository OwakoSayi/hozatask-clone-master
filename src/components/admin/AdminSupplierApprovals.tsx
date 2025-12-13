import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  Building2,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Trash2,
  ExternalLink,
  Copy,
  Clock,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Supplier {
  id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  whatsapp?: string;
  category: string;
  title: string;
  description?: string;
  status: string;
  price: number;
  images: string[];
  location: string;
  created_at: string;
}

interface AdminSupplierApprovalsProps {
  suppliers: Supplier[];
  onRefresh: () => void;
}

const AdminSupplierApprovals = ({ suppliers, onRefresh }: AdminSupplierApprovalsProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = suppliers.filter((s) => s.status === "Pending").length;
  const activeCount = suppliers.filter((s) => s.status === "Active").length;
  const inactiveCount = suppliers.filter((s) => s.status === "Inactive").length;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const updateSupplierStatus = async (id: string, status: "Active" | "Inactive" | "Pending") => {
    setLoading(id);
    try {
      const { data: supplier, error: fetchError } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from("suppliers")
        .update({ status })
        .eq("id", id);

      if (updateError) throw updateError;

      if (status === "Active") {
        const { data: existingOption } = await supabase
          .from("service_options")
          .select("id")
          .eq("supplier_id", supplier.id)
          .maybeSingle();

        if (existingOption) {
          await supabase
            .from("service_options")
            .update({
              category: supplier.category,
              title: supplier.title,
              description: supplier.description,
              price: supplier.price,
              location_area: supplier.location,
              images: supplier.images,
              is_active: true,
            })
            .eq("id", existingOption.id);
        } else {
          await supabase.from("service_options").insert({
            supplier_id: supplier.id,
            category: supplier.category,
            title: supplier.title,
            description: supplier.description,
            price: supplier.price,
            location_area: supplier.location,
            images: supplier.images,
            is_active: true,
          });
        }
      }

      if (status === "Inactive") {
        await supabase
          .from("service_options")
          .update({ is_active: false })
          .eq("supplier_id", supplier.id);
      }

      toast({
        title: "Success",
        description: `Supplier ${status === "Active" ? "approved" : status === "Inactive" ? "deactivated" : "updated"} successfully`,
      });

      onRefresh();
    } catch (error) {
      console.error("Error updating supplier:", error);
      toast({
        title: "Error",
        description: "Failed to update supplier",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const deleteSupplier = async (id: string) => {
    setLoading(id);
    try {
      await supabase.from("service_options").delete().eq("supplier_id", id);
      const { error } = await supabase.from("suppliers").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });

      onRefresh();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast({
        title: "Error",
        description: "Failed to delete supplier",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Approved</Badge>;
      case "Pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">Pending</Badge>;
      case "Inactive":
        return <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({suppliers.length})</SelectItem>
            <SelectItem value="Pending">Pending ({pendingCount})</SelectItem>
            <SelectItem value="Active">Active ({activeCount})</SelectItem>
            <SelectItem value="Inactive">Inactive ({inactiveCount})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pending Approvals Alert */}
      {pendingCount > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="py-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">
              {pendingCount} supplier{pendingCount > 1 ? "s" : ""} awaiting approval
            </span>
          </CardContent>
        </Card>
      )}

      {/* Suppliers List */}
      <div className="space-y-4">
        {filteredSuppliers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No suppliers found
            </CardContent>
          </Card>
        ) : (
          filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className={supplier.status === "Pending" ? "border-yellow-500/50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{supplier.business_name}</CardTitle>
                      {getStatusBadge(supplier.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{supplier.category}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(supplier.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-medium">{supplier.title}</p>
                {supplier.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{supplier.description}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier.contact_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier.phone}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(supplier.phone, "Phone number")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{supplier.location}</span>
                  </div>
                  <div className="font-medium text-primary">R{supplier.price}</div>
                </div>

                {supplier.whatsapp && (
                  <a
                    href={`https://wa.me/${supplier.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    WhatsApp
                  </a>
                )}

                {supplier.images && supplier.images.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Service Images ({supplier.images.length})
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {supplier.images.slice(0, 6).map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Service ${index + 1}`}
                          className="w-full h-16 object-cover rounded border border-border"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {supplier.status !== "Active" && (
                    <Button
                      size="sm"
                      onClick={() => updateSupplierStatus(supplier.id, "Active")}
                      disabled={loading === supplier.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  {supplier.status !== "Inactive" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateSupplierStatus(supplier.id, "Inactive")}
                      disabled={loading === supplier.id}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Deactivate
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" disabled={loading === supplier.id}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {supplier.business_name} and all associated
                          service options. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteSupplier(supplier.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminSupplierApprovals;
