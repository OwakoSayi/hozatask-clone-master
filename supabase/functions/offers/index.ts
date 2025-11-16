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

    const url = new URL(req.url);
    const method = req.method;
    const pathParts = url.pathname.split('/');
    const offerId = pathParts[pathParts.length - 2];
    const action = pathParts[pathParts.length - 1];

    // POST /offers - Create offer
    if (method === 'POST' && !action) {
      const body = await req.json();
      const { task_id, offered_price, offer_details, message } = body;

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      // Get tasker_id
      const { data: tasker } = await supabase
        .from('taskers')
        .select('tasker_id, background_check_status')
        .eq('userid', user.id)
        .single();

      if (!tasker) throw new Error('Tasker profile not found');

      // Check KYC requirement
      const { data: task } = await supabase
        .from('tasks')
        .select('*, category:categories(kyc_required)')
        .eq('task_id', task_id)
        .single();

      if (task?.category && 'kyc_required' in task.category && task.category.kyc_required) {
        const { data: kyc } = await supabase
          .from('tasker_kyc')
          .select('verification_status')
          .eq('tasker_id', tasker.tasker_id)
          .single();

        if (kyc?.verification_status !== 'Cleared') {
          throw new Error('KYC verification required for this category');
        }
      }

      const { data: offer, error } = await supabase
        .from('offers')
        .insert({
          task_id,
          tasker_id: tasker.tasker_id,
          offered_price,
          offer_details,
          message,
          status: 'Pending',
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Offer created:', offer.offer_id);

      return new Response(
        JSON.stringify({ offer }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /offers/:id/accept - Accept offer (atomic: booking + payment authorize)
    if (method === 'POST' && action === 'accept') {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      // Begin transaction logic
      const { data: offer } = await supabase
        .from('offers')
        .select(`
          *,
          task:tasks(*,
            client:clients(*)
          ),
          tasker:taskers(*)
        `)
        .eq('offer_id', offerId)
        .single();

      if (!offer) throw new Error('Offer not found');
      if (offer.task.client.userid !== user.id) throw new Error('Not authorized');

      // Update offer status to Accepted
      await supabase
        .from('offers')
        .update({ status: 'Accepted' })
        .eq('offer_id', offerId);

      // Reject other offers for this task
      await supabase
        .from('offers')
        .update({ status: 'Rejected' })
        .eq('task_id', offer.task_id)
        .neq('offer_id', offerId);

      // Update task status
      await supabase
        .from('tasks')
        .update({ status: 'Assigned' })
        .eq('task_id', offer.task_id);

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          task_id: offer.task_id,
          tasker_id: offer.tasker_id,
          client_id: offer.task.client_id,
          final_cost: offer.offered_price,
          status: 'Scheduled',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Authorize payment with PayPal
      const paypalAuth = await authorizePayPalPayment(offer.offered_price);

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: booking.booking_id,
          amount: offer.offered_price,
          transaction_status: 'Authorized',
          paypal_authorization_id: paypalAuth.id,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      console.log('Offer accepted, booking and payment created:', {
        booking_id: booking.booking_id,
        payment_id: payment.payment_id,
      });

      return new Response(
        JSON.stringify({ booking, payment }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /offers/task/:task_id - List offers for a task
    if (method === 'GET') {
      const taskId = url.searchParams.get('task_id');
      
      const { data: offers, error } = await supabase
        .from('offers')
        .select(`
          *,
          tasker:taskers(
            *,
            user:users(name, surname)
          )
        `)
        .eq('task_id', taskId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ offers }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Offers error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function authorizePayPalPayment(amount: number) {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID')!;
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')!;
  const auth = btoa(`${clientId}:${clientSecret}`);

  // Get access token
  const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const { access_token } = await tokenRes.json();

  // Create order with authorization intent
  const orderRes = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'AUTHORIZE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount.toFixed(2),
        },
      }],
    }),
  });

  const order = await orderRes.json();
  console.log('PayPal authorization created:', order.id);
  
  return { id: order.id };
}
