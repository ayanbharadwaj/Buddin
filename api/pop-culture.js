import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('pop_culture_responses')
      .select('name_id')
      .eq('user_id', user.id)
    return res.status(200).json(data || [])
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const {
    name_id, name, category, era, reach, insight,
    recognized, familiarity, scale_max, response_time_ms,
  } = req.body

  if (name_id == null || !name || recognized == null) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const { error: insertError } = await supabase
    .from('pop_culture_responses')
    .insert({
      user_id: user.id,
      name_id,
      name,
      category: category || null,
      era: era || null,
      reach: reach || null,
      insight: insight || null,
      recognized,
      // Null for names they didn't recognise — there's nothing to rate.
      familiarity: recognized ? familiarity ?? null : null,
      scale_max: recognized ? scale_max ?? null : null,
      response_time_ms: response_time_ms || null,
    })

  if (insertError) {
    console.error('Pop culture insert error:', insertError)
    return res.status(500).json({ error: 'Failed to save response' })
  }

  return res.status(200).json({ success: true })
}
