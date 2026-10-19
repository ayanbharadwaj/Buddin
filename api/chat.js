import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { systemPromptFor, VALID_AVATAR_IDS } from '../lib/prompts.js';
import { isCrisisText, CRISIS_INSTRUCTION } from '../lib/crisis.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const FREE_LIMIT = 10;
const SUPPORTER_LIMIT = 40;
const MAX_LIMIT = 120;

const MODEL_FREE = 'claude-haiku-4-5-20251001';
const MODEL_SUPPORTER = 'claude-sonnet-4-5-20250929';
const MODEL_MAX = 'claude-sonnet-4-6';

function modelForTier(tier) {
  if (tier === 'supporter') return MODEL_SUPPORTER;
  if (tier === 'max') return MODEL_MAX;
  return MODEL_FREE;
}
function limitForTier(tier) {
  if (tier === 'supporter') return SUPPORTER_LIMIT;
  if (tier === 'max') return MAX_LIMIT;
  return FREE_LIMIT;
}

const MAX_BODY_SIZE = 32000;
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 100;
const rateLimitStore = {};

// Per-identity off-topic strikes. In-memory on purpose: a nudge that resets
// when an instance recycles is fine, and it keeps guests out of the database.
// Previously these lived in a column only authenticated users had, so the
// off-topic redirect could never fire for a guest at all.
const offTopicStrikes = {};

// Last-resort guest counter, used only when the v3 migration hasn't been run.
const guestFallback = {};

// Hard server-side ceiling. This used to come straight from the request body,
// so a caller could ask for an enormous completion on our key.
const MAX_TOKENS_CEILING = 1024;

// Bounds on the conversation itself — an unbounded history is the other half
// of the same cost-amplification hole.
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 8000;

// ── Client identity ─────────────────────────────────────────────────────────
// X-Forwarded-For is a list where the LEFTMOST entry is written by the client
// and each proxy appends to the right. Reading the leftmost entry let anyone
// mint a fresh identity per request with a fake header, which defeated both
// the per-minute rate limit and the daily guest limit. Vercel's own headers
// (x-real-ip, x-vercel-forwarded-for) cannot be forged by the client, so they
// are preferred; the rightmost XFF entry is the fallback.
function clientIdentity(req) {
  const realIp = req.headers['x-real-ip'];
  const vercelFwd = req.headers['x-vercel-forwarded-for'];
  let raw = (typeof realIp === 'string' && realIp.trim())
    || (typeof vercelFwd === 'string' && vercelFwd.split(',').pop()?.trim());

  if (!raw) {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) raw = xff.split(',').pop().trim();
  }
  if (!raw) raw = req.socket?.remoteAddress || 'unknown';

  return crypto.createHash('sha256').update(raw + 'buddin_salt_2025').digest('hex').slice(0, 32);
}

// Best-effort burst limiter. In-memory, so it only sees one instance — the
// durable per-day limit below is what actually holds, and this just blunts a
// burst against a single instance.
function checkBurst(idHash) {
  const now = Date.now();
  if (!rateLimitStore[idHash]) rateLimitStore[idHash] = [];
  rateLimitStore[idHash] = rateLimitStore[idHash].filter(t => now - t < RATE_LIMIT_WINDOW);
  if (rateLimitStore[idHash].length >= RATE_LIMIT_MAX) return false;
  rateLimitStore[idHash].push(now);
  return true;
}

const today = () => new Date().toISOString().slice(0, 10);

