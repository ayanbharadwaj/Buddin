import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './src/App.jsx'
import Login from './components/Login.jsx'
import Signup from './components/Signup.jsx'
import Landing from './components/Landing.jsx'
import About from './components/About.jsx'
import Blog from './components/Blog.jsx'
import GuestChat from './components/GuestChat.jsx'
import { Privacy, Terms } from './components/Legal.jsx'
import NotFound from './components/NotFound.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { usePath, navigate, useRouteMeta } from './components/SiteShell.jsx'
import { supabase } from './lib/supabase.js'

// Paths owned by the authenticated app's own screen router (src/App.jsx).
// Anything that is neither one of these nor a marketing/legal route is a
// genuine 404 — previously every unknown path silently rendered the landing
// page, so getbuddin.org/me logged-out looked like the homepage with the
// wrong URL in the bar.
const APP_PATHS = new Set(['/home', '/chat', '/do', '/growth', '/me', '/learn', '/plans', '/breathe'])

function Root() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const path = usePath()
  useRouteMeta(path)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // If an authenticated user lands on /login or /signup, bounce them home.
  useEffect(() => {
    if (session && (path === '/login' || path === '/signup')) navigate('/')
  }, [session, path])

  // A logged-out visitor deep-linking into the app gets sent somewhere they can
  // act on, rather than the marketing page under an app URL. `session` is
  // undefined while the auth check is still in flight and null once it has
  // resolved to "not signed in" — only the latter should redirect.
  useEffect(() => {
    if (session === null && APP_PATHS.has(path)) navigate('/login')
  }, [session, path])

  // Marketing & legal routes are always visible (logged in or not).
  if (path === '/about') return <About />
  if (path === '/blog' || path.startsWith('/blog/')) return <Blog />
  if (path === '/privacy') return <Privacy />
  if (path === '/terms') return <Terms />
  if (path === '/try') return <GuestChat />

  if (path === '/login') {
    if (session) return null // effect above will redirect
    return <Login onSwitch={() => navigate('/signup')} />
  }
  if (path === '/signup') {
    if (session) return null
    return <Signup onSwitch={() => navigate('/login')} />
  }

  // Still resolving auth — don't flash the wrong screen.
  if (session === undefined) return (
    <div style={{ minHeight: '100vh', background: '#F5ECDC',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src="/imagebuddin.png" alt="GetBuddin" width={44} height={44}
        style={{ borderRadius: 11, animation: 'buddinPulse 1.4s ease-in-out infinite' }} />
      <style>{`@keyframes buddinPulse { 0%,100% { opacity: 0.5; transform: scale(0.96); } 50% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  )
  // App screens: signed in gets the app, signed out is being redirected above.
  if (APP_PATHS.has(path)) return session ? <App /> : null

  // '/' — the app if signed in, otherwise the marketing landing.
  // App() takes no props and imports supabase directly, like every other screen
  // in the app (the screen-component contract). These two props were being
  // passed and silently ignored — spec 2.2 flagged it; this is the cleanup.
  if (path === '/') return session ? <App /> : <Landing />

  // Anything else genuinely does not exist.
  return <NotFound />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
    <Analytics />
  </StrictMode>
)
