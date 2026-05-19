import { useState, useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { COMPARISONS } from "../../src/data/constants.js";

const PRIME_SCALES = [97, 107, 113, 127, 151];

function getRandomScale() {
  return PRIME_SCALES[Math.floor(Math.random() * PRIME_SCALES.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ComparisonEngine({ setScreen, avatarColor, C, session, supabase, onSave }) {
  const [queue, setQueue] = useState(() => shuffle(COMPARISONS));
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [intensity, setIntensity] = useState(null);
  const [scale, setScale] = useState(getRandomScale());
  const [saved, setSaved] = useState(0);
  const [phase, setPhase] = useState("pick"); // pick | rate | next
  const [exiting, setExiting] = useState(false);
  const startTime = useRef(Date.now());

  const current = queue[idx];
  const remaining = queue.length - idx;

  const handlePick = (choice) => {
    setChosen(choice);
    setPhase("rate");
  };

  const handleRate = async (val) => {
    setIntensity(val);
    const responseTime = Date.now() - startTime.current;

    // Save to Supabase
    if (session?.user?.id) {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        await fetch("/api/comparisons", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${s?.access_token}`
          },
          body: JSON.stringify({
            category: current.category,
            option_a: current.a,
            option_b: current.b,
            chosen: chosen,
            intensity: val,
            scale_max: scale,
            insight: current.insight,
            response_time_ms: responseTime
          })
        });
        setSaved(p => p + 1);
        if (onSave) onSave(saved + 1);
      } catch (e) {
        console.error("Save failed:", e);
      }
    }

    // Animate out
    setExiting(true);
    setTimeout(() => {
      setIdx(i => i + 1);
      setChosen(null);
      setIntensity(null);
      setScale(getRandomScale());
      setPhase("pick");
      setExiting(false);
      startTime.current = Date.now();
    }, 300);
  };

  if (idx >= queue.length) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", color: C.ink, fontWeight: 400, marginBottom: 8 }}>You finished all of them.</h2>
          <p style={{ color: C.stone, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            {saved} responses saved. Buddin now has a much clearer picture of how you think.
          </p>
          <button onClick={() => setScreen("knowme")} style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color: "#fff", border: "none", borderRadius: 16, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            See what Buddin knows →
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
          <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, margin: 0 }}>This or That</p>
          <p style={{ color: C.stoneMid, fontSize: 11, margin: 0 }}>{remaining} left · {saved} saved</p>
        </div>
        {/* Progress bar */}
        <div style={{ width: 80, height: 4, background: C.stoneLight, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((idx) / queue.length) * 100}%`, background: avatarColor, borderRadius: 4, transition: "width 0.3s ease" }} />
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", maxWidth: 600, margin: "0 auto", width: "100%" }}>
        
        {/* Category label */}
        <p style={{ color: avatarColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 28, textTransform: "uppercase" }}>
          {current.category}
        </p>

        {/* Card */}
        <div style={{ width: "100%", opacity: exiting ? 0 : 1, transform: exiting ? "translateY(12px)" : "translateY(0)", transition: "all 0.3s ease" }}>
          
          {phase === "pick" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[current.a, current.b].map(opt => (
                <button
                  key={opt}
                  onClick={() => handlePick(opt)}
                  style={{
                    background: "rgba(255,248,235,0.7)",
                    border: `2px solid ${avatarColor}33`,
                    borderRadius: 20,
                    padding: "32px 20px",
                    cursor: "pointer",
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontSize: 20,
                    fontWeight: 400,
                    color: C.ink,
                    lineHeight: 1.3,
                    transition: "all 0.15s ease",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${avatarColor}18`; e.currentTarget.style.borderColor = avatarColor; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,248,235,0.7)"; e.currentTarget.style.borderColor = `${avatarColor}33`; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {phase === "rate" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ background: `${avatarColor}15`, border: `1.5px solid ${avatarColor}33`, borderRadius: 18, padding: "24px 20px", marginBottom: 28 }}>
                <p style={{ color: avatarColor, fontWeight: 700, fontSize: 18, fontFamily: "'Fraunces', Georgia, serif", marginBottom: 4 }}>{chosen}</p>
                <p style={{ color: C.stone, fontSize: 13 }}>How strongly do you feel about this?</p>
              </div>
              <p style={{ color: C.stoneMid, fontSize: 12, marginBottom: 16 }}>1 = not really · {scale} = absolutely</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {[1, Math.round(scale * 0.2), Math.round(scale * 0.4), Math.round(scale * 0.6), Math.round(scale * 0.8), scale].map(val => (
                  <button
                    key={val}
                    onClick={() => handleRate(val)}
                    style={{
                      background: "rgba(255,248,235,0.7)",
                      border: `1.5px solid ${avatarColor}44`,
                      borderRadius: 12,
                      padding: "12px 20px",
                      cursor: "pointer",
                      fontSize: 15,
                      fontWeight: 600,
                      color: C.ink,
                      fontFamily: "inherit",
                      minWidth: 60,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${avatarColor}18`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,248,235,0.7)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <button onClick={() => handleRate(Math.round(scale * 0.5))} style={{ marginTop: 20, background: "transparent", border: "none", color: C.stoneMid, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                Skip rating →
              </button>
            </div>
          )}
        </div>

        {/* VS divider shown during pick phase */}
        {phase === "pick" && (
          <div style={{ marginTop: 24, color: C.stoneMid, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em" }}>VS</div>
        )}
      </div>
    </div>
  );
}