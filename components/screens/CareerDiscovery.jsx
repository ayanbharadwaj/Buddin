import { useState, useEffect } from "react";
import { ChevronLeft, Compass } from "lucide-react";
import { supabase } from '../../lib/supabase.js';
import { CAREER_QUESTIONS } from '../../src/data/career.js';

// One question on screen at a time, then a considered reveal. The questions
// never mention a job, a subject, or a field — the directions come from
// combining these answers with everything else already collected (spec 7.5).
export default function CareerDiscovery({ setScreen, avatarColor, C }) {
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("questions"); // questions | thinking | reveal
  const [directions, setDirections] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const res = await fetch('/api/career', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.answers) setAnswers(data.answers);
            if (data.directions) {
              setDirections(data.directions);
              setPhase("reveal");
            } else if (data.answers) {
              const resume = CAREER_QUESTIONS.findIndex(q => !(q.key in data.answers));
              setIdx(resume === -1 ? 0 : resume);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
      setLoaded(true);
    }
    load();
  }, []);

  const current = CAREER_QUESTIONS[idx];

  const pick = (value) => {
    const next = { ...answers, [current.key]: value };
    setAnswers(next);
    if (idx + 1 < CAREER_QUESTIONS.length) {
      setIdx(i => i + 1);
    } else {
      generate(next);
    }
  };

  const generate = async (finalAnswers) => {
    setPhase("thinking");
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You're not signed in, so this can't be generated.");
        setPhase("questions");
        return;
      }
      const res = await fetch('/api/career', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      const data = await res.json();
      if (data.directions) {
        setDirections(data.directions);
        setPhase("reveal");
      } else {
        setError("Couldn't put this together right now — try again in a minute.");
        setPhase("questions");
      }
    } catch (e) {
      console.error(e);
      setError("Couldn't put this together right now — try again in a minute.");
      setPhase("questions");
    }
  };

  const restart = () => {
    setDirections(null);
    setIdx(0);
    setPhase("questions");
  };

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream }}>
        <p style={{ color: C.stoneMid, fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Cabinet Grotesk', sans-serif", background: C.cream }}>
      {/* Header */}
      <div style={{ padding: "max(14px, calc(env(safe-area-inset-top) + 10px)) 20px 14px", display: "flex", alignItems: "center", gap: 12, background: "rgba(245,236,220,0.85)", backdropFilter: "blur(22px)", borderBottom: "1px solid rgba(255,235,200,0.28)", position: "sticky", top: 0, zIndex: 5 }}>
        <button onClick={() => setScreen("knowme")} style={{ background: "transparent", border: "none", cursor: "pointer", color: avatarColor, padding: "4px 2px", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, margin: 0 }}>Directions</p>
          <p style={{ color: C.stoneMid, fontSize: 11, margin: 0 }}>
            {phase === "reveal" ? "Built from everything you've answered" : `Question ${Math.min(idx + 1, CAREER_QUESTIONS.length)} of ${CAREER_QUESTIONS.length}`}
          </p>
        </div>
        {phase !== "reveal" && (
          <div style={{ width: 80, height: 4, background: C.stoneLight, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(idx / CAREER_QUESTIONS.length) * 100}%`, background: avatarColor, borderRadius: 4, transition: "width 0.3s ease" }} />
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: phase === "reveal" ? "flex-start" : "center", padding: "32px 24px 100px", maxWidth: 580, margin: "0 auto", width: "100%" }}>

        {error && (
          <div style={{ background: "#fee", border: "1px solid #fcc", borderRadius: 12, padding: "10px 14px", marginBottom: 16, color: "#c00", fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* ── Questions ─────────────────────────────────────────────── */}
        {phase === "questions" && current && (
          <>
            <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 400, color: C.ink, lineHeight: 1.55, marginBottom: 26 }}>
              {current.prompt}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {current.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => pick(opt.value)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "16px 18px",
                    background: "rgba(255,248,235,0.7)",
                    border: `1.5px solid ${avatarColor}33`,
                    borderRadius: 16,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: C.ink,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${avatarColor}14`; e.currentTarget.style.borderColor = avatarColor; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,248,235,0.7)"; e.currentTarget.style.borderColor = `${avatarColor}33`; }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p style={{ color: C.stoneMid, fontSize: 11, textAlign: "center", marginTop: 22, lineHeight: 1.6 }}>
              Nothing here is asking what you want to be. That question doesn't work.
            </p>
          </>
        )}

        {/* ── Thinking ──────────────────────────────────────────────── */}
        {phase === "thinking" && (
          <div style={{ textAlign: "center" }}>
            <Compass size={34} color={avatarColor} strokeWidth={1.6} style={{ animation: "spin 3s linear infinite", marginBottom: 18 }} />
            <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 19, color: C.ink, marginBottom: 8 }}>Working through it.</p>
            <p style={{ color: C.stoneMid, fontSize: 13, lineHeight: 1.7 }}>
              Reading back across everything you've answered, not just the last six questions.
            </p>
          </div>
        )}

        {/* ── Reveal ────────────────────────────────────────────────── */}
        {phase === "reveal" && directions && (
          <>
            {directions.opening && (
              <div style={{ background: `${avatarColor}12`, border: `1.5px solid ${avatarColor}33`, borderRadius: 20, padding: 22, marginBottom: 18 }}>
                <p style={{ color: avatarColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>THE THROUGH-LINE</p>
                <p style={{ color: C.ink, fontSize: 15, lineHeight: 1.8, fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", margin: 0 }}>
                  {directions.opening}
                </p>
              </div>
            )}

            {(directions.directions || []).map((d, i) => (
              <div key={i} style={{ background: "rgba(255,248,235,0.7)", border: "1px solid rgba(255,235,200,0.5)", borderRadius: 18, padding: "20px 22px", marginBottom: 12, backdropFilter: "blur(12px)" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${avatarColor}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: avatarColor, flexShrink: 0 }}>{i + 1}</div>
                  <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 17, color: C.ink, margin: 0 }}>{d.title}</p>
                </div>
                <p style={{ color: C.ink, fontSize: 14, lineHeight: 1.75, margin: "0 0 10px" }}>{d.reasoning}</p>
                {d.watch_out && (
                  <p style={{ color: C.stone, fontSize: 13, lineHeight: 1.7, margin: 0, paddingTop: 10, borderTop: `1px solid ${C.stoneLight}` }}>
                    <span style={{ color: C.stoneMid, fontWeight: 700, fontSize: 10, letterSpacing: "0.1em" }}>WATCH OUT · </span>
                    {d.watch_out}
                  </p>
                )}
              </div>
            ))}

            {directions.what_would_sharpen_this && (
              <p style={{ color: C.stoneMid, fontSize: 12, lineHeight: 1.7, textAlign: "center", marginTop: 16 }}>
                {directions.what_would_sharpen_this}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={restart} style={{ flex: 1, padding: "13px", background: "rgba(255,248,235,0.7)", border: `1.5px solid ${C.stoneLight}`, borderRadius: 14, fontSize: 13, color: C.stone, cursor: "pointer", fontFamily: "inherit" }}>
                Answer again
              </button>
              <button onClick={() => setScreen("myprofile")} style={{ flex: 1, padding: "13px", background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color: "#fff", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                See your profile →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
