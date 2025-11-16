import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify admin role
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('userid', user.id)
      .single();

    if (userData?.role !== 'Admin') {
      throw new Error('Admin access required');
    }

    const url = new URL(req.url);
    const method = req.method;
    const pathParts = url.pathname.split('/');
    const resource = pathParts[pathParts.length - 2];
    const id = pathParts[pathParts.length - 1];

    // GET /admin/taskers/pending - Get pending KYC
    if (method === 'GET' && resource === 'pending') {
      const { data: kycs, error } = await supabase
        .from('tasker_kyc')
        .select(`
          *,
          tasker:taskers(
            *,
            user:users(name, surname, email)
          )
        `)
        .eq('verification_status', 'Pending');

      if (error) throw error;

      return new Response(
        JSON.stringify({ kycs }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PATCH /admin/tasker/:id/approve - Approve tasker
    if (method === 'PATCH' && pathParts.includes('approve')) {
      const body = await req.json();
      const { notes } = body;

      // Update KYC status
      await supabase
        .from('tasker_kyc')
        .update({
          verification_status: 'Cleared',
          verification_date: new Date().toISOString(),
        })
        .eq('tasker_id', id);

      // Activate tasker
      await supabase
        .from('taskers')
        .update({
          is_active: true,
          background_check_status: 'Cleared',
        })
        .eq('tasker_id', id);

      // Log admin action
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: user.id,
          action_type: 'APPROVE_TASKER',
          target_user_id: id,
          details: notes || 'Tasker approved',
        });

      console.log('Tasker approved:', id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PATCH /admin/tasker/:id/reject - Reject tasker
    if (method === 'PATCH' && pathParts.includes('reject')) {
      const body = await req.json();
      const { notes } = body;

      await supabase
        .from('tasker_kyc')
        .update({
          verification_status: 'Rejected',
          verification_date: new Date().toISOString(),
        })
        .eq('tasker_id', id);

      await supabase
        .from('taskers')
        .update({
          background_check_status: 'Rejected',
          is_active: false,
        })
        .eq('tasker_id', id);

      await supabase
        .from('admin_actions')
        .insert({
          admin_id: user.id,
          action_type: 'REJECT_TASKER',
          target_user_id: id,
          details: notes || 'Tasker rejected',
        });

      console.log('Tasker rejected:', id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /admin/logs - Get admin action logs
    if (method === 'GET' && resource === 'logs') {
      const { data: logs, error } = await supabase
        .from('admin_actions')
        .select(`
          *,
          admin:users!admin_id(name, surname, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return new Response(
        JSON.stringify({ logs }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
