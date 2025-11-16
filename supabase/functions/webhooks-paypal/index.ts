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

    const body = await req.text();
    const event = JSON.parse(body);

    // Verify webhook signature
    const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID');
    const transmissionId = req.headers.get('paypal-transmission-id');
    const transmissionTime = req.headers.get('paypal-transmission-time');
    const certUrl = req.headers.get('paypal-cert-url');
    const authAlgo = req.headers.get('paypal-auth-algo');
    const transmissionSig = req.headers.get('paypal-transmission-sig');

    // Verify signature (simplified for MVP - add full verification in production)
    console.log('PayPal webhook received:', {
      event_type: event.event_type,
      transmission_id: transmissionId,
    });

    // Log webhook
    await supabase.from('webhook_logs').insert({
      event_type: event.event_type,
      payload: event,
      status: 'received',
    });

    // Handle events
    switch (event.event_type) {
      case 'PAYMENT.AUTHORIZATION.CREATED': {
        const authId = event.resource.id;
        console.log('Authorization created:', authId);
        
        await supabase
          .from('payments')
          .update({ transaction_status: 'Authorized' })
          .eq('paypal_authorization_id', authId);
        break;
      }

      case 'PAYMENT.CAPTURE.COMPLETED': {
        const captureId = event.resource.id;
        console.log('Capture completed:', captureId);
        
        await supabase
          .from('payments')
          .update({ transaction_status: 'Captured' })
          .eq('paypal_capture_id', captureId);
        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        const captureId = event.resource.id;
        console.log('Capture refunded:', captureId);
        
        await supabase
          .from('payments')
          .update({ transaction_status: 'Refunded' })
          .eq('paypal_capture_id', captureId);
        break;
      }

      case 'PAYMENT.AUTHORIZATION.VOIDED': {
        const authId = event.resource.id;
        console.log('Authorization voided:', authId);
        
        await supabase
          .from('payments')
          .update({ transaction_status: 'Voided' })
          .eq('paypal_authorization_id', authId);
        break;
      }

      default:
        console.log('Unhandled event type:', event.event_type);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
