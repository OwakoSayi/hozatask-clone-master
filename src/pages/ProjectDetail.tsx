import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Calendar, MapPin, Phone, Star, Check, X, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Quote {
  id: string;
  price: number;
  message: string;
  estimated_duration: string | null;
  status: string;
  created_at: string;
  supplier: {
    id: string;
    business_name: string;
    contact_name: string;
    phone: string;
    whatsapp: string | null;
    images: string[];
    description: string | null;
  };
}

interface ProjectRequest {
  id: string;
  category: string;
  title: string;
  description: string;
  location: string;
  zip_code: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  created_at: string;
}

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<ProjectRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [hiredSupplier, setHiredSupplier] = useState<Quote["supplier"] | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    loadProjectAndQuotes();
    
    // Subscribe to new quotes
    const channel = supabase
      .channel(`quotes-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quotes", filter: `request_id=eq.${id}` },
        () => loadProjectAndQuotes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const loadProjectAndQuotes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { state: { returnTo: `/project/${id}` } });
        return;
      }

      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from("project_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (projectError) throw projectError;
      if (!projectData) {
        navigate("/my-projects");
        return;
      }

      setProject(projectData);

      // Load quotes with supplier info
      const { data: quotesData, error: quotesError } = await supabase
        .from("quotes")
        .select(`
          *,
          supplier:suppliers(id, business_name, contact_name, phone, whatsapp, images, description)
        `)
        .eq("request_id", id)
        .order("created_at", { ascending: false });

      if (quotesError) throw quotesError;
      setQuotes(quotesData || []);

      // Check if already hired
      const hiredQuote = quotesData?.find(q => q.status === "accepted");
      if (hiredQuote) {
        setHiredSupplier(hiredQuote.supplier);
        
        // Check if already reviewed
        const { data: existingReview } = await supabase
          .from("reviews")
          .select("id")
          .eq("supplier_id", hiredQuote.supplier.id)
          .eq("customer_id", session.user.id)
          .maybeSingle();
        
        setHasReviewed(!!existingReview);
      }
    } catch (error) {
      console.error("Error loading project:", error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHire = async (quote: Quote) => {
    try {
      // Update quote status to accepted
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({ status: "accepted" })
        .eq("id", quote.id);

      if (quoteError) throw quoteError;

      // Update project status
      const { error: projectError } = await supabase
        .from("project_requests")
        .update({ status: "hired" })
        .eq("id", project?.id);

      if (projectError) throw projectError;

      // Decline other quotes
      await supabase
        .from("quotes")
        .update({ status: "declined" })
        .eq("request_id", project?.id)
        .neq("id", quote.id);

      setHiredSupplier(quote.supplier);
      setShowContactDialog(true);
      
      toast({
        title: "Pro Hired!",
        description: `You've hired ${quote.supplier.business_name}`,
      });

      loadProjectAndQuotes();
    } catch (error) {
      console.error("Error hiring pro:", error);
      toast({
        title: "Error",
        description: "Failed to hire pro",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ status: "declined" })
        .eq("id", quoteId);

      if (error) throw error;

      toast({ title: "Quote declined" });
      loadProjectAndQuotes();
    } catch (error) {
      console.error("Error declining quote:", error);
      toast({
        title: "Error",
        description: "Failed to decline quote",
        variant: "destructive",
      });
    }
  };

  const handleMarkCompleted = async () => {
    if (!project) return;
    
    try {
      const { error } = await supabase
        .from("project_requests")
        .update({ status: "completed" })
        .eq("id", project.id);

      if (error) throw error;

      toast({
        title: "Project completed!",
        description: "Would you like to leave a review for the pro?",
      });
      
      loadProjectAndQuotes();
      setShowReviewDialog(true);
    } catch (error) {
      console.error("Error marking project completed:", error);
      toast({
        title: "Error",
        description: "Failed to mark project as completed",
        variant: "destructive",
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!hiredSupplier) return;
    
    setSubmittingReview(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .maybeSingle();

      const { error } = await supabase.from("reviews").insert({
        supplier_id: hiredSupplier.id,
        customer_id: session.user.id,
        customer_name: profile?.full_name || session.user.email?.split("@")[0] || "Customer",
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });
      
      setShowReviewDialog(false);
      setHasReviewed(true);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "open": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "hired": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "completed": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "accepted": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "declined": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/my-projects")} className="mb-6">
          ← Back to My Projects
        </Button>

        {/* Project Details */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="secondary" className="mb-2">{project.category}</Badge>
                <CardTitle className="text-2xl">{project.title}</CardTitle>
              </div>
              <Badge className={getStatusColor(project.status)}>
                {project.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{project.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {project.location}
              </span>
              {project.preferred_date && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(project.preferred_date), "MMM d, yyyy")}
                  {project.preferred_time && ` at ${project.preferred_time}`}
                </span>
              )}
              {(project.budget_min || project.budget_max) && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  Budget: R{project.budget_min || 0} - R{project.budget_max || "Open"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hired Pro Contact Info */}
        {hiredSupplier && (
          <Card className="mb-8 border-green-500/30 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                {project.status === "completed" ? "Project Completed" : "Hired Pro"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <Avatar className="h-16 w-16">
                  {hiredSupplier.images?.[0] ? (
                    <AvatarImage src={hiredSupplier.images[0]} />
                  ) : null}
                  <AvatarFallback>{hiredSupplier.business_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{hiredSupplier.business_name}</h3>
                  <p className="text-muted-foreground">{hiredSupplier.contact_name}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <a href={`tel:${hiredSupplier.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </a>
                  </Button>
                  {hiredSupplier.whatsapp && (
                    <Button variant="outline" asChild>
                      <a 
                        href={`https://wa.me/${hiredSupplier.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Action buttons for completion and review */}
              <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-green-500/20">
                {project.status === "hired" && (
                  <Button onClick={handleMarkCompleted} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                )}
                {project.status === "completed" && !hasReviewed && (
                  <Button onClick={() => setShowReviewDialog(true)}>
                    <Star className="h-4 w-4 mr-2" />
                    Leave a Review
                  </Button>
                )}
                {hasReviewed && (
                  <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                    <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                    Review submitted
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quotes */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Quotes ({quotes.length})
          </h2>

          {quotes.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Waiting for quotes</h3>
                <p className="text-muted-foreground">
                  Pros in your area are reviewing your request. You'll be notified when quotes arrive.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <Card key={quote.id} className={quote.status === "accepted" ? "border-green-500/30" : ""}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Avatar className="h-14 w-14">
                        {quote.supplier.images?.[0] ? (
                          <AvatarImage src={quote.supplier.images[0]} />
                        ) : null}
                        <AvatarFallback>{quote.supplier.business_name[0]}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 
                              className="font-semibold hover:text-primary cursor-pointer"
                              onClick={() => navigate(`/supplier/${quote.supplier.id}`)}
                            >
                              {quote.supplier.business_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {quote.supplier.contact_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">R{quote.price}</p>
                            {quote.estimated_duration && (
                              <p className="text-xs text-muted-foreground">{quote.estimated_duration}</p>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4">{quote.message}</p>
                        
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(quote.status)}>{quote.status}</Badge>
                          
                          {quote.status === "pending" && !hiredSupplier && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDecline(quote.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleHire(quote)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Hire
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Info Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Information</DialogTitle>
          </DialogHeader>
          {hiredSupplier && (
            <div className="space-y-4">
              <p>You can now contact <strong>{hiredSupplier.business_name}</strong> directly to discuss your project and arrange payment.</p>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p><strong>Contact:</strong> {hiredSupplier.contact_name}</p>
                <p><strong>Phone:</strong> {hiredSupplier.phone}</p>
                {hiredSupplier.whatsapp && (
                  <p><strong>WhatsApp:</strong> {hiredSupplier.whatsapp}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowContactDialog(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              How was your experience with {hiredSupplier?.business_name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= reviewRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="review_comment">Your Review (optional)</Label>
              <Textarea
                id="review_comment"
                rows={4}
                placeholder="Share your experience with this pro..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Skip
            </Button>
            <Button onClick={handleSubmitReview} disabled={submittingReview}>
              {submittingReview ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ProjectDetail;
