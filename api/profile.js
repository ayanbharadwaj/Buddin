import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { data } = await supabase.from('user_profile').select('*').eq('user_id', user.id).single()
    return res.status(200).json(data || {})
  }

  if (req.method === 'POST') {
    const updates = req.body
    await supabase.from('user_profile').upsert({ user_id: user.id, ...updates, updated_at: new Date().toISOString() })
    return res.status(200).json({ success: true })
  }
}