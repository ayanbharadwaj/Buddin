import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { supabase } from '../../lib/supabase.js';
import { LEARN_LOOKUP, SCENARIOS_PER_LEVEL } from '../../src/data/learnit.js';
import ScenarioVisual from '../learnit/ScenarioVisual.jsx';
import CoachPanel from '../learnit/CoachPanel.jsx';

// ═══════════════════════════════════════════════════════════════════════════
// THE LEARN IT ENGINE
//
// The first version of this locked you out the moment you answered: one tap,
// one paragraph of feedback, next. That tests a hunch — it doesn't teach. You
// never found out what the options you didn't pick would actually have cost,
// and if you had a follow-up question there was nowhere to put it.
//
// So the shape here is: pick what you'd really do (that's the honest signal,
// and it's the only thing scored), then every other option unlocks and you're
// pushed to open them. The screen won't let you move on quietly without at
// least being told you can. Alongside that sits your companion, in the same
// voice you picked in the main chat, for the questions no card was written for.
//
// Scoring is untouched by exploration on purpose: the first pick is the honest
// one, and if poking at the alternatives changed your score you'd learn to game
// it instead of learning the thing.
// ═══════════════════════════════════════════════════════════════════════════

export default function LearnItModule({ setScreen, moduleId, avatar, avatarColor, C }) {
  const mod = LEARN_LOOKUP[moduleId];

  const [done, setDone] = useState(new Set());
  const [idx, setIdx] = useState(0);
  const [firstPick, setFirstPick] = useState(null);   // the scored answer
  const [viewing, setViewing] = useState(null);       // which option's outcome is on screen
  const [explored, setExplored] = useState(new Set());
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
      const resume = (mod?.scenarios || []).findIndex(s => !completed.has(s.id));
      setIdx(resume === -1 ? (mod?.scenarios.length || 0) : resume);
      setLoaded(true);
    }
    if (mod) load(); else setLoaded(true);
  }, [moduleId]); // eslint-disable-line

  useEffect(() => {
    startTime.current = Date.now();
    setFirstPick(null);
    setViewing(null);
    setExplored(new Set());
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

  const handlePick = async (choiceIndex) => {
    // After the first pick, tapping an option just switches which outcome you're
    // reading — nothing is re-saved and nothing is re-scored.
    if (firstPick != null) {
      setViewing(choiceIndex);
      setExplored(prev => new Set([...prev, choiceIndex]));
      return;
    }
    if (saving || !current) return;

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
      if (next.size > wasCount && next.size % SCENARIOS_PER_LEVEL === 0) setLevelUp(true);
      setFirstPick(choiceIndex);
      setViewing(choiceIndex);
      setExplored(new Set([choiceIndex]));
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
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setIdx(0)} style={{ flex: 1, padding: "13px", background: "rgba(255,248,235,0.7)", border: `1.5px solid ${C.stoneLight}`, borderRadius: 14, fontSize: 13, color: C.stone, cursor: "pointer", fontFamily: "inherit" }}>
              Go through them again
            </button>
            <button onClick={() => setScreen("learn")} style={{ flex: 1, padding: "13px", background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color: "#fff", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Back to Learn It →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const answered = firstPick != null;
  const shown = viewing != null ? current.choices[viewing] : null;
  const unexplored = current.choices.length - explored.size;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Cabinet Grotesk', sans-serif", background: C.cream }}>
      {/* Header — the bar tracks the whole module, not position inside a level.
          A bar that resets to empty every sixth scenario reads as losing progress. */}
      <div style={{ padding: "max(14px, calc(env(safe-area-inset-top) + 10px)) 20px 14px", display: "flex", alignItems: "center", gap: 12, background: "rgba(245,236,220,0.85)", backdropFilter: "blur(22px)", borderBottom: "1px solid rgba(255,235,200,0.28)", position: "sticky", top: 0, zIndex: 5 }}>
        <button onClick={() => setScreen("learn")} style={{ background: "transparent", border: "none", cursor: "pointer", color: avatarColor, padding: "4px 2px", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, margin: 0 }}>{mod.title}</p>
          <p style={{ color: C.stoneMid, fontSize: 11, margin: 0 }}>
            Situation {idx + 1} of {scenarios.length} · {completedCount} done · level {level}
          </p>
        </div>
        <div style={{ width: 74, flexShrink: 0 }}>
          <div style={{ height: 4, background: C.stoneLight, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(completedCount / scenarios.length) * 100}%`, background: avatarColor, borderRadius: 4, transition: "width 0.4s ease" }} />
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "28px 24px 60px", maxWidth: 580, margin: "0 auto", width: "100%" }}>

        <ScenarioVisual scenarioId={current.id} avatarColor={avatarColor} C={C} />

        <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 21, fontWeight: 400, color: C.ink, lineHeight: 1.6, marginBottom: 10 }}>
          {current.situation}
        </p>
        <p style={{ color: C.stoneMid, fontSize: 12, marginBottom: 22 }}>
          {answered
            ? "Now open the others — seeing what they'd have cost is the part that sticks."
            : "Pick what you'd actually do, not what sounds best."}
        </p>

        {error && (
          <div style={{ background: "#fee", border: "1px solid #fcc", borderRadius: 12, padding: "10px 14px", marginBottom: 14, color: "#c00", fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Choices — all stay live after the first pick */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {current.choices.map((c, i) => {
            const isViewing = viewing === i;
            const isFirst = firstPick === i;
            const seen = explored.has(i);
            return (
              <button
                key={i}
                onClick={() => handlePick(i)}
                disabled={saving}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "15px 17px",
                  background: isViewing ? `${avatarColor}18` : "rgba(255,248,235,0.7)",
                  border: `1.5px solid ${isViewing ? avatarColor : seen ? `${avatarColor}44` : C.stoneLight}`,
                  borderRadius: 16,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: C.ink,
                  cursor: saving ? "default" : "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 11,
                }}
              >
                <span style={{
                  width: 19, height: 19, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  border: `1.5px solid ${seen ? avatarColor : C.stoneLight}`,
                  background: seen ? `${avatarColor}22` : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {seen && <Check size={11} color={avatarColor} strokeWidth={3} />}
                </span>
                <span style={{ flex: 1 }}>
                  {c.text}
                  {isFirst && (
                    <span style={{ display: "block", color: avatarColor, fontSize: 11, fontWeight: 700, marginTop: 5, letterSpacing: "0.04em" }}>
                      YOUR ANSWER
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Outcome for whichever option is currently open */}
        {shown && (
          <div style={{ marginTop: 20, background: `${avatarColor}0e`, border: `1.5px solid ${avatarColor}33`, borderRadius: 18, padding: "18px 20px", animation: "fadeIn 0.3s ease" }}>
            <p style={{ color: avatarColor, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 8 }}>
              {viewing === firstPick ? "WHAT USUALLY HAPPENS" : "IF YOU'D DONE THIS INSTEAD"}
            </p>
            <p style={{ color: C.ink, fontSize: 14, lineHeight: 1.75, margin: 0 }}>{shown.feedback}</p>
          </div>
        )}

        {answered && unexplored > 0 && (
          <p style={{ color: C.stoneMid, fontSize: 12.5, textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
            {unexplored} option{unexplored === 1 ? "" : "s"} you haven't opened yet. They're where most of the learning is.
          </p>
        )}

        {levelUp && (
          <p style={{ color: avatarColor, fontSize: 13, fontWeight: 700, textAlign: "center", marginTop: 14 }}>
            That's level {level}.
          </p>
        )}

        {/* The companion, in whatever voice they chose. Available before they
            commit as well as after — "I genuinely don't know what I'd do" is a
            real place to be, and the API is told not to just hand over the
            answer while the pick is still open. */}
        {(
          <CoachPanel
            key={current.id}
            avatar={avatar}
            avatarColor={avatarColor}
            C={C}
            moduleTitle={mod.title}
            scenario={current}
            chosenIndex={firstPick}
            exploredCount={explored.size}
          />
        )}

        {answered && (
          <button
            onClick={() => setIdx(i => i + 1)}
            style={{
              width: "100%",
              marginTop: 14,
              padding: "15px",
              background: unexplored > 0 ? "rgba(255,248,235,0.7)" : `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
              color: unexplored > 0 ? C.stone : "#fff",
              border: unexplored > 0 ? `1.5px solid ${C.stoneLight}` : "none",
              borderRadius: 16,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.25s ease",
            }}
          >
            {idx + 1 < scenarios.length
              ? (unexplored > 0 ? "Move on anyway →" : "Next situation")
              : "Finish"}
          </button>
        )}
      </div>
    </div>
  );
}
