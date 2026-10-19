import { Component } from 'react'

// A render error anywhere in the tree previously unmounted everything and left
// a blank white page — no message, no way back, nothing in the UI to say what
// happened. For an app someone might be opening on a bad day, a silent white
// screen is the worst possible failure mode.
//
// This catches it, says something human, and gives a way out. The technical
// detail goes to the console, not to the user.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false }
  }

  static getDerivedStateFromError() {
    return { crashed: true }
  }

  componentDidCatch(error, info) {
    console.error('GetBuddin crashed:', error, info?.componentStack)
  }

  render() {
    if (!this.state.crashed) return this.props.children

    return (
      <div style={{
        minHeight: '100dvh', background: '#F5ECDC', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 24,
        fontFamily: "'Cabinet Grotesk', system-ui, sans-serif", color: '#2c2018',
      }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🌱</div>
          <h1 style={{
            fontFamily: "'Fraunces', Georgia, serif", fontSize: 24,
            fontWeight: 400, margin: '0 0 10px',
          }}>
            Something broke on our end.
          </h1>
          <p style={{ color: '#786858', fontSize: 15, lineHeight: 1.7, margin: '0 0 22px' }}>
            Not your fault, and nothing you typed is lost on the server. Reloading
            usually sorts it out.
          </p>
          <button
            onClick={() => window.location.assign('/')}
            style={{
              background: '#b87840', color: '#fff', border: 'none', borderRadius: 14,
              padding: '13px 26px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Reload GetBuddin
          </button>
          <p style={{ color: '#a89888', fontSize: 12.5, lineHeight: 1.6, marginTop: 20 }}>
            If it keeps happening, tell me at{' '}
            <a href="mailto:getbuddin@gmail.com" style={{ color: '#b87840' }}>
              getbuddin@gmail.com
            </a>{' '}
            and I'll fix it.
          </p>
        </div>
      </div>
    )
  }
}
