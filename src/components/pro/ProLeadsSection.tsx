import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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

interface ProLeadsSectionProps {
  leads: ProjectRequest[];
  sentQuotes: SentQuote[];
  credits: number;
  supplierId: string | null;
  proAccountId: string | null;
  supplierCategory: string | null;
  onRefresh: () => void;
  onCreditsUpdate: (newCredits: number) => void;
}

export function ProLeadsSection({
  leads,
  sentQuotes,
  credits,
  supplierId,
  proAccountId,
  supplierCategory,
  onRefresh,
  onCreditsUpdate,
}: ProLeadsSectionProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<ProjectRequest | null>(null);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [quoteDuration, setQuoteDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSendQuote = async () => {
    if (!selectedLead || !quotePrice || !quoteMessage || !supplierId || !proAccountId) return;

    const leadCost = selectedLead.lead_cost_credits || 1;

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
      const { error: creditError } = await supabase
        .from("pro_accounts")
        .update({ credits: credits - leadCost })
        .eq("id", proAccountId);

      if (creditError) throw creditError;

      const { error } = await supabase.from("quotes").insert({
        request_id: selectedLead.id,
        supplier_id: supplierId,
        price: parseFloat(quotePrice),
        message: quoteMessage,
        estimated_duration: quoteDuration || null,
        credits_spent: leadCost,
      });

      if (error) throw error;

      await supabase.from("credit_transactions").insert({
        pro_account_id: proAccountId,
        amount: -leadCost,
        transaction_type: "quote",
        description: `Quote sent for: ${selectedLead.title}`,
      });

      onCreditsUpdate(credits - leadCost);

      toast({
        title: "Quote Sent!",
        description: `${leadCost} credit(s) used. The customer will be notified of your quote.`,
      });

      setSelectedLead(null);
      setQuotePrice("");
      setQuoteMessage("");
      setQuoteDuration("");
      onRefresh();
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

  return (
    <div className="space-y-6">
      {/* Available Leads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Available Leads</h2>
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {leads.length} new
          </Badge>
        </div>

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
              <Card key={lead.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <Badge variant="secondary" className="mb-2">{lead.category}</Badge>
                      <h3 className="text-lg font-semibold mb-2">{lead.title}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {lead.description}
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
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
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {lead.lead_cost_credits || 1} credit
                      </Badge>
                      <Button onClick={() => setSelectedLead(lead)} className="w-full sm:w-auto">
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
      </div>

      {/* Sent Quotes */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Sent Quotes ({sentQuotes.length})</h2>
        {sentQuotes.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-muted-foreground">No quotes sent yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sentQuotes.slice(0, 5).map((quote) => (
              <Card key={quote.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{quote.project_request.category}</Badge>
                        <Badge className={getQuoteStatusColor(quote.status)}>
                          {quote.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold">{quote.project_request.title}</h3>
                      <p className="text-sm text-muted-foreground">{quote.project_request.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">R{quote.price}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(quote.created_at), "MMM d")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quote Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send a Quote</DialogTitle>
            <DialogDescription>
              Respond to: {selectedLead?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
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
                  {selectedLead?.lead_cost_credits || 1} credit required
                </p>
                <p className="text-sm text-muted-foreground">
                  You have {credits} credits
                </p>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Project Details</h4>
              <p className="text-sm text-muted-foreground">{selectedLead?.description}</p>
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
              <Label htmlFor="quote_duration">Estimated Duration</Label>
              <Input
                id="quote_duration"
                placeholder="e.g., 2-3 hours"
                value={quoteDuration}
                onChange={(e) => setQuoteDuration(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="quote_message">Your Message *</Label>
              <Textarea
                id="quote_message"
                rows={4}
                placeholder="Introduce yourself..."
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
              {submitting ? "Sending..." : `Send Quote`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
