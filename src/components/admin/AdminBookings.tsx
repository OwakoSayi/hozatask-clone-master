import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Booking {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  event_date: string;
  event_time: string;
  event_type: string;
  notes: string;
  status: string;
  matched_supplier_name: string;
  matched_supplier_contact: string;
  created_at: string;
  selected_option_ids: string[];
}

interface ServiceOption {
  id: string;
  title: string;
  category: string;
  price: number;
  supplier_id: string;
  suppliers: {
    business_name: string;
    contact_name: string;
    phone: string;
    whatsapp: string;
  };
}

interface AdminBookingsProps {
  bookings: Booking[];
  serviceOptions: ServiceOption[];
  onRefresh: () => void;
}

const AdminBookings = ({ bookings, serviceOptions, onRefresh }: AdminBookingsProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const updateBookingStatus = async (id: string, status: string, matchData?: any) => {
    setLoading(id);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status, ...matchData })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking updated successfully",
      });

      onRefresh();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return <Badge className="bg-blue-500/10 text-blue-600">New</Badge>;
      case "Matched":
        return <Badge className="bg-yellow-500/10 text-yellow-600">Matched</Badge>;
      case "InProgress":
        return <Badge className="bg-purple-500/10 text-purple-600">In Progress</Badge>;
      case "Completed":
        return <Badge className="bg-primary/10 text-primary">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statusCounts = {
    all: bookings.length,
    New: bookings.filter((b) => b.status === "New").length,
    Matched: bookings.filter((b) => b.status === "Matched").length,
    InProgress: bookings.filter((b) => b.status === "InProgress").length,
    Completed: bookings.filter((b) => b.status === "Completed").length,
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
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
            <SelectItem value="all">All ({statusCounts.all})</SelectItem>
            <SelectItem value="New">New ({statusCounts.New})</SelectItem>
            <SelectItem value="Matched">Matched ({statusCounts.Matched})</SelectItem>
            <SelectItem value="InProgress">In Progress ({statusCounts.InProgress})</SelectItem>
            <SelectItem value="Completed">Completed ({statusCounts.Completed})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No bookings found
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id} className={booking.status === "New" ? "border-blue-500/50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{booking.customer_name}</CardTitle>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.event_date}</span>
                    {booking.event_time && (
                      <>
                        <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                        <span>{booking.event_time}</span>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.phone}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(booking.phone, "Phone number")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{booking.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{booking.address}</span>
                  </div>
                  {booking.event_type && (
                    <div className="text-muted-foreground">
                      Event: <span className="text-foreground">{booking.event_type}</span>
                    </div>
                  )}
                </div>

                {booking.notes && (
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{booking.notes}</p>
                  </div>
                )}

                {booking.selected_option_ids && booking.selected_option_ids.length > 0 && (
                  <div className="bg-muted/20 p-3 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Services Requested ({booking.selected_option_ids.length})
                    </p>
                    <div className="space-y-2">
                      {booking.selected_option_ids.map((optionId) => {
                        const service = serviceOptions.find((s) => s.id === optionId);
                        return service ? (
                          <div key={optionId} className="bg-background p-3 rounded border text-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{service.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {service.category} • R{service.price}
                                </p>
                              </div>
                              {service.suppliers && (
                                <div className="text-right">
                                  <p className="text-xs font-medium">{service.suppliers.business_name}</p>
                                  <div className="flex items-center gap-1 justify-end mt-1">
                                    <span className="text-xs">{service.suppliers.phone}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 w-5 p-0"
                                      onClick={() => copyToClipboard(service.suppliers.phone, "Supplier phone")}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    {service.suppliers.whatsapp && (
                                      <a
                                        href={`https://wa.me/${service.suppliers.whatsapp.replace(/[^0-9]/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-1"
                                      >
                                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-600">
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {booking.status === "New" && (
                  <div className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/20">
                    <Label className="text-xs font-medium">Match Supplier</Label>
                    <div className="flex gap-2 mt-2">
                      <Input placeholder="Supplier Name" id={`supplier-name-${booking.id}`} className="flex-1" />
                      <Input placeholder="Contact" id={`supplier-contact-${booking.id}`} className="flex-1" />
                      <Button
                        size="sm"
                        disabled={loading === booking.id}
                        onClick={() => {
                          const nameInput = document.getElementById(`supplier-name-${booking.id}`) as HTMLInputElement;
                          const contactInput = document.getElementById(`supplier-contact-${booking.id}`) as HTMLInputElement;
                          updateBookingStatus(booking.id, "Matched", {
                            matched_supplier_name: nameInput.value,
                            matched_supplier_contact: contactInput.value,
                          });
                        }}
                      >
                        Match
                      </Button>
                    </div>
                  </div>
                )}

                {booking.matched_supplier_name && (
                  <div className="bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/20">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Matched Supplier</p>
                    <p className="text-sm font-medium">
                      {booking.matched_supplier_name} - {booking.matched_supplier_contact}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {booking.status !== "InProgress" && booking.status !== "Completed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBookingStatus(booking.id, "InProgress")}
                      disabled={loading === booking.id}
                    >
                      Mark In Progress
                    </Button>
                  )}
                  {booking.status !== "Completed" && (
                    <Button
                      size="sm"
                      onClick={() => updateBookingStatus(booking.id, "Completed")}
                      disabled={loading === booking.id}
                    >
                      Mark Completed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
