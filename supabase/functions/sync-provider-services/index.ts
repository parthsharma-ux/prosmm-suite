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

    // Verify user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: hasAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!hasAdmin) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });

    const { provider_id } = await req.json();
    if (!provider_id) return new Response(JSON.stringify({ error: "provider_id required" }), { status: 400, headers: corsHeaders });

    // Get provider
    const { data: provider, error: pErr } = await supabase.from("providers").select("*").eq("id", provider_id).single();
    if (pErr || !provider) return new Response(JSON.stringify({ error: "Provider not found" }), { status: 404, headers: corsHeaders });

    // Call provider API to get services
    const apiUrl = provider.api_url.replace(/\/$/, "");
    const params = new URLSearchParams({ key: provider.api_key, action: "services" });
    const apiRes = await fetch(`${apiUrl}?${params.toString()}`);
    
    if (!apiRes.ok) {
      return new Response(JSON.stringify({ error: `API returned ${apiRes.status}` }), { status: 502, headers: corsHeaders });
    }

    const services = await apiRes.json();

    if (!Array.isArray(services)) {
      return new Response(JSON.stringify({ error: "Invalid API response - expected array" }), { status: 502, headers: corsHeaders });
    }

    let synced = 0;
    let updated = 0;

    for (const svc of services) {
      const serviceData = {
        provider_id: provider.id,
        external_service_id: String(svc.service),
        name: svc.name || `Service ${svc.service}`,
        rate: parseFloat(svc.rate) || 0,
        min: parseInt(svc.min) || 1,
        max: parseInt(svc.max) || 10000,
        type: svc.type || null,
        description: svc.description || svc.category || null,
      };

      const { data: existing } = await supabase
        .from("provider_services")
        .select("id")
        .eq("provider_id", provider.id)
        .eq("external_service_id", serviceData.external_service_id)
        .maybeSingle();

      if (existing) {
        await supabase.from("provider_services").update({
          name: serviceData.name,
          rate: serviceData.rate,
          min: serviceData.min,
          max: serviceData.max,
          type: serviceData.type,
          description: serviceData.description,
        }).eq("id", existing.id);
        updated++;
      } else {
        await supabase.from("provider_services").insert(serviceData);
        synced++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced, updated, total: services.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
