import { useEffect, useState } from 'react'

export function navigate(path) {
  if (window.location.pathname === path) return
  window.history.pushState({}, '', path)
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

function NavLink({ to, label, active }) {
  return (
    <a
      href={to}
      onClick={e => { e.preventDefault(); navigate(to) }}
      style={{
        color: active ? '#b87840' : '#5a4634',
        textDecoration: 'none',
        fontWeight: active ? 700 : 500,
        fontSize: 15,
        padding: '6px 2px',
        borderBottom: active ? '2px solid #b87840' : '2px solid transparent'
      }}
    >
      {label}
    </a>
  )
}

export function SiteNav() {
  const path = usePath()
  const onBlog = path.startsWith('/blog')
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 28px', maxWidth: 1120, margin: '0 auto', flexWrap: 'wrap', gap: 16
    }}>
      <a
        href="/"
        onClick={e => { e.preventDefault(); navigate('/') }}
        style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
      >
        <img src="/imagebuddin.png" alt="" width={34} height={34} style={{ borderRadius: 8 }} />
        <span style={{ fontSize: 22, fontWeight: 700, color: '#2c2018', letterSpacing: -0.5 }}>
          Buddin
        </span>
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <NavLink to="/" label="Home" active={path === '/'} />
        <NavLink to="/about" label="About" active={path === '/about'} />
        <NavLink to="/blog" label="Blog" active={onBlog} />
        <a
          href="/login"
          onClick={e => { e.preventDefault(); navigate('/login') }}
          style={{ color: '#5a4634', textDecoration: 'none', fontWeight: 500, fontSize: 14 }}
        >
          Sign in
        </a>
        <a
          href="/try"
          onClick={e => { e.preventDefault(); navigate('/try') }}
          style={{
            background: '#b87840', color: 'white', padding: '10px 18px',
            borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14
          }}
        >
          Try free
        </a>
      </div>
    </nav>
  )
}

export function SiteFooter() {
  return (
    <footer style={{
      borderTop: '1px solid #e6d8c0',
      marginTop: 80,
      background: '#efe3cf'
    }}>
      <div style={{
        maxWidth: 1120, margin: '0 auto', padding: '28px',
        display: 'grid', gap: 24
      }}>
        <div style={{
          background: '#fff', border: '1.5px solid #f0c8a0', borderRadius: 14,
          padding: '18px 22px', display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap'
        }}>
          <div style={{ fontSize: 22 }}>🆘</div>
          <div style={{ flex: '1 1 280px', minWidth: 240 }}>
            <div style={{ fontWeight: 700, color: '#2c2018', marginBottom: 4 }}>
              In crisis or need to talk to a person right now?
            </div>
            <div style={{ color: '#5a4634', fontSize: 14, lineHeight: 1.5 }}>
              Buddin is a companion, not a crisis service. If you're thinking about hurting yourself
              or someone else, please reach out:
              <br />
              <strong>Crisis Text Line:</strong> Text <strong>HOME</strong> to <strong>741741</strong> (US) ·
              <strong> 988 Suicide &amp; Crisis Lifeline:</strong> call or text <strong>988</strong>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap',
          gap: 16, fontSize: 13, color: '#786858'
        }}>
          <div>© {new Date().getFullYear()} Buddin · Built by Ayan Bharadwaj</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="/about" onClick={e => { e.preventDefault(); navigate('/about') }} style={footerLink}>About</a>
            <a href="/blog" onClick={e => { e.preventDefault(); navigate('/blog') }} style={footerLink}>Blog</a>
            <a href="/privacy" onClick={e => { e.preventDefault(); navigate('/privacy') }} style={footerLink}>Privacy</a>
            <a href="/terms" onClick={e => { e.preventDefault(); navigate('/terms') }} style={footerLink}>Terms</a>
            <a href="/login" onClick={e => { e.preventDefault(); navigate('/login') }} style={footerLink}>Sign in</a>
            <a href="mailto:hello@getbuddin.org" style={footerLink}>Contact</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

const footerLink = { color: '#5a4634', textDecoration: 'none' }

export function PageShell({ children }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#F5ECDC',
      fontFamily: 'Georgia, "Times New Roman", serif', color: '#2c2018',
      display: 'flex', flexDirection: 'column'
    }}>
      <SiteNav />
      <main style={{ flex: 1 }}>{children}</main>
      <SiteFooter />
    </div>
  )
}