const OFF_TOPIC_PATTERNS = [
  /write me (a |an )?(full |complete )?(essay|story|poem|script|report|letter)/i,
  /\b(recipe for|how to bake|baking instructions|tablespoon|teaspoon|preheat oven)\b/i,
  /\b(what is \d+[\+\-\*\/]\d+|solve for x|calculate the derivative|find the integral)\b/i,
  /\b(current (stock|bitcoin|crypto) price|today's weather|exchange rate)\b/i,
  /\b(translate this to|what does .* mean in (spanish|french|hindi|tamil))\b/i,
];

function lastUserText(messages) {
  const last = [...messages].reverse().find(m => m.role === 'user');
  return last?.content || '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Malformed or missing bodies used to crash the route before any validation.
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : null;
  if (!body) return res.status(400).json({ error: 'Invalid request body' });

  let bodySize = 0;
  try { bodySize = JSON.stringify(body).length; } catch { return res.status(400).json({ error: 'Invalid request body' }); }
  if (bodySize > MAX_BODY_SIZE) return res.status(413).json({ error: 'Request too large', code: 'OVERSIZED' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server misconfigured' });

  // ── Validate the shape of what we were asked to do ────────────────────────
  const { mode, avatar_id, context, messages, max_tokens } = body;

  if (!['chat', 'guest', 'insights'].includes(mode)) {
    return res.status(400).json({ error: 'Unknown mode' });
  }
  if (mode === 'chat' && !VALID_AVATAR_IDS.includes(avatar_id)) {
    return res.status(400).json({ error: 'Unknown companion' });
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  const cleanMessages = [];
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      return res.status(400).json({ error: 'Invalid messages' });
    }
    cleanMessages.push({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) });
  }

  // Note what is NOT read here: `system`. The client no longer has any say over
  // the highest-privilege field in the request.
  const system = systemPromptFor(mode, { ...(context || {}), avatar_id });
  if (!system) return res.status(400).json({ error: 'Unknown mode' });

  const idHash = clientIdentity(req);
  if (!checkBurst(idHash)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.', code: 'RATE_LIMIT' });
  }

  // ── Who is this ───────────────────────────────────────────────────────────
  let userId = null;
  let isAuthenticated = false;
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const { data } = await supabaseAuth.auth.getUser(token);
      if (data?.user?.id) { userId = data.user.id; isAuthenticated = true; }
    }
  } catch (e) {
    console.error('Auth check failed:', e);
  }

  const date = today();
  let tier = 'free';
  let count = 0;
  let limit = FREE_LIMIT;

  // Falls back to read-modify-write if the atomic RPCs from
  // supabase-schema-v3.sql haven't been applied yet. The fallback has the race
  // this change exists to fix, but a missing migration must degrade the limit's
  // precision — not take chat down for everyone.
  const rpcMissing = (e) =>
    e && (e.code === '42883' || /function .* does not exist|could not find the function/i.test(e.message || ''));

  async function bumpAuthed() {
    const { data, error } = await supabase.rpc('increment_usage', { p_user: userId, p_date: date });
    if (!error) return data;
    if (!rpcMissing(error)) throw error;
    console.warn('increment_usage RPC missing — run supabase-schema-v3.sql. Falling back.');
    const { data: row } = await supabase
      .from('usage').select('count').eq('user_id', userId).eq('date', date).maybeSingle();
    const next = (row?.count || 0) + 1;
    await supabase.from('usage').upsert({ user_id: userId, date, count: next }, { onConflict: 'user_id,date' });
    return next;
  }

  async function bumpGuest() {
    const { data, error } = await supabase.rpc('increment_guest_usage', { p_hash: idHash, p_date: date });
    if (!error) return data;
    if (!rpcMissing(error)) throw error;
    console.warn('increment_guest_usage RPC missing — run supabase-schema-v3.sql. Falling back to memory.');
    guestFallback[idHash] = guestFallback[idHash] || { date, n: 0 };
    if (guestFallback[idHash].date !== date) guestFallback[idHash] = { date, n: 0 };
    return ++guestFallback[idHash].n;
  }

  try {
    if (isAuthenticated) {
      const { data: prof, error: tierErr } = await supabase
        .from('profiles').select('tier').eq('id', userId).limit(1);
      if (tierErr) {
        // Fail loudly rather than silently downgrading someone who pays.
        console.error('Tier lookup failed — defaulting to free:', tierErr);
      }
      tier = prof?.[0]?.tier || 'free';
      limit = limitForTier(tier);

      // Atomic: two concurrent requests can no longer both read N and write N+1.
      count = await bumpAuthed();
    } else {
      // Guests are counted in the database, not in process memory — in-memory
      // counters did not survive the platform scaling out a new instance.
      count = await bumpGuest();
      limit = FREE_LIMIT;
    }
  } catch (e) {
    console.error('Usage accounting failed:', e);
    return res.status(503).json({ error: 'Service temporarily unavailable. Try again in a moment.' });
  }

  const remaining = Math.max(0, limit - count);
  const usage_meta = { count, limit, tier, remaining };

  if (count > limit) {
    return res.status(429).json({
      error: 'LIMIT_REACHED', code: 'LIMIT_REACHED',
      tier, limit, count,
      usage_meta: { count, limit, tier, remaining: 0 },
    });
  }

  // ── Off-topic, for everyone ───────────────────────────────────────────────
  // Strikes previously lived in a column only authenticated users had, so the
  // redirect could never fire for a guest. Counting in memory per identity is
  // enough for a nudge and costs no storage.
  const userText = lastUserText(cleanMessages);
  if (OFF_TOPIC_PATTERNS.some(p => p.test(userText))) {
    offTopicStrikes[idHash] = (offTopicStrikes[idHash] || 0) + 1;
    if (offTopicStrikes[idHash] >= 2) {
      return res.status(200).json({
        content: [{
          type: 'text',
          text: `I appreciate you being here — but I'm not the right tool for that. I'm Buddin: a friend you can talk to about what's actually going on in your life. Not a homework helper, recipe finder, or general assistant. If something's weighing on you, I'm genuinely here for that. What's actually going on today?`,
        }],
        offTopicRedirect: true,
        usage_meta,
      });
    }
  } else {
    delete offTopicStrikes[idHash];
  }

  // ── Crisis, enforced on the server ────────────────────────────────────────
  // This check used to exist only in the browser, so calling the API directly
  // skipped the handoff entirely. It now runs on every request, for guests and
  // authenticated users alike, before the model is called.
  const crisis = cleanMessages.some(m => m.role === 'user' && isCrisisText(m.content));
  const finalSystem = crisis ? system + CRISIS_INSTRUCTION : system;

  const tokens = Math.min(
    MAX_TOKENS_CEILING,
    Math.max(64, Number.isFinite(Number(max_tokens)) ? Number(max_tokens) : 800)
  );

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelForTier(tier),
        max_tokens: tokens,
        system: finalSystem,
        messages: cleanMessages,
      }),
    });

    const apiData = await response.json();
    if (!response.ok) {
      console.error('Anthropic error:', apiData);
      return res.status(502).json({ error: "Couldn't reach Buddin right now. Try again in a moment." });
    }

    return res.status(200).json({
      ...apiData,
      crisisDetected: crisis,
      usage_meta: { ...usage_meta, model: modelForTier(tier) },
    });
  } catch (error) {
    console.error('Chat route error:', error);
    return res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}
