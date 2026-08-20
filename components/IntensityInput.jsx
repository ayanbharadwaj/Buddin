import { useState } from "react";

// Shared prime-scale intensity input.
//
// Why this exists as one component rather than being copy-pasted per module:
// spec 6 replaced the original six-button grid because six buttons in a row are
// their own familiar shape — people learn "always the third one" within a handful
// of questions, which is exactly the autopilot the unfamiliar prime scale was
// meant to prevent. A continuous value has no position to memorise, and it keeps
// the precision the buttons threw away (121-out-of-127 and 101-out-of-127 used to
// round into the same button). Every module that asks for a rated response uses
// this, so the fix only had to be made once.
//
// Two things it deliberately does NOT do:
//  - It never starts on a value. An untouched slider shows a dash and the commit
//    button stays disabled, so a default can't be accepted as if it were a choice.
//  - It never shows tick marks or a labelled midpoint. The number is the feedback.
//
// The typed field is the exact-entry escape hatch: dragging on a phone lands a
// few points off from what someone meant, and typing never does. Both paths
// resolve to the same single integer handed to onCommit.

export const PRIME_SCALES = [97, 107, 113, 127, 151];

export function getRandomScale() {
  return PRIME_SCALES[Math.floor(Math.random() * PRIME_SCALES.length)];
}

export default function IntensityInput({
  scale,
  avatarColor,
  C,
  onCommit,
  question = "How strongly do you feel about this?",
  lowLabel = "not really",
  highLabel = "absolutely",
  commitLabel = "That's it",
  disabled = false,
}) {
  const [draft, setDraft] = useState(null);
  const [touched, setTouched] = useState(false);

  const commit = () => {
    if (disabled || !touched || draft == null) return;
    onCommit(draft);
  };

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <p style={{ color: C.stone, fontSize: 13, marginBottom: 18 }}>{question}</p>

      <p style={{
        fontFamily: "'Fraunces', Georgia, serif",
        fontSize: 46,
        lineHeight: 1,
        fontWeight: 400,
        color: touched ? C.ink : C.stoneLight,
        marginBottom: 2,
        transition: "color 0.2s ease",
      }}>
        {touched ? draft : "—"}
        <span style={{ fontSize: 18, color: C.stoneMid }}> / {scale}</span>
      </p>
      <p style={{ color: C.stoneMid, fontSize: 12, marginBottom: 22 }}>
        {touched ? "Drag to adjust, or type an exact number below." : "Drag the bar to set how strongly you feel."}
      </p>

      <input
        type="range"
        min={1}
        max={scale}
        step={1}
        value={draft == null ? Math.round(scale / 2) : draft}
        onChange={e => { setDraft(Number(e.target.value)); setTouched(true); }}
        aria-label={`Intensity from 1 to ${scale}`}
        className="intensity-range"
        disabled={disabled}
        style={{
          width: "100%",
          accentColor: avatarColor,
          opacity: touched ? 1 : 0.45,
          transition: "opacity 0.2s ease",
          cursor: disabled ? "default" : "pointer",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, padding: "0 2px" }}>
        <span style={{ color: C.stoneMid, fontSize: 11 }}>1 · {lowLabel}</span>
        <span style={{ color: C.stoneMid, fontSize: 11 }}>{scale} · {highLabel}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 22 }}>
        <label htmlFor="intensity-exact" style={{ color: C.stoneMid, fontSize: 12 }}>Or type it:</label>
        <input
          id="intensity-exact"
          type="number"
          inputMode="numeric"
          min={1}
          max={scale}
          value={touched && draft != null ? draft : ""}
          placeholder="—"
          disabled={disabled}
          onChange={e => {
            const raw = e.target.value;
            if (raw === "") { setDraft(null); setTouched(false); return; }
            const n = Math.max(1, Math.min(scale, Math.round(Number(raw))));
            if (!Number.isNaN(n)) { setDraft(n); setTouched(true); }
          }}
          onKeyDown={e => { if (e.key === "Enter") commit(); }}
          style={{
            width: 78,
            padding: "9px 10px",
            border: `1.5px solid ${avatarColor}33`,
            borderRadius: 12,
            fontSize: 15,
            fontFamily: "inherit",
            textAlign: "center",
            background: "rgba(255,248,235,0.7)",
            color: C.ink,
            outline: "none",
          }}
        />
      </div>

      <button
        onClick={commit}
        disabled={disabled || !touched || draft == null}
        style={{
          width: "100%",
          marginTop: 22,
          padding: "15px",
          background: touched && !disabled ? `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)` : C.stoneLight,
          color: touched && !disabled ? "#fff" : C.stoneMid,
          border: "none",
          borderRadius: 16,
          fontSize: 15,
          fontWeight: 700,
          cursor: touched && !disabled ? "pointer" : "default",
          fontFamily: "inherit",
          transition: "background 0.2s ease",
        }}
      >
        {disabled ? "Saving..." : touched ? commitLabel : "Set a number first"}
      </button>

      {/* A bigger touch target than the browser default — this is the one control
          in the app people drag on a phone. */}
      <style>{`
        .intensity-range { -webkit-appearance: none; appearance: none; height: 26px; background: transparent; }
        .intensity-range::-webkit-slider-runnable-track {
          height: 6px; border-radius: 6px; background: ${C.stoneLight};
        }
        .intensity-range::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 26px; height: 26px; margin-top: -10px; border-radius: 50%;
          background: ${avatarColor}; border: 3px solid #FBF5EC;
          box-shadow: 0 2px 8px rgba(40,28,16,0.18); cursor: grab;
        }
        .intensity-range:active::-webkit-slider-thumb { cursor: grabbing; }
        .intensity-range::-moz-range-track {
          height: 6px; border-radius: 6px; background: ${C.stoneLight};
        }
        .intensity-range::-moz-range-thumb {
          width: 20px; height: 20px; border-radius: 50%;
          background: ${avatarColor}; border: 3px solid #FBF5EC;
          box-shadow: 0 2px 8px rgba(40,28,16,0.18); cursor: grab;
        }
      `}</style>
    </div>
  );
}
