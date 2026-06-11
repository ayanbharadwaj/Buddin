import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { message, page } = req.body || {}
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'Missing message' })
  }

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
