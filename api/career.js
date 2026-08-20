import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// Career Discovery is the first module that is primarily a *consumer* of other
// modules' data. It reads everything already collected, folds in a handful of
// oblique answers, and asks for three directions with reasoning tied to actual
// choices — not a generic paragraph a search engine could have written.
export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('user_profile')
      .select('career_answers, career_directions')
      .eq('user_id', user.id)
      .limit(1)
    return res.status(200).json({
      answers: data?.[0]?.career_answers || {},
      directions: data?.[0]?.career_directions || null,
    })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const { answers } = req.body
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Missing answers' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing API key' })

  // ── Pull everything else already known about them ───────────────────────
  const [comparisons, words, writings, popCulture, profileRow] = await Promise.all([
    supabase.from('comparison_responses').select('chosen, option_a, option_b, category, insight, intensity, scale_max')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(60),
    supabase.from('word_responses').select('word, response, knew_word, difficulty_level')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    supabase.from('writing_samples').select('prompt, response')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
    supabase.from('pop_culture_responses').select('name, category, recognized, familiarity, scale_max')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(40),
    supabase.from('user_profile').select('preferences').eq('user_id', user.id).limit(1),
  ])

  const prefs = profileRow.data?.[0]?.preferences || {}

  let context = ''
  if (comparisons.data?.length) {
    context += `\nFORCED CHOICES (chose X over Y, with how strongly they felt):\n${comparisons.data
      .map(c => `- ${c.chosen} over ${c.chosen === c.option_a ? c.option_b : c.option_a} (${c.category}/${c.insight}, ${c.intensity}/${c.scale_max})`)
      .join('\n')}\n`
  }
  if (words.data?.length) {
    context += `\nWORD REACTIONS:\n${words.data
      .map(w => `- ${w.word} (level ${w.difficulty_level}) → ${w.knew_word ? `"${w.response}"` : "didn't know it"}`)
      .join('\n')}\n`
  }
  if (writings.data?.length) {
    context += `\nWRITING (excerpts):\n${writings.data
      .map(w => `- "${w.prompt}" → "${(w.response || '').slice(0, 260)}"`)
      .join('\n')}\n`
  }
  if (popCulture.data?.length) {
    context += `\nNAME RECOGNITION (what they know and don't):\n${popCulture.data
      .map(p => `- ${p.name} (${p.category}): ${p.recognized ? `knows them, thinks about them ${p.familiarity}/${p.scale_max}` : 'never heard of them'}`)
      .join('\n')}\n`
  }
  if (Object.keys(prefs).length) {
    context += `\nSTATED PREFERENCES:\n${Object.entries(prefs).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n`
  }
  context += `\nOBLIQUE ANSWERS (asked without ever mentioning jobs):\n${Object.entries(answers)
    .map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n`

  const prompt = `You are helping a teenager see possible directions for their working life. They were never asked what they want to be — everything below is either a forced choice, a reaction, or an oblique question about how they behave.

${context}
Suggest exactly three directions. Rules:
- A "direction" is a shape of work, not a single job title. "Work where you're the person who figures out why something broke" beats "engineer".
- Every direction must cite at least two SPECIFIC things from the data above, quoted or named. If you cannot cite specifics, pick a different direction.
- Do not flatter. If the data is thin in some area, say what would sharpen the picture.
- Write like a perceptive older friend, not a careers advisor. No corporate language, no "leverage your strengths".
- Second person. Two to four sentences of reasoning per direction.

Output ONLY valid JSON:
{
  "opening": "1-2 sentences on the through-line you noticed across their choices",
  "directions": [
    { "title": "short name for the direction", "reasoning": "why, citing specific choices they made", "watch_out": "one honest sentence about where this could go wrong for someone wired like this" }
  ],
  "what_would_sharpen_this": "one sentence naming which Know Me module would most improve this read"
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1800,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'
    const directions = JSON.parse(text.replace(/```json|```/g, '').trim())

    const row = {
      user_id: user.id,
      career_answers: answers,
      career_directions: directions,
      updated_at: new Date().toISOString(),
    }
    const { error: saveErr } = await supabase.from('user_profile').upsert(row, { onConflict: 'user_id' })
    if (saveErr) {
      const { data: existing } = await supabase
        .from('user_profile').select('id').eq('user_id', user.id).limit(1)
      if (existing?.[0]) await supabase.from('user_profile').update(row).eq('user_id', user.id)
      else await supabase.from('user_profile').insert(row)
    }

    return res.status(200).json({ directions })
  } catch (e) {
    console.error('Career discovery error:', e)
    return res.status(500).json({ error: 'Failed to generate directions' })
  }
}
