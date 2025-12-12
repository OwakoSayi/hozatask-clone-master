import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference, user_id } = await req.json();

    if (!reference || !user_id) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing reference or user_id" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ success: false, message: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackResponse.json();
    console.log("Paystack verification:", paystackData);

    if (!paystackData.status || paystackData.data?.status !== 'success') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Payment not verified",
          status: paystackData.data?.status 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get supplier for this user
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (supplierError || !supplier) {
      console.error("Supplier not found:", supplierError);
      return new Response(
        JSON.stringify({ success: false, message: "Supplier account not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get pro account
    const { data: proAccount, error: proError } = await supabase
      .from('pro_accounts')
      .select('id, credits')
      .eq('supplier_id', supplier.id)
      .single();

    if (proError || !proAccount) {
      console.error("Pro account not found:", proError);
      return new Response(
        JSON.stringify({ success: false, message: "Pro account not found" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the reference to get purchase type
    const refParts = reference.split('_');
    const purchaseType = refParts[0]; // 'credits' or 'sub'

    if (purchaseType === 'credits') {
      const packageId = refParts[1];
      
      // Get package details
      const { data: pkg, error: pkgError } = await supabase
        .from('credit_packages')
        .select('credits, bonus_credits, name')
        .eq('id', packageId)
        .single();

      if (pkgError || !pkg) {
        console.error("Package not found:", pkgError);
        return new Response(
          JSON.stringify({ success: false, message: "Credit package not found" }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const totalCredits = pkg.credits + (pkg.bonus_credits || 0);

      // Update credits
      const { error: updateError } = await supabase
        .from('pro_accounts')
        .update({ credits: proAccount.credits + totalCredits })
        .eq('id', proAccount.id);

      if (updateError) {
        console.error("Error updating credits:", updateError);
        return new Response(
          JSON.stringify({ success: false, message: "Failed to add credits" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Record transaction
      await supabase.from('credit_transactions').insert({
        pro_account_id: proAccount.id,
        amount: totalCredits,
        transaction_type: 'purchase',
        description: `Purchased ${pkg.name}`,
        payment_reference: reference,
      });

      return new Response(
        JSON.stringify({
          success: true,
          type: 'credits',
          credits_added: totalCredits,
          new_balance: proAccount.credits + totalCredits,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (purchaseType === 'sub') {
      const planName = refParts[1];

      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('plan, leads_per_month, name')
        .eq('plan', planName)
        .single();

      if (planError || !plan) {
        console.error("Plan not found:", planError);
        return new Response(
          JSON.stringify({ success: false, message: "Subscription plan not found" }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate subscription end date (1 month from now)
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      // Update subscription
      const { error: updateError } = await supabase
        .from('pro_accounts')
        .update({ 
          subscription_plan: plan.plan,
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq('id', proAccount.id);

      if (updateError) {
        console.error("Error updating subscription:", updateError);
        return new Response(
          JSON.stringify({ success: false, message: "Failed to update subscription" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Record transaction
      await supabase.from('credit_transactions').insert({
        pro_account_id: proAccount.id,
        amount: 0,
        transaction_type: 'subscription',
        description: `Subscribed to ${plan.name}`,
        payment_reference: reference,
      });

      return new Response(
        JSON.stringify({
          success: true,
          type: 'subscription',
          plan: plan.plan,
          expires_at: expiresAt.toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: "Unknown purchase type" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Error processing purchase:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
