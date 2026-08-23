// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO VISUALS
//
// Some situations are much easier to reason about when you can see them. A
// place setting described in a sentence is a memory test; a place setting drawn
// is obvious. Same for "where do you actually look when you're reading someone"
// — the useful part of that answer is spatial, so it should be shown spatially.
//
// Everything here is inline SVG, authored rather than sourced:
//   - no external image requests (the app has a strict no-third-party-asset
//     posture, and clipart carries licensing questions we don't want)
//   - crisp at any size, including the phone widths most of this gets read on
//   - recolours to whichever companion the user picked, for free
//   - costs bytes in the bundle, not a network round trip
//
// A scenario without a `visual` key simply renders no diagram. Visuals are for
// scenarios where the picture carries information the text can't — not decoration.
// ═══════════════════════════════════════════════════════════════════════════

const frame = (C) => ({
  background: "rgba(255,248,235,0.55)",
  border: "1px solid rgba(255,235,200,0.6)",
  borderRadius: 18,
  padding: "18px 16px 14px",
  marginBottom: 22,
});

const capStyle = (C) => ({
  color: C.stoneMid,
  fontSize: 11,
  lineHeight: 1.6,
  textAlign: "center",
  margin: "10px 0 0",
});

// ── Place setting: outside-in, numbered ────────────────────────────────────
function PlaceSetting({ avatarColor, C }) {
  const Fork = ({ x, tines = 4, label, n }) => (
    <g>
      {Array.from({ length: tines }).map((_, i) => (
        <rect key={i} x={x - 6 + i * 4} y={38} width={2} height={14} rx={1} fill={avatarColor} opacity={0.85} />
      ))}
      <rect x={x - 6} y={50} width={(tines - 1) * 4 + 2} height={5} rx={2} fill={avatarColor} opacity={0.85} />
      <rect x={x - 1.5} y={54} width={3} height={40} rx={1.5} fill={avatarColor} opacity={0.85} />
      <circle cx={x} cy={26} r={8} fill={avatarColor} opacity={0.18} />
      <text x={x} y={30} textAnchor="middle" fontSize={10} fontWeight="700" fill={avatarColor}>{n}</text>
      <text x={x} y={110} textAnchor="middle" fontSize={8} fill={C.stoneMid}>{label}</text>
    </g>
  );

  return (
    <div style={frame(C)}>
      <svg viewBox="0 0 300 124" style={{ width: "100%", height: "auto", display: "block" }} role="img"
        aria-label="A place setting seen from above. Three forks sit to the left of the plate, numbered one, two and three from the outside inward.">
        {/* plate */}
        <circle cx={150} cy={66} r={38} fill="none" stroke={C.stoneLight} strokeWidth={2.5} />
        <circle cx={150} cy={66} r={28} fill="none" stroke={C.stoneLight} strokeWidth={1.5} />

        <Fork x={82}  n="1" label="first course" />
        <Fork x={104} n="2" label="second" />
        <Fork x={126} n="3" label="main" />

        {/* knife + spoon on the right, unnumbered — same rule, mirrored */}
        <g opacity={0.4}>
          <rect x={172} y={38} width={4} height={56} rx={2} fill={C.stoneMid} />
          <rect x={171} y={38} width={6} height={22} rx={3} fill={C.stoneMid} />
          <rect x={188} y={52} width={4} height={42} rx={2} fill={C.stoneMid} />
          <ellipse cx={190} cy={45} rx={5} ry={8} fill={C.stoneMid} />
        </g>

        {/* direction of travel */}
        <path d="M78 118 L130 118" stroke={avatarColor} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} />
        <path d="M126 115 L132 118 L126 121 Z" fill={avatarColor} opacity={0.7} />
      </svg>
      <p style={capStyle(C)}>
        Outside in, one per course. That's the entire rule — it's the same at every formal table in the world.
      </p>
    </div>
  );
}

