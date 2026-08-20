import { useState, useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from '../../lib/supabase.js';
import { NUMBER_LADDER, REACTIONS } from '../../src/data/numbers.js';

// A number appears, starting small and growing. The user says whether they like
// it and — optionally — why. Low effort, high frequency, and explicitly not
// carrying the weight of a full module on its own (spec 7.6).
export default function NumberSense({ setScreen, avatarColor, C }) {
  const [idx, setIdx] = useState(0);
  const [seen, setSeen] = useState(new Set());
  const [reaction, setReaction] = useState(null);
  const [why, setWhy] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [exiting, setExiting] = useState(false);
  const seenRef = useRef(new Set());
  const startTime = useRef(Date.now());

  useEffect(() => {
    async function load() {
      let done = new Set();
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data } = await supabase
            .from('number_responses')
            .select('number')
            .eq('user_id', session.user.id);
          if (data) done = new Set(data.map(d => d.number));
        }
      } catch (e) {
        console.error(e);
      }
      seenRef.current = done;
      setSeen(done);
      // Resume at the first rung they haven't reacted to, so the ladder keeps
      // climbing across sessions instead of restarting at 1.
      const resume = NUMBER_LADDER.findIndex(n => !done.has(n));
      setIdx(resume === -1 ? NUMBER_LADDER.length : resume);
      setLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
    startTime.current = Date.now();
    setReaction(null);
    setWhy("");
  }, [idx]);

  const current = NUMBER_LADDER[idx];

  const handleSubmit = async () => {
    if (!reaction || saving || current == null) return;
    setSaving(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You're not signed in, so this can't be saved.");
        setSaving(false);
        return;
      }
      const res = await fetch('/api/number-responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          number: current,
          position: idx,
          reaction,
          reason: why.trim() || null,
          response_time_ms: Date.now() - startTime.current,
        }),
      });
      if (!res.ok) {
        setError("Couldn't save that one — try again in a moment.");
        setSaving(false);
        return;
      }
      const next = new Set([...seenRef.current, current]);
      seenRef.current = next;
      setSeen(next);
      setExiting(true);
      setTimeout(() => {
        setIdx(i => i + 1);
        setExiting(false);
      }, 220);
    } catch (e) {
      console.error(e);
      setError("Couldn't save that one — try again in a moment.");
    }
    setSaving(false);
  };

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream }}>
        <p style={{ color: C.stoneMid, fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  if (current == null) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.cream, fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔢</div>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", color: C.ink, fontWeight: 400, marginBottom: 8 }}>You climbed the whole ladder.</h2>
          <p style={{ color: C.stone, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            {seen.size} numbers, one at a time. That's a surprising amount of signal from something this small.
          </p>
          <button onClick={() => setScreen("knowme")} style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color: "#fff", border: "none", borderRadius: 16, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Back to Know Me →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Cabinet Grotesk', sans-serif", background: C.cream }}>
      {/* Header */}
      <div style={{ padding: "max(14px, calc(env(safe-area-inset-top) + 10px)) 20px 14px", display: "flex", alignItems: "center", gap: 12, background: "rgba(245,236,220,0.85)", backdropFilter: "blur(22px)", borderBottom: "1px solid rgba(255,235,200,0.28)" }}>
        <button onClick={() => setScreen("knowme")} style={{ background: "transparent", border: "none", cursor: "pointer", color: avatarColor, padding: "4px 2px", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, margin: 0 }}>Numbers</p>
          <p style={{ color: C.stoneMid, fontSize: 11, margin: 0 }}>{seen.size} so far · stop whenever</p>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", maxWidth: 460, margin: "0 auto", width: "100%" }}>
        <div style={{ width: "100%", opacity: exiting ? 0 : 1, transform: exiting ? "scale(0.96)" : "scale(1)", transition: "all 0.22s ease" }}>

          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 72, fontWeight: 300, color: C.ink, textAlign: "center", lineHeight: 1, marginBottom: 8 }}>
            {current}
          </p>
          <p style={{ color: C.stoneMid, fontSize: 13, textAlign: "center", marginBottom: 26 }}>
            How's that one sit with you?
          </p>

          {error && (
            <div style={{ background: "#fee", border: "1px solid #fcc", borderRadius: 12, padding: "10px 14px", marginBottom: 14, color: "#c00", fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {REACTIONS.map(r => {
              const selected = reaction === r.value;
              return (
                <button
                  key={r.value}
                  onClick={() => setReaction(r.value)}
                  style={{
                    flex: 1,
                    padding: "13px 8px",
                    background: selected ? `${avatarColor}1f` : "rgba(255,248,235,0.7)",
                    border: `1.5px solid ${selected ? avatarColor : C.stoneLight}`,
                    borderRadius: 14,
                    fontSize: 13,
                    fontWeight: selected ? 700 : 500,
                    color: selected ? C.ink : C.stone,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s ease",
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={why}
            onChange={e => setWhy(e.target.value.slice(0, 100))}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Why? (optional)"
            style={{
              width: "100%",
              padding: "14px 18px",
              border: `1.5px solid ${avatarColor}22`,
              borderRadius: 14,
              fontSize: 14,
              fontFamily: "inherit",
              background: "rgba(255,248,235,0.7)",
              color: C.ink,
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 16,
            }}
          />

          <button
            onClick={handleSubmit}
            disabled={!reaction || saving}
            style={{
              width: "100%",
              padding: "15px",
              background: reaction ? `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)` : C.stoneLight,
              color: reaction ? "#fff" : C.stoneMid,
              border: "none",
              borderRadius: 16,
              fontSize: 15,
              fontWeight: 700,
              cursor: reaction ? "pointer" : "default",
              fontFamily: "inherit",
            }}
          >
            {saving ? "Saving..." : "Next number"}
          </button>
        </div>
      </div>
    </div>
  );
}
