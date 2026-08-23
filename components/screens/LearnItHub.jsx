import { useState, useEffect } from "react";
import { GraduationCap, ChevronRight } from "lucide-react";
import { supabase } from '../../lib/supabase.js';
import { LEARN_MODULES, SCENARIOS_PER_LEVEL } from '../../src/data/learnit.js';

// Learn It hub. Separate top-level area from Know Me on purpose — measurement
// systems and instructional systems have different shapes and different
// emotional registers, and the spec is explicit that they shouldn't be built as
// the same kind of screen (spec 4.4).
export default function LearnItHub({ setScreen, setLearnModule, avatarColor, C }) {
  const [progress, setProgress] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const res = await fetch('/api/knowme?route=training', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const rows = await res.json();
            const byModule = {};
            rows.forEach(r => {
              if (!byModule[r.module_id]) byModule[r.module_id] = { done: 0, score: 0 };
              byModule[r.module_id].done += 1;
              byModule[r.module_id].score += r.score || 0;
            });
            setProgress(byModule);
          }
        }
      } catch (e) {
        console.error(e);
      }
      setLoaded(true);
    }
    load();
  }, []);

  const totalDone = Object.values(progress).reduce((n, m) => n + m.done, 0);

  return (
    <div style={{ padding: "40px 24px 120px", maxWidth: 700, margin: "0 auto", fontFamily: "'Cabinet Grotesk', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <GraduationCap size={22} color="#fff" strokeWidth={2} />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 400, color: C.ink, margin: 0 }}>Learn It</h1>
          <p style={{ color: C.stoneMid, fontSize: 13, margin: 0 }}>
            {loaded && totalDone > 0 ? `${totalDone} scenarios worked through` : "Practical things school skips."}
          </p>
        </div>
      </div>

      <p style={{ color: C.stone, fontSize: 13, lineHeight: 1.8, marginBottom: 28 }}>
        Know Me figures out who you already are. This is the other half — things that are genuinely useful to know
        and that mostly get passed down by luck. Nothing here is a test, and there's no score anyone else sees.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {LEARN_MODULES.map(m => {
          const p = progress[m.id] || { done: 0, score: 0 };
          const level = Math.floor(p.done / SCENARIOS_PER_LEVEL) + 1;
          const intoLevel = p.done % SCENARIOS_PER_LEVEL;
          const complete = p.done >= m.scenarios.length;
          return (
            <button
              key={m.id}
              onClick={() => { setLearnModule(m.id); setScreen("learnmodule"); }}
              className="glass card"
              style={{
                width: "100%", borderRadius: 18, padding: "18px 20px", cursor: "pointer",
                textAlign: "left", border: `1.5px solid ${avatarColor}33`, display: "block",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: C.ink, margin: 0 }}>{m.title}</p>
                    <span style={{ fontSize: 10, color: p.done > 0 ? avatarColor : C.stoneMid, background: p.done > 0 ? `${avatarColor}18` : C.stoneLight, borderRadius: 6, padding: "2px 8px", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {complete ? "Complete" : p.done > 0 ? `Level ${level}` : "Start"}
                    </span>
                  </div>
                  <p style={{ color: C.stone, fontSize: 13, margin: "3px 0 0" }}>{m.blurb}</p>
                  {p.done > 0 && !complete && (
                    <div style={{ marginTop: 9, background: C.stoneLight, borderRadius: 4, height: 3 }}>
                      <div style={{ height: "100%", width: `${(intoLevel / SCENARIOS_PER_LEVEL) * 100}%`, background: avatarColor, borderRadius: 4, transition: "width 0.4s ease" }} />
                    </div>
                  )}
                  {p.done > 0 && (
                    <p style={{ color: C.stoneMid, fontSize: 11, margin: "7px 0 0" }}>
                      {p.done} of {m.scenarios.length} scenarios
                    </p>
                  )}
                </div>
                <ChevronRight size={18} color={C.stoneMid} strokeWidth={2} style={{ flexShrink: 0 }} />
              </div>
            </button>
          );
        })}
      </div>

      <p style={{ color: C.stoneMid, fontSize: 11, textAlign: "center", marginTop: 28, lineHeight: 1.6 }}>
        There's no wrong answer that costs you anything here. Pick what you'd actually do.
      </p>
    </div>
  );
}
