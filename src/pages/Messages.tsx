import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageCircle, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface Conversation {
  id: string;
  customer_id: string;
  supplier_id: string;
  quote_id: string | null;
  last_message_at: string | null;
  customer_unread_count: number;
  supplier_unread_count: number;
  other_party_name: string;
  other_party_avatar: string | null;
  project_title: string | null;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
}

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'customer' | 'supplier'>('customer');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);

      // Subscribe to new messages
      const channel = supabase
        .channel(`messages-${selectedConversation.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedConversation.id}` },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { state: { returnTo: "/messages" } });
        return;
      }

      setUserId(session.user.id);

      // Check if user is a supplier
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const isSupplier = !!supplier;
      setUserType(isSupplier ? 'supplier' : 'customer');

      // Get conversations
      const { data: conversationsData, error } = await supabase
        .from("conversations")
        .select(`
          *,
          supplier:suppliers(business_name, images),
          request:project_requests(title)
        `)
        .or(isSupplier 
          ? `supplier_id.eq.${supplier.id}` 
          : `customer_id.eq.${session.user.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Transform data to include other party info
      const transformed = await Promise.all((conversationsData || []).map(async (conv: any) => {
        let otherPartyName = "";
        let otherPartyAvatar = null;

        if (isSupplier) {
          // Get customer profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", conv.customer_id)
            .maybeSingle();
          
          otherPartyName = profile?.full_name || "Customer";
          otherPartyAvatar = profile?.avatar_url;
        } else {
          otherPartyName = conv.supplier?.business_name || "Pro";
          otherPartyAvatar = conv.supplier?.images?.[0];
        }

        return {
          ...conv,
          other_party_name: otherPartyName,
          other_party_avatar: otherPartyAvatar,
          project_title: conv.request?.title,
        };
      }));

      setConversations(transformed);

      // Check for conversation param
      const convId = searchParams.get('conversation');
      if (convId) {
        const conv = transformed.find(c => c.id === convId);
        if (conv) setSelectedConversation(conv);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages(data || []);
  };

  const markAsRead = async (conversationId: string) => {
    const updateField = userType === 'customer' ? 'customer_unread_count' : 'supplier_unread_count';
    
    await supabase
      .from("conversations")
      .update({ [updateField]: 0 })
      .eq("id", conversationId);

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_type", userType);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !userId) return;

    setSending(true);
    try {
      const { error: messageError } = await supabase.from("messages").insert({
        conversation_id: selectedConversation.id,
        sender_id: userId,
        sender_type: userType,
        content: newMessage.trim(),
      });

      if (messageError) throw messageError;

      // Update conversation last message
      const unreadField = userType === 'customer' ? 'supplier_unread_count' : 'customer_unread_count';
      await supabase
        .from("conversations")
        .update({ 
          last_message_at: new Date().toISOString(),
          [unreadField]: (selectedConversation as any)[unreadField] + 1
        })
        .eq("id", selectedConversation.id);

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-4">
        <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
          {/* Conversation List */}
          <Card className={`${selectedConversation ? 'hidden md:block' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition ${
                          selectedConversation?.id === conv.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {conv.other_party_avatar && (
                              <AvatarImage src={conv.other_party_avatar} />
                            )}
                            <AvatarFallback>{conv.other_party_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="font-medium truncate">{conv.other_party_name}</p>
                              {conv.last_message_at && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(conv.last_message_at), "MMM d")}
                                </span>
                              )}
                            </div>
                            {conv.project_title && (
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.project_title}
                              </p>
                            )}
                          </div>
                          {((userType === 'customer' && conv.customer_unread_count > 0) ||
                            (userType === 'supplier' && conv.supplier_unread_count > 0)) && (
                            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                              {userType === 'customer' ? conv.customer_unread_count : conv.supplier_unread_count}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages Area */}
          <Card className={`md:col-span-2 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
            {selectedConversation ? (
              <>
                <CardHeader className="pb-2 border-b">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="md:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar>
                      {selectedConversation.other_party_avatar && (
                        <AvatarImage src={selectedConversation.other_party_avatar} />
                      )}
                      <AvatarFallback>{selectedConversation.other_party_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedConversation.other_party_name}</CardTitle>
                      {selectedConversation.project_title && (
                        <p className="text-sm text-muted-foreground">{selectedConversation.project_title}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === userType ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.sender_type === userType
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_type === userType ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {format(new Date(msg.created_at), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="flex gap-2"
                  >
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={sending}
                    />
                    <Button type="submit" disabled={!newMessage.trim() || sending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to view messages
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;
