import { useEffect, useRef, useState } from 'react'
import { navigate } from './SiteShell.jsx'
import { sendGuestMessage } from '../lib/guestChat.js'

const NUDGE_AFTER = 3 // user turns before the soft signup nudge

export default function GuestChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "hey, i'm buddin 👋 what's going on?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [turns, setTurns] = useState(0)
  const [nudge, setNudge] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) },
    [messages, loading, nudge])
  useEffect(() => { inputRef.current?.focus() }, [])

  async function send() {
    const content = input.trim()
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
        content: "that's all the free guest messages for today. sign up (free) to keep going — and i'll actually remember you next time."
      }])
      setNudge(true)
      return
    }
    if (result.error) {
      setMessages(m => [...m, {
        role: 'assistant',
        content: "hmm, lost the connection for a sec. want to try that again?"
      }])
      return
    }
    setMessages(m => [...m, { role: 'assistant', content: result.text }])
    if (nextTurns >= NUDGE_AFTER) setNudge(true)
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{
      minHeight: '100dvh', background: '#F5ECDC',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Georgia, "Times New Roman", serif'
    }}>
      <style>{`
        @keyframes guestFade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes guestBounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-4px); } }
        .gmsg { animation: guestFade 0.25s ease; }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
        background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e6d8c0', position: 'sticky', top: 0, zIndex: 10
      }}>
        <button onClick={() => navigate('/')} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 20,
          color: '#786858', padding: 4, lineHeight: 1
        }}>←</button>
        <img src="/imagebuddin.png" alt="" width={34} height={34} style={{ borderRadius: 8 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#2c2018' }}>Buddin</div>
          <div style={{ fontSize: 12, color: '#5fbf8f', fontWeight: 600 }}>● online</div>
        </div>
        <div style={{
          marginLeft: 'auto', fontSize: 12, color: '#a89888',
          background: 'rgba(0,0,0,0.05)', padding: '4px 10px', borderRadius: 10
        }}>
          guest mode
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
        maxWidth: 680, width: '100%', margin: '0 auto', boxSizing: 'border-box'
      }}>
        {messages.map((m, i) => (
          <div key={i} className="gmsg" style={{
            display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-end', gap: 8
          }}>
            {m.role === 'assistant' && (
              <img src="/imagebuddin.png" alt="" width={28} height={28}
                style={{ borderRadius: 7, flexShrink: 0 }} />
            )}
            <div style={{
              maxWidth: '76%', padding: '11px 15px',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.role === 'user' ? '#b87840' : '#fff',
              color: m.role === 'user' ? '#fff' : '#2c2018',
              fontSize: 15, lineHeight: 1.55, whiteSpace: 'pre-wrap',
              boxShadow: '0 1px 4px rgba(40,28,16,0.07)'
            }}>{m.content}</div>
          </div>
        ))}

        {loading && (
          <div className="gmsg" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/imagebuddin.png" alt="" width={28} height={28} style={{ borderRadius: 7 }} />
            <div style={{
              display: 'flex', gap: 5, padding: '11px 15px', background: '#fff',
              borderRadius: '18px 18px 18px 4px', boxShadow: '0 1px 4px rgba(40,28,16,0.07)'
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#c4b5a0',
                  display: 'block', animation: `guestBounce 1.2s ease-in-out ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
          </div>
        )}

        {nudge && (
          <div className="gmsg" style={{
            background: 'linear-gradient(135deg, #fff5e6, #fae8d4)',
            border: '1.5px solid #f0c8a0', borderRadius: 18, padding: 20,
            textAlign: 'center', margin: '8px 0'
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#2c2018', marginBottom: 6 }}>
              Save your conversation
            </div>
            <div style={{ fontSize: 14, color: '#5a4634', lineHeight: 1.5, marginBottom: 16 }}>
              Create a free account to keep chatting, never lose your history, and have
              Buddin remember you.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/login')} style={{
                background: '#b87840', color: '#fff', border: 'none', borderRadius: 12,
                padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit'
              }}>Sign up free</button>
              <button onClick={() => setNudge(false)} style={{
                background: 'transparent', color: '#786858', border: '1px solid #ddd0bc',
                borderRadius: 12, padding: '10px 18px', fontSize: 14, cursor: 'pointer',
                fontFamily: 'inherit'
              }}>Keep chatting</button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px', background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(10px)', borderTop: '1px solid #e6d8c0',
        position: 'sticky', bottom: 0
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="type something…"
            rows={1}
            style={{
              flex: 1, padding: '12px 16px', fontSize: 15, lineHeight: 1.5,
              background: '#fff', border: '1px solid #ddd0bc', borderRadius: 22,
              fontFamily: 'inherit', color: '#2c2018', resize: 'none',
              maxHeight: 120, overflowY: 'auto', outline: 'none'
            }}
          />
          <button onClick={send} disabled={!input.trim() || loading} style={{
            width: 46, height: 46, borderRadius: '50%',
            background: input.trim() && !loading ? '#b87840' : '#e0d0bc',
            border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#fff', flexShrink: 0
          }}>↑</button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#b8a890', marginTop: 6 }}>
          guest chats aren't saved ·{' '}
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/login')}>sign up to save</span>
        </div>
      </div>
    </div>
  )
}
