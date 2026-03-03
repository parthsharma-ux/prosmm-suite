import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type PaymentRequest = Tables<"payment_requests">;

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  approved: "bg-success/10 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function UserFunds() {
  const { user } = useAuth();
  const [method, setMethod] = useState<string>("upi");
  const [amount, setAmount] = useState(0);
  const [reference, setReference] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = () => {
    if (!user) return;
    supabase.from("payment_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      setPayments(data || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchPayments(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || amount <= 0 || !reference.trim()) { toast.error("Fill all fields"); return; }
    setSubmitting(true);

    let screenshotUrl: string | null = null;
    if (screenshot) {
      const path = `${user.id}/${Date.now()}-${screenshot.name}`;
      const { error: uploadErr } = await supabase.storage.from("payment-screenshots").upload(path, screenshot);
      if (uploadErr) { toast.error("Screenshot upload failed"); setSubmitting(false); return; }
      screenshotUrl = path;
    }

    const { error } = await supabase.from("payment_requests").insert({
      user_id: user.id,
      method: method as "upi" | "usdt",
      amount,
      reference: reference.trim(),
      screenshot_url: screenshotUrl,
    });

    if (error) {
      if (error.message.includes("duplicate")) toast.error("This reference has already been submitted");
      else toast.error(error.message);
    } else {
      toast.success("Payment request submitted!");
      setAmount(0);
      setReference("");
      setScreenshot(null);
      fetchPayments();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight">Add Funds</h2>
      <Card className="shadow-sm border-border/50">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="usdt">USDT (TRC20)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input type="number" step="0.01" min="1" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} required />
            </div>
            <div className="space-y-2">
              <Label>{method === "upi" ? "UTR Number" : "Transaction ID"}</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} required placeholder="Enter reference" />
            </div>
            <div className="space-y-2">
              <Label>Screenshot (optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files?.[0] || null)} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <h3 className="text-lg font-semibold">Payment History</h3>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payments yet</TableCell></TableRow>}
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="uppercase font-medium text-xs">{p.method}</TableCell>
                <TableCell>${p.amount}</TableCell>
                <TableCell className="font-mono text-xs max-w-32 truncate">{p.reference}</TableCell>
                <TableCell><Badge variant="outline" className={statusColors[p.status] || ""}>{p.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
