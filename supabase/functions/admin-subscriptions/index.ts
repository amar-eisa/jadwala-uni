import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const SECRET = Deno.env.get('N8N_WEBHOOK_SECRET')

    if (!SECRET || authHeader !== `Bearer ${SECRET}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (req.method === 'GET') {
      const { data: profiles, error: pErr } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false })
      if (pErr) throw pErr

      const { data: roles, error: rErr } = await supabaseAdmin.from('user_roles').select('*')
      if (rErr) throw rErr

      const { data: subscriptions, error: sErr } = await supabaseAdmin.from('subscriptions').select('*')
      if (sErr) throw sErr

      const users = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id)
        const subscription = subscriptions?.find(s => s.user_id === profile.id)
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          phone: profile.phone,
          created_at: profile.created_at,
          role: userRole?.role || 'user',
          subscription: subscription ? {
            id: subscription.id,
            plan_name: subscription.plan_name,
            status: subscription.status,
            price: Number(subscription.price),
            currency: subscription.currency,
            start_date: subscription.start_date,
            end_date: subscription.end_date,
            university_name: subscription.university_name || null,
          } : null,
        }
      })

      return new Response(JSON.stringify({ users }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { action, userId, subscriptionId, updates } = body

      if (action === 'approve' && subscriptionId) {
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'active', start_date: updates?.start_date || new Date().toISOString(), end_date: updates?.end_date || null })
          .eq('id', subscriptionId)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'reject' && userId) {
        // Delete all user data then auth user
        const tables = ['schedule_entries', 'professor_unavailability', 'subjects', 'professors', 'student_groups', 'rooms', 'time_slots', 'subscriptions', 'user_roles', 'activity_logs', 'notifications', 'student_profiles', 'saved_schedules', 'user_settings']
        for (const table of tables) {
          await supabaseAdmin.from(table).delete().eq('user_id', userId)
        }
        await supabaseAdmin.from('profiles').delete().eq('id', userId)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'update_subscription' && subscriptionId && updates) {
        const { error } = await supabaseAdmin.from('subscriptions').update(updates).eq('id', subscriptionId)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'update_role' && userId && updates?.role) {
        const { data: existing } = await supabaseAdmin.from('user_roles').select('*').eq('user_id', userId).maybeSingle()
        if (existing) {
          const { error } = await supabaseAdmin.from('user_roles').update({ role: updates.role }).eq('user_id', userId)
          if (error) throw error
        } else {
          const { error } = await supabaseAdmin.from('user_roles').insert({ user_id: userId, role: updates.role })
          if (error) throw error
        }
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'delete' && userId) {
        const tables = ['schedule_entries', 'professor_unavailability', 'subjects', 'professors', 'student_groups', 'rooms', 'time_slots', 'subscriptions', 'user_roles', 'activity_logs', 'notifications', 'student_profiles', 'saved_schedules', 'user_settings']
        for (const table of tables) {
          await supabaseAdmin.from(table).delete().eq('user_id', userId)
        }
        await supabaseAdmin.from('profiles').delete().eq('id', userId)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
