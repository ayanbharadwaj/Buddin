import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { word, difficulty_level, response, knew_word, response_time_ms } = req.body

  if (!word || difficulty_level == null || knew_word == null) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const { error: insertError } = await supabase
    .from('word_responses')
    .insert({
      user_id: user.id,
      word,
      difficulty_level,
      response: response || null,
      knew_word,
      response_time_ms: response_time_ms || null,
    })

  if (insertError) {
    console.error('Word response insert error:', insertError)
    return res.status(500).json({ error: 'Failed to save response' })
  }

  return res.status(200).json({ success: true })
}
