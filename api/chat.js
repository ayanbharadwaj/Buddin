import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const FREE_LIMIT      = 10;
const SUPPORTER_LIMIT = 40;
const MAX_LIMIT       = 120;

const MODEL_FREE      = 'claude-haiku-4-5-20251001';
const MODEL_SUPPORTER = 'claude-sonnet-4-5-20250929';
const MODEL_MAX       = 'claude-sonnet-4-6';

function modelForTier(tier) {
  if (tier === 'supporter') return MODEL_SUPPORTER;
  if (tier === 'max')       return MODEL_MAX;
  return MODEL_FREE;
}

const MAX_BODY_SIZE     = 32000;
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX    = 100;
const rateLimitStore    = {};
const dailyIPCount      = {};

function hashIP(req) {
  const raw = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';
  return crypto.createHash('sha256').update(raw + 'buddin_salt_2025').digest('hex').slice(0, 32);
}

function checkRateLimit(ipHash) {
  const now = Date.now();
  if (!rateLimitStore[ipHash]) rateLimitStore[ipHash] = [];
  rateLimitStore[ipHash] = rateLimitStore[ipHash].filter(t => now - t < RATE_LIMIT_WINDOW);
  if (rateLimitStore[ipHash].length >= RATE_LIMIT_MAX) return { allowed: false };
  rateLimitStore[ipHash].push(now);
  return { allowed: true };
}

async function getUsageFromDB(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();
  return data || { count: 0, off_topic_strikes: 0 };
}

async function saveUsageToDB(userId, usageData) {
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from('usage').upsert({
    user_id: userId,
    date: today,
    count: usageData.count,
    off_topic_strikes: usageData.off_topic_strikes || 0
  });
}

async function getTierFromDB(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single();
  return data?.tier || 'free';
}

function limitForTier(tier) {
  if (tier === 'supporter') return SUPPORTER_LIMIT;
  if (tier === 'max')       return MAX_LIMIT;
  return FREE_LIMIT;
}

const OFF_TOPIC_PATTERNS = [
  /write me (a |an )?(full |complete )?(essay|story|poem|script|report|letter)/i,
  /\b(recipe for|how to bake|baking instructions|tablespoon|teaspoon|preheat oven)\b/i,
  /\b(what is \d+[\+\-\*\/]\d+|solve for x|calculate the derivative|find the integral)\b/i,
  /\b(current (stock|bitcoin|crypto) price|today's weather|exchange rate)\b/i,
  /\b(translate this to|what does .* mean in (spanish|french|hindi|tamil))\b/i,
];

function detectOffTopic(messages) {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return false;
  return OFF_TOPIC_PATTERNS.some(p => p.test(lastUser.content));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ipHash = hashIP(req);

  const rateLimitCheck = checkRateLimit(ipHash);
  if (!rateLimitCheck.allowed) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.', code: 'RATE_LIMIT' });
  }

  if (JSON.stringify(req.body).length > MAX_BODY_SIZE) {
    return res.status(413).json({ error: 'Request too large', code: 'OVERSIZED' });
  }

  const { messages, system, max_tokens } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY' });
  }

  // Resolve user identity
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  let userId = null;
  let isAuthenticated = false;

  try {
    const { data: { user } } = await supabaseAuth.auth.getUser(token);
    if (user?.id) {
      userId = user.id;
      isAuthenticated = true;
    }
  } catch {}

  // Unauthenticated users: strict in-memory daily limit
  if (!isAuthenticated) {
    const today = new Date().toISOString().slice(0, 10);
    const key = ipHash + '_' + today;
    if (!dailyIPCount[key]) dailyIPCount[key] = 0;
    if (dailyIPCount[key] >= FREE_LIMIT) {
      return res.status(429).json({
        error: 'LIMIT_REACHED',
        code: 'LIMIT_REACHED',
        tier: 'free',
        limit: FREE_LIMIT,
        count: FREE_LIMIT,
        usage_meta: { count: FREE_LIMIT, limit: FREE_LIMIT, tier: 'free', remaining: 0 }
      });
    }
    dailyIPCount[key] += 1;
    userId = ipHash;
  }

  // Authenticated users: DB-based usage
  const usageData = await getUsageFromDB(userId);
  const tier = isAuthenticated ? await getTierFromDB(userId) : 'free';
  const limit = limitForTier(tier);

  if (usageData.count >= limit) {
    return res.status(429).json({
      error: 'LIMIT_REACHED',
      code: 'LIMIT_REACHED',
      tier,
      limit,
      count: usageData.count,
      usage_meta: { count: usageData.count, limit, tier, remaining: 0 }
    });
  }

  const offTopic = detectOffTopic(messages);
  if (offTopic) {
    usageData.off_topic_strikes = (usageData.off_topic_strikes || 0) + 1;
    if (isAuthenticated) await saveUsageToDB(userId, usageData);

    if (usageData.off_topic_strikes >= 2) {
      return res.status(200).json({
        content: [{
          type: 'text',
          text: `I appreciate you being here — but I'm not the right tool for that. I'm Buddin: a friend you can talk to about what's actually going on in your life. Not a homework helper, recipe finder, or general assistant. If something's weighing on you, I'm genuinely here for that. What's actually going on today?`
        }],
        offTopicRedirect: true,
        usage_meta: { count: usageData.count, limit, tier, remaining: limit - usageData.count }
      });
    }
  } else {
    if (usageData.off_topic_strikes > 0) usageData.off_topic_strikes = 0;
  }

  usageData.count += 1;
  const remaining = limit - usageData.count;
  if (isAuthenticated) await saveUsageToDB(userId, usageData);

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
        max_tokens: max_tokens || 800,
        system,
        messages,
      }),
    });

    const apiData = await response.json();
    if (!response.ok) return res.status(response.status).json(apiData);

    return res.status(200).json({
      ...apiData,
      usage_meta: { count: usageData.count, limit, tier, remaining, model: modelForTier(tier) },
    });

  } catch (error) {
    usageData.count = Math.max(0, usageData.count - 1);
    if (isAuthenticated) await saveUsageToDB(userId, usageData);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}