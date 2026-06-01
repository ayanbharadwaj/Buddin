import { createClient } from '@supabase/supabase-js'
import { addSnapshot, deriveAdaptiveTone, createMemoryStore } from './boom/memorySchema.js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

  const userId = user.id

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', userId)
      .single()
    return res.status(200).json(data || createMemoryStore())
  }

  if (req.method === 'POST') {
    const { snapshot } = req.body
    if (!snapshot) return res.status(400).json({ error: 'Missing snapshot' })

    const { data: existing } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', userId)
      .single()

    const store = existing || createMemoryStore()
    addSnapshot(store, snapshot)

    await supabase
      .from('user_memory')
      .upsert({ user_id: userId, ...store, updated_at: new Date().toISOString() })

    return res.status(200).json({ success: true, adaptiveTone: deriveAdaptiveTone(store), store })
  }

  return res.status(405).json({ error: 'Method Not Allowed' })
}