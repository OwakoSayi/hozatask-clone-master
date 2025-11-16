import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    const body = await req.json();

    switch (path) {
      case 'register': {
        const { email, password, name, surname, phone_number } = body;
        
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (authError) throw authError;

        // Create user record with hashed password
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            userid: authData.user.id,
            name,
            surname,
            email,
            password_hash: 'managed_by_auth',
            phone_number,
            role: 'User',
          })
          .select()
          .single();

        if (userError) throw userError;

        // Create client profile
        const { error: clientError } = await supabase
          .from('clients')
          .insert({ userid: authData.user.id });

        if (clientError) throw clientError;

        return new Response(
          JSON.stringify({ user: userData, auth_user: authData.user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'login': {
        const { email, password } = body;
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'refresh': {
        const { refresh_token } = body;
        
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token,
        });

        if (error) throw error;

        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Auth error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
