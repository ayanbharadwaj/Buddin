import { Brain, Shuffle, BookOpen, Palette, Star } from "lucide-react";

export default function KnowMeHub({ setScreen, avatarColor, C, profile }) {
  const features = [
    {
      id: "comparisons",
      icon: Shuffle,
      title: "This or That",
      desc: "Quick picks that reveal how you think.",
      count: profile?.comparison_count || 0,
      total: 150,
      screen: "comparisons",
      ready: true,
    },
    {
      id: "wordgame",
      icon: BookOpen,
      title: "Word Association",
      desc: "What words mean to you says a lot.",
      count: 0,
      total: 50,
      screen: "wordgame",
      ready: false,
    },
    {
      id: "colorpref",
      icon: Palette,
      title: "Color Preferences",
      desc: "Your palette reveals your personality.",
      count: 0,
      total: 20,
      screen: "colorpref",
      ready: false,
    },
  ];

  const totalDone = profile?.comparison_count || 0;
  const totalPossible = 150;
  const pct = Math.round((totalDone / totalPossible) * 100);

  return (
    <div style={{ padding: "40px 24px 100px", maxWidth: 780, margin: "0 auto", fontFamily: "'Cabinet Grotesk', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Brain size={22} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 400, color: C.ink, margin: 0 }}>Know Me</h1>
            <p style={{ color: C.stoneMid, fontSize: 13, margin: 0 }}>Help Buddin understand how you think.</p>
          </div>
        </div>

        {/* Progress bar */}
        {totalDone > 0 && (
          <div style={{ marginTop: 16, background: C.stoneLight, borderRadius: 8, height: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${avatarColor}, ${avatarColor}cc)`, borderRadius: 8, transition: "width 0.6s ease" }} />
          </div>
        )}
        {totalDone > 0 && (
          <p style={{ color: C.stoneMid, fontSize: 11, marginTop: 6 }}>{totalDone} of {totalPossible} data points collected</p>
        )}
      </div>

      {/* Profile preview if enough data */}
      {totalDone >= 10 && profile?.inferred_traits && (
        <div style={{ background: `${avatarColor}10`, border: `1.5px solid ${avatarColor}33`, borderRadius: 18, padding: 20, marginBottom: 24 }}>
          <p style={{ color: avatarColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>HOW BUDDIN SEES YOU</p>
          <p style={{ color: C.ink, fontSize: 14, lineHeight: 1.7, fontFamily: "'Fraunces', Georgia, serif", fontStyle: "italic" }}>
            {profile.inferred_traits.summary || "Keep going — a picture of you is forming."}
          </p>
          <button onClick={() => setScreen("myprofile")} style={{ marginTop: 12, background: "transparent", border: `1px solid ${avatarColor}44`, borderRadius: 10, padding: "6px 14px", fontSize: 12, color: avatarColor, cursor: "pointer", fontFamily: "inherit" }}>
            See full profile →
          </button>
        </div>
      )}

      {/* Feature cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {features.map(f => {
          const Icon = f.icon;
          const pctDone = f.total > 0 ? Math.round((f.count / f.total) * 100) : 0;
          return (
            <button
              key={f.id}
              onClick={() => f.ready && setScreen(f.screen)}
              style={{
                background: f.ready ? "rgba(255,248,235,0.7)" : "rgba(255,248,235,0.35)",
                border: `1.5px solid ${f.ready ? avatarColor + "33" : C.stoneLight}`,
                borderRadius: 18,
                padding: "18px 20px",
                cursor: f.ready ? "pointer" : "default",
                textAlign: "left",
                opacity: f.ready ? 1 : 0.55,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: f.ready ? `${avatarColor}18` : `${C.stoneLight}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={19} color={f.ready ? avatarColor : C.stoneMid} strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: C.ink, margin: 0 }}>{f.title}</p>
                    {!f.ready && <span style={{ fontSize: 10, color: C.stoneMid, background: C.stoneLight, borderRadius: 6, padding: "2px 8px" }}>Coming soon</span>}
                    {f.ready && f.count > 0 && <span style={{ fontSize: 11, color: avatarColor, fontWeight: 600 }}>{pctDone}%</span>}
                  </div>
                  <p style={{ color: C.stone, fontSize: 13, margin: "3px 0 0" }}>{f.desc}</p>
                  {f.ready && f.count > 0 && (
                    <div style={{ marginTop: 8, background: C.stoneLight, borderRadius: 4, height: 3 }}>
                      <div style={{ height: "100%", width: `${pctDone}%`, background: avatarColor, borderRadius: 4 }} />
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p style={{ color: C.stoneMid, fontSize: 11, textAlign: "center", marginTop: 28, lineHeight: 1.6 }}>
        All data stays with you. You can clear it anytime.
      </p>
    </div>
  );
}