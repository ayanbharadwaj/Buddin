import { PageShell, navigate, usePath } from './SiteShell.jsx'

const posts = [
  {
    slug: 'connected-and-lonely',
    title: '48%. That number is why I built Buddin.',
    date: '2026-01-12',
    minutes: 4,
    summary:
      "In 2025, almost half of US teens said social media is making people their age worse. Here's what that statistic actually feels like from inside ninth grade — and what I think a healthier alternative looks like.",
    body: connectedAndLonelyBody
  },
  {
    slug: 'companion-not-clinician',
    title: 'Buddin is a companion, not a clinician — and that’s the whole point.',
    date: '2026-01-26',
    minutes: 5,
    summary:
      "Why I'm intentionally not building an 'AI therapist,' how I think about the line between supporting someone and treating them, and what counselors have told me about where a tool like Buddin actually helps.",
    body: companionNotClinicianBody
  },
  {
    slug: 'designing-against-the-feed',
    title: 'Designing against the feed.',
    date: '2026-02-09',
    minutes: 6,
    summary:
      'No streaks. No likes. No followers. Notes from building a product whose entire job is to leave you feeling better than when you opened it — even at the cost of "engagement."',
    body: designingAgainstTheFeedBody
  }
]

export default function Blog() {
  const path = usePath()
  const match = path.match(/^\/blog\/([^/]+)\/?$/)
  if (match) {
    const post = posts.find(p => p.slug === match[1])
    if (post) return <PageShell><PostView post={post} /></PageShell>
    return <PageShell><NotFound /></PageShell>
  }
  return <PageShell><Index /></PageShell>
}

