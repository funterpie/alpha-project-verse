import { store } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, Users, CheckSquare, ArrowUpRight, Circle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const projects = store.getProjects();
  const clients = store.getClients();
  const team = store.getUsers();
  const tasks = store.getTasks();
  const activity = store.getActivity();

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: FolderKanban, color: 'text-primary' },
    { label: 'Active Projects', value: projects.filter(p => p.status === 'In Progress').length, icon: ArrowUpRight, color: 'text-success' },
    { label: 'Completed', value: projects.filter(p => p.status === 'Completed').length, icon: CheckSquare, color: 'text-info' },
    { label: 'Clients', value: clients.length, icon: Users, color: 'text-warning' },
    { label: 'Team Members', value: team.filter(u => u.active).length, icon: Users, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.displayName}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Active Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.filter(p => p.status !== 'Completed').slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.clientName}</p>
                </div>
                <span className={`text-[10px] font-mono px-2 py-1 rounded-full ${
                  p.status === 'In Progress' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}>{p.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No activity yet. Actions will appear here.</p>
            ) : activity.slice(0, 6).map(a => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <Circle className="h-2 w-2 mt-1.5 text-primary fill-primary shrink-0" />
                <div>
                  <p className="text-xs text-foreground"><span className="font-medium">{a.userName}</span> {a.action}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Task Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {(['todo', 'in-progress', 'done'] as const).map(status => {
              const count = tasks.filter(t => t.status === status).length;
              const labels = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };
              const colors = { todo: 'bg-muted', 'in-progress': 'bg-warning/10', done: 'bg-success/10' };
              return (
                <div key={status} className={`rounded-lg p-4 ${colors[status]}`}>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{labels[status]}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
