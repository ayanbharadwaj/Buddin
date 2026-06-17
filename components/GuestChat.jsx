import { useEffect, useRef, useState } from 'react'
import { navigate, Icon } from './SiteShell.jsx'
import { sendGuestMessage, loadGuest, saveGuest } from '../lib/guestChat.js'

const LIMIT = 5      // hard stop after 5 user messages
const REMIND_AT = 3  // gentle one-time nudge

const saved = loadGuest('try')

export default function GuestChat() {
  const [messages, setMessages] = useState(
    saved?.messages?.length ? saved.messages : [{ role: 'assistant', content: "hey, i'm buddin. what's going on?" }]
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [turns, setTurns] = useState(saved?.turns ?? 0)
  const [remind, setRemind] = useState(false)
  const [stopped, setStopped] = useState((saved?.turns ?? 0) >= LIMIT)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) },
    [messages, loading, remind, stopped])
  useEffect(() => { inputRef.current?.focus() }, [])

  async function send() {
    const content = input.trim()
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
      setMessages(m => [...m, { role: 'assistant', content: "hmm, lost the connection for a sec. want to try that again?" }])
      return
    }
    const finalMessages = [...convo, { role: 'assistant', content: result.text }]
    setMessages(finalMessages)
    saveGuest('try', nextTurns, finalMessages)

    if (nextTurns >= LIMIT) setTimeout(() => setStopped(true), 600)
    else if (nextTurns === REMIND_AT) setRemind(true)
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const remaining = Math.max(0, LIMIT - turns)

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(180deg, #F5ECDC, #efe1cb)',
      display: 'flex', flexDirection: 'column', fontFamily: 'Georgia, "Times New Roman", serif'
    }}>
      <style>{`
        @keyframes gFade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes gBounce { 0%,60%,100% { transform:translateY(0); } 30% { transform:translateY(-4px); } }
        .gmsg { animation: gFade 0.25s ease; }
      `}</style>

      {/* Distinct guest banner — makes it obviously a preview, not the real app */}
      <div style={{
        background: '#2c2018', color: '#f5ecdc', fontSize: 12.5, textAlign: 'center',
        padding: '7px 14px', letterSpacing: 0.2
      }}>
        You're in a free guest preview · {remaining} message{remaining === 1 ? '' : 's'} left ·{' '}
        <span style={{ textDecoration: 'underline', cursor: 'pointer' }}
          onClick={() => navigate('/login')}>sign up to save</span>
      </div>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e6d8c0', position: 'sticky', top: 0, zIndex: 10
      }}>
        <button onClick={() => navigate('/')} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: '#786858',
          padding: 4, display: 'flex'
        }} aria-label="Back"><Icon name="arrow" size={20} /></button>
        <img src="/imagebuddin.png" alt="" width={34} height={34} style={{ borderRadius: 8, transform: 'scaleX(-1)' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#2c2018' }}>Buddin</div>
          <div style={{ fontSize: 12, color: '#5fbf8f', fontWeight: 600 }}>guest preview</div>
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
              <img src="/imagebuddin.png" alt="" width={26} height={26} style={{ borderRadius: 7, flexShrink: 0 }} />
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
            <img src="/imagebuddin.png" alt="" width={26} height={26} style={{ borderRadius: 7 }} />
            <div style={{
              display: 'flex', gap: 5, padding: '11px 15px', background: '#fff',
              borderRadius: '18px 18px 18px 4px', boxShadow: '0 1px 4px rgba(40,28,16,0.07)'
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#c4b5a0',
                  display: 'block', animation: `gBounce 1.2s ease-in-out ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
          </div>
        )}

        {remind && !stopped && (
          <div className="gmsg" style={cardStyle}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#2c2018', marginBottom: 6 }}>
              Liking this so far?
            </div>
            <div style={{ fontSize: 14, color: '#5a4634', lineHeight: 1.5, marginBottom: 14 }}>
              You've got {remaining} preview message{remaining === 1 ? '' : 's'} left. Make a
              free account to keep going and have Buddin remember you.
            </div>
            <div style={cardBtns}>
              <button onClick={() => navigate('/login')} style={cardPrimary}>Sign up free</button>
              <button onClick={() => setRemind(false)} style={cardGhost}>Keep chatting</button>
            </div>
          </div>
        )}

        {stopped && (
          <div className="gmsg" style={cardStyle}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#2c2018', marginBottom: 6 }}>
              That's the end of the guest preview.
            </div>
            <div style={{ fontSize: 14, color: '#5a4634', lineHeight: 1.5, marginBottom: 14 }}>
              Create a free account to keep this conversation going, save your history, and
              have Buddin actually remember you next time.
            </div>
            <div style={cardBtns}>
              <button onClick={() => navigate('/login')} style={cardPrimary}>Sign up free</button>
              <button onClick={() => navigate('/')} style={cardGhost}>Back to home</button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input — hidden once the preview is used up */}
      {!stopped && (
        <div style={{
          padding: '12px 16px', background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(10px)', borderTop: '1px solid #e6d8c0',
          position: 'sticky', bottom: 0
        }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={onKey} placeholder="type something…" rows={1}
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
              color: '#fff', flexShrink: 0
            }} aria-label="Send"><Icon name="arrow" size={20} /></button>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: '#b8a890', marginTop: 6 }}>
            guest chats aren't saved · {remaining} of {LIMIT} messages left
          </div>
        </div>
      )}
    </div>
  )
}

const cardStyle = {
  background: 'linear-gradient(135deg, #fff5e6, #fae8d4)',
  border: '1.5px solid #f0c8a0', borderRadius: 18, padding: 20,
  textAlign: 'center', margin: '8px 0'
}
const cardBtns = { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }
const cardPrimary = {
  background: '#b87840', color: '#fff', border: 'none', borderRadius: 12,
  padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
}
const cardGhost = {
  background: 'transparent', color: '#786858', border: '1px solid #ddd0bc',
  borderRadius: 12, padding: '10px 18px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit'
}
