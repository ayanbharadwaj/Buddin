import { createClient } from '@supabase/supabase-js'
import { requireUser } from '../lib/auth.js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  const auth = await requireUser(supabaseAuth, req)
  if (auth.error) return res.status(auth.status).json({ error: auth.error })
  const user = auth.user

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('comparison_responses')
      .select('comparison_id')
      .eq('user_id', user.id)
      .limit(500)
    return res.status(200).json(data || [])
  }

  if (req.method === 'POST') {
    const {
      comparison_id, category, option_a, option_b, chosen,
      intensity, scale_max, insight, response_time_ms, input_method
    } = req.body

    const row = {
      user_id: user.id, comparison_id, category, option_a, option_b,
      chosen, intensity, scale_max, insight, response_time_ms,
      // Answers collected before the continuous slider shipped came from a
      // six-button grid and are far coarser. Tagging them keeps the two
      // generations of data from being treated as equally precise.
      input_method: input_method || 'buttons',
    }

    let { error: insertError } = await supabase.from('comparison_responses').insert(row)

    // input_method is added by supabase-schema-v2.sql. If that hasn't been run
    // yet the column is missing — retry without it so the answer still saves.
    if (insertError && /input_method/.test(insertError.message || '')) {
      const { input_method: _drop, ...rest } = row
      ;({ error: insertError } = await supabase.from('comparison_responses').insert(rest))
    }

    if (insertError) {
      // Log the detail server-side; never hand Postgres internals (constraint
      // names, column names, query fragments) to whoever triggered the failure.
      console.error('Comparison insert error:', insertError)
      return res.status(500).json({ error: "Couldn't save that response" })
    }
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method Not Allowed' })
}
