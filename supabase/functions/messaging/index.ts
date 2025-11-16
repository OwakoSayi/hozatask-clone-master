import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const url = new URL(req.url);
    const method = req.method;
    const taskId = url.searchParams.get('task_id');

    // GET /messaging?task_id=xxx - Get messages
    if (method === 'GET' && taskId) {
      const { data: messages, error } = await supabase
        .from('task_messages')
        .select(`
          *,
          sender:users!sender_user_id(name, surname)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify({ messages }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /messaging - Send message with anti-contact enforcement
    if (method === 'POST') {
      const body = await req.json();
      const { task_id, content } = body;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      // Anti-contact patterns (phone, email, WhatsApp, URLs)
      const blockedPatterns = [
        /\d{10,}/,                                    // Phone numbers (10+ digits)
        /\+?\d{1,3}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}/, // International phone
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,         // Email
        /whatsapp|wa\.me|telegram|signal/i,           // Messaging apps
        /(https?:\/\/|www\.)[^\s]+/,                  // URLs
      ];

      for (const pattern of blockedPatterns) {
        if (pattern.test(content)) {
          console.warn('Blocked message with contact info:', { user_id: user.id, task_id });
          return new Response(
            JSON.stringify({ 
              error: 'Contact information sharing is not allowed. Please keep communication within the platform.',
              blocked: true,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const { data: message, error } = await supabase
        .from('task_messages')
        .insert({
          task_id,
          sender_user_id: user.id,
          content,
          metadata: {},
        })
        .select(`
          *,
          sender:users!sender_user_id(name, surname)
        `)
        .single();

      if (error) throw error;

      console.log('Message sent:', message.message_id);

      return new Response(
        JSON.stringify({ message }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Messaging error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
