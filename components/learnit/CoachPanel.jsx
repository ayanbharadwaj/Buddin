import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, ChevronDown } from "lucide-react";
import { supabase } from '../../lib/supabase.js';

// ═══════════════════════════════════════════════════════════════════════════
// COACH PANEL
//
// The point of Learn It is learning, and you don't learn much from picking an
// option and being told what happens. You learn by asking "but what if she'd
// said it in front of everyone?" — the follow-up nobody wrote a card for.
//
// So every scenario carries a conversation. The companion answers in the same
// voice the user already chose in the main chat: Mochi eases into it, Zap gives
// you the answer in two sentences, Sage turns it back into a question, Nova
// reframes it sideways. Same character, different room.
//
// It has its own daily allowance rather than sharing the companion chat's — a
// free user shouldn't have to spend their ten messages to finish a lesson.
// ═══════════════════════════════════════════════════════════════════════════

export default function CoachPanel({
  avatar, avatarColor, C, moduleTitle, scenario, chosenIndex, exploredCount,
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const name = avatar?.name || "Buddin";

  // A conversation belongs to one scenario. Moving on starts a fresh one rather
  // than dragging the last situation's context into the next.
  useEffect(() => {
    setMessages([]);
    setInput("");
    setError(null);
  }, [scenario?.id]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  // Openers that depend on where they are, so the blank box isn't the first
  // thing they have to solve.
  const suggestions = chosenIndex == null
    ? ["What's this actually testing?", "I genuinely don't know what I'd do"]
    : exploredCount > 1
      ? ["Why is that one worse?", "What if the person is someone I know well?"]
      : ["Why does that work?", "What if I get it wrong in the moment?"];

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");
    setError(null);
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You need to be signed in to ask about this.");
        setSending(false);
        return;
      }
      const res = await fetch('/api/knowme?route=coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          avatar_id: avatar?.id || null,
          module_title: moduleTitle,
          situation: scenario.situation,
          options: scenario.choices.map(c => c.text),
          chose: chosenIndex != null ? scenario.choices[chosenIndex].text : null,
          messages: next.slice(-8),
        }),
      });
      const data = await res.json();

      if (res.status === 429) {
        setError(`That's all the coaching questions for today. ${name} will be here tomorrow.`);
        setSending(false);
        return;
      }
      if (!res.ok || !data.reply) {
        setError("Couldn't get through just now — try that again in a moment.");
        setSending(false);
        return;
      }
      setMessages(m => [...m, { role: "assistant", content: data.reply }]);
      if (typeof data.remaining === "number") setRemaining(data.remaining);
    } catch (e) {
      console.error(e);
      setError("Couldn't get through just now — try that again in a moment.");
    }
    setSending(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 60); }}
        style={{
          width: "100%", marginTop: 16, padding: "14px 18px",
          background: "rgba(255,248,235,0.7)",
          border: `1.5px dashed ${avatarColor}55`,
          borderRadius: 16, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 10, textAlign: "left",
        }}
      >
        <MessageCircle size={17} color={avatarColor} strokeWidth={2} />
        <span style={{ color: C.stone, fontSize: 13.5, flex: 1 }}>
          Ask {name} about this one
        </span>
      </button>
    );
  }

  return (
    <div style={{
      marginTop: 16,
      background: "rgba(255,248,235,0.75)",
      border: `1.5px solid ${avatarColor}33`,
      borderRadius: 18,
      overflow: "hidden",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "12px 16px", borderBottom: `1px solid ${avatarColor}22`,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 9,
          background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}bb)`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
        }}>{avatar?.emoji || "💬"}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: C.ink, margin: 0 }}>{name}</p>
          <p style={{ color: C.stoneMid, fontSize: 10.5, margin: 0 }}>
            {remaining != null ? `${remaining} questions left today` : "on this situation"}
          </p>
        </div>
        <button onClick={() => setOpen(false)}
          style={{ background: "transparent", border: "none", cursor: "pointer", color: C.stoneMid, display: "flex", padding: 4 }}
          aria-label="Close coach">
          <ChevronDown size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Transcript */}
      <div style={{ maxHeight: 300, overflowY: "auto", padding: "14px 16px" }}>
        {messages.length === 0 && (
          <p style={{ color: C.stoneMid, fontSize: 12.5, lineHeight: 1.7, margin: "0 0 12px" }}>
            Ask anything about this situation — including the parts the options didn't cover.
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 10,
          }}>
            <div style={{
              maxWidth: "85%",
              padding: "10px 14px",
              borderRadius: 14,
              background: m.role === "user" ? `${avatarColor}20` : "rgba(255,255,255,0.6)",
              border: m.role === "user" ? "none" : `1px solid ${C.stoneLight}`,
              color: C.ink,
              fontSize: 13.5,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <p style={{ color: C.stoneMid, fontSize: 12, fontStyle: "italic", margin: "4px 0" }}>
            {name} is thinking...
          </p>
        )}

        {error && (
          <div style={{ background: "#fee", border: "1px solid #fcc", borderRadius: 10, padding: "8px 12px", color: "#c00", fontSize: 12.5, marginTop: 6 }}>
            {error}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, padding: "0 16px 12px" }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => send(s)} disabled={sending}
              style={{
                background: "transparent", border: `1px solid ${avatarColor}44`,
                borderRadius: 20, padding: "6px 12px", fontSize: 12,
                color: avatarColor, cursor: "pointer", fontFamily: "inherit",
              }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderTop: `1px solid ${avatarColor}18` }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value.slice(0, 400))}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={`Ask ${name}...`}
          disabled={sending}
          style={{
            flex: 1, padding: "11px 14px",
            border: `1.5px solid ${avatarColor}2a`,
            borderRadius: 13, fontSize: 14, fontFamily: "inherit",
            background: "rgba(255,255,255,0.6)", color: C.ink, outline: "none",
            boxSizing: "border-box", minWidth: 0,
          }}
        />
        <button onClick={() => send()} disabled={!input.trim() || sending}
          aria-label="Send"
          style={{
            width: 42, flexShrink: 0,
            background: input.trim() ? `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)` : C.stoneLight,
            border: "none", borderRadius: 13, cursor: input.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
          <Send size={16} color={input.trim() ? "#fff" : C.stoneMid} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
