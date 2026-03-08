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
    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsError } = await supabaseAuth.auth.getClaims(token)
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const callerId = claims.claims.sub as string

    // Check if caller is admin using service role client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('role', 'admin')
      .maybeSingle()

    if (!adminRole) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin only' }), { status: 403, headers: corsHeaders })
    }

    // Get user_id from body
    const { user_id } = await req.json()
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400, headers: corsHeaders })
    }

    // Prevent self-deletion
    if (user_id === callerId) {
      return new Response(JSON.stringify({ error: 'Cannot delete yourself' }), { status: 400, headers: corsHeaders })
    }

    // Delete from public tables first (in case CASCADE isn't set up)
    await supabaseAdmin.from('schedule_entries').delete().eq('user_id', user_id)
    await supabaseAdmin.from('professor_unavailability').delete().eq('user_id', user_id)
    await supabaseAdmin.from('subjects').delete().eq('user_id', user_id)
    await supabaseAdmin.from('professors').delete().eq('user_id', user_id)
    await supabaseAdmin.from('student_groups').delete().eq('user_id', user_id)
    await supabaseAdmin.from('rooms').delete().eq('user_id', user_id)
    await supabaseAdmin.from('time_slots').delete().eq('user_id', user_id)
    await supabaseAdmin.from('subscriptions').delete().eq('user_id', user_id)
    await supabaseAdmin.from('user_roles').delete().eq('user_id', user_id)
    await supabaseAdmin.from('activity_logs').delete().eq('user_id', user_id)
    await supabaseAdmin.from('notifications').delete().eq('user_id', user_id)
    await supabaseAdmin.from('student_profiles').delete().eq('user_id', user_id)
    await supabaseAdmin.from('saved_schedules').delete().eq('user_id', user_id)
    await supabaseAdmin.from('user_settings').delete().eq('user_id', user_id)
    await supabaseAdmin.from('profiles').delete().eq('id', user_id)

    // Delete from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id)
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders })
  }
})
