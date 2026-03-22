// Local storage backed data store for Alpha Orbit Dev Portal

export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  email: string;
  role: 'admin' | 'member';
  active: boolean;
  avatar?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'Completed';
  assignedMembers: string[];
  githubUrl: string;
  deadline: string;
  notes: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  projectAssigned: string;
  notes: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedMember: string;
  projectId: string;
  status: 'todo' | 'in-progress' | 'done';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

const genId = () => crypto.randomUUID();

const DEFAULT_USERS: User[] = [
  { id: genId(), username: 'kira', password: 'funterpie5893', displayName: 'Admin User', email: 'admin@alphaorbit.dev', role: 'admin', active: true, createdAt: new Date().toISOString() },
  { id: genId(), username: 'sarah', password: 'password1', displayName: 'Sarah Chen', email: 'sarah@alphaorbit.dev', role: 'member', active: true, createdAt: new Date().toISOString() },
  { id: genId(), username: 'marcus', password: 'password1', displayName: 'Marcus Rivera', email: 'marcus@alphaorbit.dev', role: 'member', active: true, createdAt: new Date().toISOString() },
  { id: genId(), username: 'elena', password: 'password1', displayName: 'Elena Volkov', email: 'elena@alphaorbit.dev', role: 'admin', active: true, createdAt: new Date().toISOString() },
];

const DEFAULT_PROJECTS: Project[] = [
  { id: genId(), name: 'Nova Platform', clientName: 'TechCorp', description: 'Full-stack SaaS platform rebuild', status: 'In Progress', assignedMembers: [], githubUrl: 'https://github.com/alphaorbit/nova', deadline: '2026-06-15', notes: 'Priority client. Weekly syncs on Wednesdays.', createdAt: new Date().toISOString() },
  { id: genId(), name: 'Meridian App', clientName: 'HealthPlus', description: 'Mobile health tracking application', status: 'Planning', assignedMembers: [], githubUrl: 'https://github.com/alphaorbit/meridian', deadline: '2026-08-01', notes: 'Waiting on API specs from client.', createdAt: new Date().toISOString() },
  { id: genId(), name: 'Pulse Dashboard', clientName: 'FinanceFlow', description: 'Real-time analytics dashboard', status: 'Completed', assignedMembers: [], githubUrl: 'https://github.com/alphaorbit/pulse', deadline: '2026-02-28', notes: 'Delivered. Client very happy with results.', createdAt: new Date().toISOString() },
  { id: genId(), name: 'Orbit CMS', clientName: 'MediaHub', description: 'Headless CMS with custom editor', status: 'In Progress', assignedMembers: [], githubUrl: 'https://github.com/alphaorbit/orbit-cms', deadline: '2026-05-20', notes: 'Phase 2 starting next sprint.', createdAt: new Date().toISOString() },
];

const DEFAULT_CLIENTS: Client[] = [
  { id: genId(), name: 'James Wilson', company: 'TechCorp', email: 'james@techcorp.io', phone: '+1 555-0101', projectAssigned: 'Nova Platform', notes: 'Primary contact for all TechCorp projects', createdAt: new Date().toISOString() },
  { id: genId(), name: 'Dr. Amara Osei', company: 'HealthPlus', email: 'amara@healthplus.com', phone: '+1 555-0202', projectAssigned: 'Meridian App', notes: 'Prefers email communication', createdAt: new Date().toISOString() },
  { id: genId(), name: 'Lin Zhang', company: 'FinanceFlow', email: 'lin@financeflow.co', phone: '+1 555-0303', projectAssigned: 'Pulse Dashboard', notes: 'Long-term client. Potential for follow-up projects.', createdAt: new Date().toISOString() },
  { id: genId(), name: 'Rachel Kim', company: 'MediaHub', email: 'rachel@mediahub.io', phone: '+1 555-0404', projectAssigned: 'Orbit CMS', notes: 'Technical background, reviews PRs directly', createdAt: new Date().toISOString() },
];

const DEFAULT_TASKS: Task[] = [
  { id: genId(), title: 'Design system setup', description: 'Create component library and design tokens', assignedMember: '', projectId: '', status: 'done', createdAt: new Date().toISOString() },
  { id: genId(), title: 'API integration layer', description: 'Build REST API client with error handling', assignedMember: '', projectId: '', status: 'in-progress', createdAt: new Date().toISOString() },
  { id: genId(), title: 'User auth flow', description: 'Implement login, signup, and password reset', assignedMember: '', projectId: '', status: 'in-progress', createdAt: new Date().toISOString() },
  { id: genId(), title: 'Dashboard analytics', description: 'Add charts and KPI cards to dashboard', assignedMember: '', projectId: '', status: 'todo', createdAt: new Date().toISOString() },
  { id: genId(), title: 'CI/CD pipeline', description: 'Set up GitHub Actions for automated deployment', assignedMember: '', projectId: '', status: 'todo', createdAt: new Date().toISOString() },
  { id: genId(), title: 'Database schema review', description: 'Optimize queries and indexes', assignedMember: '', projectId: '', status: 'todo', createdAt: new Date().toISOString() },
];

