import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"public_services">;
type Category = Tables<"categories">;

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ category_id: "", name: "", description: "", retail_rate: 0, min: 1, max: 10000 });

  const fetchData = async () => {
    const [s, c] = await Promise.all([
      supabase.from("public_services").select("*").order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);
    setServices(s.data || []);
    setCategories(c.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ category_id: "", name: "", description: "", retail_rate: 0, min: 1, max: 10000 });
    setDialogOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({ category_id: s.category_id || "", name: s.name, description: s.description || "", retail_rate: s.retail_rate, min: s.min, max: s.max });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Name required"); return; }
    const payload = { ...form, category_id: form.category_id || null, retail_rate: Number(form.retail_rate), min: Number(form.min), max: Number(form.max) };
    if (editing) {
      const { error } = await supabase.from("public_services").update(payload).eq("id", editing.id);
      if (error) toast.error(error.message); else { toast.success("Updated"); setDialogOpen(false); fetchData(); }
    } else {
      const { error } = await supabase.from("public_services").insert(payload);
      if (error) toast.error(error.message); else { toast.success("Created"); setDialogOpen(false); fetchData(); }
    }
  };

  const toggle = async (s: Service) => { await supabase.from("public_services").update({ status: !s.status }).eq("id", s.id); fetchData(); };
  const del = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("public_services").delete().eq("id", id); toast.success("Deleted"); fetchData(); };

  const getCategoryName = (id: string | null) => categories.find((c) => c.id === id)?.name || "—";

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Public Services</h2>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Service</Button>
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Min/Max</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No services</TableCell></TableRow>}
            {services.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium max-w-48 truncate">{s.name}</TableCell>
                <TableCell>{getCategoryName(s.category_id)}</TableCell>
                <TableCell>${s.retail_rate}</TableCell>
                <TableCell>{s.min} / {s.max}</TableCell>
                <TableCell><Switch checked={s.status} onCheckedChange={() => toggle(s)} /></TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Service</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Retail Rate ($)</Label><Input type="number" step="0.01" value={form.retail_rate} onChange={(e) => setForm({ ...form, retail_rate: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Min</Label><Input type="number" value={form.min} onChange={(e) => setForm({ ...form, min: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Max</Label><Input type="number" value={form.max} onChange={(e) => setForm({ ...form, max: Number(e.target.value) })} /></div>
            </div>
            <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
