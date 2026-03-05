import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { public_service_id, link, quantity } = await req.json();
    if (!public_service_id || !link || !quantity) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: corsHeaders });
    }

    // Get service
    const { data: service, error: sErr } = await supabase
      .from("public_services")
      .select("*")
      .eq("id", public_service_id)
      .single();
    if (sErr || !service) return new Response(JSON.stringify({ error: "Service not found" }), { status: 404, headers: corsHeaders });

    if (quantity < service.min || quantity > service.max) {
      return new Response(JSON.stringify({ error: `Quantity must be ${service.min}-${service.max}` }), { status: 400, headers: corsHeaders });
    }

    const charge = (service.retail_rate / 1000) * quantity;

    // Check balance
    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", user.id).single();
    if (!profile || profile.wallet_balance < charge) {
      return new Response(JSON.stringify({ error: "Insufficient balance" }), { status: 400, headers: corsHeaders });
    }

    // Deduct balance
    await supabase.from("profiles").update({ wallet_balance: profile.wallet_balance - charge }).eq("user_id", user.id);

    // Get provider mapping (highest priority)
    const { data: mapping } = await supabase
      .from("service_provider_map")
      .select("*, provider_service:provider_services(*, provider:providers(*))")
      .eq("public_service_id", public_service_id)
      .order("priority", { ascending: true })
      .limit(1)
      .single();

    let providerOrderId: string | null = null;
    let providerId: string | null = null;
    let orderStatus = "pending";

    if (mapping?.provider_service?.provider) {
      const provider = mapping.provider_service.provider;
      const providerService = mapping.provider_service;

      if (provider.status) {
        try {
          const apiUrl = provider.api_url.replace(/\/$/, "");
          const params = new URLSearchParams({
            key: provider.api_key,
            action: "add",
            service: providerService.external_service_id,
            link,
            quantity: String(quantity),
          });

          const apiRes = await fetch(`${apiUrl}?${params.toString()}`);
          const apiData = await apiRes.json();

          if (apiData.order) {
            providerOrderId = String(apiData.order);
            providerId = provider.id;
            orderStatus = "processing";
          }
        } catch (e) {
          console.error("Provider API error:", e);
          // Order still created as pending
        }
      }
    }

    // Create order
    const { data: order, error: oErr } = await supabase.from("orders").insert({
      user_id: user.id,
      public_service_id: service.id,
      link,
      quantity,
      charge,
      status: orderStatus,
      provider_id: providerId,
      provider_order_id: providerOrderId,
    }).select().single();

    if (oErr) {
      // Refund
      await supabase.from("profiles").update({ wallet_balance: profile.wallet_balance }).eq("user_id", user.id);
      return new Response(JSON.stringify({ error: "Failed to create order" }), { status: 500, headers: corsHeaders });
    }

    // Transaction log
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "debit",
      amount: charge,
      description: `Order: ${service.name}`,
    });

    return new Response(
      JSON.stringify({ success: true, order_id: order.id, provider_order_id: providerOrderId, status: orderStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
