import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type PublicService = Tables<"public_services">;
type Category = Tables<"categories">;

export default function UserServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<PublicService[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [s, c] = await Promise.all([
        supabase.from("public_services").select("*").eq("status", true).order("name"),
        supabase.from("categories").select("*").eq("status", true).order("name"),
      ]);
      setServices(s.data || []);
      setCategories(c.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const service = services.find((s) => s.id === selectedService);
  const totalCharge = service ? (service.retail_rate / 1000) * quantity : 0;

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !service) return;
    if (quantity < service.min || quantity > service.max) {
      toast.error(`Quantity must be between ${service.min} and ${service.max}`);
      return;
    }
    if (!link.trim()) { toast.error("Link is required"); return; }

    setSubmitting(true);

    // Check wallet
    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", user.id).single();
    if (!profile || profile.wallet_balance < totalCharge) {
      toast.error("Insufficient balance");
      setSubmitting(false);
      return;
    }

    // Deduct wallet
    await supabase.from("profiles").update({ wallet_balance: profile.wallet_balance - totalCharge }).eq("user_id", user.id);

    // Create order
    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      public_service_id: service.id,
      link,
      quantity,
      charge: totalCharge,
      status: "pending",
    });

    if (error) {
      // Refund on error
      await supabase.from("profiles").update({ wallet_balance: profile.wallet_balance }).eq("user_id", user.id);
      toast.error("Failed to place order");
    } else {
      // Create transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "debit",
        amount: totalCharge,
        description: `Order: ${service.name}`,
      });
      toast.success("Order placed successfully!");
      setLink("");
      setQuantity(0);
      setSelectedService("");
    }
    setSubmitting(false);
  };

  const getCatName = (id: string | null) => categories.find((c) => c.id === id)?.name || "";

  // Group by category
  const grouped = categories.map((c) => ({
    ...c,
    services: services.filter((s) => s.category_id === c.id),
  })).filter((g) => g.services.length > 0);

  const uncategorized = services.filter((s) => !s.category_id);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight">New Order</h2>
      <Card className="shadow-sm border-border/50">
        <CardContent className="pt-6">
          <form onSubmit={handleOrder} className="space-y-4">
            <div className="space-y-2">
              <Label>Service</Label>
              <Select value={selectedService} onValueChange={(v) => { setSelectedService(v); const s = services.find((x) => x.id === v); if (s) setQuantity(s.min); }}>
                <SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger>
                <SelectContent>
                  {grouped.map((g) => (
                    <div key={g.id}>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{g.name}</div>
                      {g.services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} — ${s.retail_rate}/1K
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                  {uncategorized.length > 0 && uncategorized.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — ${s.retail_rate}/1K</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {service?.description && <p className="text-xs text-muted-foreground">{service.description}</p>}
            </div>
            <div className="space-y-2">
              <Label>Link</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." required />
            </div>
            <div className="space-y-2">
              <Label>Quantity {service ? `(${service.min} - ${service.max})` : ""}</Label>
              <Input type="number" value={quantity || ""} onChange={(e) => setQuantity(Number(e.target.value))} min={service?.min || 1} max={service?.max || 10000} required />
            </div>
            {service && quantity > 0 && (
              <div className="rounded-lg bg-accent p-3 text-sm">
                <span className="text-muted-foreground">Total charge: </span>
                <span className="font-bold text-foreground">${totalCharge.toFixed(4)}</span>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={submitting || !selectedService}>
              {submitting ? "Placing order..." : "Place Order"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
