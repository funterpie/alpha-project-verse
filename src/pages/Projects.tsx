import { useState } from 'react';
import { store, Project } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, ExternalLink, Pencil, Trash2, Calendar } from 'lucide-react';

const emptyProject: Omit<Project, 'id' | 'createdAt'> = {
  name: '', clientName: '', description: '', status: 'Planning', assignedMembers: [], githubUrl: '', deadline: '', notes: '',
};

export default function Projects() {
  const { isAdmin, user } = useAuth();
  const [projects, setProjects] = useState(store.getProjects());
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyProject);
  const [open, setOpen] = useState(false);
  const users = store.getUsers().filter(u => u.active);

  const canEdit = (p: Project) => isAdmin || p.assignedMembers.includes(user!.id);

  const save = () => {
    let updated: Project[];
    if (editing) {
      updated = projects.map(p => p.id === editing.id ? { ...editing, ...form } : p);
      store.addActivity({ userId: user!.id, userName: user!.displayName, action: `updated project "${form.name}"` });
    } else {
      const newP: Project = { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      updated = [...projects, newP];
      store.addActivity({ userId: user!.id, userName: user!.displayName, action: `created project "${form.name}"` });
    }
    store.setProjects(updated);
    setProjects(updated);
    setOpen(false);
    setEditing(null);
    setForm(emptyProject);
  };

  const remove = (p: Project) => {
    const updated = projects.filter(x => x.id !== p.id);
    store.setProjects(updated);
    setProjects(updated);
    store.addActivity({ userId: user!.id, userName: user!.displayName, action: `deleted project "${p.name}"` });
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ name: p.name, clientName: p.clientName, description: p.description, status: p.status, assignedMembers: p.assignedMembers, githubUrl: p.githubUrl, deadline: p.deadline, notes: p.notes });
    setOpen(true);
  };

  const statusColor = (s: string) => {
    if (s === 'Completed') return 'bg-success/10 text-success';
    if (s === 'In Progress') return 'bg-info/10 text-info';
    return 'bg-warning/10 text-warning';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Projects</h2>
          <p className="text-sm text-muted-foreground">{projects.length} projects</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditing(null); setForm(emptyProject); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit' : 'New'} Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Project Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div><Label className="text-xs">Client</Label><Input value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} /></div>
                <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} /></div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v as Project['status']})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">GitHub URL</Label><Input value={form.githubUrl} onChange={e => setForm({...form, githubUrl: e.target.value})} /></div>
                <div><Label className="text-xs">Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
                <div>
                  <Label className="text-xs">Assigned Members</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {users.map(u => (
                      <button key={u.id} type="button"
                        onClick={() => setForm({...form, assignedMembers: form.assignedMembers.includes(u.id) ? form.assignedMembers.filter(m => m !== u.id) : [...form.assignedMembers, u.id]})}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${form.assignedMembers.includes(u.id) ? 'bg-primary/20 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                        {u.displayName}
                      </button>
                    ))}
                  </div>
                </div>
                <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
                <Button onClick={save} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(p => (
          <Card key={p.id} className="group hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">{p.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{p.clientName}</p>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${statusColor(p.status)}`}>{p.status}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
              {p.deadline && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" /> {new Date(p.deadline).toLocaleDateString()}
                </div>
              )}
              {p.githubUrl && (
                <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" /> Repository
                </a>
              )}
              <div className="flex flex-wrap gap-1">
                {p.assignedMembers.map(mId => {
                  const u = users.find(x => x.id === mId);
                  return u ? <span key={mId} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{u.displayName}</span> : null;
                })}
              </div>
              {canEdit(p) && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(p)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                  {isAdmin && <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => remove(p)}><Trash2 className="h-3 w-3 mr-1" /> Delete</Button>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
