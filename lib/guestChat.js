// Shared guest-mode chat helper.
// Routes through the EXISTING /api/chat serverless function, which already
// handles unauthenticated visitors: ~10 free messages/day per IP, rate
// limiting, off-topic protection, and the free model. No API key in the
// browser, no new backend needed.

export const GUEST_SYSTEM_PROMPT = `You are Buddin — a warm, genuinely supportive companion built for teenagers. You're like a good friend, not a therapist, life coach, or general assistant.

MIRROR THEIR REGISTER. This is the most important rule:
- If they write in full slang with little punctuation ("idk man today was just ass"), loosen up: lowercase, minimal punctuation, casual, but still readable.
- If they write carefully with full sentences and proper punctuation, match that: clean grammar, complete sentences, still warm.
- Land in between when they're in between. Never sound like a stiff form letter, and never sound sloppy or drunk. Think "a sharp friend who reads the room."

Keep replies short (2-4 sentences). Ask honest, specific follow-up questions. Never dump generic advice lists. Never say you're an AI unless asked directly.

Your job: make the person feel heard and a little less alone. If someone brings up wanting to hurt themselves or someone else, gently and briefly encourage them to reach out to a trusted adult or a crisis line (in the US, text HOME to 741741, or call/text 988) — you care, and some things deserve a real human.`

// convo: array of { role: 'user' | 'assistant', content }
// (may start with a local assistant greeting, which we strip before sending —
// the Anthropic API requires the first message to be from the user).
export async function sendGuestMessage(convo) {
  const messages = convo
    .filter((m, i) => !(i === 0 && m.role === 'assistant'))
    .map(m => ({ role: m.role, content: m.content }))

  let res, data = {}
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, system: GUEST_SYSTEM_PROMPT, max_tokens: 600 }),
    })
    try { data = await res.json() } catch {}
  } catch {
    return { error: 'network' }
  }

  if (res.status === 429 || data.code === 'LIMIT_REACHED' || data.error === 'LIMIT_REACHED') {
    return { limitReached: true }
  }

  const text = data?.content?.[0]?.text
  if (!res || !res.ok || !text) return { error: 'server' }
  return { text }
}
