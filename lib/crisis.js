// Single canonical crisis-detection list.
//
// This used to live only in src/App.jsx (and a looser prose version in the
// guest prompt), which meant the check ran in the browser and nowhere else —
// anyone calling /api/chat directly skipped the 988 handoff entirely. It now
// lives here and is imported by BOTH the client and api/chat.js, so the two
// can never drift apart.
//
// Deliberately broad and deliberately simple. False positives cost a hotline
// number appearing when it wasn't strictly needed; false negatives cost
// something that actually matters.

export const CRISIS_KW = [
  "suicide", "kill myself", "killing myself", "end my life", "want to die",
  "wanna die", "self-harm", "self harm", "hurt myself", "hurting myself",
  "cutting", "overdose", "can't go on", "cant go on", "no reason to live",
  "better off dead", "end it all", "take my own life", "don't want to be here",
  "dont want to be here", "kms",
];

export function isCrisisText(t) {
  if (!t || typeof t !== "string") return false;
  const lower = t.toLowerCase();
  return CRISIS_KW.some(k => lower.includes(k));
}

// Appended to the system prompt whenever a crisis signal is present, on the
// server, regardless of how the endpoint was reached.
export const CRISIS_INSTRUCTION =
  "\n\nCRITICAL SAFETY: There are signals of crisis in this conversation. Drop any " +
  "casual persona framing that would get in the way. Lead with warmth and acknowledge " +
  "the pain before anything else. Then give both: the 988 Suicide & Crisis Lifeline " +
  "(call or text 988) and the Crisis Text Line (text HOME to 741741). Do not lecture, " +
  "do not list other options, and do not redirect to an activity.";
