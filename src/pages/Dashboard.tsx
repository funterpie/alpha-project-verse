import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, Users, CheckSquare, ArrowUpRight, Circle } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ projects: 0, active: 0, completed: 0, clients: 0, team: 0 });
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [taskCounts, setTaskCounts] = useState({ todo: 0, 'in-progress': 0, done: 0 });

  useEffect(() => {
    const load = async () => {
      const [{ data: projects }, { data: clients }, { data: team }, { data: tasks }, { data: logs }] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('clients').select('id'),
        supabase.from('profiles').select('id').eq('active', true),
        supabase.from('tasks').select('status'),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(6),
      ]);
      const p = projects || [];
      setStats({
        projects: p.length,
        active: p.filter(x => x.status === 'In Progress').length,
        completed: p.filter(x => x.status === 'Completed').length,
        clients: clients?.length || 0,
        team: team?.length || 0,
      });
      setActiveProjects(p.filter(x => x.status !== 'Completed').slice(0, 5));
      setActivity(logs || []);
      const t = tasks || [];
      setTaskCounts({
        todo: t.filter(x => x.status === 'todo').length,
        'in-progress': t.filter(x => x.status === 'in-progress').length,
        done: t.filter(x => x.status === 'done').length,
      });
    };
    load();
  }, []);

  const statCards = [
    { label: 'Total Projects', value: stats.projects, icon: FolderKanban, color: 'text-primary' },
    { label: 'Active Projects', value: stats.active, icon: ArrowUpRight, color: 'text-success' },
    { label: 'Completed', value: stats.completed, icon: CheckSquare, color: 'text-info' },
    { label: 'Clients', value: stats.clients, icon: Users, color: 'text-warning' },
    { label: 'Team Members', value: stats.team, icon: Users, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Welcome back, {profile?.display_name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map(s => (
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
            {activeProjects.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.client_name}</p>
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
              <p className="text-xs text-muted-foreground py-4 text-center">No activity yet.</p>
            ) : activity.map(a => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                <Circle className="h-2 w-2 mt-1.5 text-primary fill-primary shrink-0" />
                <div>
                  <p className="text-xs text-foreground"><span className="font-medium">{a.user_name}</span> {a.action}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
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
              const labels = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };
              const colors = { todo: 'bg-muted', 'in-progress': 'bg-warning/10', done: 'bg-success/10' };
              return (
                <div key={status} className={`rounded-lg p-4 ${colors[status]}`}>
                  <p className="text-2xl font-bold text-foreground">{taskCounts[status]}</p>
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
