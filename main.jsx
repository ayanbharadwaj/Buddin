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
import { usePath, navigate } from './components/SiteShell.jsx'
import { supabase } from './lib/supabase.js'

function Root() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const path = usePath()

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

  // '/' — show the app if signed in, otherwise show the marketing landing.
  if (session === undefined) return (
    <div style={{ minHeight: '100vh', background: '#F5ECDC',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src="/imagebuddin.png" alt="Buddin" width={44} height={44}
        style={{ borderRadius: 11, animation: 'buddinPulse 1.4s ease-in-out infinite' }} />
      <style>{`@keyframes buddinPulse { 0%,100% { opacity: 0.5; transform: scale(0.96); } 50% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  )
  if (!session) return <Landing />
  return <App session={session} supabase={supabase} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
    <Analytics />
  </StrictMode>
)
