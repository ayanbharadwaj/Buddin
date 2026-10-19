# GetBuddin — how tiers actually work

Rewritten October 18, 2026. The previous version of this file described a
`/data/tiers.json` file-based system, file-backed rate limiting in
`/data/ratelimit/`, a BuyMeACoffee integration, and `claude-3-haiku-20240307`.
None of those exist. This file now describes what the code really does.

## Where a tier lives

One column: `profiles.tier`, holding `free`, `supporter`, or `max`.
`api/chat.js` reads it via `getTierFromDB(userId)`. There is no JSON file and
no IP-based tier mapping.

## What each tier changes

| Tier | Messages/day | Chat model | Learn It coaching/day |
|---|---|---|---|
| `free` | 10 | `claude-haiku-4-5` | 25 |
| `supporter` | 40 | `claude-sonnet-4-5` | 80 |
| `max` | 120 | `claude-sonnet-4-6` | 200 |

Message limits and model selection: `api/chat.js` (`limitForTier`,
`modelForTier`). Coaching limits: `api/knowme.js` (`COACH_LIMITS`), counted
separately so finishing a Learn It lesson never eats your conversation quota.

Daily counts live in the Supabase `usage` table, keyed `(user_id, date)` —
`count` for chat, `coach_count` for coaching.

## How someone gets a paid tier

**By hand, in Supabase.** There is deliberately no way to buy one.

The purchase flow was removed on October 18, 2026. It approved PayPal orders
without ever calling `actions.order.capture()`, so money never moved; it then
granted the tier with a `profiles.update({tier})` call **from the browser**,
which any signed-in user could run themselves from devtools; and it displayed
$9/$19 while charging $4.99/$9.99. Rather than ship a payment path that could
not be verified server-side, it is off until it can be built properly.

To grant a tier:

```sql
update profiles set tier = 'supporter' where id = '<user-uuid>';
```

Before purchasing can come back, all of these are required:
1. An `api/verify-payment.js` route that captures the order with the PayPal
   secret server-side and only then sets the tier using the service key.
2. An RLS policy making `profiles.tier` writable by the service role only.
3. One source of truth for prices, rendered by both the pricing cards and the
   order amount, so the two can never drift apart again.

## Rate limiting

`api/chat.js` applies 100 requests/minute per identity, in memory
(`rateLimitStore`). Two known weaknesses, both tracked:
- In-memory counters do not survive serverless instances scaling out.
- The identity comes from the **leftmost** `X-Forwarded-For` entry, which the
  client controls and can rotate.

Both are fixed in the security pass, not here.

## Off-topic handling

Patterns live in `OFF_TOPIC_PATTERNS` in `api/chat.js`. The backend detects
them and returns `offTopicRedirect: true`; the frontend only renders the
message. Two strikes produces a redirect message. Keeping the logic in one
place is what stops the double-redirect bug this originally had.
