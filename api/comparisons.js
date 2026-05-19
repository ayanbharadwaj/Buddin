import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { category, option_a, option_b, chosen, intensity, scale_max, insight, response_time_ms } = req.body

  await supabase.from('comparison_responses').insert({
    user_id: user.id, category, option_a, option_b, chosen,
    intensity, scale_max, insight, response_time_ms
  })

  return res.status(200).json({ success: true })
}