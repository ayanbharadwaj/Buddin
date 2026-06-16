import { PageShell, navigate } from './SiteShell.jsx'

const LAST_UPDATED = 'June 16, 2026'

function LegalShell({ title, children }) {
  return (
    <PageShell>
      <article style={{
        maxWidth: 760, margin: '0 auto', padding: '40px 28px 0',
        fontSize: 16, lineHeight: 1.65, color: '#3a2d22'
      }}>
        <div style={{ fontSize: 13, color: '#a89888', marginBottom: 8 }}>Legal</div>
        <h1 style={{
          fontSize: 'clamp(30px, 4vw, 42px)', lineHeight: 1.12, margin: '0 0 8px',
          color: '#2c2018', letterSpacing: -0.8
        }}>{title}</h1>
        <div style={{ color: '#786858', fontSize: 14, marginBottom: 24 }}>
          Last updated: {LAST_UPDATED}
        </div>
        <div style={{
          background: '#fff5e6', border: '1px solid #f0c8a0', borderRadius: 12,
          padding: '14px 18px', marginBottom: 28, fontSize: 14, color: '#5a4634', lineHeight: 1.55
        }}>
          Buddin is built by a student founder and written in plain English so you can
          actually read it. It's offered in good faith and isn't a substitute for legal
          advice. If anything here is unclear, email{' '}
          <a href="mailto:getbuddin@gmail.com" style={inlineLink}>getbuddin@gmail.com</a>.
        </div>
        {children}
        <div style={{ height: 48 }} />
      </article>
    </PageShell>
  )
}

export function Privacy() {
  return (
    <LegalShell title="Privacy Policy">
      <p style={p}>
        This policy explains what information Buddin ("we," "us") collects, why, and what
        we do with it. Buddin is operated by Ayan Bharadwaj, an independent student founder.
      </p>

      <h2 style={h2}>The short version</h2>
      <ul style={ul}>
        <li>We collect the minimum we need to run Buddin: your account info and your conversations.</li>
        <li>We use your conversations to give you replies and to help Buddin remember you over time.</li>
        <li>We do <strong>not</strong> sell your data. We don't run ads. There's no social feed.</li>
        <li>You can delete your account and data at any time by emailing us.</li>
      </ul>

      <h2 style={h2}>What we collect</h2>
      <ul style={ul}>
        <li><strong>Account information:</strong> your name (if you give one) and email address, used to sign you in and keep your account secure.</li>
        <li><strong>Conversation content:</strong> the messages you send to Buddin and Buddin's replies, so the experience works and can feel personal over time.</li>
        <li><strong>Basic usage data:</strong> anonymous, aggregate analytics (e.g. page views) to understand whether Buddin is helping. We don't tie this to your conversations to identify you.</li>
      </ul>

      <h2 style={h2}>How we use it</h2>
      <ul style={ul}>
        <li>To provide the core service — generating Buddin's responses.</li>
        <li>To let Buddin remember context so conversations get more personal, not more generic.</li>
        <li>To keep your account secure and prevent abuse.</li>
        <li>To improve Buddin in aggregate (e.g. "are people coming back?"), never by selling or publishing your individual conversations.</li>
      </ul>

      <h2 style={h2}>Who we share it with</h2>
      <p style={p}>
        We use a small number of trusted service providers to run Buddin. They only process
        data on our behalf to provide their service:
      </p>
      <ul style={ul}>
        <li><strong>Supabase</strong> — secure account login and database storage.</li>
        <li><strong>Anthropic</strong> — generates Buddin's AI responses from your messages. Anthropic does not train its models on data sent through its API.</li>
        <li><strong>Vercel</strong> — hosting and privacy-friendly, aggregate analytics.</li>
        <li><strong>PayPal</strong> — only if you choose to support Buddin financially; we never see or store your card details.</li>
      </ul>
      <p style={p}>
        We will only ever disclose data outside these providers if required by law (for
        example, a valid legal request) or to protect someone's safety.
      </p>

      <h2 style={h2}>Your age</h2>
      <p style={p}>
        Buddin is designed for teenagers and is intended for users <strong>13 and older</strong>.
        Buddin is not directed to children under 13, and we do not knowingly collect personal
        information from anyone under 13. If you believe a child under 13 has created an
        account, email us and we will delete it. If you are under 18, please use Buddin with
        the awareness and permission of a parent or guardian.
      </p>

      <h2 style={h2}>Your choices &amp; rights</h2>
      <ul style={ul}>
        <li><strong>Access or delete:</strong> email <a href="mailto:getbuddin@gmail.com" style={inlineLink}>getbuddin@gmail.com</a> to get a copy of, or permanently delete, your account and conversations.</li>
        <li><strong>Correct:</strong> you can update your name or email from your account.</li>
        <li><strong>Stop using:</strong> you can stop and request deletion at any time — no hoops.</li>
      </ul>

      <h2 style={h2}>Buddin is not a crisis or medical service</h2>
      <p style={p}>
        Buddin is a supportive companion, not a doctor, therapist, or emergency service. If
        you are in crisis or worried about your safety or someone else's, please reach a real
        human: in the US, text <strong>HOME</strong> to <strong>741741</strong>, or call or
        text <strong>988</strong>.
      </p>

      <h2 style={h2}>Changes</h2>
      <p style={p}>
        If we update this policy, we'll change the "last updated" date above and, for
        meaningful changes, do our best to let you know.
      </p>

      <h2 style={h2}>Contact</h2>
      <p style={p}>
        Questions? Email <a href="mailto:getbuddin@gmail.com" style={inlineLink}>getbuddin@gmail.com</a>.
        See also our <a href="/terms" onClick={lnk('/terms')} style={inlineLink}>Terms of Service</a>.
      </p>
    </LegalShell>
  )
}

