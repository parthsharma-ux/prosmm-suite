import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type ServiceMap = Tables<"service_provider_map">;
type PublicService = Tables<"public_services">;
type ProviderService = Tables<"provider_services">;

export default function AdminMapping() {
  const [mappings, setMappings] = useState<ServiceMap[]>([]);
  const [publicServices, setPublicServices] = useState<PublicService[]>([]);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ public_service_id: "", provider_service_id: "", priority: 1, custom_margin: 0, failover_enabled: false });

  const fetchData = async () => {
    const [m, ps, pvs] = await Promise.all([
      supabase.from("service_provider_map").select("*").order("priority"),
      supabase.from("public_services").select("*").order("name"),
      supabase.from("provider_services").select("*").order("name"),
    ]);
    setMappings(m.data || []);
    setPublicServices(ps.data || []);
    setProviderServices(pvs.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.public_service_id || !form.provider_service_id) { toast.error("Select both services"); return; }
    const { error } = await supabase.from("service_provider_map").insert({
      ...form, priority: Number(form.priority), custom_margin: Number(form.custom_margin),
    });
    if (error) toast.error(error.message); else { toast.success("Mapping added"); setDialogOpen(false); fetchData(); }
  };

  const del = async (id: string) => { if (!confirm("Remove?")) return; await supabase.from("service_provider_map").delete().eq("id", id); fetchData(); };

  const toggleFailover = async (m: ServiceMap) => {
    await supabase.from("service_provider_map").update({ failover_enabled: !m.failover_enabled }).eq("id", m.id);
    fetchData();
  };

  const getPublicName = (id: string) => publicServices.find((s) => s.id === id)?.name || id;
  const getProviderName = (id: string) => providerServices.find((s) => s.id === id)?.name || id;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">API Mapping</h2>
        <Button size="sm" onClick={() => { setForm({ public_service_id: "", provider_service_id: "", priority: 1, custom_margin: 0, failover_enabled: false }); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Mapping</Button>
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Public Service</TableHead>
              <TableHead>Provider Service</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Margin</TableHead>
              <TableHead>Failover</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No mappings</TableCell></TableRow>}
            {mappings.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium max-w-32 truncate">{getPublicName(m.public_service_id)}</TableCell>
                <TableCell className="max-w-32 truncate">{getProviderName(m.provider_service_id)}</TableCell>
                <TableCell>{m.priority}</TableCell>
                <TableCell>{m.custom_margin}%</TableCell>
                <TableCell><Switch checked={m.failover_enabled} onCheckedChange={() => toggleFailover(m)} /></TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => del(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Mapping</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Public Service</Label>
              <Select value={form.public_service_id} onValueChange={(v) => setForm({ ...form, public_service_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{publicServices.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Provider Service</Label>
              <Select value={form.provider_service_id} onValueChange={(v) => setForm({ ...form, provider_service_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{providerServices.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Priority</Label><Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Custom Margin %</Label><Input type="number" step="0.01" value={form.custom_margin} onChange={(e) => setForm({ ...form, custom_margin: Number(e.target.value) })} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.failover_enabled} onCheckedChange={(v) => setForm({ ...form, failover_enabled: v })} /><Label>Enable Failover</Label></div>
            <Button onClick={handleSave} className="w-full">Add Mapping</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
