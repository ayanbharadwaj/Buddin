import { useState, useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from '../../lib/supabase.js';
import IntensityInput, { getRandomScale } from '../IntensityInput.jsx';
import { POP_NAMES } from '../../src/data/popculture.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pop Culture Recognition. Names only — no images, no logos, no reproduced media.
// The framing is neutral throughout on purpose: what someone has never heard of
// is as revealing as what they know well, and nothing here should read as a test
// of whether they're "in the loop" (spec 7.4).
export default function PopCulture({ setScreen, avatarColor, C }) {
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("recognize"); // recognize | rate
  const [scale, setScale] = useState(getRandomScale());
  const [saving, setSaving] = useState(false);
  const [answered, setAnswered] = useState(new Set());
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [exiting, setExiting] = useState(false);
  const answeredRef = useRef(new Set());
  const startTime = useRef(Date.now());

  useEffect(() => {
    async function load() {
      let done = new Set();
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data } = await supabase
            .from('pop_culture_responses')
            .select('name_id')
            .eq('user_id', session.user.id);
          if (data) done = new Set(data.map(d => d.name_id));
        }
      } catch (e) {
        console.error(e);
      }
      answeredRef.current = done;
      setAnswered(done);
      setQueue(shuffle(POP_NAMES.filter(n => !done.has(n.id))));
      setLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
    startTime.current = Date.now();
  }, [idx]);

  const current = queue[idx];

  const save = async ({ recognized, familiarity }) => {
    if (!current) return false;
    setSaving(true);
    setError(null);
    let ok = false;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You're not signed in, so this can't be saved.");
        setSaving(false);
        return false;
      }
      const res = await fetch('/api/knowme?route=pop-culture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name_id: current.id,
          name: current.name,
          category: current.category,
          era: current.era,
          reach: current.reach,
          insight: current.insight,
          recognized,
          familiarity: familiarity ?? null,
          scale_max: familiarity != null ? scale : null,
          response_time_ms: Date.now() - startTime.current,
        }),
      });
      if (res.ok) {
        const next = new Set([...answeredRef.current, current.id]);
        answeredRef.current = next;
        setAnswered(next);
        ok = true;
      } else {
        setError("Couldn't save that one — check your connection and try again.");
      }
    } catch (e) {
      console.error(e);
      setError("Couldn't save that one — check your connection and try again.");
    }
    setSaving(false);
    return ok;
  };

  const advance = () => {
    setExiting(true);
    setTimeout(() => {
      setIdx(i => i + 1);
      setPhase("recognize");
      setScale(getRandomScale());
      setExiting(false);
    }, 250);
  };

  const handleKnow = () => {
    setError(null);
    setPhase("rate");
  };

  const handleDontKnow = async () => {
    if (saving) return;
    const ok = await save({ recognized: false });
    if (ok) advance();
  };

  const handleFamiliarity = async (val) => {
    if (saving) return;
    const ok = await save({ recognized: true, familiarity: val });
    if (ok) advance();
  };

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream }}>
        <p style={{ color: C.stoneMid, fontSize: 14 }}>Loading names...</p>
      </div>
    );
  }

  if (idx >= queue.length) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.cream, fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", color: C.ink, fontWeight: 400, marginBottom: 8 }}>That's all of them.</h2>
          <p style={{ color: C.stone, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            {answered.size} names. The ones you skipped past tell Buddin as much as the ones you knew cold.
          </p>
          <button onClick={() => setScreen("myprofile")} style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color: "#fff", border: "none", borderRadius: 16, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            See what Buddin knows →
          </button>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream }}>
        <p style={{ color: C.stoneMid, fontSize: 14 }}>Loading names...</p>
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
          <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, margin: 0 }}>Names</p>
          <p style={{ color: C.stoneMid, fontSize: 11, margin: 0 }}>{answered.size} of {POP_NAMES.length} seen</p>
        </div>
        <div style={{ width: 80, height: 4, background: C.stoneLight, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(answered.size / POP_NAMES.length) * 100}%`, background: avatarColor, borderRadius: 4, transition: "width 0.3s ease" }} />
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", maxWidth: 500, margin: "0 auto", width: "100%" }}>
        <div style={{ width: "100%", opacity: exiting ? 0 : 1, transform: exiting ? "translateY(10px)" : "translateY(0)", transition: "all 0.25s ease" }}>

          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 34, fontWeight: 400, color: C.ink, textAlign: "center", lineHeight: 1.25, marginBottom: 10 }}>
            {current.name}
          </p>

          {error && (
            <div style={{ width: "100%", background: "#fee", border: "1px solid #fcc", borderRadius: 12, padding: "10px 14px", margin: "14px 0", color: "#c00", fontSize: 13 }}>
              {error}
            </div>
          )}

          {phase === "recognize" && (
            <>
              <p style={{ color: C.stoneMid, fontSize: 13, textAlign: "center", marginBottom: 28 }}>
                Do you know who this is?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={handleKnow}
                  disabled={saving}
                  style={{
                    width: "100%", padding: "16px",
                    background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
                    color: "#fff", border: "none", borderRadius: 16,
                    fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Yeah, I know them
                </button>
                <button
                  onClick={handleDontKnow}
                  disabled={saving}
                  style={{
                    width: "100%", padding: "16px",
                    background: "rgba(255,248,235,0.7)",
                    border: `1.5px solid ${C.stoneLight}`, borderRadius: 16,
                    fontSize: 15, fontWeight: 600, color: C.stone,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {saving ? "Saving..." : "Never heard of them"}
                </button>
              </div>
              <p style={{ color: C.stoneMid, fontSize: 11, textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
                Not knowing a name is just as useful here as knowing one.
              </p>
            </>
          )}

          {phase === "rate" && (
            <IntensityInput
              key={current.id}
              scale={scale}
              avatarColor={avatarColor}
              C={C}
              onCommit={handleFamiliarity}
              disabled={saving}
              question="How much do they actually come up in your head?"
              lowLabel="barely register"
              highLabel="constantly"
              commitLabel="That's about right"
            />
          )}
        </div>
      </div>
    </div>
  );
}
