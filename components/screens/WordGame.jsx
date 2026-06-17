import { useState, useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from '../../lib/supabase.js';
import { WORDS } from '../../src/data/constants.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


// Words near the current level; if that band is empty, fall back to ALL
// remaining words so the game never declares completion early.
function buildQueue(level, answeredSet) {
  const remaining = WORDS.filter(w => !answeredSet.has(w.word));
  const band = remaining.filter(w => Math.abs(w.difficulty - level) <= 1);
  return shuffle(band.length > 0 ? band : remaining);
}

export default function WordGame({ setScreen, avatarColor, C }) {
  const [difficulty, setDifficulty] = useState(3);
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDef, setShowDef] = useState(false);
  const [streak, setStreak] = useState(0);
  const [dontKnowStreak, setDontKnowStreak] = useState(0);
  const [answeredIds, setAnsweredIds] = useState(new Set());
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const answeredRef = useRef(new Set());
  const startTime = useRef(Date.now());
  const inputRef = useRef(null);

  const answered = answeredIds.size;
  const remainingCount = WORDS.filter(w => !answeredIds.has(w.word)).length;

  useEffect(() => {
    async function loadAnswered() {
      let ids = new Set();
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data } = await supabase
            .from('word_responses')
            .select('word')
            .eq('user_id', session.user.id);
          if (data) ids = new Set(data.map(d => d.word));
        }
      } catch (e) {
        console.error(e);
      }
      answeredRef.current = ids;
      setAnsweredIds(ids);
      setQueue(buildQueue(3, ids));
      setIdx(0);
      setLoaded(true);
    }
    loadAnswered();
  }, []);

  // Rebuild only when the difficulty actually changes — not after every answer.
  useEffect(() => {
    if (!loaded) return;
    setQueue(buildQueue(difficulty, answeredRef.current));
    setIdx(0);
  }, [difficulty]); // eslint-disable-line

  useEffect(() => {
    startTime.current = Date.now();
    setResponse("");
    setShowDef(false);
    if (inputRef.current) inputRef.current.focus();
  }, [idx, queue]);

  const current = queue[idx];

  // Returns true only if the server confirmed the save — callers must not
  // advance or mark the word answered otherwise.
  const save = async (word, knew, text) => {
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
      const res = await fetch('/api/word-responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          word: word.word,
          difficulty_level: word.difficulty,
          response: text || null,
          knew_word: knew,
          response_time_ms: Date.now() - startTime.current,
        }),
      });
      if (res.ok) {
        const next = new Set([...answeredRef.current, word.word]);
        answeredRef.current = next;
        setAnsweredIds(next);
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

  const handleSubmit = async () => {
    if (!response.trim() || !current || saving) return;
    const ok = await save(current, true, response.trim());
    if (!ok) return;
    setDontKnowStreak(0);
    const next = streak + 1;
    const bumped = Math.min(10, difficulty + 1);
    if (next >= 3 && bumped !== difficulty) {
      setStreak(0);
      setDifficulty(bumped); // triggers queue rebuild
    } else {
      setStreak(next >= 3 ? 0 : next);
      advance();
    }
  };

  const handleDontKnow = async () => {
    if (!current || saving) return;
    const ok = await save(current, false, null);
    if (!ok) return;
    setStreak(0);
    const next = dontKnowStreak + 1;
    const lowered = Math.max(1, difficulty - 1);
    if (next >= 2 && lowered !== difficulty) {
      setDontKnowStreak(0);
      setDifficulty(lowered); // triggers queue rebuild
    } else {
      setDontKnowStreak(next >= 2 ? 0 : next);
      advance();
    }
  };

  const handleSkip = () => {
    setError(null);
    advance();
  };

  const advance = () => {
    // Walk past anything already answered (the queue isn't rebuilt per-answer).
    let next = idx + 1;
    while (next < queue.length && answeredRef.current.has(queue[next].word)) next++;
    if (next < queue.length) {
      setIdx(next);
    } else {
      setQueue(buildQueue(difficulty, answeredRef.current));
      setIdx(0);
    }
  };

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream }}>
        <p style={{ color: C.stoneMid, fontSize: 14 }}>Loading words...</p>
      </div>
    );
  }

  if (remainingCount === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.cream, fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", color: C.ink, fontWeight: 400, marginBottom: 8 }}>You've explored all the words!</h2>
          <p style={{ color: C.stone, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            {answered} words explored. Buddin now understands your vocabulary and associations.
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
        <p style={{ color: C.stoneMid, fontSize: 14 }}>Loading words...</p>
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
          <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, margin: 0 }}>Word Association</p>
          <p style={{ color: C.stoneMid, fontSize: 11, margin: 0 }}>{answered} words explored</p>
        </div>
        <div style={{ fontSize: 10, color: C.stoneMid, background: C.stoneLight, borderRadius: 6, padding: "2px 8px" }}>Level {difficulty}</div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", maxWidth: 500, margin: "0 auto", width: "100%" }}>
        {/* Word display */}
        <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 42, fontWeight: 400, color: C.ink, marginBottom: 8, textAlign: "center" }}>
          {current.word}
        </p>

        {showDef && (
          <p style={{ color: C.stoneMid, fontSize: 12, fontStyle: "italic", marginBottom: 20, textAlign: "center", maxWidth: 320 }}>
            {current.definition}
          </p>
        )}

        {!showDef && (
          <button onClick={() => setShowDef(true)} style={{ background: "transparent", border: "none", color: C.stoneMid, fontSize: 11, cursor: "pointer", marginBottom: 20, textDecoration: "underline" }}>
            Show definition
          </button>
        )}

        {error && (
          <div style={{ width: "100%", background: "#fee", border: "1px solid #fcc", borderRadius: 12, padding: "10px 14px", marginBottom: 14, color: "#c00", fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Input */}
        <div style={{ width: "100%", marginBottom: 20 }}>
          <input
            ref={inputRef}
            type="text"
            value={response}
            onChange={e => setResponse(e.target.value.slice(0, 120))}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="What comes to mind?"
            style={{
              width: "100%",
              padding: "16px 20px",
              border: `1.5px solid ${avatarColor}33`,
              borderRadius: 16,
              fontSize: 16,
              fontFamily: "inherit",
              background: "rgba(255,248,235,0.7)",
              color: C.ink,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, padding: "0 4px" }}>
            <span style={{ fontSize: 10, color: C.stoneMid }}>{response.length}/120</span>
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!response.trim() || saving}
          style={{
            width: "100%",
            padding: "16px",
            background: response.trim() ? `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)` : C.stoneLight,
            color: response.trim() ? "#fff" : C.stoneMid,
            border: "none",
            borderRadius: 16,
            fontSize: 15,
            fontWeight: 700,
            cursor: response.trim() ? "pointer" : "default",
            fontFamily: "inherit",
            marginBottom: 12,
          }}
        >
          {saving ? "Saving..." : "Submit"}
        </button>

        {/* Secondary actions */}
        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button
            onClick={handleDontKnow}
            disabled={saving}
            style={{
              flex: 1,
              padding: "12px",
              background: "rgba(255,248,235,0.7)",
              border: `1px solid ${C.stoneLight}`,
              borderRadius: 12,
              fontSize: 13,
              color: C.stone,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            I don't know this word
          </button>
          <button
            onClick={handleSkip}
            disabled={saving}
            style={{
              flex: 1,
              padding: "12px",
              background: "transparent",
              border: `1px solid ${C.stoneLight}`,
              borderRadius: 12,
              fontSize: 13,
              color: C.stoneMid,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
