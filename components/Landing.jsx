import { PageShell, navigate } from './SiteShell.jsx'
import DemoChat from './DemoChat.jsx'

// Real user quotes only. Leave the array empty until you have real ones.
// Schema: { quote, attribution } — e.g. { quote: "...", attribution: "10th grader, GA" }
const TESTIMONIALS = []
// Press / mentions. Same rule — only fill in real ones.
// Schema: { outlet, quote, url }
const PRESS = []

export default function Landing() {
  return (
    <PageShell>
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 28px 24px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'center'
        }} className="landing-hero">
          <div>
            <div style={{
              display: 'inline-block', background: '#fff5e6', color: '#a85a18',
              padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              border: '1px solid #f0c8a0', marginBottom: 18
            }}>
              For teens · Free · Built by a student
            </div>
            <h1 style={{
              fontSize: 'clamp(34px, 5vw, 54px)', lineHeight: 1.1, margin: '0 0 18px',
              color: '#2c2018', letterSpacing: -1
            }}>
              Teens are more connected than ever —
              <span style={{ color: '#b87840' }}> and lonelier than ever.</span>
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.5, color: '#46382c', maxWidth: 560, margin: '0 0 28px' }}>
              Buddin is the friend that's always there — a quiet, judgment-free
              place to think out loud when school, family, or your own head feel
              like too much.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <button onClick={() => navigate('/try')} style={primaryBtn}>
                Start talking — no signup
              </button>
              <button onClick={() => navigate('/about')} style={ghostBtn}>
                Why this exists →
              </button>
            </div>
            <div style={{ fontSize: 13, color: '#786858' }}>
              No credit card. No social feed. Talk to Buddin for real on the right — no signup needed.
            </div>
          </div>

          <DemoChat />
        </div>
      </section>

      <section style={{
        maxWidth: 1120, margin: '0 auto', padding: '60px 28px 0'
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 18
        }}>
          <Stat big="48%" label="of US teens say social media harms people their age" sub="Pew Research, 2025" />
          <Stat big="↑ from 32%" label="just three years earlier (2022)" sub="Pew Research" />
          <Stat big="44%" label="of teens have already tried to cut back" sub="Pew Research, 2025" />
          <Stat big="24 / 7" label="Buddin is awake when the group chat isn't" sub="and won't screenshot you" />
        </div>
        <div style={{ fontSize: 12, color: '#a89888', marginTop: 12, textAlign: 'center' }}>
          Sources: Pew Research Center,{' '}
          <a href="https://www.pewresearch.org/" target="_blank" rel="noreferrer"
             style={{ color: '#a89888' }}>
            pewresearch.org
          </a>
        </div>
      </section>

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 28px 0' }}>
        <h2 style={sectionH2}>What Buddin is — and isn't</h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18
        }}>
          <FeatureCard
            icon="🌱"
            title="A companion, not a therapist"
            body="Buddin listens, asks good questions, and helps you think. It's not a replacement for a counselor or crisis line — it's the friend you wish you could text at 1 AM."
          />
          <FeatureCard
            icon="🧠"
            title="It actually remembers you"
            body="Buddin builds a quiet picture of who you are over time, so conversations get more personal — not more generic — the longer you use it."
          />
          <FeatureCard
            icon="🤐"
            title="Private by design"
            body="No social feed. No likes. No followers. Nothing you say gets posted, ranked, or shown to anyone else."
          />
          <FeatureCard
            icon="🎓"
            title="Built for students"
            body="By a high schooler, for high schoolers. The teen mental health crisis isn't an abstract topic here — it's the reason this exists."
          />
        </div>
      </section>

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '64px 28px 0' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14
        }}>
          <TrustBadge icon="🎒" title="Built by a student" sub="High schooler in Georgia" />
          <TrustBadge icon="💸" title="Free, always" sub="No paywall, no upsell" />
          <TrustBadge icon="🤐" title="Private by design" sub="No social feed, no algorithm" />
          <TrustBadge icon="🆘" title="Honest about limits" sub="Crisis resources on every page" />
        </div>
      </section>

      {(TESTIMONIALS.length > 0 || PRESS.length > 0) && (
        <section style={{ maxWidth: 1120, margin: '0 auto', padding: '64px 28px 0' }}>
          <h2 style={sectionH2}>What people are saying</h2>
          {TESTIMONIALS.length > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 18, marginBottom: PRESS.length > 0 ? 24 : 0
            }}>
              {TESTIMONIALS.map((t, i) => (
                <blockquote key={i} style={{
                  background: 'white', borderRadius: 16, padding: '22px 22px',
                  border: '1px solid #ead8bb', margin: 0
                }}>
                  <div style={{ fontSize: 16, color: '#2c2018', lineHeight: 1.55, marginBottom: 12 }}>
                    “{t.quote}”
                  </div>
                  <div style={{ fontSize: 13, color: '#786858' }}>— {t.attribution}</div>
                </blockquote>
              ))}
            </div>
          )}
          {PRESS.length > 0 && (
            <div style={{
              display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
              justifyContent: 'center', paddingTop: 8
            }}>
              <span style={{ color: '#786858', fontSize: 13 }}>As seen in:</span>
              {PRESS.map((p, i) => (
                <a key={i} href={p.url} target="_blank" rel="noreferrer"
                   style={{ color: '#5a4634', textDecoration: 'none', fontWeight: 600 }}>
                  {p.outlet}
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      <section style={{ maxWidth: 880, margin: '0 auto', padding: '80px 28px 0' }}>
        <div style={{
          background: '#fff', borderRadius: 20, padding: '36px 32px',
          border: '1px solid #ead8bb', boxShadow: '0 8px 28px rgba(40,28,16,0.06)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#b87840',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700
            }}>A</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#2c2018' }}>
                Ayan Bharadwaj
              </div>
              <div style={{ color: '#786858', fontSize: 14 }}>
                Founder · 9th grader · South Forsyth High
              </div>
            </div>
          </div>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: '#3a2d22', margin: 0 }}>
            "I'm a student, not a startup. I built Buddin because I watched my own friends
            scroll themselves into a worse mood every night — and the apps that were supposed
            to help felt like another version of the problem. Buddin is what I wish existed:
            something quiet, that listens, and that doesn't try to perform for an audience."
          </p>
          <div style={{ marginTop: 20 }}>
            <button onClick={() => navigate('/about')} style={ghostBtn}>
              Read the full story →
            </button>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 28px 0' }}>
        <h2 style={sectionH2}>FAQ — what parents, teens, and counselors ask</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <Faq q="Is Buddin a replacement for therapy?">
            No. Buddin is a conversational companion — somewhere between a journal and a
            friend. If you're in crisis or working through something serious, please reach
            out to a counselor, trusted adult, or the resources in the footer.
          </Faq>
          <Faq q="What does Buddin do with what I say?">
            Conversations are used to make Buddin remember <em>you</em> better over time.
            They aren't shared, posted, or sold. Buddin has no social feed.
          </Faq>
          <Faq q="Who built this?">
            Ayan Bharadwaj — a high school student in Georgia who got tired of watching
            friends feel worse the more "connected" they got. Read more on the{' '}
            <a href="/about" onClick={e => { e.preventDefault(); navigate('/about') }}
               style={faqLink}>About page</a>.
          </Faq>
          <Faq q="Is it free?">
            Yes — the core experience is free. Buddin is a student project, not a
            subscription trap.
          </Faq>
          <Faq q="I'm a school counselor — can I share this with students?">
            Please do. Buddin is designed to <em>support</em>, not replace, the work
            counselors already do. Reach out at hello@getbuddin.org for a counselor-friendly
            overview.
          </Faq>
        </div>
      </section>

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 28px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, #b87840, #d49460)',
          borderRadius: 22, padding: '44px 32px', textAlign: 'center', color: 'white'
        }}>
          <h2 style={{ fontSize: 32, margin: '0 0 10px', letterSpacing: -0.5 }}>
            Try Buddin tonight.
          </h2>
          <p style={{ fontSize: 17, opacity: 0.92, margin: '0 0 22px' }}>
            Free. No signup to start. No social feed, no algorithm, no audience.
          </p>
          <button
            onClick={() => navigate('/try')}
            style={{
              background: 'white', color: '#b87840', border: 'none',
              padding: '14px 28px', borderRadius: 12, fontSize: 16, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            Start talking — no signup →
          </button>
        </div>
      </section>

      <style>{`
        @media (max-width: 820px) {
          .landing-hero { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </PageShell>
  )
}

function TrustBadge({ icon, title, sub }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '14px 16px',
      border: '1px solid #ead8bb', display: 'flex', alignItems: 'center', gap: 12
    }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 700, color: '#2c2018', fontSize: 14 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#786858' }}>{sub}</div>
      </div>
    </div>
  )
}

function Stat({ big, label, sub }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '20px 18px',
      border: '1px solid #ead8bb', boxShadow: '0 4px 16px rgba(40,28,16,0.04)'
    }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#b87840', letterSpacing: -0.5 }}>
        {big}
      </div>
      <div style={{ fontSize: 14, color: '#2c2018', marginTop: 6, lineHeight: 1.4 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: '#a89888', marginTop: 6 }}>{sub}</div>
    </div>
  )
}

function FeatureCard({ icon, title, body }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '22px 20px',
      border: '1px solid #ead8bb', boxShadow: '0 4px 16px rgba(40,28,16,0.04)'
    }}>
      <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 17, color: '#2c2018', marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.5, color: '#5a4634' }}>{body}</div>
    </div>
  )
}

function Faq({ q, children }) {
  return (
    <details style={{
      background: 'white', borderRadius: 12, padding: '14px 18px',
      border: '1px solid #ead8bb'
    }}>
      <summary style={{
        cursor: 'pointer', fontWeight: 700, color: '#2c2018', fontSize: 16,
        listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span>{q}</span>
        <span style={{ color: '#b87840', fontWeight: 700 }}>+</span>
      </summary>
      <div style={{ marginTop: 10, color: '#5a4634', lineHeight: 1.6, fontSize: 15 }}>
        {children}
      </div>
    </details>
  )
}

const sectionH2 = {
  fontSize: 28, color: '#2c2018', margin: '0 0 22px', letterSpacing: -0.5
}

const primaryBtn = {
  background: '#b87840', color: 'white', border: 'none',
  padding: '14px 22px', borderRadius: 12, fontSize: 16, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit'
}

const ghostBtn = {
  background: 'transparent', color: '#b87840', border: '1.5px solid #b87840',
  padding: '13px 20px', borderRadius: 12, fontSize: 15, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit'
}

const faqLink = { color: '#b87840', fontWeight: 600 }
