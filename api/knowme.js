import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// ═══════════════════════════════════════════════════════════════════════════
// KNOW ME — one serverless function, five logical routes.
//
// Vercel's Hobby plan allows 12 Serverless Functions per deployment and every
// file in /api becomes one. Preferences, Pop Culture, Numbers, Learn It
// progress and Career Discovery would have been five of those on their own, so
// they're dispatched here off ?route= instead — the same trick /api/profile
// already uses for /api/feedback.
//
// Auth runs once, at the top, for every route. The dual-client pattern is
// non-negotiable: the service key cannot validate a user's JWT, and using it to
// try produces unauthorized errors that look like a completely different bug.
// ═══════════════════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  const route = req.query?.route

  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

  switch (route) {
    case 'preferences':  return preferences(req, res, user)
    case 'pop-culture':  return popCulture(req, res, user)
    case 'numbers':      return numbers(req, res, user)
    case 'training':     return training(req, res, user)
    case 'career':       return career(req, res, user)
    case 'coach':        return coach(req, res, user)
    default:
      return res.status(400).json({ error: `Unknown route: ${route || '(none)'}` })
  }
}

// ── Learn It coach ──────────────────────────────────────────────────────────
// Deliberately kept in the same voice the user already picked in the main chat.
// These strings mirror the AVATARS table in src/App.jsx; they're duplicated here
// rather than imported so this serverless function has no dependency on the
// frontend bundle.
const COACH_VOICES = {
  mochi: "Warm and gentle. Say 'we' more than 'you'. Take the pressure out of it before explaining anything. Never make them feel behind.",
  sage:  "Philosophical and Socratic. Where a question would teach more than an answer, ask it — but never leave them with nothing.",
  zap:   "Direct and clear. Short sentences. Give the answer first, then the reason. Cut every hedge and every bit of filler.",
  nova:  "Curious and imaginative. Reframe it — a comparison, a pattern, an angle they hadn't considered. Find the interesting part.",
}

// Its own allowance, separate from the companion chat's daily limit. Making
// someone spend their ten conversation messages to finish a lesson would make
// the whole feature unusable on the free tier.
const COACH_LIMITS = { free: 25, supporter: 80, max: 200 }

