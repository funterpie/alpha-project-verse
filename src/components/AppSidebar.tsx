import { LayoutDashboard, FolderKanban, Users, CheckSquare, MessageSquare, UserCog, Shield, LogOut, Sun, Moon, Orbit, Receipt } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';

const mainNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Projects', url: '/projects', icon: FolderKanban },
  { title: 'Clients', url: '/clients', icon: Users },
  { title: 'Tasks', url: '/tasks', icon: CheckSquare },
  { title: 'Chat', url: '/chat', icon: MessageSquare },
  { title: 'Team', url: '/team', icon: UserCog },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile, logout, isAdmin } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <Orbit className="h-7 w-7 text-primary shrink-0" />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-foreground leading-tight">Alpha Orbit</span>
            <span className="text-[10px] text-muted-foreground font-mono">DEV PORTAL</span>
          </div>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === '/'} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-primary font-medium">
                      <Shield className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        {!collapsed && profile && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {profile.display_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-foreground truncate">{profile.display_name}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{isAdmin ? 'admin' : 'member'}</span>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button onClick={toggle} className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button onClick={logout} className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
