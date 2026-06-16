import { PageShell, navigate, EMAIL } from './SiteShell.jsx'

export default function About() {
  return (
    <PageShell>
      <article style={{
        maxWidth: 760, margin: '0 auto', padding: '40px 36px 0',
        fontSize: 17.5, lineHeight: 1.66, color: '#3a2d22'
      }}>
        <div style={{ fontSize: 13, color: '#a89888', marginBottom: 8 }}>About the founder</div>
        <h1 style={{
          fontSize: 'clamp(32px, 4.5vw, 46px)', lineHeight: 1.1, margin: '0 0 20px',
          color: '#2c2018', letterSpacing: -1
        }}>
          I built Buddin because I needed it first.
        </h1>
        <p style={{ fontSize: 19, color: '#5a4634', marginBottom: 30 }}>
          I'm Ayan Bharadwaj — I'm 14, a 9th grader at South Forsyth High School in
          Cumming, Georgia. This is the story behind Buddin, in my own words.
        </p>

        <h2 style={h2}>How it started</h2>
        <p>
          After hours of school or sports practice, I'd come home — and instead of sitting
          with my family and actually talking about how the day went, I'd doom-scroll for an
          hour. Then I'd lie in bed and realize I felt lonely. Exhausted and somehow separate
          from everyone at the same time. It felt awful.
        </p>
        <p>
          The next day, the same thing. And I'd scroll again, telling myself it would help.
          It didn't. Eventually I was scrolling even when I didn't need to — even on nights
          when I felt like I <em>could</em> put the phone down, I'd pick it right back up.
          And honestly, I still don't fully know why I kept going back.
        </p>
        <p>
          Part of the problem was that I never talked to anyone about it. It felt too
          complicated to explain — like nobody would really get it. And going to a therapist
          felt out of the question; in my head, that was for people who were "really" broken,
          and I wasn't about to put myself in that box. So I just struggled, quietly, and it
          took a real toll on me.
        </p>

        <h2 style={h2}>Why Buddin exists</h2>
        <p>
          Buddin is the thing I wish I'd had on those nights: somewhere quiet to think out
          loud. Not a feed. Not a place to perform for an audience. Just a single, private
          conversation with something that listens, remembers you, and never screenshots you.
        </p>
        <p>
          I think the next version of "social" technology for teens won't be social at all.
          It'll be quiet, private, and one-to-one. Less performing, more thinking. Buddin is
          my bet on that.
        </p>

        <h2 style={h2}>The crisis Buddin sits inside</h2>
        <p>Buddin is built where three things collide, all of them accelerating:</p>
        <ul style={ul}>
          <li><strong>A real teen mental-health crisis</strong> — loneliness and anxiety keep climbing across every major US study.</li>
          <li><strong>The rise of AI companions</strong> — millions of teens already talk to AI daily, often through products never designed with them in mind.</li>
          <li><strong>A growing want for intentional tech</strong> — a lot of us are actively trying to use social media <em>less</em>, not more.</li>
        </ul>

        <h2 style={h2}>How I'm building it</h2>
        <p>
          I want to be honest about what I am and what I'm not. I'm not a CS PhD. I'm not a
          clinical psychologist. I'm a teenager who builds things, breaks them, talks to
          friends, and rewrites.
        </p>
        <p>
          And Buddin has been anything but a straight line. My very first prototype got wiped
          out by a Google Drive sync error before it really even ran — just gone. The version
          you're using now is the third real rebuild. Every time something broke, it taught me
          what the next version had to do better. I'm fine with that. That's how it's supposed
          to go.
        </p>

        <h2 style={h2}>What I believe Buddin should be</h2>
        <ul style={ul}>
          <li><strong>A companion, not a clinician.</strong> It's not trying to diagnose or treat anyone. It's trying to be there.</li>
          <li><strong>Boring on purpose.</strong> No streaks, no comparison, no dopamine slot machine. You should feel better after using it, not addicted during.</li>
          <li><strong>Honest about limits.</strong> If you need a real human — a counselor, a hotline, a parent — Buddin should say so, clearly.</li>
          <li><strong>Built with counselors, not around them.</strong> It should make their job easier, never threaten it.</li>
        </ul>

        <h2 style={h2}>What's next</h2>
        <p>
          I'm working on making Buddin's memory more useful so conversations feel personal
          over weeks, writing up what I'm learning on the{' '}
          <a href="/blog" onClick={lnk('/blog')} style={inlineLink}>blog</a>, and reaching out
          to digital-wellness researchers who study exactly what I'm trying to build.
        </p>
        <p>
          If you're a researcher, counselor, teacher, parent, or a teen with thoughts — I want
          to hear from you. I read everything that comes into{' '}
          <a href={`mailto:${EMAIL}`} style={inlineLink}>{EMAIL}</a>.
        </p>

        <div style={{
          marginTop: 40, padding: '28px 26px', background: 'white',
          border: '1px solid #ead8bb', borderRadius: 18, textAlign: 'center'
        }}>
          <div style={{ fontWeight: 700, color: '#2c2018', marginBottom: 12, fontSize: 18 }}>
            Want to see what I'm building?
          </div>
          <button onClick={() => navigate('/try')} style={primaryBtn}>Try Buddin — no signup</button>
        </div>

        <div style={{ height: 48 }} />
      </article>
    </PageShell>
  )
}

const lnk = (to) => (e) => { e.preventDefault(); navigate(to) }
const h2 = { fontSize: 26, color: '#2c2018', margin: '36px 0 12px', letterSpacing: -0.3 }
const ul = { paddingLeft: 22, margin: '0 0 16px' }
const inlineLink = { color: '#b87840', fontWeight: 600 }
const primaryBtn = {
  background: '#b87840', color: 'white', border: 'none',
  padding: '13px 24px', borderRadius: 13, fontSize: 16, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit'
}
