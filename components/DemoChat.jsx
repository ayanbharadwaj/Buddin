import { useEffect, useRef, useState } from 'react'
import { navigate } from './SiteShell.jsx'
import { sendGuestMessage } from '../lib/guestChat.js'

const STARTERS = [
  'I had a rough day at school',
  "I can't sleep",
  'My friend stopped texting me',
  'I feel like nobody gets it'
]

const NUDGE_AFTER = 3 // user turns

export default function DemoChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "hey, i'm buddin 👋 what's on your mind? pick something below or just type." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [turns, setTurns] = useState(0)
  const [nudge, setNudge] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, loading, nudge])

  async function send(text) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    setInput('')
    const convo = [...messages, { role: 'user', content }]
    setMessages(convo)
    const nextTurns = turns + 1
    setTurns(nextTurns)
    setLoading(true)

    const result = await sendGuestMessage(convo)
    setLoading(false)

    if (result.limitReached) {
      setMessages(m => [...m, {
        role: 'assistant',
        content: "you've used up your free guest messages for today — sign up (it's free) to keep going and i'll remember you next time."
      }])
      setNudge(true)
      return
    }
    if (result.error) {
      setMessages(m => [...m, {
        role: 'assistant',
        content: "hmm, i dropped the connection for a sec. mind trying that again?"
      }])
      return
    }
    setMessages(m => [...m, { role: 'assistant', content: result.text }])
    if (nextTurns >= NUDGE_AFTER) setTimeout(() => setNudge(true), 600)
  }

  const showStarters = turns === 0 && !loading

  return (
    <div style={{
      background: '#fff', borderRadius: 22, padding: 18,
      boxShadow: '0 12px 40px rgba(40,28,16,0.10)', border: '1px solid #ead8bb',
      display: 'flex', flexDirection: 'column', minHeight: 420
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 10, borderBottom: '1px dashed #ead8bb', marginBottom: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5fbf8f' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#2c2018' }}>
            Buddin · live · guest mode
          </span>
        </div>
        <button
          onClick={() => navigate('/try')}
          style={{
            background: 'transparent', border: 'none', color: '#b87840',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          Full screen ↗
        </button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', maxHeight: 320, paddingRight: 4 }}>
        {messages.map((m, i) => (
          <Bubble key={i} side={m.role === 'user' ? 'me' : 'them'}>{m.content}</Bubble>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
            <div style={{
              background: '#f5ecdc', padding: '10px 14px', borderRadius: 16,
              borderBottomLeftRadius: 4
            }}>
              <Dots />
            </div>
          </div>
        )}
      </div>

      {showStarters && (
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {STARTERS.map(s => (
            <button key={s} onClick={() => send(s)} style={starterBtn}>{s}</button>
          ))}
        </div>
      )}

      {nudge && (
        <div style={{
          marginTop: 12, padding: '14px 16px', background: '#fff5e6',
          border: '1px solid #f0c8a0', borderRadius: 12
        }}>
          <div style={{ color: '#2c2018', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
            Want Buddin to remember this?
          </div>
          <div style={{ color: '#5a4634', fontSize: 13, marginBottom: 10, lineHeight: 1.5 }}>
            Sign up free to save this conversation and pick up where you left off — Buddin
            gets more personal the more you talk.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/login')} style={ctaBtn}>Sign up free →</button>
            <button onClick={() => setNudge(false)} style={keepBtn}>Keep chatting</button>
          </div>
        </div>
      )}

      {!showStarters && !nudge && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={loading}
            placeholder="type back to buddin…"
            style={{
              flex: 1, padding: '11px 14px', borderRadius: 12,
              border: '1.5px solid #ddd0bc', background: '#fdf8f2',
              fontSize: 15, outline: 'none', fontFamily: 'inherit'
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              background: '#b87840', color: '#fff', border: 'none',
              padding: '0 18px', borderRadius: 12, fontWeight: 700, cursor: 'pointer',
              opacity: loading || !input.trim() ? 0.5 : 1, fontFamily: 'inherit'
            }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}

function Bubble({ side, children }) {
  const me = side === 'me'
  return (
    <div style={{
      display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', marginBottom: 10
    }}>
      <div style={{
        background: me ? '#b87840' : '#f5ecdc',
        color: me ? 'white' : '#2c2018',
        padding: '10px 14px', borderRadius: 16,
        borderBottomRightRadius: me ? 4 : 16,
        borderBottomLeftRadius: me ? 16 : 4,
        maxWidth: '82%', fontSize: 15, lineHeight: 1.45, whiteSpace: 'pre-wrap'
      }}>{children}</div>
    </div>
  )
}

function Dots() {
  return (
    <span aria-label="typing" style={{ display: 'inline-flex', gap: 4 }}>
      <Dot delay={0} /><Dot delay={0.15} /><Dot delay={0.3} />
      <style>{`
        @keyframes buddinDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </span>
  )
}
function Dot({ delay }) {
  return (
    <span style={{
      width: 6, height: 6, borderRadius: '50%', background: '#a89888',
      display: 'inline-block', animation: `buddinDot 1.1s ${delay}s infinite ease-in-out`
    }} />
  )
}

const starterBtn = {
  textAlign: 'left', background: '#fdf8f2', border: '1.5px solid #ead8bb',
  padding: '11px 14px', borderRadius: 12, fontSize: 14, cursor: 'pointer',
  color: '#2c2018', fontFamily: 'inherit'
}
const ctaBtn = {
  background: '#b87840', color: 'white', border: 'none',
  padding: '10px 18px', borderRadius: 10, fontSize: 14, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit'
}
const keepBtn = {
  background: 'transparent', color: '#786858', border: '1px solid #ddd0bc',
  padding: '10px 16px', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit'
}
