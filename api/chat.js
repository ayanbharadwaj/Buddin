import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const FREE_LIMIT       = 10;
const SUPPORTER_LIMIT  = 40;
const MAX_LIMIT        = 120;
const MAX_BODY_SIZE    = 32000;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX   = 100;  // requests per minute

const DATA_DIR = process.env.NODE_ENV === 'production'
  ? '/tmp/buddin_usage'
  : path.join(process.cwd(), 'data', 'usage');

const TIERS_DIR = process.env.NODE_ENV === 'production'
  ? '/tmp'
  : path.join(process.cwd(), 'data');

const RATE_LIMIT_DIR = process.env.NODE_ENV === 'production'
  ? '/tmp/buddin_ratelimit'
  : path.join(process.cwd(), 'data', 'ratelimit');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(TIERS_DIR)) fs.mkdirSync(TIERS_DIR, { recursive: true });
if (!fs.existsSync(RATE_LIMIT_DIR)) fs.mkdirSync(RATE_LIMIT_DIR, { recursive: true });

function hashIP(req) {
  const raw = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';
  return crypto.createHash('sha256').update(raw + 'buddin_salt_2025').digest('hex').slice(0, 32);
}

function getUsage(ipHash) {
  const file = path.join(DATA_DIR, `${ipHash}.json`);
  const today = new Date().toISOString().slice(0, 10);
  let data = { date: today, count: 0, blocked: false, offTopicStrikes: 0 };
  if (fs.existsSync(file)) {
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (raw.date !== today) { 
        data = { ...data, blocked: raw.blocked }; 
      } else { 
        data = raw; 
      }
    } catch {}
  }
  return { file, data };
}

function getTier(ipHash) {
  const tiersFile = path.join(TIERS_DIR, 'tiers.json');
  try {
    if (fs.existsSync(tiersFile)) {
      const tiers = JSON.parse(fs.readFileSync(tiersFile, 'utf8'));
      return tiers[ipHash] || 'free';
    }
  } catch {}
  return 'free';
}

function setTier(ipHash, tier) {
  const tiersFile = path.join(TIERS_DIR, 'tiers.json');
  try {
    let tiers = {};
    if (fs.existsSync(tiersFile)) {
      tiers = JSON.parse(fs.readFileSync(tiersFile, 'utf8'));
    }
    tiers[ipHash] = tier;
    fs.writeFileSync(tiersFile, JSON.stringify(tiers, null, 2));
    return true;
  } catch (e) {
    console.error('Error saving tier:', e);
    return false;
  }
}

function saveUsage(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data)); } catch {}
}

function limitForTier(tier) {
  if (tier === 'supporter') return SUPPORTER_LIMIT;
  if (tier === 'max') return MAX_LIMIT;
  return FREE_LIMIT;
}

function checkRateLimit(ipHash) {
  const rateLimitFile = path.join(RATE_LIMIT_DIR, `${ipHash}.json`);
  const now = Date.now();
  let rateLimitData = { requests: [], blocked: false };
  
  if (fs.existsSync(rateLimitFile)) {
    try {
      rateLimitData = JSON.parse(fs.readFileSync(rateLimitFile, 'utf8'));
    } catch {}
  }
  
  rateLimitData.requests = rateLimitData.requests.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (rateLimitData.requests.length >= RATE_LIMIT_MAX) {
    return { allowed: false, reason: 'rate_limit' };
  }
  
  rateLimitData.requests.push(now);
  try {
    fs.writeFileSync(rateLimitFile, JSON.stringify(rateLimitData));
  } catch {}
  
  return { allowed: true, reason: null };
}

const OFF_TOPIC_PATTERNS = [
  /\b(homework|essay|assignment|quiz|exam|test|chapter|textbook)\b/i,
  /\b(recipe|bake|baking|cook|ingredient|tablespoon|teaspoon|oven|celsius|fahrenheit)\b/i,
  /\b(factor|quadratic|derivative|integral|algebra|calculus|geometry|theorem|equation)\b/i,
  /write me (a |an )?(essay|story|poem|code|script|email|report|letter)/i,
  /\b(calculate|solve for|what is \d+[\+\-\*\/]\d+|what equals)\b/i,
  /\b(weather|forecast|stock price|bitcoin|crypto|exchange rate|current time)\b/i,
  /\b(translate this|translation of|what does.*mean in)\b/i,
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
    return res.status(429).json({ 
      error: 'Too many requests. Please wait a moment.', 
      code: 'RATE_LIMIT' 
    });
  }

  if (JSON.stringify(req.body).length > MAX_BODY_SIZE) {
    return res.status(413).json({ error: 'Request too large', code: 'OVERSIZED' });
  }

  const { messages, system, max_tokens } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY' });
  }

  const { file, data } = getUsage(ipHash);
  const tier = getTier(ipHash);
  const limit = limitForTier(tier);

  if (data.blocked) {
    return res.status(429).json({ error: 'BLOCKED', code: 'BLOCKED' });
  }

  if (data.count >= limit) {
    return res.status(429).json({
      error: 'LIMIT_REACHED',
      code: 'LIMIT_REACHED',
      tier,
      limit,
      count: data.count,
      usage_meta: { count: data.count, limit, tier, remaining: 0 }
    });
  }


  const offTopic = detectOffTopic(messages);
  if (offTopic) {
    data.offTopicStrikes = (data.offTopicStrikes || 0) + 1;
    saveUsage(file, data);

    if (data.offTopicStrikes >= 2) {
      return res.status(200).json({
        content: [{
          type: 'text',
          text: `I appreciate you being here — but I'm not the right tool for that. I'm Buddin: a friend you can talk to about what's actually going on in your life. Not a homework helper, recipe finder, or general assistant. If something's weighing on you, I'm genuinely here for that. What's actually going on today?`
        }],
        offTopicRedirect: true,
        usage_meta: { 
          count: data.count, 
          limit, 
          tier, 
          remaining: limit - data.count 
        }
      });
    }
  } else {
    if (data.offTopicStrikes > 0) {
      data.offTopicStrikes = 0;
    }
  }

  data.count += 1;
  const remaining = limit - data.count;
  saveUsage(file, data);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: max_tokens || 800,
        system,
        messages,
      }),
    });

    const apiData = await response.json();
    if (!response.ok) return res.status(response.status).json(apiData);

    return res.status(200).json({
      ...apiData,
      usage_meta: { count: data.count, limit, tier, remaining },
    });

  } catch (error) {
    data.count = Math.max(0, data.count - 1);
    saveUsage(file, data);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}