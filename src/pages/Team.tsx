import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Shield, User } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

export default function Team() {
  const [users, setUsers] = useState<(Profile & { role: string })[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from('profiles').select('*').eq('active', true),
        supabase.from('user_roles').select('*'),
      ]);
      const r = roles || [];
      setUsers((profiles || []).map(p => ({
        ...p,
        role: r.find(x => x.user_id === p.id)?.role || 'member',
      })));
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Team Members</h2>
        <p className="text-sm text-muted-foreground">{users.length} active members</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <Card key={u.id} className="hover:border-primary/30 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {u.display_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{u.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{u.username}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" /> {u.email}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {u.role === 'admin' ? <Shield className="h-3 w-3 text-primary" /> : <User className="h-3 w-3 text-muted-foreground" />}
                  <span className="capitalize text-muted-foreground">{u.role}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
