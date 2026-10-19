import { createClient } from '@supabase/supabase-js'
import { addSnapshot, deriveAdaptiveTone, createMemoryStore } from '../src/boom/memorySchema.js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// NOTE: nothing in the app currently POSTs here — the only caller is a GET from
// src/App.jsx on session init — so the cross-session memory store is never
// written in practice. The route is hardened rather than deleted because the
// GET is live and the POST is the intended wiring point.
export default async function handler(req, res) {
  let user
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    const { data, error } = await supabaseAuth.auth.getUser(token)
    if (error || !data?.user) return res.status(401).json({ error: 'Unauthorized' })
    user = data.user
  } catch (e) {
    // getUser throws on a malformed token; without this the route 500s.
    console.error('Memory auth error:', e)
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userId = user.id

  if (req.method === 'GET') {
    // maybeSingle, not single: single() errors when there is no row yet, which
    // is the normal state for anyone who has never had a snapshot written.
    const { data, error: readErr } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (readErr) {
      console.error('Memory read error:', readErr)
      return res.status(500).json({ error: "Couldn't load your memory store" })
    }
    return res.status(200).json(data || createMemoryStore())
  }

  if (req.method === 'POST') {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : null
    if (!body) return res.status(400).json({ error: 'Invalid request body' })

    const { snapshot } = body
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return res.status(400).json({ error: 'Missing or malformed snapshot' })
    }
    // Unbounded objects flow straight into a stored JSONB column.
    if (JSON.stringify(snapshot).length > 8000) {
      return res.status(413).json({ error: 'Snapshot too large' })
    }

    const { data: existing, error: readErr } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (readErr) {
      console.error('Memory read-before-write error:', readErr)
      return res.status(500).json({ error: "Couldn't save that" })
    }

    const store = existing || createMemoryStore()
    addSnapshot(store, snapshot)

    // Two things were wrong here. There was no onConflict target, so repeated
    // writes could pile up duplicate rows instead of updating in place; and the
    // result's error was never checked, so a failed write still returned
    // {success: true} to a client that then believed it had saved.
    const { error: writeErr } = await supabase
      .from('user_memory')
      .upsert(
        { ...store, user_id: userId, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (writeErr) {
      console.error('Memory write error:', writeErr)
      return res.status(500).json({ error: "Couldn't save that" })
    }

    return res.status(200).json({ success: true, adaptiveTone: deriveAdaptiveTone(store), store })
  }

  return res.status(405).json({ error: 'Method Not Allowed' })
}
