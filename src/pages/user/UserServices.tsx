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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-t-transparent" />
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">New Order</h2>

      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
        <form onSubmit={handleOrder} className="space-y-5">
          {/* Category & Service — 2-col on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedService("");
                }}
                className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Service */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Service</label>
              <select
                value={selectedService}
                onChange={(e) => {
                  setSelectedService(e.target.value);
                  const s = services.find((x) => x.id === e.target.value);
                  if (s) setQuantity(s.min);
                }}
                className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">Select a service</option>
                {filteredServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ${s.retail_rate}/1K
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description (read-only) */}
          {service?.description && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                readOnly
                value={service.description}
                className="w-full min-h-[120px] resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:outline-none"
              />
            </div>
          )}

          {/* Link */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Link</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com/post"
              required
              className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Quantity & Charge — 2-col */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Quantity {service ? <span className="text-gray-400 font-normal">({service.min} – {service.max})</span> : ""}
              </label>
              <input
                type="number"
                value={quantity || ""}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={service?.min || 1}
                max={service?.max || 10000}
                required
                className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Charge</label>
              <div className="flex items-center h-10 rounded-lg border border-gray-200 bg-gray-50 px-3">
                <span className="text-sm font-semibold text-gray-900">
                  ${totalCharge.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* Rate info */}
          {service && (
            <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 px-4 py-2.5 text-sm">
              <span className="text-gray-500">Rate per 1K</span>
              <span className="font-medium text-gray-900">${service.retail_rate}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !selectedService}
            className="w-full h-11 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Placing order…" : "Place Order"}
          </button>
        </form>
      </div>
    </div>
  );
}
