import { useState, useEffect } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { supabase } from '../../lib/supabase.js';
import { PREFERENCE_CLUSTERS, PREFERENCE_QUESTION_COUNT } from '../../src/data/preferences.js';

// Preferences is deliberately a different shape from the rest of Know Me:
// clustered, all-at-once, settings-like. These are questions where the honest
// answer isn't embarrassing, so a one-at-a-time reveal would just make a quick
// thing feel long (spec 7.3).
export default function Preferences({ setScreen, avatarColor, C }) {
  const [answers, setAnswers] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data } = await supabase
            .from('user_profile')
            .select('preferences')
            .eq('user_id', session.user.id)
            .order('updated_at', { ascending: false })
            .limit(1);
          if (data?.[0]?.preferences) setAnswers(data[0].preferences);
        }
      } catch (e) {
        console.error(e);
      }
      setLoaded(true);
    }
    load();
  }, []);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount >= PREFERENCE_QUESTION_COUNT;

  const pick = (key, value) => {
    setJustSaved(false);
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (saving || answeredCount === 0) return;
    setSaving(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You're not signed in, so this can't be saved.");
        setSaving(false);
        return;
      }
      const res = await fetch('/api/knowme?route=preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ preferences: answers }),
      });
      if (!res.ok) {
        setError("Couldn't save — your answers are still here. Try again in a moment.");
        setSaving(false);
        return;
      }
      setJustSaved(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't save — your answers are still here. Try again in a moment.");
    }
    setSaving(false);
  };

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream }}>
        <p style={{ color: C.stoneMid, fontSize: 14 }}>Loading your preferences...</p>
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
          <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, margin: 0 }}>Preferences</p>
          <p style={{ color: C.stoneMid, fontSize: 11, margin: 0 }}>{answeredCount} of {PREFERENCE_QUESTION_COUNT} answered</p>
        </div>
        <div style={{ width: 80, height: 4, background: C.stoneLight, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(answeredCount / PREFERENCE_QUESTION_COUNT) * 100}%`, background: avatarColor, borderRadius: 4, transition: "width 0.3s ease" }} />
        </div>
      </div>

      <div style={{ flex: 1, padding: "28px 24px 120px", maxWidth: 600, margin: "0 auto", width: "100%" }}>
        <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, color: C.ink, lineHeight: 1.6, marginBottom: 6 }}>
          These ones we'll just ask you straight.
        </p>
        <p style={{ color: C.stone, fontSize: 13, lineHeight: 1.7, marginBottom: 30 }}>
          Nothing here has a right answer, and none of it is a test. Skip anything that doesn't fit — partial is fine.
        </p>

        {PREFERENCE_CLUSTERS.map(cluster => (
          <div key={cluster.id} style={{ marginBottom: 34 }}>
            <p style={{ color: avatarColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
              {cluster.title}
            </p>
            <p style={{ color: C.stoneMid, fontSize: 12, marginBottom: 16 }}>{cluster.blurb}</p>

            {cluster.questions.map(q => (
              <div key={q.key} style={{ background: "rgba(255,248,235,0.7)", border: "1px solid rgba(255,235,200,0.5)", borderRadius: 16, padding: "16px 18px", marginBottom: 12, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
                <p style={{ color: C.ink, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{q.label}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {q.options.map(opt => {
                    const selected = answers[q.key] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => pick(q.key, opt.value)}
                        style={{
                          background: selected ? `${avatarColor}1f` : "rgba(255,248,235,0.55)",
                          border: `1.5px solid ${selected ? avatarColor : C.stoneLight}`,
                          borderRadius: 12,
                          padding: "9px 14px",
                          fontSize: 13,
                          fontWeight: selected ? 600 : 400,
                          color: selected ? C.ink : C.stone,
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}

        {error && (
          <div style={{ background: "#fee", border: "1px solid #fcc", borderRadius: 12, padding: "10px 14px", marginBottom: 14, color: "#c00", fontSize: 13 }}>
            {error}
          </div>
        )}

        {justSaved && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <p style={{ color: C.ink, fontSize: 14, fontFamily: "'Fraunces', Georgia, serif", marginBottom: 6 }}>
              {allAnswered ? "That's all of them — saved." : "Saved. Come back and finish the rest whenever."}
            </p>
            <button onClick={() => setScreen("myprofile")} style={{ background: "transparent", border: `1px solid ${avatarColor}44`, borderRadius: 10, padding: "7px 15px", fontSize: 12, color: avatarColor, cursor: "pointer", fontFamily: "inherit" }}>
              See what Buddin knows →
            </button>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || answeredCount === 0}
          style={{
            width: "100%",
            padding: "16px",
            background: answeredCount > 0 ? `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)` : C.stoneLight,
            color: answeredCount > 0 ? "#fff" : C.stoneMid,
            border: "none",
            borderRadius: 16,
            fontSize: 15,
            fontWeight: 700,
            cursor: answeredCount > 0 ? "pointer" : "default",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {justSaved && !saving && <Check size={16} strokeWidth={2.5} />}
          {saving ? "Saving..." : justSaved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
