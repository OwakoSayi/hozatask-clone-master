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
    const method = req.method;
    const pathParts = url.pathname.split('/');
    const bookingId = pathParts[pathParts.length - 2];
    const action = pathParts[pathParts.length - 1];

    // POST /payments/:booking_id/capture - Capture payment
    if (method === 'POST' && action === 'capture') {
      const { data: payment } = await supabase
        .from('payments')
        .select('*, booking:bookings(*)')
        .eq('booking_id', bookingId)
        .single();

      if (!payment) throw new Error('Payment not found');
      if (payment.transaction_status !== 'Authorized') {
        throw new Error('Payment not in Authorized state');
      }

      // Capture with PayPal
      const captureData = await capturePayPalPayment(payment.paypal_authorization_id);

      // Calculate platform fee (10%)
      const platformFee = payment.amount * 0.10;
      const taskerPayout = payment.amount - platformFee;

      // Update payment record
      const { data: updatedPayment, error } = await supabase
        .from('payments')
        .update({
          transaction_status: 'Captured',
          paypal_capture_id: captureData.id,
          platform_fee: platformFee,
          tasker_payout: taskerPayout,
        })
        .eq('booking_id', bookingId)
        .select()
        .single();

      if (error) throw error;

      // Update booking status
      await supabase
        .from('bookings')
        .update({ status: 'Completed' })
        .eq('booking_id', bookingId);

      console.log('Payment captured:', {
        payment_id: updatedPayment.payment_id,
        capture_id: captureData.id,
      });

      return new Response(
        JSON.stringify({ payment: updatedPayment }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /payments/:booking_id/refund - Refund payment
    if (method === 'POST' && action === 'refund') {
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (!payment) throw new Error('Payment not found');

      if (payment.transaction_status === 'Authorized') {
        // Void authorization
        await voidPayPalAuthorization(payment.paypal_authorization_id);
        
        await supabase
          .from('payments')
          .update({ transaction_status: 'Voided' })
          .eq('booking_id', bookingId);

        console.log('Authorization voided:', payment.paypal_authorization_id);
      } else if (payment.transaction_status === 'Captured') {
        // Refund capture
        const refundData = await refundPayPalPayment(payment.paypal_capture_id);
        
        await supabase
          .from('payments')
          .update({ transaction_status: 'Refunded' })
          .eq('booking_id', bookingId);

        console.log('Payment refunded:', refundData.id);
      }

      // Update booking status
      await supabase
        .from('bookings')
        .update({ status: 'Cancelled' })
        .eq('booking_id', bookingId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /payments/:booking_id - Get payment details
    if (method === 'GET') {
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ payment }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Payments error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getPayPalAccessToken() {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID')!;
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')!;
  const auth = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  return data.access_token;
}

async function capturePayPalPayment(authorizationId: string) {
  const token = await getPayPalAccessToken();

  const res = await fetch(
    `https://api-m.sandbox.paypal.com/v2/payments/authorizations/${authorizationId}/capture`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return await res.json();
}

async function voidPayPalAuthorization(authorizationId: string) {
  const token = await getPayPalAccessToken();

  const res = await fetch(
    `https://api-m.sandbox.paypal.com/v2/payments/authorizations/${authorizationId}/void`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return await res.json();
}

async function refundPayPalPayment(captureId: string) {
  const token = await getPayPalAccessToken();

  const res = await fetch(
    `https://api-m.sandbox.paypal.com/v2/payments/captures/${captureId}/refund`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return await res.json();
}
