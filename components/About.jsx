import { PageShell, navigate } from './SiteShell.jsx'

export default function About() {
  return (
    <PageShell>
      <article style={{
        maxWidth: 760, margin: '0 auto', padding: '40px 28px 0',
        fontSize: 17, lineHeight: 1.65, color: '#3a2d22'
      }}>
        <div style={{ fontSize: 13, color: '#a89888', marginBottom: 8 }}>
          About the founder
        </div>
        <h1 style={{
          fontSize: 'clamp(32px, 4.5vw, 46px)', lineHeight: 1.1, margin: '0 0 18px',
          color: '#2c2018', letterSpacing: -1
        }}>
          A student built this because students needed it.
        </h1>
        <p style={{ fontSize: 19, color: '#5a4634', marginBottom: 28 }}>
          Buddin is the work of <strong>Ayan Bharadwaj</strong>, a 9th grader at
          South Forsyth High School in Georgia. This page is the story behind it —
          why a teenager started building a teen mental-health tool, what's working,
          and what's next.
        </p>

        <div style={{
          background: 'white', border: '1px solid #ead8bb', borderRadius: 16,
          padding: '20px 22px', marginBottom: 36
        }}>
          <strong style={{ color: '#2c2018' }}>The short version:</strong> in 2025,
          Pew Research found that <strong>48% of US teens think social media harms
          people their age</strong> — up from 32% just three years earlier. 44% have
          already tried to cut back. Buddin is one teenager's answer to that data,
          built from the inside.
        </div>

        <h2 style={h2}>Why Buddin exists</h2>
        <p>
          I'm Ayan. I'm 14. I watched my own friends — and myself — get worse, not
          better, the more "connected" we got. Group chats that didn't sleep.
          Comparison spirals at midnight. The weird, hollow feeling of scrolling
          for an hour and still feeling like nobody actually knew what kind of day
          you'd had.
        </p>
        <p>
          The apps we were told to use when we felt bad mostly looked, sounded, and
          rewarded us like the apps that made us feel bad in the first place. So I
          started Buddin: a single, quiet conversation. No feed. No followers. No
          notifications competing for your attention. Just somewhere to think out
          loud — to a thing that listens, remembers you, and never performs for an
          audience.
        </p>

        <h2 style={h2}>The crisis Buddin sits inside</h2>
        <p>
          Buddin sits at the intersection of three trends that are all accelerating:
        </p>
        <ul style={ulStyle}>
          <li>
            <strong>A documented teen mental-health crisis</strong> — anxiety,
            loneliness, and self-reported harm from social media keep climbing across
            every major US study.
          </li>
          <li>
            <strong>The rise of AI companions</strong> — millions of teens are already
            talking to AI every day, often through products that weren't designed
            with them in mind at all.
          </li>
          <li>
            <strong>Growing demand for intentional digital experiences</strong> —
            44% of teens are now trying to <em>cut back</em> on social media use, not
            increase it.
          </li>
        </ul>
        <p>
          Buddin's bet is that the next generation of "social" technology won't be
          social at all. It'll be quiet, private, and one-to-one.
        </p>

        <h2 style={h2}>How I'm building it</h2>
        <p>
          I started programming in middle school — Scratch, then Python, then Java.
          I went through CS50 Web on my own, took Duke's pre-college research methods
          course, and have been gradually layering in the tools I actually need:
          React, Vite, Supabase, the Anthropic API, and a lot of nights debugging.
        </p>
        <p>
          I am not a CS PhD. I am not a clinical psychologist. I'm a teenager who
          ships, breaks things, talks to users, and rewrites. Buddin's first
          prototype was wiped out by a Google Drive sync error. The current version
          is the third real rewrite. That's fine. Every version teaches me what the
          next one has to do better.
        </p>

        <h2 style={h2}>What I believe Buddin should be</h2>
        <ul style={ulStyle}>
          <li>
            <strong>A companion, not a clinician.</strong> Buddin isn't trying to
            diagnose or treat anyone. It's trying to be there.
          </li>
          <li>
            <strong>Boring on purpose.</strong> No streaks. No social comparison. No
            dopamine slot-machine. The point is to feel better after using it, not
            during.
          </li>
          <li>
            <strong>Honest about limits.</strong> If someone needs a human — a
            counselor, a hotline, a parent — Buddin should say so, clearly, and
            point the way.
          </li>
          <li>
            <strong>Built with counselors, not around them.</strong> Buddin should
            make a school counselor's life easier, not threaten it.
          </li>
        </ul>

        <h2 style={h2}>What's next</h2>
        <p>
          I'm working on three things in parallel: making Buddin's memory more
          useful so conversations feel personal over weeks, writing up what I'm
          learning on the <a href="/blog" onClick={e => { e.preventDefault(); navigate('/blog') }} style={inlineLink}>Buddin blog</a>,
          and reaching out to digital-wellness researchers at MIT, Georgia Tech, and
          other groups who study what I'm trying to build.
        </p>
        <p>
          If you're a researcher, counselor, journalist, teacher, parent, or a teen
          who has thoughts — I want to hear from you. I read everything that comes
          into <a href="mailto:hello@getbuddin.org" style={inlineLink}>hello@getbuddin.org</a>.
        </p>

        <div style={{
          marginTop: 40, padding: '26px 24px', background: 'white',
          border: '1px solid #ead8bb', borderRadius: 16, textAlign: 'center'
        }}>
          <div style={{ fontWeight: 700, color: '#2c2018', marginBottom: 10, fontSize: 18 }}>
            Want to see what I'm building?
          </div>
          <button onClick={() => navigate('/login')} style={primaryBtn}>
            Try Buddin →
          </button>
        </div>

        <div style={{ height: 40 }} />
      </article>
    </PageShell>
  )
}

const h2 = {
  fontSize: 26, color: '#2c2018', margin: '36px 0 12px', letterSpacing: -0.3
}
const ulStyle = { paddingLeft: 22, margin: '0 0 16px' }
const inlineLink = { color: '#b87840', fontWeight: 600 }
const primaryBtn = {
  background: '#b87840', color: 'white', border: 'none',
  padding: '13px 22px', borderRadius: 12, fontSize: 16, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit'
}
