import { PageShell, navigate } from './SiteShell.jsx'

// Unknown URLs previously fell through to the host's raw error page — a grey
// wall with Vercel's branding on it, which is a bad thing for a judge to hit
// from a mistyped link. This keeps people inside the site and points them
// somewhere useful instead of apologising at them.
const C = {
  cream: '#F5ECDC',
  ink: '#2c2018',
  stone: '#786858',
  stoneMid: '#a89888',
  stoneLight: '#ddd0bc',
  clay: '#b87840',
}

const DESTINATIONS = [
  { to: '/try',   title: 'Try the chat',  desc: 'No account, no signup. Just start talking.' },
  { to: '/',      title: 'Home',          desc: 'What GetBuddin is and who it is for.' },
  { to: '/about', title: 'About',         desc: 'Why a high-schooler built this.' },
  { to: '/blog',  title: 'Blog',          desc: 'Writing on loneliness, focus and screens.' },
]

export default function NotFound() {
  return (
    <PageShell>
      <div style={{
        maxWidth: 680, margin: '0 auto', padding: '56px 28px 0',
        fontFamily: "'Cabinet Grotesk', system-ui, sans-serif", color: C.ink,
      }}>
        <div style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 'clamp(54px, 9vw, 84px)', lineHeight: 1,
          color: C.clay, opacity: 0.35, letterSpacing: -2, marginBottom: 10,
        }}>
          404
        </div>

        <h1 style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 'clamp(26px, 4vw, 36px)', lineHeight: 1.2,
          margin: '0 0 12px', letterSpacing: -0.6, fontWeight: 400,
        }}>
          There's nothing at this address.
        </h1>

        <p style={{ fontSize: 16, lineHeight: 1.7, color: C.stone, margin: '0 0 32px', maxWidth: 480 }}>
          Either the link was wrong or something moved. Not your fault either way —
          here's where people usually want to go.
        </p>

        <div style={{ display: 'grid', gap: 10, marginBottom: 36 }}>
          {DESTINATIONS.map(d => (
            <button
              key={d.to}
              onClick={() => navigate(d.to)}
              style={{
                width: '100%', textAlign: 'left', cursor: 'pointer',
                background: 'rgba(255,248,235,0.72)',
                border: `1.5px solid ${C.stoneLight}`,
                borderRadius: 16, padding: '15px 18px',
                fontFamily: 'inherit', color: C.ink,
                transition: 'border-color 0.15s ease, transform 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = C.clay
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.stoneLight
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span style={{ display: 'block', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                {d.title}
              </span>
              <span style={{ display: 'block', fontSize: 13.5, color: C.stone }}>
                {d.desc}
              </span>
            </button>
          ))}
        </div>

        <p style={{ fontSize: 13, color: C.stoneMid, lineHeight: 1.6 }}>
          If you followed a link from somewhere and it's broken, tell me at{' '}
          <a href="mailto:getbuddin@gmail.com" style={{ color: C.clay, textDecoration: 'underline' }}>
            getbuddin@gmail.com
          </a>{' '}
          and I'll fix it.
        </p>

        <div style={{ height: 56 }} />
      </div>
    </PageShell>
  )
}
