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
          <img src="https://www.google.com/favicon.ico" width={16} style={{ marginRight: 8 }} />
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#786858' }}>
          No account?{' '}
          <span onClick={onSwitch} style={{ color: '#b87840', cursor: 'pointer', fontWeight: 600 }}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #ddd0bc',
  marginBottom: 12, fontSize: 15, boxSizing: 'border-box', background: '#fdf8f2',
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