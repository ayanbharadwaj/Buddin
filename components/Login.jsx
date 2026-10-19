import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login({ onSwitch }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#F5ECDC', fontFamily: 'Georgia, serif'
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 40,
        width: 360, boxShadow: '0 8px 32px rgba(40,28,16,0.13)'
      }}>
        <h1 style={{ textAlign: 'center', color: '#2c2018', marginBottom: 8 }}>Welcome back</h1>
        <p style={{ textAlign: 'center', color: '#786858', marginBottom: 28, fontSize: 14 }}>
          Buddin remembers you
        </p>

        {error && (
          <div style={{ background: '#fee', color: '#c00', borderRadius: 8,
            padding: '10px 14px', marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <input
          type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={inputStyle}
        />

        <button onClick={handleLogin} disabled={loading} style={primaryBtn}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div style={{ textAlign: 'center', margin: '16px 0', color: '#a89888', fontSize: 13 }}>
          or
        </div>

        <button onClick={handleGoogle} style={googleBtn}>
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true" style={{ marginRight: 8, flexShrink: 0 }}>
            <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.9c-.5 2.8-2.1 5.2-4.4 6.8v5.6h7.1c4.2-3.8 6.5-9.5 6.5-16.6z"/>
            <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.6c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.8C8.1 41.2 15.5 46 24 46z"/>
            <path fill="#FBBC05" d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.8H4.5C2.9 17.2 2 20.5 2 24s.9 6.8 2.5 10l7.3-5.8z"/>
            <path fill="#EA4335" d="M24 10.5c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.9 29.9 2 24 2 15.5 2 8.1 6.8 4.5 14l7.3 5.8c1.7-5.2 6.5-9.3 12.2-9.3z"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#786858' }}>
          No account?{' '}
          <button type="button" onClick={onSwitch} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: '#b87840', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #ddd0bc',
  marginBottom: 12, fontSize: 15, boxSizing: 'border-box', background: '#fdf8f2',
  // Explicit colour and colorScheme: the background was set but the text colour
  // was left to the user agent, so a force-darkened browser painted the field
  // (and the password bullets) black on near-black.
  color: '#2c2018', caretColor: '#2c2018', colorScheme: 'light',
  outline: 'none', fontFamily: 'inherit'
}

const primaryBtn = {
  width: '100%', padding: '13px', borderRadius: 10, border: 'none',
  background: '#b87840', color: 'white', fontSize: 15, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit'
}

const googleBtn = {
  width: '100%', padding: '12px', borderRadius: 10,
  border: '1.5px solid #ddd0bc', background: 'white',
  fontSize: 14, cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit'
}