// ── Where you actually read someone ────────────────────────────────────────
// The regions worth attending to, and the ones people waste attention on. Takes
// a list of region keys to light up, so each People Reading scenario can point
// at the specific signal that matters in that situation.
const REGIONS = {
  eyes:     { cx: 150, cy: 40,  r: 20, label: "eyes" },
  mouth:    { cx: 150, cy: 57,  r: 13, label: "mouth" },
  shoulders:{ cx: 150, cy: 84,  r: 30, label: "shoulders" },
  hands:    { cx: 150, cy: 126, r: 26, label: "hands" },
  feet:     { cx: 150, cy: 178, r: 24, label: "feet" },
};

function BodySignals({ avatarColor, C, highlight = [], caption }) {
  const on = new Set(highlight);
  return (
    <div style={frame(C)}>
      <svg viewBox="0 0 300 200" style={{ width: "100%", height: "auto", display: "block" }} role="img"
        aria-label={`A simple figure with the ${highlight.join(", ")} highlighted as where the useful signal is.`}>
        {/* figure */}
        <g stroke={C.stoneLight} strokeWidth={2.5} fill="none" strokeLinecap="round">
          <circle cx={150} cy={46} r={24} />
          <path d="M150 70 L150 130" />
          <path d="M150 82 L118 112" />
          <path d="M150 82 L182 112" />
          <path d="M150 130 L128 180" />
          <path d="M150 130 L172 180" />
          <path d="M126 84 L174 84" />
        </g>
        {/* face marks */}
        <circle cx={142} cy={42} r={2.5} fill={C.stoneMid} />
        <circle cx={158} cy={42} r={2.5} fill={C.stoneMid} />
        <path d="M142 55 Q150 59 158 55" stroke={C.stoneMid} strokeWidth={2} fill="none" strokeLinecap="round" />
        {/* hands */}
        <circle cx={116} cy={114} r={5} fill="none" stroke={C.stoneLight} strokeWidth={2.5} />
        <circle cx={184} cy={114} r={5} fill="none" stroke={C.stoneLight} strokeWidth={2.5} />

        {/* highlights */}
        {Object.entries(REGIONS).map(([key, r]) => {
          const lit = on.has(key);
          return (
            <g key={key}>
              <ellipse cx={r.cx} cy={r.cy} rx={r.r} ry={r.r * 0.62}
                fill={lit ? avatarColor : "transparent"}
                fillOpacity={lit ? 0.16 : 0}
                stroke={lit ? avatarColor : C.stoneLight}
                strokeOpacity={lit ? 0.9 : 0.3}
                strokeWidth={lit ? 2 : 1}
                strokeDasharray={lit ? "0" : "3 4"} />
              <text x={r.cx + r.r + 8} y={r.cy + 3} fontSize={9}
                fill={lit ? avatarColor : C.stoneLight}
                fontWeight={lit ? 700 : 400}>{r.label}</text>
            </g>
          );
        })}
      </svg>
      <p style={capStyle(C)}>{caption}</p>
    </div>
  );
}

// ── Two bars: what a number looks like annualised ──────────────────────────
function CostComparison({ avatarColor, C, small, large, smallLabel, largeLabel, caption }) {
  return (
    <div style={frame(C)}>
      <svg viewBox="0 0 300 96" style={{ width: "100%", height: "auto", display: "block" }} role="img"
        aria-label={`${smallLabel} compared with ${largeLabel}.`}>
        <rect x={10} y={18} width={26} height={20} rx={5} fill={avatarColor} opacity={0.35} />
        <text x={44} y={32} fontSize={12} fontWeight="700" fill={C.ink}>{small}</text>
        <text x={44} y={45} fontSize={9} fill={C.stoneMid}>{smallLabel}</text>

        <rect x={10} y={58} width={278} height={20} rx={5} fill={avatarColor} opacity={0.85} />
        <text x={20} y={72} fontSize={12} fontWeight="700" fill="#FBF5EC">{large}</text>
        <text x={20} y={90} fontSize={9} fill={C.stoneMid}>{largeLabel}</text>
      </svg>
      <p style={capStyle(C)}>{caption}</p>
    </div>
  );
}

