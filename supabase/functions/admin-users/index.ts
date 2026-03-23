import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const callerClient = createClient(supabaseUrl, serviceRoleKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller } } = await createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!).auth.getUser(token)
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Check admin role
    const { data: roles } = await callerClient.from('user_roles').select('role').eq('user_id', caller.id).eq('role', 'admin')
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { action, ...payload } = await req.json()
    const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })

    if (action === 'create_user') {
      const { email, password, username, display_name, role } = payload
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, display_name, role: role || 'member' },
      })
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify({ user: data.user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'update_user') {
      const { user_id, email, password, display_name, username } = payload
      const updates: any = {}
      if (email) updates.email = email
      if (password) updates.password = password
      if (display_name || username) {
        updates.user_metadata = {}
        if (display_name) updates.user_metadata.display_name = display_name
        if (username) updates.user_metadata.username = username
      }
      const { error } = await adminClient.auth.admin.updateUserById(user_id, updates)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      
      // Update profile
      const profileUpdate: any = {}
      if (display_name) profileUpdate.display_name = display_name
      if (username) profileUpdate.username = username
      if (email) profileUpdate.email = email
      if (Object.keys(profileUpdate).length > 0) {
        await adminClient.from('profiles').update(profileUpdate).eq('id', user_id)
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'update_role') {
      const { user_id, role } = payload
      // Delete existing roles and insert new one
      await adminClient.from('user_roles').delete().eq('user_id', user_id)
      await adminClient.from('user_roles').insert({ user_id, role })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'toggle_active') {
      const { user_id, active } = payload
      await adminClient.from('profiles').update({ active }).eq('id', user_id)
      if (!active) {
        // Ban user
        await adminClient.auth.admin.updateUserById(user_id, { ban_duration: '876000h' })
      } else {
        await adminClient.auth.admin.updateUserById(user_id, { ban_duration: 'none' })
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'delete_user') {
      const { user_id } = payload
      const { error } = await adminClient.auth.admin.deleteUser(user_id)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
