import { useState } from 'react';
import { store, Task } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, GripVertical } from 'lucide-react';

const columns: { key: Task['status']; label: string; color: string }[] = [
  { key: 'todo', label: 'To Do', color: 'border-muted-foreground/30' },
  { key: 'in-progress', label: 'In Progress', color: 'border-warning/50' },
  { key: 'done', label: 'Done', color: 'border-success/50' },
];

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(store.getTasks());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', assignedMember: '', projectId: '', status: 'todo' as Task['status'] });
  const users = store.getUsers().filter(u => u.active);
  const projects = store.getProjects();

  const save = () => {
    const newTask: Task = { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const updated = [...tasks, newTask];
    store.setTasks(updated);
    setTasks(updated);
    store.addActivity({ userId: user!.id, userName: user!.displayName, action: `created task "${form.title}"` });
    setOpen(false);
    setForm({ title: '', description: '', assignedMember: '', projectId: '', status: 'todo' });
  };

  const moveTask = (taskId: string, newStatus: Task['status']) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    store.setTasks(updated);
    setTasks(updated);
  };

  const getAssigneeName = (id: string) => users.find(u => u.id === id)?.displayName || 'Unassigned';
  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Task Board</h2>
          <p className="text-sm text-muted-foreground">{tasks.length} tasks</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-1" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} /></div>
              <div>
                <Label className="text-xs">Assign To</Label>
                <Select value={form.assignedMember} onValueChange={v => setForm({...form, assignedMember: v})}>
                  <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.displayName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Project</Label>
                <Select value={form.projectId} onValueChange={v => setForm({...form, projectId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={save} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {columns.map(col => (
          <div key={col.key} className="space-y-3">
            <div className={`flex items-center gap-2 pb-2 border-b-2 ${col.color}`}>
              <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {tasks.filter(t => t.status === col.key).length}
              </span>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {tasks.filter(t => t.status === col.key).map(task => (
                <Card key={task.id} className="group hover:border-primary/30 transition-colors">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/30 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{task.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{getAssigneeName(task.assignedMember)}</span>
                      {getProjectName(task.projectId) && (
                        <span className="text-[10px] text-primary">{getProjectName(task.projectId)}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {columns.filter(c => c.key !== col.key).map(c => (
                        <button key={c.key} onClick={() => moveTask(task.id, c.key)}
                          className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border hover:border-primary/30 transition-colors">
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
