import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('number_responses')
      .select('number')
      .eq('user_id', user.id)
    return res.status(200).json(data || [])
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const { number, position, reaction, reason, response_time_ms } = req.body

  if (number == null || !reaction) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  if (!['like', 'neutral', 'dislike'].includes(reaction)) {
    return res.status(400).json({ error: 'Invalid reaction' })
  }

  const { error: insertError } = await supabase
    .from('number_responses')
    .insert({
      user_id: user.id,
      number,
      position: position ?? null,
      reaction,
      reason: reason || null,
      response_time_ms: response_time_ms || null,
    })

  if (insertError) {
    console.error('Number response insert error:', insertError)
    return res.status(500).json({ error: 'Failed to save response' })
  }

  return res.status(200).json({ success: true })
}
