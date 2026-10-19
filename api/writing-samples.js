import { createClient } from '@supabase/supabase-js'
import { requireUser } from '../lib/auth.js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const auth = await requireUser(supabaseAuth, req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })
  const user = auth.user

  const { prompt, response, word_count, response_time_ms, time_to_first_keystroke_ms } = req.body

  if (!prompt || !response) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const row = {
    user_id: user.id,
    prompt,
    response,
    word_count: word_count || 0,
    response_time_ms: response_time_ms || null,
    time_to_first_keystroke_ms: time_to_first_keystroke_ms || null,
  }

  let { error: insertError } = await supabase.from('writing_samples').insert(row)

  // time_to_first_keystroke_ms is added by supabase-fixes.sql. If that hasn't
  // run yet the column is missing and the insert fails — retry without it so
  // the writing sample still saves (we just lose that one timing signal).
  if (insertError && /time_to_first_keystroke_ms/.test(insertError.message || '')) {
    const { time_to_first_keystroke_ms: _drop, ...rest } = row
    ;({ error: insertError } = await supabase.from('writing_samples').insert(rest))
  }

  if (insertError) {
    console.error('Writing sample insert error:', insertError)
    return res.status(500).json({ error: 'Failed to save response' })
  }

  return res.status(200).json({ success: true })
}