async function coach(req, res, user) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing API key' })

  const { avatar_id, module_title, situation, options, chose, messages } = req.body
  if (!situation || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Tier + daily coaching count. If the coach_count column hasn't been migrated
  // yet, fail open — a missing column should never lock someone out of learning.
  const today = new Date().toISOString().slice(0, 10)
  let tier = 'free'
  try {
    const { data: p } = await supabase.from('profiles').select('tier').eq('id', user.id).limit(1)
    tier = p?.[0]?.tier || 'free'
  } catch { /* default free */ }

  const limit = COACH_LIMITS[tier] ?? COACH_LIMITS.free
  let used = 0
  let countable = true
  try {
    const { data: u, error: uErr } = await supabase
      .from('usage').select('coach_count').eq('user_id', user.id).eq('date', today).limit(1)
    if (uErr) countable = false
    else used = u?.[0]?.coach_count || 0
  } catch { countable = false }

  if (countable && used >= limit) {
    return res.status(429).json({ error: 'COACH_LIMIT_REACHED', remaining: 0 })
  }

  const voice = COACH_VOICES[avatar_id] || COACH_VOICES.zap

  const system = `You are the user's companion inside Buddin's "Learn It" section, helping a teenager actually understand a real-world situation rather than memorise an answer.

YOUR VOICE: ${voice}

THE SITUATION THEY'RE WORKING THROUGH${module_title ? ` (module: ${module_title})` : ''}:
"${situation}"

THE OPTIONS THEY WERE SHOWN:
${(options || []).map((o, i) => `${i + 1}. ${o}`).join('\n')}
${chose
  ? `\nWHAT THEY PICKED: "${chose}" — they have already committed, so you can be fully open about what each option costs.`
  : `\nTHEY HAVE NOT PICKED YET. Help them think it through — what to weigh, what the situation is really about, what they'd want afterwards. Do NOT tell them which option is best or hint at it. If they push for the answer, say plainly that picking it themselves first is the part that makes it stick, and that everything opens up right after.`}

HOW TO ANSWER:
- Two to four sentences. This is a conversation, not an article.
- Ask at most ONE question per reply, and only when it genuinely moves them forward.
- Be concrete. Name what actually happens in the room, not abstract principles.
- If they describe a variation the options didn't cover, engage with THEIR version — that curiosity is the whole point of this feature.
- Never tell them they got it wrong. Explain what each choice costs and let them draw the line.
- No lists, no headers, no bold. Plain conversational text.
- You are a peer who has thought about this, not a teacher, therapist, or life coach. Never clinical.
- Stay on this situation and the skill behind it. If they steer somewhere unrelated, say so warmly in one line and point them back to the main chat.

CRISIS: if there are genuine signs of self-harm or crisis, drop everything else, lead with warmth, and give the 988 Lifeline and Crisis Text Line (text HOME to 741741).`

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
        max_tokens: 400,
        system,
        messages: messages
          .filter(m => m && (m.role === 'user' || m.role === 'assistant') && m.content)
          .map(m => ({ role: m.role, content: String(m.content).slice(0, 1500) })),
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('Coach upstream error:', data)
      return res.status(502).json({ error: 'Coach unavailable' })
    }

    const reply = data.content?.[0]?.text?.trim()
    if (!reply) return res.status(502).json({ error: 'Empty reply' })

    if (countable) {
      await supabase.from('usage').upsert(
        { user_id: user.id, date: today, coach_count: used + 1 },
        { onConflict: 'user_id,date' }
      )
    }

    return res.status(200).json({
      reply,
      remaining: countable ? Math.max(0, limit - (used + 1)) : null,
    })
  } catch (e) {
    console.error('Coach error:', e)
    return res.status(500).json({ error: 'Failed to reach coach' })
  }
}

// ── Shared: write to user_profile whether or not UNIQUE(user_id) exists ─────
async function saveProfileRow(row, userId) {
  const { error: upsertErr } = await supabase.from('user_profile').upsert(row, { onConflict: 'user_id' })
  if (!upsertErr) return null
  const { data: existing } = await supabase
    .from('user_profile').select('id').eq('user_id', userId).limit(1)
  const { error: fallbackErr } = existing?.[0]
    ? await supabase.from('user_profile').update(row).eq('user_id', userId)
    : await supabase.from('user_profile').insert(row)
  return fallbackErr || null
}

// ── Preferences ─────────────────────────────────────────────────────────────
// Settings, not behavioural logging — these live in the JSONB column already
// provisioned on user_profile rather than in a table of their own.
async function preferences(req, res, user) {
  if (req.method === 'GET') {
    const { data } = await supabase
      .from('user_profile').select('preferences').eq('user_id', user.id).limit(1)
    return res.status(200).json({ preferences: data?.[0]?.preferences || {} })
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const { preferences: prefs } = req.body
  if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) {
    return res.status(400).json({ error: 'Missing or malformed preferences' })
  }

  // Merge, never replace — a partial save must not wipe answers from an
  // earlier visit.
  const { data: existing } = await supabase
    .from('user_profile').select('preferences').eq('user_id', user.id).limit(1)
  const merged = { ...(existing?.[0]?.preferences || {}), ...prefs }

  const saveErr = await saveProfileRow(
    { user_id: user.id, preferences: merged, updated_at: new Date().toISOString() },
    user.id
  )
  if (saveErr) {
    console.error('Preferences save error:', saveErr)
    return res.status(500).json({ error: 'Failed to save preferences' })
  }
  return res.status(200).json({ success: true, preferences: merged })
}

// ── Pop Culture Recognition ─────────────────────────────────────────────────
async function popCulture(req, res, user) {
  if (req.method === 'GET') {
    const { data } = await supabase
      .from('pop_culture_responses').select('name_id').eq('user_id', user.id)
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

  const { error: insertError } = await supabase.from('pop_culture_responses').insert({
    user_id: user.id,
    name_id, name,
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

// ── Number Preference ───────────────────────────────────────────────────────
async function numbers(req, res, user) {
  if (req.method === 'GET') {
    const { data } = await supabase
      .from('number_responses').select('number').eq('user_id', user.id)
    return res.status(200).json(data || [])
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const { number, position, reaction, reason, response_time_ms } = req.body
  if (number == null || !reaction) return res.status(400).json({ error: 'Missing required fields' })
  if (!['like', 'neutral', 'dislike'].includes(reaction)) {
    return res.status(400).json({ error: 'Invalid reaction' })
  }

  const { error: insertError } = await supabase.from('number_responses').insert({
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

// ── Learn It progress ───────────────────────────────────────────────────────
// One row per scenario answered. Level and completion are derived by counting
// rather than stored, so there's no counter that can drift out of sync.
async function training(req, res, user) {
  if (req.method === 'GET') {
    const { data, error: readErr } = await supabase
      .from('training_progress')
      .select('module_id, scenario_id, score, choice_index')
      .eq('user_id', user.id)
    if (readErr) {
      console.error('Training read error:', readErr)
      return res.status(500).json({ error: 'Failed to load progress' })
    }
    return res.status(200).json(data || [])
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const { module_id, scenario_id, choice_index, score, response_time_ms } = req.body
  if (!module_id || !scenario_id || choice_index == null || score == null) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Revisiting a scenario updates the answer instead of stacking duplicates
  // that would inflate the level count.
  const { error: upsertErr } = await supabase.from('training_progress').upsert({
    user_id: user.id,
    module_id, scenario_id, choice_index, score,
    response_time_ms: response_time_ms || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,module_id,scenario_id' })

  if (upsertErr) {
    console.error('Training upsert error:', upsertErr)
    return res.status(500).json({ error: 'Failed to save progress' })
  }
  return res.status(200).json({ success: true })
}

// ── Career Discovery ────────────────────────────────────────────────────────
// The first module that is primarily a consumer of other modules' data: it
// reads everything already collected, folds in a handful of oblique answers,
// and asks for three directions with reasoning tied to actual choices.
async function career(req, res, user) {
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
  if (!answers || typeof answers !== 'object') return res.status(400).json({ error: 'Missing answers' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing API key' })

  const [comparisons, words, writings, popCultureRows, profileRow] = await Promise.all([
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
  if (popCultureRows.data?.length) {
    context += `\nNAME RECOGNITION (what they know and don't):\n${popCultureRows.data
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

    await saveProfileRow({
      user_id: user.id,
      career_answers: answers,
      career_directions: directions,
      updated_at: new Date().toISOString(),
    }, user.id)

    return res.status(200).json({ directions })
  } catch (e) {
    console.error('Career discovery error:', e)
    return res.status(500).json({ error: 'Failed to generate directions' })
  }
}