function Index() {
  return (
    <section style={{ maxWidth: 820, margin: '0 auto', padding: '40px 28px 0' }}>
      <div style={{ fontSize: 13, color: '#a89888', marginBottom: 8 }}>Blog</div>
      <h1 style={{
        fontSize: 'clamp(32px, 4.5vw, 46px)', lineHeight: 1.1, margin: '0 0 14px',
        color: '#2c2018', letterSpacing: -1
      }}>
        Notes from building Buddin.
      </h1>
      <p style={{ fontSize: 18, color: '#5a4634', marginBottom: 32, lineHeight: 1.5 }}>
        Short essays on teen mental health, AI companions, and what it's like to
        build a real product in high school. Written by Ayan, the founder.
      </p>

      <div style={{ display: 'grid', gap: 16 }}>
        {posts.map(p => (
          <a
            key={p.slug}
            href={`/blog/${p.slug}`}
            onClick={e => { e.preventDefault(); navigate(`/blog/${p.slug}`) }}
            style={{
              background: 'white', border: '1px solid #ead8bb', borderRadius: 16,
              padding: '22px 24px', textDecoration: 'none', color: 'inherit',
              display: 'block', boxShadow: '0 4px 16px rgba(40,28,16,0.04)'
            }}
          >
            <div style={{ fontSize: 12, color: '#a89888', marginBottom: 6 }}>
              {formatDate(p.date)} · {p.minutes} min read
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#2c2018', marginBottom: 8 }}>
              {p.title}
            </div>
            <div style={{ color: '#5a4634', lineHeight: 1.55, fontSize: 15 }}>
              {p.summary}
            </div>
            <div style={{ marginTop: 14, color: '#b87840', fontWeight: 600, fontSize: 14 }}>
              Read →
            </div>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 40, fontSize: 14, color: '#786858' }}>
        Want to be told when there's a new post? Email{' '}
        <a href="mailto:hello@getbuddin.org" style={{ color: '#b87840', fontWeight: 600 }}>
          hello@getbuddin.org
        </a>{' '}
        with the subject "subscribe" — no list software yet, just me.
      </div>
    </section>
  )
}

function PostView({ post }) {
  return (
    <article style={{
      maxWidth: 720, margin: '0 auto', padding: '40px 28px 0',
      fontSize: 18, lineHeight: 1.7, color: '#3a2d22'
    }}>
      <a
        href="/blog" onClick={e => { e.preventDefault(); navigate('/blog') }}
        style={{ color: '#b87840', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}
      >
        ← All posts
      </a>
      <div style={{ fontSize: 13, color: '#a89888', margin: '20px 0 6px' }}>
        {formatDate(post.date)} · {post.minutes} min read · by Ayan Bharadwaj
      </div>
      <h1 style={{
        fontSize: 'clamp(30px, 4.5vw, 42px)', lineHeight: 1.15, margin: '0 0 22px',
        color: '#2c2018', letterSpacing: -0.8
      }}>
        {post.title}
      </h1>
      {post.body()}

      <div style={{
        marginTop: 48, padding: '22px 22px', background: 'white',
        border: '1px solid #ead8bb', borderRadius: 16
      }}>
        <div style={{ fontWeight: 700, color: '#2c2018', marginBottom: 6 }}>
          Buddin is the product behind this writing.
        </div>
        <div style={{ color: '#5a4634', marginBottom: 14, fontSize: 16 }}>
          A quiet, private place for teens to think out loud. Free to try.
        </div>
        <button onClick={() => navigate('/login')} style={primaryBtn}>
          Try Buddin →
        </button>
      </div>
      <div style={{ height: 40 }} />
    </article>
  )
}

function NotFound() {
  return (
    <section style={{ maxWidth: 720, margin: '0 auto', padding: '60px 28px', textAlign: 'center' }}>
      <h1 style={{ color: '#2c2018' }}>Post not found</h1>
      <p style={{ color: '#5a4634' }}>That one might have moved.</p>
      <button onClick={() => navigate('/blog')} style={primaryBtn}>Back to the blog</button>
    </section>
  )
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const primaryBtn = {
  background: '#b87840', color: 'white', border: 'none',
  padding: '12px 20px', borderRadius: 12, fontSize: 15, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit'
}

const p = { margin: '0 0 18px' }
const h2 = { fontSize: 24, color: '#2c2018', margin: '32px 0 10px', letterSpacing: -0.3 }
const blockquote = {
  borderLeft: '4px solid #b87840', background: '#fff5e6',
  padding: '12px 18px', margin: '20px 0', borderRadius: 6, fontStyle: 'italic',
  color: '#46382c'
}

function connectedAndLonelyBody() {
  return (
    <>
      <p style={p}>
        In April 2025, Pew Research published a survey of US teenagers. One number
        stuck with me and has been stuck with me ever since:
        <strong> 48% of teens said social media has had a mostly negative effect on
        people their age.</strong> Three years earlier, in 2022, that number was 32%.
      </p>
      <p style={p}>
        Same teens. Same platforms. Sixteen-point jump.
      </p>
      <p style={p}>
        That is not a chart you want to be on the wrong side of. And almost half of
        us — 44% — have already tried to cut back our own usage. We <em>know</em>.
        We're not waiting for someone to explain it to us.
      </p>

      <h2 style={h2}>What it actually looks like</h2>
      <p style={p}>
        I want to translate that statistic out of survey-speak, because "negative
        effect on people their age" sounds clinical and it isn't.
      </p>
      <p style={p}>
        It looks like a group chat that you can't leave because leaving says
        something you didn't mean to say. It looks like opening Instagram for 30
        seconds at 11pm and then being on it at 1am and not being able to honestly
        explain to yourself what you actually looked at. It looks like the friend
        who got into the thing, posted about it, and now you can't bring up that
        you didn't.
      </p>
      <blockquote style={blockquote}>
        The hardest part isn't the obvious bad stuff. It's the way ordinary days
        get a little quieter and a little hollower, slowly, and you don't notice
        until you do.
      </blockquote>

      <h2 style={h2}>Why "talk to your friends" isn't a complete answer</h2>
      <p style={p}>
        Adults often tell teens, "Put the phone down, talk to your friends." It's
        good advice. It's also incomplete. Sometimes the friends are the thing
        you're trying to take a break from. Sometimes the thing you want to say
        out loud is exactly the thing you don't want recorded in a group chat
        forever.
      </p>
      <p style={p}>
        That's the gap Buddin is trying to fill. Not therapy. Not a feed. A
        conversation. With something that listens, asks honest questions, and
        won't screenshot you.
      </p>

      <h2 style={h2}>The thesis behind the product</h2>
      <p style={p}>
        I think the next decade of "social" technology for teens won't be social
        at all. It'll be quiet, private, one-to-one. Less performing, more
        thinking. Less audience, more presence.
      </p>
      <p style={p}>
        Buddin is a bet on that shift. If 48% of us already know the loud version
        is hurting us, somebody has to start building the quiet version.
      </p>
    </>
  )
}

function companionNotClinicianBody() {
  return (
    <>
      <p style={p}>
        The fastest way to make an AI mental-health product irresponsible is to
        let it call itself a therapist. So Buddin doesn't.
      </p>
      <p style={p}>
        Buddin is a <strong>companion</strong>. The difference matters.
      </p>

      <h2 style={h2}>What a companion does</h2>
      <p style={p}>
        A companion sits next to you. Listens. Asks honest, non-leading questions.
        Remembers what you said last Tuesday so it doesn't make you re-explain
        your life every time you open it. Helps you put your own thoughts into
        words. Does not diagnose. Does not prescribe. Does not pretend to be a
        clinician.
      </p>

      <h2 style={h2}>Where Buddin should stop and a human should start</h2>
      <p style={p}>
        There are bright lines a tool like Buddin should not cross. Crisis. Risk
        of harm to yourself or someone else. Anything where a real human needs to
        be involved, fast. In those moments, the most useful thing Buddin can do
        is say so clearly and point the way — counselor, hotline, trusted adult.
        Every page on this site has those numbers in the footer for that reason.
      </p>

      <h2 style={h2}>What counselors have told me</h2>
      <p style={p}>
        When I describe Buddin to school counselors, the reaction I hear most
        often is some version of: "Anything that helps kids get more comfortable
        naming what they're feeling — before they get to my office — makes my
        job easier." Buddin is built to be that kind of upstream tool. A way to
        practice articulating, so when you do talk to a person, you already know
        what you want to say.
      </p>

      <p style={p}>
        Companion, not clinician. It's not a marketing line. It's the actual
        product constraint I make every design decision against.
      </p>
    </>
  )
}

function designingAgainstTheFeedBody() {
  return (
    <>
      <p style={p}>
        Most apps want you to come back. Buddin wants you to come back <em>less
        anxious than you arrived.</em> Those two goals can pull in opposite
        directions, and a lot of design choices come down to which one wins.
      </p>

      <h2 style={h2}>Things Buddin doesn't have</h2>
      <ul style={{ paddingLeft: 22, margin: '0 0 18px' }}>
        <li>No social feed.</li>
        <li>No followers or following.</li>
        <li>No likes, hearts, or public reactions.</li>
        <li>No streaks.</li>
        <li>No "people online" indicator.</li>
        <li>No notifications designed to drag you back in.</li>
      </ul>
      <p style={p}>
        Every one of those is a choice I had to actively make, because the
        defaults of modern app design assume you want all of them. The defaults
        are wrong for what Buddin is for.
      </p>

      <h2 style={h2}>What Buddin does have</h2>
      <p style={p}>
        A conversation. A memory. A long-term sense of who you are — your moods,
        your vocabulary, the kinds of things that wear you down and the kinds of
        things that bring you back.
      </p>
      <p style={p}>
        That's the trade. Less surface area, more depth. Less for an audience,
        more for you.
      </p>

      <h2 style={h2}>The honest version of "engagement"</h2>
      <p style={p}>
        If a Buddin user opens the app, has a five-minute conversation, closes
        it, and goes to sleep without doom-scrolling — that is success. Even if
        they don't come back tomorrow. Even if my "DAU" number stays small.
      </p>
      <p style={p}>
        I would rather have a small number of teens who feel a little better
        because of Buddin than a large number who feel a little worse.
      </p>
    </>
  )
}
