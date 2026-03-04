import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

type PublicService = Tables<"public_services">;
type Category = Tables<"categories">;

export default function UserServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<PublicService[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedService, setSelectedService] = useState("");
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

  const filteredServices = selectedCategory
    ? services.filter((s) => s.category_id === selectedCategory)
    : services;

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

    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", user.id).single();
    if (!profile || profile.wallet_balance < totalCharge) {
      toast.error("Insufficient balance");
      setSubmitting(false);
      return;
    }

    await supabase.from("profiles").update({ wallet_balance: profile.wallet_balance - totalCharge }).eq("user_id", user.id);

    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      public_service_id: service.id,
      link,
      quantity,
      charge: totalCharge,
      status: "pending",
    });

    if (error) {
      await supabase.from("profiles").update({ wallet_balance: profile.wallet_balance }).eq("user_id", user.id);
      toast.error("Failed to place order");
    } else {
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
      setSelectedCategory("");
    }
    setSubmitting(false);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">New Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOrder} className="space-y-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Category</Label>
              <Select
                value={selectedCategory || "__all__"}
                onValueChange={(v) => {
                  setSelectedCategory(v === "__all__" ? "" : v);
                  setSelectedService("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Service</Label>
              <Select
                value={selectedService || "__none__"}
                onValueChange={(v) => {
                  const id = v === "__none__" ? "" : v;
                  setSelectedService(id);
                  const s = services.find((x) => x.id === id);
                  if (s) setQuantity(s.min);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="__none__">Select a service</SelectItem>
                  {filteredServices.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="line-clamp-1">{s.name} — ${s.retail_rate}/1K</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            {service?.description && (
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Description</Label>
                <div className="w-full rounded-md border border-input bg-muted p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap break-words" style={{ overflowWrap: "anywhere" }}>
                  {service.description}
                </div>
              </div>
            )}

            {/* Link */}
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Link</Label>
              <Input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com/post"
                required
                className="w-full"
              />
            </div>

            {/* Quantity & Charge */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Quantity</Label>
                <Input
                  type="number"
                  value={quantity || ""}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min={service?.min || 1}
                  max={service?.max || 10000}
                  required
                  placeholder={service ? `${service.min} – ${service.max}` : ""}
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Charge</Label>
                <div className="flex items-center h-10 rounded-md border border-input bg-muted px-3">
                  <span className="text-sm font-semibold text-foreground">
                    ${totalCharge.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Rate info */}
            {service && (
              <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-xs">
                <span className="text-muted-foreground">Rate per 1K</span>
                <span className="font-semibold text-foreground">${service.retail_rate}</span>
              </div>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={submitting || !selectedService}>
              {submitting ? "Placing order…" : "Place Order"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
