import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

  // Fetch all their data
  const { data: comparisons } = await supabase
    .from('comparison_responses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: words } = await supabase
    .from('word_responses')
    .select('*')
    .eq('user_id', user.id)
    .limit(50)

  const { data: writings } = await supabase
    .from('writing_samples')
    .select('*')
    .eq('user_id', user.id)
    .limit(10)

  const totalDataPoints = (comparisons?.length || 0) + (words?.length || 0) + (writings?.length || 0)
  if (totalDataPoints < 5) {
    return res.status(200).json({
      error: 'not_enough_data',
      message: 'Need at least 5 data points to build a profile'
    })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing API key' })

  let dataSection = ''

  if (comparisons?.length > 0) {
    dataSection += `\nTHEIR THIS-OR-THAT CHOICES (most recent first):\n${comparisons.map(c => `- Chose "${c.chosen}" over "${c.chosen === c.option_a ? c.option_b : c.option_a}" (${c.category} · ${c.insight} · intensity ${c.intensity}/${c.scale_max})`).join('\n')}\n`
  }

  if (words?.length > 0) {
    dataSection += `\nWORD ASSOCIATIONS (word → their response):\n${words.map(w => `${w.word} → "${w.response}" (knew word: ${w.knew_word}, time: ${w.response_time_ms}ms)`).join('\n')}\n`
  }

  if (writings?.length > 0) {
    dataSection += `\nWRITING SAMPLES (prompt → first 200 chars of response):\n${writings.map(w => `Prompt: "${w.prompt}" → "${w.response?.slice(0, 200)}..."`).join('\n')}\n`
  }

  const prompt = `You are a cognitive profiling system. Based on this person's data, infer their personality traits. Be specific and evidence-based. Reference their actual responses.
${dataSection}
Output ONLY a valid JSON object with exactly these keys:
{
  "summary": "2-3 casual sentences describing this person like a friend would. No jargon.",
  "aesthetic_identity": "one sentence about their visual/taste preferences with specific evidence",
  "social_style": "one sentence about how they operate socially with evidence",
  "risk_profile": "one sentence about their relationship with risk and comfort with evidence",
  "intellectual_pattern": "one sentence about how they think and process with evidence",
  "vocabulary_profile": "one sentence about their word knowledge and associations (or null if no word data)",
  "writing_voice": "one sentence about how they express themselves in writing (or null if no writing data)",
  "emotional_vocabulary": "one sentence about how they describe feelings (or null if insufficient data)",
  "contrarian_score": a number 0-100 where 100 = always picks the unexpected choice,
  "career_signals": ["3-5 short career-related observations based on their data"],
  "stand_out_choices": ["3 most revealing individual responses and why they reveal something"]
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'
    const traits = JSON.parse(text.replace(/```json|```/g, '').trim())

    // Save to user_profile table
    await supabase.from('user_profile').upsert({
      user_id: user.id,
      inferred_traits: traits,
      updated_at: new Date().toISOString()
    })

    return res.status(200).json({ traits, total_responses: totalDataPoints })

  } catch (e) {
    console.error('Infer profile error:', e)
    return res.status(500).json({ error: 'Failed to generate profile' })
  }
}