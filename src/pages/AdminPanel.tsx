import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, UserX, UserCheck, Circle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type ActivityLog = Tables<'activity_logs'>;

export default function AdminPanel() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<(Profile & { role: string })[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [editing, setEditing] = useState<(Profile & { role: string }) | null>(null);
  const [form, setForm] = useState({ username: '', password: '', displayName: '', email: '', role: 'member' });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">Access denied. Admin only.</div>;

  const load = async () => {
    const [{ data: profiles }, { data: roles }, { data: logs }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('user_roles').select('*'),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    const r = roles || [];
    setUsers((profiles || []).map(p => ({ ...p, role: r.find(x => x.user_id === p.id)?.role || 'member' })));
    setActivity(logs || []);
  };

  useEffect(() => { load(); }, []);

  const callAdmin = async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke('admin-users', {
      body,
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await callAdmin({ action: 'update_user', user_id: editing.id, email: form.email, password: form.password || undefined, display_name: form.displayName, username: form.username });
        if (form.role !== editing.role) {
          await callAdmin({ action: 'update_role', user_id: editing.id, role: form.role });
        }
        toast({ title: 'User updated' });
      } else {
        await callAdmin({ action: 'create_user', email: form.email, password: form.password, username: form.username, display_name: form.displayName, role: form.role });
        toast({ title: 'User created' });
      }
      setOpen(false);
      setEditing(null);
      setForm({ username: '', password: '', displayName: '', email: '', role: 'member' });
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const toggleActive = async (u: Profile & { role: string }) => {
    try {
      await callAdmin({ action: 'toggle_active', user_id: u.id, active: !u.active });
      toast({ title: u.active ? 'User deactivated' : 'User activated' });
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const remove = async (u: Profile & { role: string }) => {
    try {
      await callAdmin({ action: 'delete_user', user_id: u.id });
      toast({ title: 'User deleted' });
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const openEdit = (u: Profile & { role: string }) => {
    setEditing(u);
    setForm({ username: u.username, password: '', displayName: u.display_name, email: u.email, role: u.role });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Admin Panel</h2>
        <p className="text-sm text-muted-foreground">Manage users, roles, and system activity</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditing(null); setForm({ username: '', password: '', displayName: '', email: '', role: 'member' }); } }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-1" /> New User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Create'} User</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label className="text-xs">Display Name</Label><Input value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} /></div>
                  <div><Label className="text-xs">Username</Label><Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} /></div>
                  <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                  <div><Label className="text-xs">Password{editing ? ' (leave blank to keep)' : ''}</Label><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
                  <div>
                    <Label className="text-xs">Role</Label>
                    <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={save} disabled={saving} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Role</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Status</TableHead>
                  <TableHead className="text-xs w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{u.display_name}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{u.role}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={`text-xs ${u.active ? 'text-success' : 'text-destructive'}`}>{u.active ? 'Active' : 'Inactive'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(u)}><Pencil className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleActive(u)}>
                          {u.active ? <UserX className="h-3 w-3 text-warning" /> : <UserCheck className="h-3 w-3 text-success" />}
                        </Button>
                        {u.id !== user?.id && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(u)}><Trash2 className="h-3 w-3" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">System Activity</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {activity.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No activity recorded yet.</p>
              ) : activity.map(a => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <Circle className="h-2 w-2 mt-1.5 text-primary fill-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-foreground"><span className="font-medium">{a.user_name}</span> {a.action}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
