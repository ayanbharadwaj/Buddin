import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export const EMAIL = 'getbuddin@gmail.com'

export function navigate(path) {
  if (window.location.pathname === path) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  window.history.pushState({}, '', path)
  window.scrollTo(0, 0)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function usePath() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}

/* ── Sleek inline line icons (no emoji) ─────────────────────────── */
const ic = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }
export function Icon({ name, size = 22 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', ...ic }
  switch (name) {
    case 'chat': return <svg {...p}><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20l1.3-3.6A8.4 8.4 0 1 1 21 11.5Z" /></svg>
    case 'brain': return <svg {...p}><path d="M9 4a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 5 11a2.5 2.5 0 0 0 1.5 4.5A2.5 2.5 0 0 0 9 19a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" /><path d="M15 4a2.5 2.5 0 0 1 2.5 2.5A2.5 2.5 0 0 1 19 11a2.5 2.5 0 0 1-1.5 4.5A2.5 2.5 0 0 1 15 19a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /></svg>
    case 'lock': return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
    case 'moon': return <svg {...p}><path d="M20 14.5A7.5 7.5 0 1 1 9.5 4a6 6 0 0 0 10.5 10.5Z" /></svg>
    case 'leaf': return <svg {...p}><path d="M5 19c0-8 6-13 14-13 0 8-5 14-13 14" /><path d="M5 19c2-4 5-6 9-7" /></svg>
    case 'arrow': return <svg {...p}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
    case 'mail': return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
    case 'shield': return <svg {...p}><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" /></svg>
    default: return null
  }
}

/* ── Nav with sliding underline ─────────────────────────────────── */
const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/blog', label: 'Blog' },
]

function activeIndex(path) {
  if (path === '/') return 0
  if (path === '/about') return 1
  if (path.startsWith('/blog')) return 2
  return -1
}

export function SiteNav() {
  const path = usePath()
  const idx = activeIndex(path)
  const wrapRef = useRef(null)
  const linkRefs = useRef([])
  const [underline, setUnderline] = useState({ left: 0, width: 0, opacity: 0 })

  useLayoutEffect(() => {
    const el = linkRefs.current[idx]
    const wrap = wrapRef.current
    if (el && wrap) {
      const a = el.getBoundingClientRect()
      const b = wrap.getBoundingClientRect()
      setUnderline({ left: a.left - b.left, width: a.width, opacity: 1 })
    } else {
      setUnderline(u => ({ ...u, opacity: 0 }))
    }
  }, [idx, path])

  return (
    <header style={{
      borderBottom: '1px solid #ece1cd',
      background: 'rgba(245,236,220,0.82)', backdropFilter: 'blur(10px)',
      position: 'sticky', top: 0, zIndex: 100
    }}>
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 36px', maxWidth: 1160, margin: '0 auto', flexWrap: 'wrap', gap: 18
    }}>
      <a href="/" onClick={e => { e.preventDefault(); navigate('/') }}
        style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
        <img src="/imagebuddin.png" alt="" width={38} height={38} style={{ borderRadius: 9 }} />
        <span style={{ fontSize: 24, fontWeight: 700, color: '#2c2018', letterSpacing: -0.5 }}>
          Buddin
        </span>
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
        <div ref={wrapRef} style={{ position: 'relative', display: 'flex', gap: 30 }}>
          {NAV_ITEMS.map((item, i) => {
            const active = i === idx
            return (
              <a key={item.to} ref={el => (linkRefs.current[i] = el)}
                href={item.to}
                onClick={e => { e.preventDefault(); navigate(item.to) }}
                style={{
                  color: active ? '#2c2018' : '#6a5848', textDecoration: 'none',
                  fontWeight: active ? 700 : 500, fontSize: 16, padding: '4px 0',
                  transition: 'color 0.2s'
                }}>
                {item.label}
              </a>
            )
          })}
          <span style={{
            position: 'absolute', bottom: -4, height: 2.5, borderRadius: 2,
            background: '#b87840', left: underline.left, width: underline.width,
            opacity: underline.opacity,
            transition: 'left 0.32s cubic-bezier(0.4,0,0.2,1), width 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.2s'
          }} />
        </div>

        <a href="/login" onClick={e => { e.preventDefault(); navigate('/login') }}
          style={{ color: '#6a5848', textDecoration: 'none', fontWeight: 500, fontSize: 16 }}>
          Sign in
        </a>
        <a href="/try" onClick={e => { e.preventDefault(); navigate('/try') }}
          style={{
            background: '#b87840', color: 'white', padding: '12px 22px',
            borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 15,
            display: 'inline-flex', alignItems: 'center', gap: 7,
            boxShadow: '0 4px 14px rgba(184,120,64,0.25)'
          }}>
          Start talking <Icon name="arrow" size={17} />
        </a>
      </div>
    </nav>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid #e6d8c0', marginTop: 90, background: '#efe3cf' }}>
      <div style={{
        maxWidth: 1160, margin: '0 auto', padding: '32px 36px',
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap',
        gap: 16, fontSize: 14, color: '#786858', alignItems: 'center'
      }}>
        <div>© {new Date().getFullYear()} Buddin · Built by Ayan Bharadwaj</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <a href="/about" onClick={e => { e.preventDefault(); navigate('/about') }} style={footerLink}>About</a>
          <a href="/blog" onClick={e => { e.preventDefault(); navigate('/blog') }} style={footerLink}>Blog</a>
          <a href="/privacy" onClick={e => { e.preventDefault(); navigate('/privacy') }} style={footerLink}>Privacy</a>
          <a href="/terms" onClick={e => { e.preventDefault(); navigate('/terms') }} style={footerLink}>Terms</a>
          <a href="/login" onClick={e => { e.preventDefault(); navigate('/login') }} style={footerLink}>Sign in</a>
          <a href={`mailto:${EMAIL}`} style={footerLink}>{EMAIL}</a>
        </div>
      </div>
    </footer>
  )
}

const footerLink = { color: '#5a4634', textDecoration: 'none' }

export function PageShell({ children }) {
  const path = usePath()

  // Always land at the top when the route changes.
  useEffect(() => { window.scrollTo(0, 0) }, [path])

  return (
    <div style={{
      minHeight: '100vh', background: '#F5ECDC',
      fontFamily: 'Georgia, "Times New Roman", serif', color: '#2c2018',
      display: 'flex', flexDirection: 'column'
    }}>
      <style>{`
        @keyframes pageIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .reveal { opacity: 0; animation: fadeUp 0.7s cubic-bezier(0.2,0.7,0.2,1) forwards; }
      `}</style>
      <SiteNav />
      <main key={path} style={{ flex: 1, animation: 'pageIn 0.45s cubic-bezier(0.2,0.7,0.2,1)' }}>
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
