// Shared guest-mode chat helper.
// Routes through the EXISTING /api/chat serverless function, which already
// handles unauthenticated visitors: ~10 free messages/day per IP, rate
// limiting, off-topic protection, and the free model. No API key in the
// browser, no new backend needed.

// The guest system prompt now lives in lib/prompts.js and is applied by
// api/chat.js. It used to be sent from the browser, which meant any caller
// could substitute their own instructions on our API key.

// ── Anonymous guest tracking (persists across reloads / leaving & returning) ──
// Stored in localStorage, keyed by surface ('try' or 'demo'), reset once per day
// so a returning visitor isn't locked out forever — matching the backend's daily
// per-IP limit. Leaving /try and coming back no longer hands out a fresh allowance.
const GUEST_PREFIX = 'buddin_guest_'
const guestDay = () => new Date().toISOString().slice(0, 10)

export function loadGuest(key) {
  try {
    const raw = localStorage.getItem(GUEST_PREFIX + key)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data.date !== guestDay()) return null // new day → fresh allowance
    return data // { date, turns, messages }
  } catch { return null }
}

export function saveGuest(key, turns, messages) {
  try {
    localStorage.setItem(GUEST_PREFIX + key, JSON.stringify({ date: guestDay(), turns, messages }))
  } catch {}
}

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
      body: JSON.stringify({ mode: 'guest', messages, max_tokens: 600 }),
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
