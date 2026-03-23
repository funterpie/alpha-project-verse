import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Client = Tables<'clients'>;
const emptyClient = { name: '', company: '', email: '', phone: '', project_assigned: '', notes: '' };

export default function Clients() {
  const { isAdmin, user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyClient);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data || []);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (editing) {
      await supabase.from('clients').update(form).eq('id', editing.id);
      await supabase.from('activity_logs').insert({ user_id: user!.id, user_name: user!.user_metadata?.display_name || '', action: `updated client "${form.name}"` });
    } else {
      await supabase.from('clients').insert(form);
      await supabase.from('activity_logs').insert({ user_id: user!.id, user_name: user!.user_metadata?.display_name || '', action: `added client "${form.name}"` });
    }
    setOpen(false);
    setEditing(null);
    setForm(emptyClient);
    load();
  };

  const remove = async (c: Client) => {
    await supabase.from('clients').delete().eq('id', c.id);
    await supabase.from('activity_logs').insert({ user_id: user!.id, user_name: user!.user_metadata?.display_name || '', action: `removed client "${c.name}"` });
    load();
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, company: c.company, email: c.email, phone: c.phone, project_assigned: c.project_assigned, notes: c.notes });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clients</h2>
          <p className="text-sm text-muted-foreground">{clients.length} clients</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditing(null); setForm(emptyClient); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" /> Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Client</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div><Label className="text-xs">Company</Label><Input value={form.company} onChange={e => setForm({...form, company: e.target.value})} /></div>
                <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div><Label className="text-xs">Assigned Project</Label><Input value={form.project_assigned} onChange={e => setForm({...form, project_assigned: e.target.value})} /></div>
                <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
                <Button onClick={save} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs hidden sm:table-cell">Company</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Contact</TableHead>
              <TableHead className="text-xs hidden lg:table-cell">Project</TableHead>
              {isAdmin && <TableHead className="text-xs w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map(c => (
              <TableRow key={c.id}>
                <TableCell className="text-sm font-medium">{c.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{c.company}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{c.email}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{c.phone}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{c.project_assigned}</TableCell>
                {isAdmin && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(c)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