// ── A sentence, before and after cutting ───────────────────────────────────
function WordCount({ avatarColor, C, before, after, caption }) {
  const unit = 260 / Math.max(before, after);
  return (
    <div style={frame(C)}>
      <svg viewBox="0 0 300 92" style={{ width: "100%", height: "auto", display: "block" }} role="img"
        aria-label={`${before} words cut down to ${after}.`}>
        {Array.from({ length: before }).map((_, i) => (
          <rect key={`b${i}`} x={14 + i * unit} y={16} width={Math.max(3, unit - 3)} height={16} rx={2}
            fill={i < after ? avatarColor : C.stoneLight} opacity={i < after ? 0.8 : 1} />
        ))}
        <text x={14} y={44} fontSize={9} fill={C.stoneMid}>{before} words</text>

        {Array.from({ length: after }).map((_, i) => (
          <rect key={`a${i}`} x={14 + i * unit} y={58} width={Math.max(3, unit - 3)} height={16} rx={2}
            fill={avatarColor} opacity={0.85} />
        ))}
        <text x={14} y={86} fontSize={9} fill={avatarColor} fontWeight="700">{after} words — same meaning</text>
      </svg>
      <p style={capStyle(C)}>{caption}</p>
    </div>
  );
}

// ── The shape of an email that gets answered ───────────────────────────────
function EmailAnatomy({ avatarColor, C }) {
  const rows = [
    { label: "Subject", text: "Question about Friday's deadline", w: 200 },
    { label: "Greeting", text: "Hi Ms. Reyes —", w: 110 },
    { label: "The ask", text: "two sentences, no preamble", w: 230 },
    { label: "Sign-off", text: "Thanks, Ayan", w: 95 },
  ];
  return (
    <div style={frame(C)}>
      <svg viewBox="0 0 300 148" style={{ width: "100%", height: "auto", display: "block" }} role="img"
        aria-label="The four parts of an email that gets answered: subject, greeting, the ask, sign-off.">
        <rect x={8} y={8} width={284} height={132} rx={10} fill="none" stroke={C.stoneLight} strokeWidth={1.5} />
        {rows.map((r, i) => (
          <g key={r.label}>
            <rect x={20} y={22 + i * 30} width={r.w} height={13} rx={3} fill={avatarColor} opacity={0.22} />
            <text x={24} y={32 + i * 30} fontSize={8.5} fill={C.ink}>{r.text}</text>
            <text x={20} y={46 + i * 30} fontSize={7.5} fill={avatarColor} fontWeight="700"
              letterSpacing="0.06em">{r.label.toUpperCase()}</text>
          </g>
        ))}
      </svg>
      <p style={capStyle(C)}>
        Four parts, in this order. It isn't stiffness — it's making it fast for a busy person to help you.
      </p>
    </div>
  );
}

// ── A pause, drawn to scale ────────────────────────────────────────────────
function SilenceTimeline({ avatarColor, C }) {
  return (
    <div style={frame(C)}>
      <svg viewBox="0 0 300 86" style={{ width: "100%", height: "auto", display: "block" }} role="img"
        aria-label="A timeline showing that a silence which feels enormous is usually only a few seconds long.">
        <line x1={16} y1={44} x2={284} y2={44} stroke={C.stoneLight} strokeWidth={2} />
        {[0, 1, 2, 3, 4].map(s => (
          <g key={s}>
            <line x1={16 + s * 67} y1={38} x2={16 + s * 67} y2={50} stroke={C.stoneLight} strokeWidth={2} />
            <text x={16 + s * 67} y={64} textAnchor="middle" fontSize={9} fill={C.stoneMid}>{s}s</text>
          </g>
        ))}
        <rect x={16} y={38} width={134} height={12} rx={6} fill={avatarColor} opacity={0.75} />
        <text x={83} y={28} textAnchor="middle" fontSize={9} fontWeight="700" fill={avatarColor}>feels like forever</text>
        <text x={216} y={28} textAnchor="middle" fontSize={9} fill={C.stoneMid}>still completely normal</text>
        <text x={150} y={80} textAnchor="middle" fontSize={8.5} fill={C.stoneMid}>
          The person who fills every pause is the one who's uncomfortable.
        </text>
      </svg>
    </div>
  );
}

