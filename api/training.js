import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// Learn It progress. One row per scenario answered — level and completion are
// derived by counting rather than stored, so there is no separate progress
// counter that can drift out of sync with the actual answers.
export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { data, error: readErr } = await supabase
      .from('training_progress')
      .select('module_id, scenario_id, score, choice_index')
      .eq('user_id', user.id)
    if (readErr) {
      console.error('Training read error:', readErr)
      return res.status(500).json({ error: 'Failed to load progress' })
    }
    return res.status(200).json(data || [])
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const { module_id, scenario_id, choice_index, score, response_time_ms } = req.body

  if (!module_id || !scenario_id || choice_index == null || score == null) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // A scenario can be revisited; keep the most recent answer rather than
  // stacking duplicates that would inflate the level count.
  const { error: upsertErr } = await supabase
    .from('training_progress')
    .upsert({
      user_id: user.id,
      module_id,
      scenario_id,
      choice_index,
      score,
      response_time_ms: response_time_ms || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,module_id,scenario_id' })

  if (upsertErr) {
    console.error('Training upsert error:', upsertErr)
    return res.status(500).json({ error: 'Failed to save progress' })
  }

  return res.status(200).json({ success: true })
}
