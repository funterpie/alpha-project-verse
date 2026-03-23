import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })

  // Check if admin already exists
  const { data: existing } = await admin.from('profiles').select('id').eq('username', 'kira').limit(1)
  if (existing && existing.length > 0) {
    return new Response(JSON.stringify({ message: 'Admin already exists' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Create admin user
  const { data, error } = await admin.auth.admin.createUser({
    email: 'kira@alphaorbit.dev',
    password: 'funterpie5893',
    email_confirm: true,
    user_metadata: { username: 'kira', display_name: 'Kira Admin', role: 'admin' },
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Create sample team members
  const members = [
    { email: 'sarah@alphaorbit.dev', password: 'member12345', username: 'sarah', display_name: 'Sarah Chen', role: 'member' },
    { email: 'marcus@alphaorbit.dev', password: 'member12345', username: 'marcus', display_name: 'Marcus Rivera', role: 'member' },
    { email: 'elena@alphaorbit.dev', password: 'member12345', username: 'elena', display_name: 'Elena Volkov', role: 'admin' },
  ]

  const memberIds: string[] = []
  for (const m of members) {
    const { data: u } = await admin.auth.admin.createUser({
      email: m.email, password: m.password, email_confirm: true,
      user_metadata: { username: m.username, display_name: m.display_name, role: m.role },
    })
    if (u?.user) memberIds.push(u.user.id)
  }

  // Seed projects
  const projects = [
    { name: 'Nova Platform', client_name: 'TechCorp', description: 'Full-stack SaaS platform rebuild', status: 'In Progress', github_url: 'https://github.com/alphaorbit/nova', deadline: '2026-06-15', notes: 'Priority client. Weekly syncs on Wednesdays.' },
    { name: 'Meridian App', client_name: 'HealthPlus', description: 'Mobile health tracking application', status: 'Planning', github_url: 'https://github.com/alphaorbit/meridian', deadline: '2026-08-01', notes: 'Waiting on API specs from client.' },
    { name: 'Pulse Dashboard', client_name: 'FinanceFlow', description: 'Real-time analytics dashboard', status: 'Completed', github_url: 'https://github.com/alphaorbit/pulse', deadline: '2026-02-28', notes: 'Delivered. Client very happy.' },
    { name: 'Orbit CMS', client_name: 'MediaHub', description: 'Headless CMS with custom editor', status: 'In Progress', github_url: 'https://github.com/alphaorbit/orbit-cms', deadline: '2026-05-20', notes: 'Phase 2 starting next sprint.' },
  ]
  const { data: insertedProjects } = await admin.from('projects').insert(projects).select()

  // Assign members to projects
  if (insertedProjects && memberIds.length > 0) {
    const assignments = insertedProjects.map((p: any, i: number) => ({
      project_id: p.id, user_id: memberIds[i % memberIds.length],
    }))
    await admin.from('project_members').insert(assignments)
  }

  // Seed clients
  await admin.from('clients').insert([
    { name: 'James Wilson', company: 'TechCorp', email: 'james@techcorp.io', phone: '+1 555-0101', project_assigned: 'Nova Platform', notes: 'Primary contact' },
    { name: 'Dr. Amara Osei', company: 'HealthPlus', email: 'amara@healthplus.com', phone: '+1 555-0202', project_assigned: 'Meridian App', notes: 'Prefers email' },
    { name: 'Lin Zhang', company: 'FinanceFlow', email: 'lin@financeflow.co', phone: '+1 555-0303', project_assigned: 'Pulse Dashboard', notes: 'Long-term client' },
    { name: 'Rachel Kim', company: 'MediaHub', email: 'rachel@mediahub.io', phone: '+1 555-0404', project_assigned: 'Orbit CMS', notes: 'Reviews PRs directly' },
  ])

  // Seed tasks
  const projectIds = insertedProjects?.map((p: any) => p.id) || []
  await admin.from('tasks').insert([
    { title: 'Design system setup', description: 'Create component library and design tokens', assigned_member: memberIds[0] || null, project_id: projectIds[0] || null, status: 'done' },
    { title: 'API integration layer', description: 'Build REST API client with error handling', assigned_member: memberIds[1] || null, project_id: projectIds[0] || null, status: 'in-progress' },
    { title: 'User auth flow', description: 'Implement login, signup, and password reset', assigned_member: memberIds[0] || null, project_id: projectIds[1] || null, status: 'in-progress' },
    { title: 'Dashboard analytics', description: 'Add charts and KPI cards to dashboard', assigned_member: memberIds[2] || null, project_id: projectIds[2] || null, status: 'todo' },
    { title: 'CI/CD pipeline', description: 'Set up GitHub Actions for automated deployment', assigned_member: memberIds[1] || null, project_id: projectIds[3] || null, status: 'todo' },
  ])

  // Seed chat messages
  await admin.from('chat_messages').insert([
    { sender_id: data.user!.id, sender_name: 'Kira Admin', content: 'Welcome to Alpha Orbit team chat! 🚀' },
  ])

  return new Response(JSON.stringify({ message: 'Seed complete', adminId: data.user!.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