export function Terms() {
  return (
    <LegalShell title="Terms of Service">
      <p style={p}>
        These terms are the agreement between you and Buddin (operated by Ayan Bharadwaj) when
        you use getbuddin.org. By using Buddin, you agree to them.
      </p>

      <h2 style={h2}>Who can use Buddin</h2>
      <p style={p}>
        You must be at least <strong>13 years old</strong> to use Buddin. If you're under 18,
        you should use it with the awareness and permission of a parent or guardian.
      </p>

      <h2 style={h2}>What Buddin is — and isn't</h2>
      <p style={p}>
        Buddin is a conversational companion designed to listen and help you think things
        through. <strong>Buddin is not therapy, medical or mental-health treatment, a
        counselor, or a crisis service</strong>, and nothing it says is professional advice.
        If you're in crisis, contact a real human immediately: in the US, text
        <strong> HOME</strong> to <strong>741741</strong> or call/text <strong>988</strong>.
      </p>

      <h2 style={h2}>Using Buddin responsibly</h2>
      <p style={p}>Please don't use Buddin to:</p>
      <ul style={ul}>
        <li>Break the law or harm yourself or others.</li>
        <li>Harass, abuse, or impersonate anyone.</li>
        <li>Attempt to break, overload, scrape, or reverse-engineer the service.</li>
        <li>Use it as a general homework machine or assistant — it's built for real conversation, not essays or recipes.</li>
      </ul>
      <p style={p}>We may limit or close accounts that misuse the service.</p>

      <h2 style={h2}>Your account</h2>
      <p style={p}>
        You're responsible for keeping your login secure and for what happens under your
        account. Let us know at <a href="mailto:getbuddin@gmail.com" style={inlineLink}>getbuddin@gmail.com</a> if
        you think someone else has accessed it.
      </p>

      <h2 style={h2}>Payments</h2>
      <p style={p}>
        Buddin's core experience is free. If optional supporter tiers are offered, payments are
        handled by PayPal and any paid terms will be shown to you before you pay. We don't store
        your card details.
      </p>

      <h2 style={h2}>Your content</h2>
      <p style={p}>
        Your conversations are yours. By using Buddin you give us permission to process them
        only as described in the <a href="/privacy" onClick={lnk('/privacy')} style={inlineLink}>Privacy Policy</a> —
        to run the service and personalize your experience.
      </p>

      <h2 style={h2}>No guarantees</h2>
      <p style={p}>
        Buddin is provided "as is." We work hard to make it helpful and available, but we can't
        guarantee it will always be accurate, uninterrupted, or right for every situation. To
        the fullest extent allowed by law, Buddin and its founder aren't liable for damages
        arising from your use of the service. Because Buddin can be wrong, don't rely on it for
        decisions that need a qualified professional.
      </p>

      <h2 style={h2}>Changes &amp; ending use</h2>
      <p style={p}>
        We may update these terms (we'll change the date above). You can stop using Buddin
        anytime, and we may suspend access for violations of these terms.
      </p>

      <h2 style={h2}>Governing law &amp; contact</h2>
      <p style={p}>
        These terms are governed by the laws of the State of Georgia, USA. Questions? Email{' '}
        <a href="mailto:getbuddin@gmail.com" style={inlineLink}>getbuddin@gmail.com</a>.
      </p>
    </LegalShell>
  )
}

const lnk = (to) => (e) => { e.preventDefault(); navigate(to) }
const p = { margin: '0 0 16px' }
const h2 = { fontSize: 22, color: '#2c2018', margin: '30px 0 10px', letterSpacing: -0.3 }
const ul = { paddingLeft: 22, margin: '0 0 16px' }
const inlineLink = { color: '#b87840', fontWeight: 600 }
