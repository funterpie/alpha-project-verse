

# Plan: Migrate Alpha Orbit to Lovable Cloud (Real-time Database)

## Overview
Replace the current localStorage-based data layer with Lovable Cloud (Supabase) for real-time database, proper authentication, and persistent data across sessions/devices.

## Database Schema

**Tables to create:**

1. **profiles** — user profiles linked to `auth.users`
   - `id` (uuid, FK to auth.users), `username`, `display_name`, `email`, `role` (text: admin/member), `active` (bool), `avatar` (text), `created_at`

2. **user_roles** — RBAC table (per security rules)
   - `id` (uuid), `user_id` (FK to auth.users), `role` (app_role enum: admin, member)

3. **projects** — project data
   - `id`, `name`, `client_name`, `description`, `status`, `github_url`, `deadline`, `notes`, `created_at`

4. **project_members** — many-to-many for project assignments
   - `project_id`, `user_id`

5. **clients** — CRM data
   - `id`, `name`, `company`, `email`, `phone`, `project_assigned`, `notes`, `created_at`

6. **tasks** — kanban tasks
   - `id`, `title`, `description`, `assigned_member` (FK), `project_id` (FK), `status`, `created_at`

7. **chat_messages** — team chat with real-time subscriptions
   - `id`, `sender_id` (FK), `sender_name`, `content`, `created_at`

8. **activity_logs** — system activity
   - `id`, `user_id`, `user_name`, `action`, `created_at`

## Authentication
- Replace localStorage auth with Supabase Auth (email/password)
- Create initial admin user (kira) via seed data
- `AuthContext` will use `supabase.auth.onAuthStateChange` + `getSession`

## RLS Policies
- Profiles: users read all active profiles, update own only
- Projects: admins full CRUD, members read assigned only
- Clients: admins full CRUD, members read-only
- Tasks: authenticated users can read/write
- Chat: authenticated users can read/insert
- Activity: authenticated users can read, insert via security definer function
- User roles: checked via `has_role()` security definer function

## Code Changes

1. **Enable Lovable Cloud** and create all tables/migrations
2. **Replace `src/lib/store.ts`** with a Supabase client helper (`src/integrations/supabase/`)
3. **Rewrite `AuthContext`** to use Supabase Auth
4. **Update every page** (Dashboard, Projects, Clients, Tasks, Chat, Team, AdminPanel) to fetch from Supabase instead of `store.*` calls
5. **Chat page** — use Supabase Realtime subscriptions for live messages
6. **Admin Panel** — use Supabase Admin APIs (via edge function) for user management
7. **Seed default data** — insert sample projects, clients, tasks

## Real-time Features
- Chat messages via `supabase.channel('chat').on('postgres_changes', ...)` 
- Task board updates via real-time subscriptions
- Activity log live updates

## Steps (in order)
1. Enable Lovable Cloud
2. Create database migrations (all tables, enums, RLS, functions)
3. Seed default data
4. Create Supabase client integration
5. Rewrite AuthContext with Supabase Auth
6. Update all pages to use Supabase queries
7. Add real-time subscriptions for chat
8. Create edge function for admin user management
9. Remove old `store.ts`

