import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// Preferences are settings, not behavioural logging — they live in the JSONB
// column already provisioned on user_profile rather than in their own table.
export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('user_profile')
      .select('preferences')
      .eq('user_id', user.id)
      .limit(1)
    return res.status(200).json({ preferences: data?.[0]?.preferences || {} })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const { preferences } = req.body
  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
    return res.status(400).json({ error: 'Missing or malformed preferences' })
  }

  // Merge rather than replace — a partial save must never wipe answers the user
  // gave on an earlier visit.
  const { data: existing } = await supabase
    .from('user_profile')
    .select('preferences')
    .eq('user_id', user.id)
    .limit(1)

  const merged = { ...(existing?.[0]?.preferences || {}), ...preferences }
  const row = { user_id: user.id, preferences: merged, updated_at: new Date().toISOString() }

  const { error: saveErr } = await supabase.from('user_profile').upsert(row, { onConflict: 'user_id' })
  if (saveErr) {
    // Same fallback as infer-profile: works whether or not the UNIQUE(user_id)
    // constraint from supabase-fixes.sql has been applied yet.
    if (existing?.[0]) {
      const { error: updErr } = await supabase.from('user_profile').update(row).eq('user_id', user.id)
      if (updErr) {
        console.error('Preferences update error:', updErr)
        return res.status(500).json({ error: 'Failed to save preferences' })
      }
    } else {
      const { error: insErr } = await supabase.from('user_profile').insert(row)
      if (insErr) {
        console.error('Preferences insert error:', insErr)
        return res.status(500).json({ error: 'Failed to save preferences' })
      }
    }
  }

  return res.status(200).json({ success: true, preferences: merged })
}
