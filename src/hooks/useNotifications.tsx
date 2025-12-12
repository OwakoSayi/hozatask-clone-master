import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NotificationCounts {
  unreadMessages: number;
  unreadQuotes: number;
  total: number;
}

export const useNotifications = () => {
  const { toast } = useToast();
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadMessages: 0,
    unreadQuotes: 0,
    total: 0,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [isSupplier, setIsSupplier] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setUserId(session.user.id);

      // Check if user is a supplier
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("status", "Active")
        .maybeSingle();

      if (supplier) {
        setSupplierId(supplier.id);
        setIsSupplier(true);
      }
    };

    initializeUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUserId(session.user.id);
        const { data: supplier } = await supabase
          .from("suppliers")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("status", "Active")
          .maybeSingle();

        if (supplier) {
          setSupplierId(supplier.id);
          setIsSupplier(true);
        } else {
          setSupplierId(null);
          setIsSupplier(false);
        }
      } else {
        setUserId(null);
        setSupplierId(null);
        setIsSupplier(false);
        setCounts({ unreadMessages: 0, unreadQuotes: 0, total: 0 });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const loadCounts = async () => {
      await Promise.all([
        loadMessageCounts(),
        loadQuoteCounts(),
      ]);
    };

    loadCounts();

    // Subscribe to message changes
    const messageChannel = supabase
      .channel('notification-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const message = payload.new as any;
          
          // Check if this message is for the current user
          const { data: conv } = await supabase
            .from("conversations")
            .select("customer_id, supplier_id")
            .eq("id", message.conversation_id)
            .single();

          if (!conv) return;

          const isForUser = isSupplier 
            ? conv.supplier_id === supplierId && message.sender_type !== 'supplier'
            : conv.customer_id === userId && message.sender_type !== 'customer';

          if (isForUser) {
            setCounts(prev => ({
              ...prev,
              unreadMessages: prev.unreadMessages + 1,
              total: prev.total + 1,
            }));

            toast({
              title: "New message",
              description: "You have received a new message",
            });
          }
        }
      )
      .subscribe();

    // Subscribe to quote changes
    const quoteChannel = supabase
      .channel('notification-quotes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quotes' },
        async (payload) => {
          const quote = payload.new as any;

          // Check if this quote is for the current user's request
          const { data: request } = await supabase
            .from("project_requests")
            .select("user_id")
            .eq("id", quote.request_id)
            .single();

          if (request?.user_id === userId) {
            setCounts(prev => ({
              ...prev,
              unreadQuotes: prev.unreadQuotes + 1,
              total: prev.total + 1,
            }));

            toast({
              title: "New quote received",
              description: "A pro has sent you a quote!",
            });
          }
        }
      )
      .subscribe();

    // Subscribe to conversation unread count updates
    const conversationChannel = supabase
      .channel('notification-conversations')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        () => {
          loadMessageCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(quoteChannel);
      supabase.removeChannel(conversationChannel);
    };
  }, [userId, supplierId, isSupplier, toast]);

  const loadMessageCounts = async () => {
    if (!userId) return;

    let query = supabase.from("conversations").select("customer_unread_count, supplier_unread_count");

    if (isSupplier && supplierId) {
      query = query.eq("supplier_id", supplierId);
    } else {
      query = query.eq("customer_id", userId);
    }

    const { data } = await query;

    if (data) {
      const totalUnread = data.reduce((sum, conv) => {
        return sum + (isSupplier ? conv.supplier_unread_count : conv.customer_unread_count) || 0;
      }, 0);

      setCounts(prev => ({
        ...prev,
        unreadMessages: totalUnread,
        total: totalUnread + prev.unreadQuotes,
      }));
    }
  };

  const loadQuoteCounts = async () => {
    if (!userId || isSupplier) return;

    // Get user's requests
    const { data: requests } = await supabase
      .from("project_requests")
      .select("id")
      .eq("user_id", userId);

    if (!requests || requests.length === 0) return;

    const requestIds = requests.map(r => r.id);

    // Count unread quotes
    const { count } = await supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .in("request_id", requestIds)
      .eq("is_read", false);

    setCounts(prev => ({
      ...prev,
      unreadQuotes: count || 0,
      total: prev.unreadMessages + (count || 0),
    }));
  };

  const markMessagesRead = () => {
    loadMessageCounts();
  };

  const markQuotesRead = () => {
    loadQuoteCounts();
  };

  return {
    counts,
    isSupplier,
    markMessagesRead,
    markQuotesRead,
  };
};
