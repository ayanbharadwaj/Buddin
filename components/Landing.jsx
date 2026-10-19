import { useEffect, useRef, useState } from 'react'
import { PageShell, navigate, Icon, EMAIL } from './SiteShell.jsx'
import DemoChat from './DemoChat.jsx'

// Real on-scroll reveal. Fades + lifts content as it enters the viewport.
function Reveal({ children, delay = 0, style }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); obs.disconnect() }
    }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: shown ? 1 : 0,
      transform: shown ? 'none' : 'translateY(22px)',
      transition: `opacity 0.7s ${delay}s cubic-bezier(0.2,0.7,0.2,1), transform 0.7s ${delay}s cubic-bezier(0.2,0.7,0.2,1)`,
      ...style
    }}>{children}</div>
  )
}

export default function Landing() {
  return (
    <PageShell>
      {/* Hero */}
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '36px 36px 16px' }}>
        <div className="landing-hero" style={{
          display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 52, alignItems: 'center'
        }}>
          <Reveal>
            <div style={{
              display: 'inline-block', background: '#fff', color: '#a85a18',
              padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              border: '1px solid #ead8bb', marginBottom: 20
            }}>
              Built by a student
            </div>
            <h1 style={{
              fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.08, margin: '0 0 20px',
              color: '#2c2018', letterSpacing: -1.2
            }}>
              More connected than ever —
              <span style={{ color: '#b87840' }}> and lonelier than ever.</span>
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.55, color: '#46382c', maxWidth: 520, margin: '0 0 30px' }}>
              GetBuddin is a quiet, private place to think out loud — a friend that's
              there when school, family, or your own head feel like too much.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
              <button onClick={() => navigate('/try')} style={primaryBtn}>
                Start talking — no signup <Icon name="arrow" size={18} />
              </button>
              <button onClick={() => navigate('/about')} style={ghostBtn}>
                Why this exists
              </button>
            </div>
            <div style={{ fontSize: 13.5, color: '#786858' }}>
              No social feed. No algorithm. Try it for real — the live preview is right here.
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <DemoChat />
          </Reveal>
        </div>
      </section>

      {/* One understated credibility line (single use of the stat) */}
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '40px 36px 0' }}>
        <Reveal>
          <div style={{
            background: '#fff', border: '1px solid #ead8bb', borderRadius: 18,
            padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 18,
            flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center'
          }}>
            <span style={{ fontSize: 15, color: '#46382c', lineHeight: 1.5 }}>
              In 2025, nearly half of US teens said social media is making people their
              age worse off
              <span style={{ color: '#a89888' }}> (Pew Research)</span>. GetBuddin is one
              teenager's attempt at something better.
            </span>
          </div>
        </Reveal>
      </section>

      {/* What GetBuddin is — 3 cards, line icons */}
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '64px 36px 0' }}>
        <Reveal><h2 style={sectionH2}>What GetBuddin is</h2></Reveal>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18
        }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div style={card}>
                <div style={iconWrap}><Icon name={f.icon} size={24} /></div>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#2c2018', margin: '14px 0 6px' }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.55, color: '#5a4634' }}>{f.body}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Founder note — first person, short */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: '72px 36px 0' }}>
        <Reveal>
          <div style={{
            background: '#fff', borderRadius: 20, padding: '34px 32px',
            border: '1px solid #ead8bb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 18, flexWrap: 'wrap' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', background: '#b87840',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700
              }}>A</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: '#2c2018' }}>Ayan Bharadwaj</div>
                <div style={{ color: '#786858', fontSize: 14 }}>Founder · South Forsyth High School · Cumming, GA</div>
              </div>
            </div>
            <p style={{ fontSize: 17.5, lineHeight: 1.62, color: '#3a2d22', margin: 0 }}>
              "I found myself going down a rabbit hole of doom-scrolling every night and
              feeling lonelier for it. GetBuddin is what I wish I'd had back then — somewhere
              quiet to think out loud, that actually listens and doesn't perform for an
              audience."
            </p>
            <div style={{ marginTop: 20 }}>
              <button onClick={() => navigate('/about')} style={ghostBtn}>
                Read the full story
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: '72px 36px 0' }}>
        <Reveal><h2 style={sectionH2}>Questions people ask</h2></Reveal>
        <div style={{ display: 'grid', gap: 12 }}>
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.05}>
              <Faq q={f.q}>{f.a}</Faq>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '72px 36px 0' }}>
        <Reveal>
          <div style={{
            background: 'linear-gradient(135deg, #b87840, #d49460)',
            borderRadius: 24, padding: '48px 32px', textAlign: 'center', color: 'white'
          }}>
            <h2 style={{ fontSize: 32, margin: '0 0 10px', letterSpacing: -0.6 }}>
              Try GetBuddin tonight.
            </h2>
            <p style={{ fontSize: 17, opacity: 0.92, margin: '0 0 24px' }}>
              Free. No signup to start. No feed, no algorithm, no audience.
            </p>
            <button onClick={() => navigate('/try')} style={{
              background: 'white', color: '#b87840', border: 'none',
              padding: '15px 30px', borderRadius: 13, fontSize: 16, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex',
              alignItems: 'center', gap: 8
            }}>
              Start talking <Icon name="arrow" size={18} />
            </button>
          </div>
        </Reveal>
      </section>

      <style>{`
        @media (max-width: 860px) {
          .landing-hero { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </PageShell>
  )
}

const FEATURES = [
  { icon: 'chat', title: 'A companion, not a therapist', body: "GetBuddin listens and asks real questions. It's not a counselor or a crisis line — it's the friend you wish you could text at 1 AM." },
  { icon: 'brain', title: 'It gets to know you', body: 'Answer a few quick things in Know Me — this or that, a word, a short piece of writing — and GetBuddin builds a lasting picture of how you think, saved to your account rather than a browser.' },
  { icon: 'lock', title: 'Private by design', body: 'No social feed. No likes. No followers. Nothing you say gets posted, ranked, or shown to anyone else.' },
]

const FAQS = [
  { q: 'Is GetBuddin a replacement for therapy?', a: "No. GetBuddin is a conversational companion — somewhere between a journal and a friend. If you're in crisis or working through something serious, please reach out to a counselor or a trusted adult. If you need someone right now: call or text 988 (Suicide & Crisis Lifeline), or text HOME to 741741 (Crisis Text Line). Both are free, 24/7, and confidential." },
  { q: 'What does GetBuddin do with what I say?', a: 'Your conversations stay between you and GetBuddin — never shared, posted, or sold, and there’s no social feed. The profile GetBuddin builds comes from what you choose to answer in Know Me, not from reading your chats back later.' },
  { q: 'Who built this?', a: 'I did — Ayan Bharadwaj, a sophomore at South Forsyth High School in Cumming, Georgia. I found myself doom-scrolling into a worse mood every night and wanted to build the opposite of that.' },
  { q: 'Is it free?', a: 'Yes — the core experience is free, and you can start without even making an account.' },
  { q: "I'm a school counselor — can I share this?", a: <>Please do. GetBuddin is meant to <em>support</em> the work counselors already do, not replace it. Reach out at {EMAIL} for a counselor-friendly overview.</> },
]

function Faq({ q, children }) {
  return (
    <details style={{ background: 'white', borderRadius: 14, padding: '16px 20px', border: '1px solid #ead8bb' }}>
      <summary style={{
        cursor: 'pointer', fontWeight: 700, color: '#2c2018', fontSize: 16.5,
        listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span>{q}</span>
        <span style={{ color: '#b87840', fontWeight: 700, fontSize: 20 }}>+</span>
      </summary>
      <div style={{ marginTop: 12, color: '#5a4634', lineHeight: 1.62, fontSize: 15.5 }}>{children}</div>
    </details>
  )
}

const sectionH2 = { fontSize: 30, color: '#2c2018', margin: '0 0 24px', letterSpacing: -0.6 }
const card = {
  background: 'white', borderRadius: 18, padding: '24px 22px',
  border: '1px solid #ead8bb', height: '100%'
}
const iconWrap = {
  width: 46, height: 46, borderRadius: 13, background: '#f7ede0', color: '#b87840',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
}
const primaryBtn = {
  background: '#b87840', color: 'white', border: 'none',
  padding: '14px 24px', borderRadius: 13, fontSize: 16, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8,
  boxShadow: '0 6px 18px rgba(184,120,64,0.28)'
}
const ghostBtn = {
  background: 'transparent', color: '#b87840', border: '1.5px solid #b87840',
  padding: '13px 22px', borderRadius: 13, fontSize: 15, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit'
}
