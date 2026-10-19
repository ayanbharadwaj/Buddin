import { createClient } from '@supabase/supabase-js'
import { requireUser } from '../lib/auth.js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  const auth = await requireUser(supabaseAuth, req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })
  const user = auth.user

  // Route /api/feedback POST requests handled here to stay under Vercel's 12-function limit
  if (req.query?._route === 'feedback') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
    const { message, page } = req.body || {}
    if (!message || !String(message).trim()) return res.status(400).json({ error: 'Missing message' })
    const { error: insertError } = await supabase.from('feedback').insert({
      user_id: user.id,
      email: user.email || null,
      message: String(message).trim().slice(0, 2000),
      page: typeof page === 'string' ? page.slice(0, 50) : null,
    })
    if (insertError) {
      console.error('Feedback insert error:', insertError)
      return res.status(500).json({ error: 'Failed to save feedback' })
    }
    return res.status(200).json({ success: true })
  }

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
    return res.status(200).json(data?.[0] || {})
  }

  if (req.method === 'POST') {
    // The spread used to come AFTER user_id, so a client-supplied user_id in
    // the JSON body silently overrode the authenticated one and wrote to
    // someone else's row. An explicit allow-list removes the whole class of
    // bug rather than blacklisting the two keys we happened to think of.
    const ALLOWED = ['preferences']
    const updates = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {}
    const safe = {}
    for (const k of ALLOWED) {
      if (Object.prototype.hasOwnProperty.call(updates, k)) safe[k] = updates[k]
    }
    if (Object.keys(safe).length === 0) {
      return res.status(400).json({ error: 'No updatable fields supplied' })
    }
    // user_id is always the authenticated one, and is set LAST so nothing can
    // override it.
    const row = { ...safe, updated_at: new Date().toISOString(), user_id: user.id }
    // Prefer a single-row upsert keyed on user_id; if the UNIQUE(user_id)
    // constraint (supabase-fixes.sql) isn't in place yet, onConflict errors —
    // fall back to a manual update-or-insert so saving still works.
    const { error: upsertError } = await supabase
      .from('user_profile')
      .upsert(row, { onConflict: 'user_id' })
    if (upsertError) {
      const { data: existing } = await supabase
        .from('user_profile').select('id').eq('user_id', user.id).limit(1)
      const { error: fallbackError } = existing?.[0]
        ? await supabase.from('user_profile').update(row).eq('user_id', user.id)
        : await supabase.from('user_profile').insert(row)
      if (fallbackError) {
        console.error('Profile save error:', fallbackError)
        return res.status(500).json({ error: 'Failed to save profile' })
      }
    }
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method Not Allowed' })
}