const DEFAULT_MESSAGES: ChatMessage[] = [
  { id: genId(), senderId: '', senderName: 'Admin User', content: 'Welcome to Alpha Orbit team chat! 🚀', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: genId(), senderId: '', senderName: 'Sarah Chen', content: 'Hey team! The Nova Platform sprint is looking good. We\'re on track for the milestone.', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: genId(), senderId: '', senderName: 'Marcus Rivera', content: 'Just pushed the API integration changes. Ready for review!', timestamp: new Date(Date.now() - 1800000).toISOString() },
];

function getStore<T>(key: string, defaults: T[]): T[] {
  const data = localStorage.getItem(`ao_${key}`);
  if (data) return JSON.parse(data);
  localStorage.setItem(`ao_${key}`, JSON.stringify(defaults));
  return defaults;
}

function setStore<T>(key: string, data: T[]) {
  localStorage.setItem(`ao_${key}`, JSON.stringify(data));
}

// Force-migrate master credentials if still using old defaults
function migrateMasterUser() {
  const users = getStore<User>('users', DEFAULT_USERS);
  const oldAdmin = users.find(u => u.username === 'admin' && u.password === 'password1');
  if (oldAdmin) {
    oldAdmin.username = 'kira';
    oldAdmin.password = 'funterpie5893';
    setStore('users', users);
  }
}

// Initialize with member IDs linked
function initializeStore() {
  const users = getStore('users', DEFAULT_USERS);
  const projects = getStore('projects', DEFAULT_PROJECTS);
  
  // Link members to projects if not done
  if (projects.length > 0 && projects[0].assignedMembers.length === 0) {
    const memberIds = users.filter(u => u.role === 'member').map(u => u.id);
    projects.forEach((p, i) => {
      p.assignedMembers = [memberIds[i % memberIds.length]];
    });
    setStore('projects', projects);
  }

  const tasks = getStore('tasks', DEFAULT_TASKS);
  if (tasks.length > 0 && !tasks[0].assignedMember) {
    const memberIds = users.map(u => u.id);
    const projectIds = projects.map(p => p.id);
    tasks.forEach((t, i) => {
      t.assignedMember = memberIds[i % memberIds.length];
      t.projectId = projectIds[i % projectIds.length];
    });
    setStore('tasks', tasks);
  }

  const messages = getStore('messages', DEFAULT_MESSAGES);
  if (messages.length > 0 && !messages[0].senderId) {
    messages.forEach((m, i) => {
      m.senderId = users[i % users.length].id;
      m.senderName = users[i % users.length].displayName;
    });
    setStore('messages', messages);
  }

  getStore('clients', DEFAULT_CLIENTS);
  getStore<ActivityLog>('activity', []);
}

initializeStore();

// CRUD operations
export const store = {
  getUsers: () => getStore<User>('users', []),
  setUsers: (u: User[]) => setStore('users', u),
  
  getProjects: () => getStore<Project>('projects', []),
  setProjects: (p: Project[]) => setStore('projects', p),
  
  getClients: () => getStore<Client>('clients', []),
  setClients: (c: Client[]) => setStore('clients', c),
  
  getTasks: () => getStore<Task>('tasks', []),
  setTasks: (t: Task[]) => setStore('tasks', t),
  
  getMessages: () => getStore<ChatMessage>('messages', []),
  addMessage: (m: ChatMessage) => {
    const msgs = getStore<ChatMessage>('messages', []);
    msgs.push(m);
    setStore('messages', msgs);
  },
  
  getActivity: () => getStore<ActivityLog>('activity', []),
  addActivity: (a: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const logs = getStore<ActivityLog>('activity', []);
    logs.unshift({ ...a, id: genId(), timestamp: new Date().toISOString() });
    if (logs.length > 100) logs.length = 100;
    setStore('activity', logs);
  },

  authenticate: (username: string, password: string): User | null => {
    const users = getStore<User>('users', []);
    return users.find(u => u.username === username && u.password === password && u.active) || null;
  },
};
