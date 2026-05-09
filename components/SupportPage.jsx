import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { useState } from 'react'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    messages: 10,
    model: 'Haiku',
    features: ['10 messages/day', 'Basic companion mode', 'Mood tracking'],
    color: '#786858'
  },
  {
    id: 'supporter',
    name: 'Supporter',
    price: 4.99,
    messages: 40,
    model: 'Sonnet',
    features: ['40 messages/day', 'Smarter AI model', 'Memory across sessions', 'All avatars'],
    color: '#b87840',
    popular: true
  },
  {
    id: 'max',
    name: 'Max',
    price: 9.99,
    messages: 120,
    model: 'Sonnet 4.6',
    features: ['120 messages/day', 'Latest AI model', 'Priority memory', 'Early features'],
    color: '#3A7A58'
  }
]

export default function SupportPage({ session, supabase, currentTier = 'free' }) {
  const [selected, setSelected] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleApprove = async (plan) => {
    // Update tier in Supabase after successful payment
    await supabase
      .from('profiles')
      .update({ tier: plan.id })
      .eq('id', session.user.id)
    setSuccess(true)
    setSelected(null)
  }

  return (
    <div style={{ padding: '40px 24px', maxWidth: 900, margin: '0 auto', fontFamily: 'Georgia, serif' }}>
      <h1 style={{ textAlign: 'center', color: '#2c2018', marginBottom: 8 }}>Support Buddin</h1>
      <p style={{ textAlign: 'center', color: '#786858', marginBottom: 40 }}>
        Keep Buddin growing. Pick what works for you.
      </p>

      {success && (
        <div style={{ background: '#efffef', border: '1.5px solid #3A7A58', borderRadius: 12,
          padding: 16, textAlign: 'center', marginBottom: 24, color: '#2a4a38' }}>
          ✅ Thank you! Your plan has been upgraded. Refresh the page to see your new limits.
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {PLANS.map(plan => (
          <div key={plan.id} style={{
            background: 'white', borderRadius: 20, padding: 28, width: 260,
            border: `2px solid ${plan.popular ? plan.color : '#ddd0bc'}`,
            boxShadow: plan.popular ? `0 4px 24px ${plan.color}33` : '0 2px 12px rgba(40,28,16,0.08)',
            position: 'relative'
          }}>
            {plan.popular && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                background: plan.color, color: 'white', borderRadius: 20, padding: '4px 16px',
                fontSize: 12, fontWeight: 700 }}>
                Most Popular
              </div>
            )}
            {currentTier === plan.id && (
              <div style={{ position: 'absolute', top: -12, right: 16,
                background: '#3A7A58', color: 'white', borderRadius: 20,
                padding: '4px 12px', fontSize: 11 }}>
                Current
              </div>
            )}
            <h2 style={{ color: plan.color, margin: '0 0 4px' }}>{plan.name}</h2>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#2c2018', marginBottom: 4 }}>
              {plan.price === 0 ? 'Free' : `$${plan.price}`}
              {plan.price > 0 && <span style={{ fontSize: 14, color: '#786858' }}>/mo</span>}
            </div>
            <div style={{ color: '#786858', fontSize: 13, marginBottom: 20 }}>
              {plan.messages} messages/day · {plan.model}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', fontSize: 14 }}>
              {plan.features.map(f => (
                <li key={f} style={{ color: '#2c2018', marginBottom: 8 }}>✓ {f}</li>
              ))}
            </ul>

            {plan.price === 0 ? (
              <button disabled style={{ width: '100%', padding: 12, borderRadius: 10,
                border: '1.5px solid #ddd0bc', background: '#fdf8f2',
                color: '#a89888', cursor: 'default', fontSize: 14 }}>
                {currentTier === 'free' ? 'Your current plan' : 'Free tier'}
              </button>
            ) : currentTier === plan.id ? (
              <button disabled style={{ width: '100%', padding: 12, borderRadius: 10,
                border: 'none', background: '#efffef', color: '#3A7A58', fontSize: 14 }}>
                Active plan ✓
              </button>
            ) : (
              <button
                onClick={() => setSelected(selected === plan.id ? null : plan.id)}
                style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none',
                  background: plan.color, color: 'white', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer' }}>
                {selected === plan.id ? 'Cancel' : `Get ${plan.name}`}
              </button>
            )}

            {selected === plan.id && (
              <div style={{ marginTop: 16 }}>
                <PayPalScriptProvider options={{
                  'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID,
                  currency: 'USD'
                }}>
                  <PayPalButtons
                    style={{ layout: 'vertical', shape: 'rect' }}
                    createOrder={(data, actions) => actions.order.create({
                      purchase_units: [{
                        amount: { value: String(plan.price) },
                        description: `Buddin ${plan.name} Plan`
                      }]
                    })}
                    onApprove={() => handleApprove(plan)}
                    onError={(err) => console.error('PayPal error:', err)}
                  />
                </PayPalScriptProvider>
              </div>
            )}
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', color: '#a89888', fontSize: 12, marginTop: 32 }}>
        Payments processed securely by PayPal. Cancel anytime by contacting support.
      </p>
    </div>
  )
}