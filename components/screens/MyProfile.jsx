import { useState, useEffect } from "react";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { supabase } from '../../lib/supabase.js';

export default function MyProfile({ setScreen, avatarColor, C }) {
  const [traits, setTraits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [totalResponses, setTotalResponses] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data } = await supabase
        .from('user_profile')
        .select('inferred_traits')
        .eq('user_id', session.user.id)
        .single();

      if (data?.inferred_traits?.summary) {
        setTraits(data.inferred_traits);
      }

      const { count: compCount } = await supabase
        .from('comparison_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      const { count: wordCount } = await supabase
        .from('word_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      const { count: writingCount } = await supabase
        .from('writing_samples')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);

      setTotalResponses((compCount || 0) + (wordCount || 0) + (writingCount || 0));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const generateProfile = async () => {
    setGenerating(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/infer-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await res.json();
      if (data.error === 'not_enough_data') {
        setError('Answer at least 5 questions across any Know Me module first.');
      } else if (data.traits) {
        setTraits(data.traits);
        setTotalResponses(data.total_responses);
      }
    } catch (e) {
      setError('Something went wrong. Try again.');
    }
    setGenerating(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream }}>
      <p style={{ color: C.stoneMid, fontSize: 14 }}>Loading your profile...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "'Cabinet Grotesk', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "max(14px, calc(env(safe-area-inset-top) + 10px)) 20px 14px", display: "flex", alignItems: "center", gap: 12, background: "rgba(245,236,220,0.85)", backdropFilter: "blur(22px)", borderBottom: "1px solid rgba(255,235,200,0.28)" }}>
        <button onClick={() => setScreen("knowme")} style={{ background: "transparent", border: "none", cursor: "pointer", color: avatarColor, padding: "4px 2px", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, margin: 0 }}>How Buddin Sees You</p>
          <p style={{ color: C.stoneMid, fontSize: 11, margin: 0 }}>{totalResponses} responses collected</p>
        </div>
        <button onClick={generateProfile} disabled={generating} style={{ background: `${avatarColor}18`, border: `1px solid ${avatarColor}44`, borderRadius: 10, padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: avatarColor, fontWeight: 600 }}>
          <RefreshCw size={13} strokeWidth={2} style={{ animation: generating ? "spin 1s linear infinite" : "none" }} />
          {generating ? "Thinking..." : "Refresh"}
        </button>
      </div>

      <div style={{ padding: "24px 20px 100px", maxWidth: 680, margin: "0 auto" }}>
        {error && (
          <div style={{ background: "#fee", border: "1px solid #fcc", borderRadius: 12, padding: "12px 16px", marginBottom: 20, color: "#c00", fontSize: 13 }}>
            {error}
          </div>
        )}

        {!traits && !error && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", color: C.ink, fontWeight: 400, marginBottom: 8 }}>No profile yet</h2>
            <p style={{ color: C.stone, fontSize: 14, lineHeight: 1.7, marginBottom: 24, maxWidth: 300, margin: "0 auto 24px" }}>
              Answer some questions in the Know Me section first, then come back here to see what Buddin has figured out about you.
            </p>
            <button onClick={() => setScreen("knowme")} style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color: "#fff", border: "none", borderRadius: 16, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Go to Know Me →
            </button>
          </div>
        )}

        {traits && (
          <>
            {/* Summary */}
            <div style={{ background: `${avatarColor}12`, border: `1.5px solid ${avatarColor}33`, borderRadius: 20, padding: 24, marginBottom: 16 }}>
              <p style={{ color: avatarColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>THE SHORT VERSION</p>
              <p style={{ color: C.ink, fontSize: 16, lineHeight: 1.8, fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic", margin: 0 }}>
                {traits.summary}
              </p>
            </div>

            {/* Trait cards */}
            {[
              { label: "AESTHETIC IDENTITY", value: traits.aesthetic_identity },
              { label: "SOCIAL STYLE", value: traits.social_style },
              { label: "RISK PROFILE", value: traits.risk_profile },
              { label: "HOW YOU THINK", value: traits.intellectual_pattern },
              { label: "VOCABULARY PROFILE", value: traits.vocabulary_profile },
              { label: "WRITING VOICE", value: traits.writing_voice },
              { label: "EMOTIONAL VOCABULARY", value: traits.emotional_vocabulary },
            ].filter(t => t.value && t.value !== "null").map(trait => (
              <div key={trait.label} style={{ background: "rgba(255,248,235,0.7)", border: "1px solid rgba(255,235,200,0.5)", borderRadius: 16, padding: "16px 20px", marginBottom: 12, backdropFilter: "blur(12px)" }}>
                <p style={{ color: avatarColor, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>{trait.label}</p>
                <p style={{ color: C.ink, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{trait.value}</p>
              </div>
            ))}

            {/* Contrarian score */}
            {traits.contrarian_score !== undefined && (
              <div style={{ background: "rgba(255,248,235,0.7)", border: "1px solid rgba(255,235,200,0.5)", borderRadius: 16, padding: "16px 20px", marginBottom: 12 }}>
                <p style={{ color: avatarColor, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>CONTRARIAN SCORE</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, background: C.stoneLight, borderRadius: 4, height: 6 }}>
                    <div style={{ height: "100%", width: `${traits.contrarian_score}%`, background: `linear-gradient(90deg, ${avatarColor}, ${avatarColor}cc)`, borderRadius: 4 }} />
                  </div>
                  <p style={{ color: C.ink, fontSize: 14, fontWeight: 700, margin: 0 }}>{traits.contrarian_score}/100</p>
                </div>
                <p style={{ color: C.stoneMid, fontSize: 12, marginTop: 6, margin: "6px 0 0" }}>
                  {traits.contrarian_score > 70 ? "You consistently pick the unexpected choice." : traits.contrarian_score > 40 ? "You mix conventional and unconventional picks." : "You tend toward popular, proven choices."}
                </p>
              </div>
            )}

            {/* Stand out choices */}
            {traits.stand_out_choices?.length > 0 && (
              <div style={{ background: "rgba(255,248,235,0.7)", border: "1px solid rgba(255,235,200,0.5)", borderRadius: 16, padding: "16px 20px", marginBottom: 12 }}>
                <p style={{ color: avatarColor, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>MOST REVEALING CHOICES</p>
                {traits.stand_out_choices.map((choice, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${avatarColor}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: avatarColor, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                    <p style={{ color: C.ink, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{choice}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Career signals */}
            {traits.career_signals?.length > 0 && (
              <div style={{ background: "rgba(255,248,235,0.7)", border: "1px solid rgba(255,235,200,0.5)", borderRadius: 16, padding: "16px 20px", marginBottom: 12 }}>
                <p style={{ color: avatarColor, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>CAREER SIGNALS</p>
                {traits.career_signals.map((signal, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: avatarColor, flexShrink: 0, marginTop: 7 }} />
                    <p style={{ color: C.ink, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{signal}</p>
                  </div>
                ))}
              </div>
            )}

            <p style={{ color: C.stoneMid, fontSize: 11, textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
              Based on {totalResponses} responses. Hit Refresh to update as you answer more.
            </p>
          </>
        )}
      </div>
    </div>
  );
}