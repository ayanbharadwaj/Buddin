import { useState, useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from '../../lib/supabase.js';

const WRITING_PROMPTS = [
  "Describe a moment when you felt completely in your element.",
  "What's something most people get wrong about you?",
  "Describe your ideal Saturday with no obligations.",
  "What made you angry recently and why?",
  "Describe a place that makes you feel calm.",
  "What's a skill you wish you had and why?",
  "Describe someone you admire without saying their name.",
  "What do you think about right before you fall asleep?",
  "What's something you've changed your mind about?",
  "Describe a night you won't forget.",
  "What does success look like to you in 10 years?",
  "What's something you do differently from most people?",
  "Describe a time you were proud of yourself.",
  "What would you do with a completely free week?",
  "What's a belief you hold that others often disagree with?",
  "Describe what boredom feels like for you.",
  "What's something small that brings you genuine joy?",
  "Describe a conversation that changed how you think.",
  "What's something you want to get better at and why?",
  "If you could fix one thing about the world, what would it be?",
];

export default function WritingPrompt({ setScreen, avatarColor, C }) {
  const [answeredPrompts, setAnsweredPrompts] = useState(new Set());
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [firstKeystrokeRecorded, setFirstKeystrokeRecorded] = useState(false);
  const promptStartTime = useRef(Date.now());
  const firstKeystrokeTime = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    async function loadAnswered() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          setQueue([...WRITING_PROMPTS]);
          setLoaded(true);
          return;
        }
        const { data } = await supabase
          .from('writing_samples')
          .select('prompt')
          .eq('user_id', session.user.id);
        const done = new Set(data?.map(d => d.prompt) || []);
        setAnsweredPrompts(done);
        const remaining = WRITING_PROMPTS.filter(p => !done.has(p));
        setQueue(remaining);
        setLoaded(true);
      } catch (e) {
        console.error(e);
        setQueue([...WRITING_PROMPTS]);
        setLoaded(true);
      }
    }
    loadAnswered();
  }, []);

  useEffect(() => {
    promptStartTime.current = Date.now();
    firstKeystrokeTime.current = null;
    setFirstKeystrokeRecorded(false);
    setResponse("");
    if (textareaRef.current) textareaRef.current.focus();
  }, [idx]);

  const current = queue[idx];
  const wordCount = response.trim() ? response.trim().split(/\s+/).length : 0;
  const totalAnswered = answeredPrompts.size;
  const totalPrompts = WRITING_PROMPTS.length;

  const handleChange = (e) => {
    const val = e.target.value;
    if (!firstKeystrokeRecorded && val.length > 0) {
      firstKeystrokeTime.current = Date.now() - promptStartTime.current;
      setFirstKeystrokeRecorded(true);
    }
    setResponse(val);
  };

  const handleSubmit = async () => {
    if (wordCount < 5 || saving) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setSaving(false); return; }
      await fetch('/api/writing-samples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: current,
          response: response.trim(),
          word_count: wordCount,
          response_time_ms: Date.now() - promptStartTime.current,
          time_to_first_keystroke_ms: firstKeystrokeTime.current || null,
        }),
      });
      setAnsweredPrompts(prev => new Set([...prev, current]));
      if (idx + 1 < queue.length) {
        setIdx(i => i + 1);
      } else {
        setQueue([]);
      }
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.cream }}>
        <p style={{ color: C.stoneMid, fontSize: 14 }}>Loading prompts...</p>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.cream, fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✍️</div>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", color: C.ink, fontWeight: 400, marginBottom: 8 }}>All prompts completed!</h2>
          <p style={{ color: C.stone, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            {totalAnswered} writing samples collected. Buddin now has a deep sense of how you express yourself.
          </p>
          <button onClick={() => setScreen("myprofile")} style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color: "#fff", border: "none", borderRadius: 16, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            See what Buddin knows →
          </button>
        </div>
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
          <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, margin: 0 }}>Writing Prompts</p>
          <p style={{ color: C.stoneMid, fontSize: 11, margin: 0 }}>Prompt {totalAnswered + 1} of {totalPrompts}</p>
        </div>
        {/* Progress bar */}
        <div style={{ width: 80, height: 4, background: C.stoneLight, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(totalAnswered / totalPrompts) * 100}%`, background: avatarColor, borderRadius: 4, transition: "width 0.3s ease" }} />
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "32px 24px 24px", maxWidth: 600, margin: "0 auto", width: "100%" }}>
        {/* Prompt */}
        <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 400, color: C.ink, lineHeight: 1.6, marginBottom: 28, textAlign: "center" }}>
          {current}
        </p>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={response}
          onChange={handleChange}
          placeholder="Start writing..."
          style={{
            flex: 1,
            minHeight: 200,
            padding: "20px",
            border: `1.5px solid ${avatarColor}33`,
            borderRadius: 16,
            fontSize: 15,
            fontFamily: "'Fraunces', Georgia, serif",
            background: "rgba(255,248,235,0.7)",
            color: C.ink,
            outline: "none",
            resize: "none",
            lineHeight: 1.8,
            boxSizing: "border-box",
          }}
        />

        {/* Word count and guidance */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, padding: "0 4px" }}>
          <span style={{ fontSize: 12, color: wordCount >= 50 && wordCount <= 300 ? avatarColor : C.stoneMid, fontWeight: wordCount >= 50 ? 600 : 400 }}>
            {wordCount} word{wordCount !== 1 ? "s" : ""}
          </span>
          <span style={{ fontSize: 11, color: C.stoneMid }}>
            {wordCount < 50 ? "Try to write at least 50 words" : wordCount > 300 ? "Nice depth — wrap up when ready" : "Looking good"}
          </span>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={wordCount < 5 || saving}
          style={{
            width: "100%",
            padding: "16px",
            marginTop: 16,
            background: wordCount >= 5 ? `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)` : C.stoneLight,
            color: wordCount >= 5 ? "#fff" : C.stoneMid,
            border: "none",
            borderRadius: 16,
            fontSize: 15,
            fontWeight: 700,
            cursor: wordCount >= 5 ? "pointer" : "default",
            fontFamily: "inherit",
          }}
        >
          {saving ? "Saving..." : "Submit & Next"}
        </button>
      </div>
    </div>
  );
}
