import { useState, useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from '../../lib/supabase.js';
import { LEARN_LOOKUP, SCENARIOS_PER_LEVEL } from '../../src/data/learnit.js';

// The shared Learn It engine: scenario → choice → feedback → progress toward a
// level, backed by training_progress. All five sub-modules run through this one
// component; adding a sub-module means writing content, not building a screen.
export default function LearnItModule({ setScreen, moduleId, avatarColor, C }) {
  const mod = LEARN_LOOKUP[moduleId];

  const [done, setDone] = useState(new Set());
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);   // index of chosen option
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [levelUp, setLevelUp] = useState(false);
  const doneRef = useRef(new Set());
  const startTime = useRef(Date.now());

  useEffect(() => {
    async function load() {
      let completed = new Set();
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const res = await fetch('/api/knowme?route=training', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const rows = await res.json();
            completed = new Set(rows.filter(r => r.module_id === moduleId).map(r => r.scenario_id));
          }
        }
      } catch (e) {
        console.error(e);
      }
      doneRef.current = completed;
      setDone(completed);
      // Resume on the first scenario they haven't answered.
      const resume = (mod?.scenarios || []).findIndex(s => !completed.has(s.id));
      setIdx(resume === -1 ? (mod?.scenarios.length || 0) : resume);
      setLoaded(true);
    }
    if (mod) load(); else setLoaded(true);
  }, [moduleId]); // eslint-disable-line

  useEffect(() => {
    startTime.current = Date.now();
    setPicked(null);
    setLevelUp(false);
    setError(null);
  }, [idx]);

  if (!mod) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream }}>
        <p style={{ color: C.stoneMid, fontSize: 14 }}>Nothing to show here.</p>
      </div>
    );
  }

  const scenarios = mod.scenarios;
  const current = scenarios[idx];
  const completedCount = done.size;
  const level = Math.floor(completedCount / SCENARIOS_PER_LEVEL) + 1;
  const intoLevel = completedCount % SCENARIOS_PER_LEVEL;

  const handlePick = async (choiceIndex) => {
    if (picked != null || saving || !current) return;
    setSaving(true);
    setError(null);
    const choice = current.choices[choiceIndex];
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You're not signed in, so this progress can't be saved.");
        setSaving(false);
        return;
      }
      const res = await fetch('/api/knowme?route=training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          module_id: moduleId,
          scenario_id: current.id,
          choice_index: choiceIndex,
          score: choice.score,
          response_time_ms: Date.now() - startTime.current,
        }),
      });
      if (!res.ok) {
        setError("Couldn't save that — try again in a moment.");
        setSaving(false);
        return;
      }
      const wasCount = doneRef.current.size;
      const next = new Set([...doneRef.current, current.id]);
      doneRef.current = next;
      setDone(next);
      // Level ticks over on the way past a multiple of SCENARIOS_PER_LEVEL.
      if (next.size > wasCount && next.size % SCENARIOS_PER_LEVEL === 0) setLevelUp(true);
      setPicked(choiceIndex);
    } catch (e) {
      console.error(e);
      setError("Couldn't save that — try again in a moment.");
    }
    setSaving(false);
  };

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream }}>
        <p style={{ color: C.stoneMid, fontSize: 14 }}>Loading {mod.title}...</p>
      </div>
    );
  }

  if (idx >= scenarios.length) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.cream, fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", color: C.ink, fontWeight: 400, marginBottom: 8 }}>
            You've been through all of {mod.title}.
          </h2>
          <p style={{ color: C.stone, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            {completedCount} scenarios, level {level}. The point isn't the number — it's that the next time one of
            these actually happens, you've already thought about it once.
          </p>
          <button onClick={() => setScreen("learn")} style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color: "#fff", border: "none", borderRadius: 16, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Back to Learn It →
          </button>
        </div>
      </div>
    );
  }

  const chosen = picked != null ? current.choices[picked] : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Cabinet Grotesk', sans-serif", background: C.cream }}>
      {/* Header */}
      <div style={{ padding: "max(14px, calc(env(safe-area-inset-top) + 10px)) 20px 14px", display: "flex", alignItems: "center", gap: 12, background: "rgba(245,236,220,0.85)", backdropFilter: "blur(22px)", borderBottom: "1px solid rgba(255,235,200,0.28)" }}>
        <button onClick={() => setScreen("learn")} style={{ background: "transparent", border: "none", cursor: "pointer", color: avatarColor, padding: "4px 2px", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, margin: 0 }}>{mod.title}</p>
          <p style={{ color: C.stoneMid, fontSize: 11, margin: 0 }}>Level {level} · {completedCount} of {scenarios.length}</p>
        </div>
        <div style={{ width: 80, height: 4, background: C.stoneLight, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(intoLevel / SCENARIOS_PER_LEVEL) * 100}%`, background: avatarColor, borderRadius: 4, transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 24px 40px", maxWidth: 560, margin: "0 auto", width: "100%" }}>

        <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 21, fontWeight: 400, color: C.ink, lineHeight: 1.6, marginBottom: 26 }}>
          {current.situation}
        </p>

        {error && (
          <div style={{ background: "#fee", border: "1px solid #fcc", borderRadius: 12, padding: "10px 14px", marginBottom: 14, color: "#c00", fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Choices */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {current.choices.map((c, i) => {
            const isPicked = picked === i;
            const dimmed = picked != null && !isPicked;
            return (
              <button
                key={i}
                onClick={() => handlePick(i)}
                disabled={picked != null || saving}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "16px 18px",
                  background: isPicked ? `${avatarColor}18` : "rgba(255,248,235,0.7)",
                  border: `1.5px solid ${isPicked ? avatarColor : C.stoneLight}`,
                  borderRadius: 16,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: C.ink,
                  cursor: picked != null ? "default" : "pointer",
                  fontFamily: "inherit",
                  opacity: dimmed ? 0.45 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                {c.text}
              </button>
            );
          })}
        </div>

        {/* Feedback — never framed as right or wrong, just what actually happens. */}
        {chosen && (
          <div style={{ marginTop: 22, background: `${avatarColor}0e`, border: `1.5px solid ${avatarColor}33`, borderRadius: 18, padding: "18px 20px", animation: "fadeIn 0.3s ease" }}>
            <p style={{ color: avatarColor, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 8 }}>WHAT USUALLY HAPPENS</p>
            <p style={{ color: C.ink, fontSize: 14, lineHeight: 1.75, margin: 0 }}>{chosen.feedback}</p>
          </div>
        )}

        {levelUp && (
          <p style={{ color: avatarColor, fontSize: 13, fontWeight: 700, textAlign: "center", marginTop: 16 }}>
            That's level {level}. 
          </p>
        )}

        {chosen && (
          <button
            onClick={() => setIdx(i => i + 1)}
            style={{
              width: "100%",
              marginTop: 18,
              padding: "15px",
              background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
              color: "#fff",
              border: "none",
              borderRadius: 16,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {idx + 1 < scenarios.length ? "Next situation" : "Finish"}
          </button>
        )}
      </div>
    </div>
  );
}
