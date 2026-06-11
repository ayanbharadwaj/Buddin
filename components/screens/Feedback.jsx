import { useState } from "react";
import { ChevronLeft, Mail } from "lucide-react";
import { InstagramIcon, YoutubeIcon } from '../SocialIcons.jsx';
import { supabase } from '../../lib/supabase.js';

export default function Feedback({ setScreen, avatarColor, C }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (message.trim().length < 3 || sending) return;
    setSending(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You need to be signed in — or email us at getbuddin@gmail.com.");
        setSending(false);
        return;
      }
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: message.trim(), page: 'feedback' }),
      });
      if (!res.ok) {
        setError("Couldn't send right now — try again, or email getbuddin@gmail.com.");
        setSending(false);
        return;
      }
      setSent(true);
    } catch (e) {
      console.error(e);
      setError("Couldn't send right now — try again, or email getbuddin@gmail.com.");
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.cream, fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💌</div>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", color: C.ink, fontWeight: 400, marginBottom: 8 }}>Thank you!</h2>
          <p style={{ color: C.stone, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            Your feedback was sent. Every message gets read — it genuinely shapes what gets built next.
          </p>
          <button onClick={() => setScreen("home")} style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color: "#fff", border: "none", borderRadius: 16, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Back home →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Cabinet Grotesk', sans-serif", background: C.cream }}>
      {/* Header */}
      <div style={{ padding: "max(14px, calc(env(safe-area-inset-top) + 10px)) 20px 14px", display: "flex", alignItems: "center", gap: 12, background: "rgba(245,236,220,0.85)", backdropFilter: "blur(22px)", borderBottom: "1px solid rgba(255,235,200,0.28)" }}>
        <button onClick={() => setScreen("home")} style={{ background: "transparent", border: "none", cursor: "pointer", color: avatarColor, padding: "4px 2px", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, margin: 0 }}>Feedback</p>
          <p style={{ color: C.stoneMid, fontSize: 11, margin: 0 }}>Tell us what to fix or build next</p>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "32px 24px 24px", maxWidth: 600, margin: "0 auto", width: "100%" }}>
        <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 400, color: C.ink, lineHeight: 1.6, marginBottom: 20, textAlign: "center" }}>
          Found a bug? Have an idea? Something feel off?
        </p>

        {error && (
          <div style={{ background: "#fee", border: "1px solid #fcc", borderRadius: 12, padding: "12px 16px", marginBottom: 14, color: "#c00", fontSize: 13 }}>
            {error}
          </div>
        )}

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value.slice(0, 2000))}
          placeholder="Write anything — short is fine..."
          style={{
            minHeight: 160,
            padding: "20px",
            border: `1.5px solid ${avatarColor}33`,
            borderRadius: 16,
            fontSize: 15,
            fontFamily: "inherit",
            background: "rgba(255,248,235,0.7)",
            color: C.ink,
            outline: "none",
            resize: "none",
            lineHeight: 1.7,
            boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6, padding: "0 4px" }}>
          <span style={{ fontSize: 10, color: C.stoneMid }}>{message.length}/2000</span>
        </div>

        <button
          onClick={handleSend}
          disabled={message.trim().length < 3 || sending}
          style={{
            width: "100%",
            padding: "16px",
            marginTop: 12,
            background: message.trim().length >= 3 ? `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)` : C.stoneLight,
            color: message.trim().length >= 3 ? "#fff" : C.stoneMid,
            border: "none",
            borderRadius: 16,
            fontSize: 15,
            fontWeight: 700,
            cursor: message.trim().length >= 3 ? "pointer" : "default",
            fontFamily: "inherit",
          }}
        >
          {sending ? "Sending..." : "Send feedback"}
        </button>

        <a href="mailto:getbuddin@gmail.com" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 18, color: C.stoneMid, fontSize: 13, textDecoration: "none" }}>
          <Mail size={14} strokeWidth={2} /> Prefer email? getbuddin@gmail.com
        </a>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 22 }}>
          <a href="https://www.youtube.com/channel/UClXPubvuKuWSYKkRwBqwo1Q" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: C.stone, fontSize: 13, textDecoration: "none", fontWeight: 600 }}>
            <YoutubeIcon size={16} /> @Getbuddin
          </a>
          <a href="https://www.instagram.com/getbuddin" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: C.stone, fontSize: 13, textDecoration: "none", fontWeight: 600 }}>
            <InstagramIcon size={16} /> getbuddin
          </a>
        </div>
      </div>
    </div>
  );
}
