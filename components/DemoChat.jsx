import { useEffect, useRef, useState } from 'react'
import { navigate, Icon } from './SiteShell.jsx'
import { sendGuestMessage, loadGuest, saveGuest } from '../lib/guestChat.js'

const STARTERS = [
  'I had a rough day at school',
  "I can't sleep",
  'My friend stopped texting me',
  'I feel like nobody gets it'
]

const LIMIT = 3 // hard stop after 3 user messages in the inline demo

const saved = loadGuest('demo')

export default function DemoChat() {
  const [messages, setMessages] = useState(
    saved?.messages?.length ? saved.messages : [{ role: 'assistant', content: "hey, i'm buddin. what's on your mind? pick something below or just type." }]
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [turns, setTurns] = useState(saved?.turns ?? 0)
  const [stopped, setStopped] = useState((saved?.turns ?? 0) >= LIMIT)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, loading, stopped])

  async function send(text) {
    const content = (text ?? input).trim()
    if (!content || loading || stopped) return
    setInput('')
    const convo = [...messages, { role: 'user', content }]
    setMessages(convo)
    const nextTurns = turns + 1
    setTurns(nextTurns)
    setLoading(true)

    const result = await sendGuestMessage(convo)
    setLoading(false)

    if (result.limitReached) { setStopped(true); return }
    if (result.error) {
      setMessages(m => [...m, { role: 'assistant', content: "hmm, i dropped the connection for a sec. mind trying again?" }])
      return
    }
    const finalMessages = [...convo, { role: 'assistant', content: result.text }]
    setMessages(finalMessages)
    saveGuest('demo', nextTurns, finalMessages)
    if (nextTurns >= LIMIT) setTimeout(() => setStopped(true), 700)
  }

  const showStarters = turns === 0 && !loading && !stopped

  return (
    <div style={{
      background: '#fff', borderRadius: 22, padding: 18,
      boxShadow: '0 14px 44px rgba(40,28,16,0.12)', border: '1px solid #ead8bb',
      display: 'flex', flexDirection: 'column', minHeight: 420
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 10, borderBottom: '1px dashed #ead8bb', marginBottom: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5fbf8f' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#2c2018' }}>Buddin · live preview</span>
        </div>
        <button onClick={() => navigate('/try')} style={{
          background: 'transparent', border: 'none', color: '#b87840',
          fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', gap: 4
        }}>
          Full screen <Icon name="arrow" size={14} />
        </button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', maxHeight: 320, paddingRight: 4 }}>
        {messages.map((m, i) => (
          <Bubble key={i} side={m.role === 'user' ? 'me' : 'them'}>{m.content}</Bubble>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
            <div style={{ background: '#f5ecdc', padding: '10px 14px', borderRadius: 16, borderBottomLeftRadius: 4 }}>
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

      {stopped && (
        <div style={{
          marginTop: 12, padding: '16px 18px', background: '#fff5e6',
          border: '1px solid #f0c8a0', borderRadius: 14, textAlign: 'center'
        }}>
          <div style={{ color: '#2c2018', fontWeight: 700, marginBottom: 6, fontSize: 15 }}>
            That's the preview.
          </div>
          <div style={{ color: '#5a4634', fontSize: 13.5, marginBottom: 12, lineHeight: 1.5 }}>
            Keep this conversation going — and have Buddin actually remember you — by starting
            for real. It's free.
          </div>
          <button onClick={() => navigate('/try')} style={ctaBtn}>
            Keep talking <Icon name="arrow" size={16} />
          </button>
        </div>
      )}

      {!showStarters && !stopped && (
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
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{
            background: '#b87840', color: '#fff', border: 'none',
            padding: '0 18px', borderRadius: 12, fontWeight: 700, cursor: 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1, fontFamily: 'inherit'
          }}>Send</button>
        </div>
      )}
    </div>
  )
}

function Bubble({ side, children }) {
  const me = side === 'me'
  return (
    <div style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      <div style={{
        background: me ? '#b87840' : '#f5ecdc', color: me ? 'white' : '#2c2018',
        padding: '10px 14px', borderRadius: 16,
        borderBottomRightRadius: me ? 4 : 16, borderBottomLeftRadius: me ? 16 : 4,
        maxWidth: '82%', fontSize: 15, lineHeight: 1.45, whiteSpace: 'pre-wrap'
      }}>{children}</div>
    </div>
  )
}

function Dots() {
  return (
    <span aria-label="typing" style={{ display: 'inline-flex', gap: 4 }}>
      <Dot delay={0} /><Dot delay={0.15} /><Dot delay={0.3} />
      <style>{`@keyframes buddinDot { 0%,60%,100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-4px); opacity: 1; } }`}</style>
    </span>
  )
}
function Dot({ delay }) {
  return <span style={{
    width: 6, height: 6, borderRadius: '50%', background: '#a89888',
    display: 'inline-block', animation: `buddinDot 1.1s ${delay}s infinite ease-in-out`
  }} />
}

const starterBtn = {
  textAlign: 'left', background: '#fdf8f2', border: '1.5px solid #ead8bb',
  padding: '11px 14px', borderRadius: 12, fontSize: 14, cursor: 'pointer',
  color: '#2c2018', fontFamily: 'inherit'
}
const ctaBtn = {
  background: '#b87840', color: 'white', border: 'none',
  padding: '10px 20px', borderRadius: 11, fontSize: 14, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6
}
