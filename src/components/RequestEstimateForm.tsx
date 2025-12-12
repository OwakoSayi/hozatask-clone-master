import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, Phone, Send, Calendar, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServiceOption {
  id: string;
  title: string;
  price: number;
}

interface RequestEstimateFormProps {
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  category: string;
  services: ServiceOption[];
  onMessageClick?: () => void;
}

const FREQUENCY_OPTIONS = [
  { value: "once", label: "Just once" },
  { value: "weekly", label: "Every week" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Once a month" },
];

const PROPERTY_SIZE_OPTIONS = [
  { value: "1", label: "1 bedroom" },
  { value: "2", label: "2 bedrooms" },
  { value: "3", label: "3 bedrooms" },
  { value: "4", label: "4 bedrooms" },
  { value: "5", label: "5+ bedrooms" },
];

const SERVICE_TYPE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  "House Cleaning": [
    { value: "standard", label: "Standard cleaning" },
    { value: "deep", label: "Deep cleaning" },
    { value: "moveout", label: "Move out cleaning" },
    { value: "construction", label: "Post-construction cleaning" },
    { value: "vacation", label: "Vacation rental cleaning" },
  ],
  default: [
    { value: "basic", label: "Basic service" },
    { value: "standard", label: "Standard service" },
    { value: "premium", label: "Premium service" },
  ],
};

export const RequestEstimateForm = ({
  supplierId,
  supplierName,
  supplierPhone,
  category,
  services,
  onMessageClick,
}: RequestEstimateFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    selectedService: "",
    zipCode: "",
    frequency: "",
    propertySize: "",
    serviceType: "",
    preferredDate: "",
    description: "",
  });

  const serviceTypeOptions = SERVICE_TYPE_OPTIONS[category] || SERVICE_TYPE_OPTIONS.default;

  const handleRequestEstimate = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to request an estimate",
      });
      navigate("/auth", { state: { returnTo: `/supplier/${supplierId}` } });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Please describe your project",
        description: "Let the pro know what you need help with",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check for existing conversation
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("customer_id", session.user.id)
        .eq("supplier_id", supplierId)
        .maybeSingle();

      let conversationId = existingConv?.id;

      // Create conversation if doesn't exist
      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({
            customer_id: session.user.id,
            supplier_id: supplierId,
          })
          .select("id")
          .single();

        if (convError) throw convError;
        conversationId = newConv.id;
      }

      // Build the estimate request message
      const selectedServiceName = services.find(s => s.id === formData.selectedService)?.title || "General inquiry";
      const frequencyLabel = FREQUENCY_OPTIONS.find(f => f.value === formData.frequency)?.label || "";
      const propertySizeLabel = PROPERTY_SIZE_OPTIONS.find(p => p.value === formData.propertySize)?.label || "";
      const serviceTypeLabel = serviceTypeOptions.find(s => s.value === formData.serviceType)?.label || "";

      let messageContent = `**Estimate Request**\n\n`;
      messageContent += `Service: ${selectedServiceName}\n`;
      if (formData.zipCode) messageContent += `Location: ${formData.zipCode}\n`;
      if (frequencyLabel) messageContent += `Frequency: ${frequencyLabel}\n`;
      if (propertySizeLabel) messageContent += `Property size: ${propertySizeLabel}\n`;
      if (serviceTypeLabel) messageContent += `Service type: ${serviceTypeLabel}\n`;
      if (formData.preferredDate) messageContent += `Preferred date: ${formData.preferredDate}\n`;
      messageContent += `\n${formData.description}`;

      // Send the message
      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: session.user.id,
        sender_type: "customer",
        content: messageContent,
      });

      if (msgError) throw msgError;

      // Update conversation
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          supplier_unread_count: 1,
        })
        .eq("id", conversationId);

      toast({
        title: "Request sent!",
        description: `${supplierName} will respond to your estimate request soon.`,
      });

      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error("Error sending request:", error);
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to message this pro",
      });
      navigate("/auth", { state: { returnTo: `/supplier/${supplierId}` } });
      return;
    }

    // Check for existing conversation or create one
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("customer_id", session.user.id)
      .eq("supplier_id", supplierId)
      .maybeSingle();

    if (existingConv) {
      navigate(`/messages?conversation=${existingConv.id}`);
    } else {
      // Create new conversation
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          customer_id: session.user.id,
          supplier_id: supplierId,
        })
        .select("id")
        .single();

      if (!error && newConv) {
        navigate(`/messages?conversation=${newConv.id}`);
      } else {
        navigate("/messages");
      }
    }
  };

  const handleCall = () => {
    if (supplierPhone) {
      window.location.href = `tel:${supplierPhone}`;
    }
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Contact for price</span>
          </div>
          <Button
            variant="link"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="text-primary p-0 h-auto"
          >
            {showForm ? "Hide details" : "View details"}
          </Button>
        </div>

        {showForm && (
          <div className="space-y-4 pt-2 border-t">
            {services.length > 0 && (
              <div className="space-y-2">
                <Label>Select a service</Label>
                <Select
                  value={formData.selectedService}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, selectedService: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Zip code</Label>
              <Input
                placeholder="Enter your zip code"
                value={formData.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select answer" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Property size</Label>
              <Select
                value={formData.propertySize}
                onValueChange={(value) => setFormData(prev => ({ ...prev, propertySize: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select answer" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Service type</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, serviceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select answer" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Preferred date (optional)</Label>
              <Input
                type="date"
                value={formData.preferredDate}
                onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Describe your project</Label>
              <Textarea
                placeholder="Tell us about your project requirements..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleRequestEstimate}
              disabled={loading}
            >
              {loading ? "Sending..." : "Request estimate"}
              <Send className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <Button
            className="w-full"
            variant={showForm ? "outline" : "default"}
            size="lg"
            onClick={handleMessage}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
          {supplierPhone && (
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleCall}
            >
              <Phone className="h-4 w-4 mr-2" />
              Request a call
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
