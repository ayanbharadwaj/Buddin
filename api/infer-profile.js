import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE INFERENCE v2
//
// v1 read one table and produced one fixed JSON shape. As modules came online
// the naive growth path was to always send everything and always ask for every
// field — which gets slow, expensive, and produces "undefined" cards on screen
// for users who haven't done the module that would populate them.
//
// Instead: sections are conditionally included, and the requested output schema
// is assembled from only the sections that actually have data behind them. A
// user with nothing but This-or-That answers gets a four-field profile with no
// empty slots; a user who has done everything gets the full picture. Nothing
// downstream has to special-case a missing field, because a missing field is
// never requested in the first place.
// ═══════════════════════════════════════════════════════════════════════════

// Each source declares: how to fetch it, how to render it into the prompt, and
// which output fields it unlocks. Adding a module is adding one entry here.
const SECTIONS = [
  {
    key: 'comparisons',
    table: 'comparison_responses',
    columns: 'chosen, option_a, option_b, category, insight, intensity, scale_max, input_method',
    limit: 100,
    render: rows => `\nFORCED CHOICES (chose X over Y, and how strongly):\n${rows.map(c =>
      `- "${c.chosen}" over "${c.chosen === c.option_a ? c.option_b : c.option_a}" (${c.category} · ${c.insight} · ${c.intensity}/${c.scale_max}${c.input_method === 'buttons' ? ' · coarse, pre-slider' : ''})`
    ).join('\n')}\n`,
    fields: {
      aesthetic_identity: 'one sentence about their visual and taste preferences, citing specific choices',
      social_style: 'one sentence about how they operate socially, citing specific choices',
      risk_profile: 'one sentence about their relationship with risk, citing specific choices',
      contrarian_score: 'a number 0-100 where 100 = consistently picks the unexpected option',
    },
  },
  {
    key: 'words',
    table: 'word_responses',
    columns: 'word, response, knew_word, difficulty_level, response_time_ms',
    limit: 50,
    render: rows => `\nWORD REACTIONS (word → what came to mind):\n${rows.map(w =>
      `- ${w.word} (level ${w.difficulty_level}) → ${w.knew_word ? `"${w.response}"` : "didn't know this word"} [${w.response_time_ms}ms]`
    ).join('\n')}\n`,
    fields: {
      vocabulary_profile: 'one sentence about their word knowledge and the kind of associations they reach for, citing specific words',
    },
  },
  {
    key: 'writings',
    table: 'writing_samples',
    columns: 'prompt, response, word_count, time_to_first_keystroke_ms',
    limit: 10,
    // Excerpts only. This is the most personal data in the system and the
    // inference call is the only place the raw text should ever travel to.
    render: rows => `\nWRITING SAMPLES (excerpt only, plus how long before they started typing):\n${rows.map(w =>
      `- "${w.prompt}" → "${(w.response || '').slice(0, 300)}" (${w.word_count} words, ${w.time_to_first_keystroke_ms ?? '?'}ms before first keystroke)`
    ).join('\n')}\n`,
    fields: {
      writing_voice: 'one sentence about how they express themselves in writing — rhythm, structure, what they reach for',
      emotional_vocabulary: 'one sentence about how they describe feelings, including what they avoid naming',
    },
  },
  {
    key: 'popCulture',
    table: 'pop_culture_responses',
    columns: 'name, category, era, reach, recognized, familiarity, scale_max',
    limit: 90,
    render: rows => `\nNAME RECOGNITION (what they know, and — just as informative — what they don't):\n${rows.map(p =>
      `- ${p.name} (${p.category}, ${p.era}, ${p.reach}): ${p.recognized ? `knows them · sits with them ${p.familiarity}/${p.scale_max}` : 'never heard of them'}`
    ).join('\n')}\n`,
    fields: {
      cultural_orientation: 'one sentence about their information diet and where their cultural attention actually goes, naming specific recognitions AND specific gaps',
    },
  },
  {
    key: 'numbers',
    table: 'number_responses',
    columns: 'number, reaction, reason',
    limit: 60,
    render: rows => `\nNUMBER REACTIONS:\n${rows.map(n =>
      `- ${n.number}: ${n.reaction}${n.reason ? ` — "${n.reason}"` : ''}`
    ).join('\n')}\n`,
    fields: {
      pattern_instinct: 'one short sentence about the kind of associations their mind reaches for — mathematical, cultural, superstitious, aesthetic — citing specific numbers',
    },
  },
  {
    key: 'training',
    table: 'training_progress',
    columns: 'module_id, scenario_id, score',
    limit: 200,
    render: rows => {
      const byModule = {}
      rows.forEach(r => {
        if (!byModule[r.module_id]) byModule[r.module_id] = { n: 0, score: 0 }
        byModule[r.module_id].n += 1
        byModule[r.module_id].score += r.score || 0
      })
      return `\nLEARN IT PRACTICE (skills training — how they answered scenarios, 2 = the move that works):\n${
        Object.entries(byModule).map(([m, v]) =>
          `- ${m}: ${v.n} scenarios, average ${(v.score / v.n).toFixed(1)}/2`
        ).join('\n')}\n`
    },
    fields: {
      practical_instincts: 'one sentence about their judgment in the practical scenarios — where their instincts are already good and where they default to the comfortable option',
    },
  },
]

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

  // Fetch every source in parallel. A missing table (a module whose migration
  // hasn't been run yet) resolves to an empty section rather than failing the
  // whole request.
  const results = await Promise.all(SECTIONS.map(async s => {
    try {
      const { data, error: readErr } = await supabase
        .from(s.table)
        .select(s.columns)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(s.limit)

      // A named column that doesn't exist yet (a migration not yet run) fails
      // the whole select and would silently drop this data source from the
      // profile. Retry with * so the section still contributes.
      if (readErr) {
        const { data: fallback } = await supabase
          .from(s.table)
          .select('*')
          .eq('user_id', user.id)
          .limit(s.limit)
        return { section: s, rows: fallback || [] }
      }
      return { section: s, rows: data || [] }
    } catch {
      return { section: s, rows: [] }
    }
  }))

  // Preferences live on user_profile rather than in their own table.
  const { data: profileRows } = await supabase
    .from('user_profile')
    .select('preferences')
    .eq('user_id', user.id)
    .limit(1)
  const prefs = profileRows?.[0]?.preferences || {}

  const present = results.filter(r => r.rows.length > 0)
  const totalDataPoints = present.reduce((n, r) => n + r.rows.length, 0) + Object.keys(prefs).length

  if (totalDataPoints < 5) {
    return res.status(200).json({
      error: 'not_enough_data',
      message: 'Need at least 5 data points to build a profile',
    })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing API key' })

  // ── Assemble only the sections that have data ───────────────────────────
  let dataSection = present.map(r => r.section.render(r.rows)).join('')

  const requestedFields = {}
  present.forEach(r => Object.assign(requestedFields, r.section.fields))

  if (Object.keys(prefs).length > 0) {
    dataSection += `\nSTATED PREFERENCES (the one place they were asked directly):\n${
      Object.entries(prefs).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n`
    requestedFields.daily_rhythm =
      'one sentence about how they actually structure their day and energy, combining what they said with what their other answers imply'
  }

  // Always present, regardless of which modules exist.
  const schema = {
    summary: '2-3 casual sentences describing this person the way a friend would. No jargon, no therapy language.',
    ...requestedFields,
    intellectual_pattern: 'one sentence about how they think and process, drawing on whichever sources are strongest',
    stand_out_choices: ['3 of their most revealing individual responses and what each one gives away'],
    career_signals: ['3-5 short, specific observations about the kind of work they might be suited to'],
  }

  const schemaText = Object.entries(schema)
    .map(([k, v]) => `  "${k}": ${Array.isArray(v) ? `[${JSON.stringify(v[0])}]` : typeof v === 'string' ? JSON.stringify(v) : v}`)
    .join(',\n')

  const sourceList = present.map(r => `${r.section.key} (${r.rows.length})`).join(', ')
    + (Object.keys(prefs).length ? `, preferences (${Object.keys(prefs).length})` : '')

  const prompt = `You are building a picture of a teenager from behavioural data — not from anything they said about themselves directly. Be specific and evidence-based. Every claim should be traceable to something below. If a pattern isn't there, don't invent one; say the picture is still thin on that front.

Data sources available for this person: ${sourceList}
${dataSection}
Output ONLY a valid JSON object with exactly these keys and nothing else:
{
${schemaText}
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
        // Scales with how many fields were actually requested — a thin profile
        // doesn't pay for a full-profile token budget.
        max_tokens: Math.min(3000, 700 + Object.keys(schema).length * 160),
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'
    const traits = JSON.parse(text.replace(/```json|```/g, '').trim())

    // Record which modules fed this profile, so MyProfile can tell the user
    // what's behind it and what would sharpen it — without guessing.
    traits.data_sources = present.map(r => r.section.key)
      .concat(Object.keys(prefs).length ? ['preferences'] : [])

    const row = { user_id: user.id, inferred_traits: traits, updated_at: new Date().toISOString() }
    const { error: saveErr } = await supabase.from('user_profile').upsert(row, { onConflict: 'user_id' })
    if (saveErr) {
      // Fallback for databases where the UNIQUE(user_id) constraint from
      // supabase-fixes.sql hasn't been applied yet.
      const { data: existing } = await supabase
        .from('user_profile').select('id').eq('user_id', user.id).limit(1)
      if (existing?.[0]) {
        await supabase.from('user_profile').update(row).eq('user_id', user.id)
      } else {
        await supabase.from('user_profile').insert(row)
      }
    }

    return res.status(200).json({ traits, total_responses: totalDataPoints })
  } catch (e) {
    console.error('Infer profile error:', e)
    return res.status(500).json({ error: 'Failed to generate profile' })
  }
}
