import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, DollarSign, Send, MessageSquare, Clock, Zap, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface ProjectRequest {
  id: string;
  category: string;
  title: string;
  description: string;
  location: string;
  preferred_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  created_at: string;
  lead_cost_credits: number | null;
}

interface SentQuote {
  id: string;
  price: number;
  message: string;
  status: string;
  created_at: string;
  project_request: ProjectRequest;
}

const ProLeads = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<ProjectRequest[]>([]);
  const [sentQuotes, setSentQuotes] = useState<SentQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [supplierCategory, setSupplierCategory] = useState<string | null>(null);
  const [proAccountId, setProAccountId] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);

  // Quote form state
  const [selectedLead, setSelectedLead] = useState<ProjectRequest | null>(null);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [quoteDuration, setQuoteDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkSupplierAndLoad();
  }, []);

  const checkSupplierAndLoad = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { state: { returnTo: "/leads" } });
        return;
      }

      // Check if user is an active supplier
      const { data: supplier, error: supplierError } = await supabase
        .from("suppliers")
        .select("id, category, status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (supplierError) throw supplierError;

      if (!supplier || supplier.status !== "Active") {
        toast({
          title: "Access Denied",
          description: "You need to be an approved pro to view leads",
          variant: "destructive",
        });
        navigate("/pro-dashboard");
        return;
      }

      setSupplierId(supplier.id);
      setSupplierCategory(supplier.category);

      // Load pro account for credits
      const { data: proAccount } = await supabase
        .from("pro_accounts")
        .select("id, credits")
        .eq("supplier_id", supplier.id)
        .maybeSingle();

      if (proAccount) {
        setProAccountId(proAccount.id);
        setCredits(proAccount.credits);
      }

      await Promise.all([
        loadLeads(supplier.category, supplier.id),
        loadSentQuotes(supplier.id),
      ]);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async (category: string, supplierId: string) => {
    // Get leads in supplier's category that they haven't quoted on
    const { data, error } = await supabase
      .from("project_requests")
      .select("*")
      .eq("category", category)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Filter out leads that supplier has already quoted on
    const { data: existingQuotes } = await supabase
      .from("quotes")
      .select("request_id")
      .eq("supplier_id", supplierId);

    const quotedIds = new Set(existingQuotes?.map(q => q.request_id) || []);
    const availableLeads = (data || []).filter(lead => !quotedIds.has(lead.id));

    setLeads(availableLeads);
  };

  const loadSentQuotes = async (supplierId: string) => {
    const { data, error } = await supabase
      .from("quotes")
      .select(`
        *,
        project_request:project_requests(*)
      `)
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setSentQuotes(data || []);
  };

  const handleSendQuote = async () => {
    if (!selectedLead || !quotePrice || !quoteMessage || !supplierId || !proAccountId) return;

    const leadCost = selectedLead.lead_cost_credits || 1;

    // Check if user has enough credits
    if (credits < leadCost) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${leadCost} credit(s) to send this quote. You have ${credits}.`,
        variant: "destructive",
      });
      navigate("/buy-credits");
      return;
    }

    setSubmitting(true);
    try {
      // Deduct credits first
      const { error: creditError } = await supabase
        .from("pro_accounts")
        .update({ credits: credits - leadCost })
        .eq("id", proAccountId);

      if (creditError) throw creditError;

      // Insert quote with credits spent
      const { error } = await supabase.from("quotes").insert({
        request_id: selectedLead.id,
        supplier_id: supplierId,
        price: parseFloat(quotePrice),
        message: quoteMessage,
        estimated_duration: quoteDuration || null,
        credits_spent: leadCost,
      });

      if (error) throw error;

      // Record the transaction
      await supabase.from("credit_transactions").insert({
        pro_account_id: proAccountId,
        amount: -leadCost,
        transaction_type: "quote",
        description: `Quote sent for: ${selectedLead.title}`,
      });

      // Update local credits state
      setCredits(credits - leadCost);

      toast({
        title: "Quote Sent!",
        description: `${leadCost} credit(s) used. The customer will be notified of your quote.`,
      });

      setSelectedLead(null);
      setQuotePrice("");
      setQuoteMessage("");
      setQuoteDuration("");

      // Refresh data
      if (supplierCategory && supplierId) {
        await Promise.all([
          loadLeads(supplierCategory, supplierId),
          loadSentQuotes(supplierId),
        ]);
      }
    } catch (error) {
      console.error("Error sending quote:", error);
      toast({
        title: "Error",
        description: "Failed to send quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "accepted": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "declined": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading leads...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Leads & Quotes</h1>
            <p className="text-muted-foreground">
              View customer requests in your category and send quotes
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
              <Zap className="h-4 w-4" />
              <span className="font-semibold">{credits} credits</span>
            </div>
            <Button variant="outline" onClick={() => navigate("/buy-credits")}>
              Buy Credits
            </Button>
          </div>
        </div>

        <Tabs defaultValue="leads">
          <TabsList className="mb-6">
            <TabsTrigger value="leads">
              Available Leads ({leads.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent Quotes ({sentQuotes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            {leads.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No new leads</h3>
                  <p className="text-muted-foreground">
                    Check back later for new project requests in your category
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {leads.map((lead) => (
                  <Card key={lead.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Badge variant="secondary" className="mb-2">{lead.category}</Badge>
                          <h3 className="text-lg font-semibold mb-2">{lead.title}</h3>
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                            {lead.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {lead.location}
                            </span>
                            {lead.preferred_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(lead.preferred_date), "MMM d, yyyy")}
                              </span>
                            )}
                            {(lead.budget_min || lead.budget_max) && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                R{lead.budget_min || 0} - R{lead.budget_max || "Open"}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {format(new Date(lead.created_at), "MMM d, h:mm a")}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {lead.lead_cost_credits || 1} credit
                          </Badge>
                          <Button onClick={() => setSelectedLead(lead)}>
                            <Send className="h-4 w-4 mr-2" />
                            Send Quote
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent">
            {sentQuotes.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No quotes sent yet</h3>
                  <p className="text-muted-foreground">
                    Send quotes to available leads to start getting hired
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {sentQuotes.map((quote) => (
                  <Card key={quote.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{quote.project_request.category}</Badge>
                            <Badge className={getQuoteStatusColor(quote.status)}>
                              {quote.status}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold mb-1">{quote.project_request.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {quote.project_request.location}
                          </p>
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-sm">
                              <strong>Your quote:</strong> R{quote.price}
                            </p>
                            <p className="text-sm text-muted-foreground">{quote.message}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">R{quote.price}</p>
                          <p className="text-xs text-muted-foreground">
                            Sent {format(new Date(quote.created_at), "MMM d")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Send Quote Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send a Quote</DialogTitle>
            <DialogDescription>
              Respond to: {selectedLead?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Credit cost warning */}
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              credits >= (selectedLead?.lead_cost_credits || 1) 
                ? 'bg-primary/10' 
                : 'bg-destructive/10'
            }`}>
              {credits >= (selectedLead?.lead_cost_credits || 1) ? (
                <Zap className="h-5 w-5 text-primary mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              )}
              <div>
                <p className="font-medium">
                  {selectedLead?.lead_cost_credits || 1} credit required to send this quote
                </p>
                <p className="text-sm text-muted-foreground">
                  You have {credits} credits available
                </p>
                {credits < (selectedLead?.lead_cost_credits || 1) && (
                  <Button 
                    size="sm" 
                    variant="link" 
                    className="px-0 h-auto"
                    onClick={() => navigate("/buy-credits")}
                  >
                    Buy more credits
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Project Details</h4>
              <p className="text-sm text-muted-foreground">{selectedLead?.description}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedLead?.location}
                </span>
                {selectedLead?.budget_max && (
                  <span>Budget: Up to R{selectedLead.budget_max}</span>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="quote_price">Your Price (R) *</Label>
              <Input
                id="quote_price"
                type="number"
                placeholder="e.g., 1500"
                value={quotePrice}
                onChange={(e) => setQuotePrice(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="quote_duration">Estimated Duration (optional)</Label>
              <Input
                id="quote_duration"
                placeholder="e.g., 2-3 hours, 1 day"
                value={quoteDuration}
                onChange={(e) => setQuoteDuration(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="quote_message">Your Message *</Label>
              <Textarea
                id="quote_message"
                rows={4}
                placeholder="Introduce yourself and explain why you're the best fit for this job..."
                value={quoteMessage}
                onChange={(e) => setQuoteMessage(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLead(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendQuote} 
              disabled={!quotePrice || !quoteMessage || submitting || credits < (selectedLead?.lead_cost_credits || 1)}
            >
              {submitting ? "Sending..." : `Send Quote (${selectedLead?.lead_cost_credits || 1} credit)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ProLeads;
