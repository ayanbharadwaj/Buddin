# Buddin Tier System - Implementation Guide

## What Was Updated

### 1. Backend Changes (`/api/chat.js`)

✅ **Model Updated**: `claude-3-haiku-20240307`
✅ **Tier System**: Reads from `/data/tiers.json` (or `/tmp/buddin_tiers` in production)
✅ **Rate Limiting**: 100 requests per minute per IP
✅ **Supporter Tier**: Renamed from "pro" (40 messages/day)
✅ **Unified Off-Topic Logic**: All patterns in backend, backend returns flag

### 2. Frontend Changes (`/src/App.jsx`)

✅ **Tier Badge**: Displays in chat header showing current tier (Free/Supporter/Max)
✅ **Plans Button**: Added to home screen navbar
✅ **Message Limits**: Automatically enforced by backend
✅ **UI State**: Reads tier from `usageMeta.tier`

### 3. New Files

- `/data/tiers.json` - Mock tier database (starts empty `{}`)

---

## How the Tier System Works

### Tier Limits

- **Free**: 10 messages/day
- **Supporter**: 40 messages/day
- **Max**: 120 messages/day

### Tier Assignment (Manual for Now)

Until you integrate real payments, upgrade users manually by adding to `/data/tiers.json`:

```json
{
  "hashedIP_abc123": "free",
  "hashedIP_def456": "supporter",
  "hashedIP_ghi789": "max"
}
```

### Data Flow

1. **User sends message** → Backend reads tier from `tiers.json`
2. **Backend enforces limit** → Returns `usage_meta: { tier, limit, remaining }`
3. **Frontend displays tier badge** → Shows in chat header
4. **Limit reached** → Shows upgrade prompt

---

## Off-Topic Logic (Unified)

All off-topic patterns are now **centralized in backend**:

- Backend detects off-topic message
- Returns `offTopicRedirect: true` flag
- Frontend just displays the message (no duplicate logic)
- After 2 strikes, shows friendly redirect message

This prevents:

- Double redirects
- Inconsistent behavior
- Conflicting logic

---

## Rate Limiting

Protects your server from abuse:

- **Window**: 60 seconds
- **Limit**: 100 requests per IP
- **File**: `/data/ratelimit/` (auto-created)

---

## Tier Badge in Chat

**Location**: Top-right of chat screen, next to "Breathe" button
**Format**: Small glass-morphic badge showing "free" | "supporter" | "max"
**Updates**: When backend returns `usage_meta.tier`

---

## Plans Button on Home

**Location**: Home screen navbar, next to "Switch" button
**Icon**: Sparkles (Lucide React)
**Action**: `onClick={() => setScreen("upgrade")}`
**Label**: "Plans"

---

## Manual Tier Testing

To test tiers locally, edit `/data/tiers.json`:

```json
{
  "abc123def456ghi789": "supporter"
}
```

Then:

1. Make sure your hashed IP matches
2. Send a chat message
3. Badge should show "supporter"
4. You'll have 40 messages/day instead of 10

---

## Next Steps for Production

### 1. Real Payment Integration

Use BuyMeACoffee webhook to auto-update tiers:

- User donates → Webhook receives payment
- Backend maps user email → hashed IP
- Updates `tiers.json` automatically

### 2. User Identity

Right now, tiers are IP-based. For real users:

- Add email/account system
- Hash email instead of IP
- Persist identity across devices

### 3. Database

Phase out JSON files:

- Migrate to Supabase/MongoDB
- Store: `{ ipHash, tier, createdAt, updatedAt, email }`
- Query directly instead of file reads

---

## Error Codes

- `RATE_LIMIT` - Too many requests (429)
- `LIMIT_REACHED` - Daily message limit hit (429)
- `BLOCKED` - User permanently blocked (429)
- `OVERSIZED` - Request body too large (413)
- `OFFCATION` - Returns message with `offTopicRedirect: true`

---

## Safety Notes

✅ **Safe**: IP hashing (one-way, no PII stored)
✅ **Safe**: No real payments yet (BuyMeACoffee only)
✅ **Safe**: Off-topic logic is friendly, not punitive
✅ **Safe**: Rate limiting prevents abuse

⚠️ **TODO**: Add authentication for real tier persistence
⚠️ **TODO**: Implement BuyMeACoffee webhook integration
⚠️ **TODO**: Add database migration plan

---

## Files Modified

```
/api/chat.js                    [✅ Updated with tier support, rate limiting]
/src/App.jsx                    [✅ Added tier badge, Plans button]
/data/tiers.json                [✅ Created - mock tier database]
/data/usage/                    [✅ Existing - usage tracking]
/data/ratelimit/                [✅ Auto-created - rate limit tracking]
```

---

Questions? Everything is aligned with Buddin's warm, supportive tone. No shaming, no punishment — just honest guardrails.