// ── Who's holding the floor ────────────────────────────────────────────────
function FloorShare({ avatarColor, C }) {
  const people = [
    { name: "you", share: 0.62 },
    { name: "A", share: 0.18 },
    { name: "B", share: 0.14 },
    { name: "C", share: 0.06 },
  ];
  let x = 14;
  return (
    <div style={frame(C)}>
      <svg viewBox="0 0 300 78" style={{ width: "100%", height: "auto", display: "block" }} role="img"
        aria-label="A bar showing one person holding most of the conversation while three others barely speak.">
        {people.map((p, i) => {
          const w = p.share * 272;
          const el = (
            <g key={p.name}>
              <rect x={x} y={20} width={w - 3} height={22} rx={5}
                fill={avatarColor} opacity={i === 0 ? 0.85 : 0.25} />
              <text x={x + (w - 3) / 2} y={35} textAnchor="middle" fontSize={9}
                fontWeight={i === 0 ? 700 : 400} fill={i === 0 ? "#FBF5EC" : C.stone}>{p.name}</text>
            </g>
          );
          x += w;
          return el;
        })}
        <text x={150} y={62} textAnchor="middle" fontSize={8.5} fill={C.stoneMid}>
          Nobody interrupts because interrupting is hard — not because they're enjoying it.
        </text>
      </svg>
    </div>
  );
}

// ── Registry ───────────────────────────────────────────────────────────────
// Keyed by scenario id. Anything not listed renders nothing.
export const VISUALS = {
  etq1: (p) => <PlaceSetting {...p} />,
  etq5: (p) => <FloorShare {...p} />,
  etq6: (p) => <EmailAnatomy {...p} />,

  gr2:  (p) => <WordCount {...p} before={13} after={5}
          caption={'"I personally believe that in my own opinion the plan is basically a good one." → "I think the plan is good."'} />,
  gr4:  (p) => <EmailAnatomy {...p} />,

  mn5:  (p) => <CostComparison {...p} small="$9.99" smallLabel="what it feels like, monthly"
          large="$119.88" largeLabel="what it actually is, yearly"
          caption="Subscriptions work precisely because $9.99 never feels like a decision. Annualising it makes it one again." />,
  mn7:  (p) => <CostComparison {...p} small="willpower" smallLabel="needed every single payday"
          large="one standing instruction" largeLabel="needed exactly once"
          caption="The gap between knowing and doing is almost never information. It's that every payday requires a decision." />,

  pp1:  (p) => <BodySignals {...p} highlight={["eyes", "hands"]}
          caption="When words and behaviour disagree, behaviour is the more reliable one. Watch what's steady, not what's said." />,
  pp2:  (p) => <BodySignals {...p} highlight={["mouth", "shoulders"]}
          caption="Fast agreement plus a closed posture is usually self-protection, not enthusiasm." />,
  pp4:  (p) => <BodySignals {...p} highlight={["eyes", "mouth"]}
          caption="The feedback was in the delivery, not the sentence. Flat tone and no eye contact carry the real note." />,
  pp7:  (p) => <BodySignals {...p} highlight={["shoulders", "hands"]}
          caption="You're reading a change from their baseline — not a fixed 'type'. Baseline first, deviation second." />,

  pr4:  (p) => <SilenceTimeline {...p} />,
  pr7:  (p) => <BodySignals {...p} highlight={["shoulders", "feet"]}
          caption="Composure in an unfamiliar room is mostly pace. People read speed as nerves before they read anything else." />,
};

export default function ScenarioVisual({ scenarioId, avatarColor, C }) {
  const render = VISUALS[scenarioId];
  if (!render) return null;
  return render({ avatarColor, C });
}
