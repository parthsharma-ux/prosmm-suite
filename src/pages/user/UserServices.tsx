import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
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
      <h2 className="text-base font-semibold text-foreground mb-3">New Order</h2>

      <div className="bg-card border border-border shadow-sm rounded-xl p-4 md:p-6">
        <form onSubmit={handleOrder} className="space-y-4">
          {/* Category */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedService("");
              }}
              className="block w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Service</label>
            <select
              value={selectedService}
              onChange={(e) => {
                setSelectedService(e.target.value);
                const s = services.find((x) => x.id === e.target.value);
                if (s) setQuantity(s.min);
              }}
              className="block w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a service</option>
              {filteredServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — ${s.retail_rate}/1K
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          {service?.description && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
              <div className="w-full min-h-[100px] rounded-md border border-input bg-muted p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
                {service.description}
              </div>
            </div>
          )}

          {/* Link */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Link</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com/post"
              required
              className="block w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Quantity & Charge */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Quantity
              </label>
              <input
                type="number"
                value={quantity || ""}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={service?.min || 1}
                max={service?.max || 10000}
                required
                placeholder={service ? `${service.min} – ${service.max}` : ""}
                className="block w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Charge</label>
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
          <button
            type="submit"
            disabled={submitting || !selectedService}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Placing order…" : "Place Order"}
          </button>
        </form>
      </div>
    </div>
  );
}
