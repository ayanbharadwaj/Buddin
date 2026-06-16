import { PageShell, navigate, usePath } from './SiteShell.jsx'

const posts = [
  {
    slug: 'why-i-built-buddin',
    title: 'Buddin started at 1am, after a talk with my mom.',
    date: '2026-06-12',
    minutes: 4,
    summary:
      'Most of my ideas show up at 1 or 2am. This one showed up after a normal conversation with my mom drifted toward mental health — and I realized I could build something out of my own limitations.',
    body: originBody
  },
  {
    slug: 'waiting-for-the-perfect-time',
    title: 'I keep waiting for the perfect time to say things.',
    date: '2026-06-08',
    minutes: 5,
    summary:
      "A cricket teammate batted perfectly against everything I bowled. I wanted to tell him. I froze, kept waiting for the perfect moment, and the moment never came. Here's what that taught me — and what it has to do with Buddin.",
    body: perfectTimeBody
  },
  {
    slug: 'forgot-how-to-stop',
    title: "I didn't scroll to escape. I forgot how to stop.",
    date: '2026-05-30',
    minutes: 4,
    summary:
      "Everyone frames doom-scrolling as running away from something. For me it usually wasn't. It was just the default — and the default kept winning.",
    body: scrollHabitBody
  },
  {
    slug: 'my-brain-runs-too-fast',
    title: 'My brain runs too fast, and it makes the small stuff hard.',
    date: '2026-05-22',
    minutes: 4,
    summary:
      'When my mom says "go outside," my mind runs a whole tree of outcomes at once. Some of that is chess and math. Some of it is just me being lazy. Here\'s the honest version.',
    body: fastBrainBody
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
    <section style={{ maxWidth: 820, margin: '0 auto', padding: '40px 36px 0' }}>
      <div style={{ fontSize: 13, color: '#a89888', marginBottom: 8 }}>Blog</div>
      <h1 style={{
        fontSize: 'clamp(32px, 4.5vw, 46px)', lineHeight: 1.1, margin: '0 0 14px',
        color: '#2c2018', letterSpacing: -1
      }}>
        Notes from building Buddin.
      </h1>
      <p style={{ fontSize: 18, color: '#5a4634', marginBottom: 32, lineHeight: 1.55 }}>
        Honest writing about doom-scrolling, overthinking, freezing up, and what it's
        actually like to build something out of your own limitations. By Ayan — in my own words.
      </p>

      <div style={{ display: 'grid', gap: 16 }}>
        {posts.map(p => (
          <a key={p.slug} href={`/blog/${p.slug}`}
            onClick={e => { e.preventDefault(); navigate(`/blog/${p.slug}`) }}
            style={{
              background: 'white', border: '1px solid #ead8bb', borderRadius: 16,
              padding: '22px 24px', textDecoration: 'none', color: 'inherit', display: 'block'
            }}>
            <div style={{ fontSize: 12, color: '#a89888', marginBottom: 6 }}>
              {formatDate(p.date)} · {p.minutes} min read
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#2c2018', marginBottom: 8 }}>
              {p.title}
            </div>
            <div style={{ color: '#5a4634', lineHeight: 1.55, fontSize: 15 }}>{p.summary}</div>
            <div style={{ marginTop: 14, color: '#b87840', fontWeight: 600, fontSize: 14 }}>
              Read →
            </div>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 40, fontSize: 14, color: '#786858' }}>
        Want to know when there's a new post? Email{' '}
        <a href="mailto:getbuddin@gmail.com" style={{ color: '#b87840', fontWeight: 600 }}>
          getbuddin@gmail.com
        </a>{' '}
        with the subject "subscribe" — no list software yet, just me.
      </div>
    </section>
  )
}

function PostView({ post }) {
  return (
    <article style={{
      maxWidth: 720, margin: '0 auto', padding: '40px 36px 0',
      fontSize: 18, lineHeight: 1.72, color: '#3a2d22'
    }}>
      <a href="/blog" onClick={e => { e.preventDefault(); navigate('/blog') }}
        style={{ color: '#b87840', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
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
        marginTop: 48, padding: '22px 24px', background: 'white',
        border: '1px solid #ead8bb', borderRadius: 16
      }}>
        <div style={{ fontWeight: 700, color: '#2c2018', marginBottom: 6 }}>
          Buddin is the thing behind this writing.
        </div>
        <div style={{ color: '#5a4634', marginBottom: 14, fontSize: 16 }}>
          A quiet, private place to think out loud. Free, no signup to start.
        </div>
        <button onClick={() => navigate('/try')} style={primaryBtn}>Try Buddin — no signup →</button>
      </div>
      <div style={{ height: 40 }} />
    </article>
  )
}

function NotFound() {
  return (
    <section style={{ maxWidth: 720, margin: '0 auto', padding: '60px 36px', textAlign: 'center' }}>
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
  padding: '12px 18px', margin: '20px 0', borderRadius: 6, fontStyle: 'italic', color: '#46382c'
}

function originBody() {
  return (
    <>
      <p style={p}>
        Most of my ideas show up at 1 or 2 in the morning. Usually they're high-level AI
        things — retrieval, machine learning, whatever I've been reading about that week.
        My brain just gets loud right when it's supposed to be winding down.
      </p>
      <p style={p}>
        About two months ago, my mom and I were talking late, like we usually do. The
        conversation drifted, the way they do, until somehow we landed on mental health. And
        something clicked.
      </p>
      <blockquote style={blockquote}>
        "Wait — I'm good at AI. I've been trying to lock in and push myself since 7th-grade
        summer. What if I built something out of my own fears and limitations?"
      </blockquote>
      <p style={p}>So I did. That's the whole origin story. No incubator, no big launch — just that.</p>

      <h2 style={h2}>What it actually took</h2>
      <p style={p}>
        It wasn't smooth. Money was a wall early on, until I figured out how to get around it
        (it took me embarrassingly long to even learn that Vercel existed for hosting). Time
        was the bigger one — right up until my 9th-grade finals, I could barely balance this
        with school.
      </p>
      <p style={p}>
        I'll be honest: sometimes I just stopped doing schoolwork to work on Buddin. Not
        because I'm some disciplined founder, but because fixing one stubborn error and
        getting it to work <em>perfectly</em> was the most fun I'd had all day.
      </p>

      <h2 style={h2}>The perfectionist problem</h2>
      <p style={p}>
        I'm a perfectionist. If I'm going to do something, I want it done right. That's a
        strength when I'm debugging at midnight and a real problem when it wrecks my time
        management. A lot of building Buddin wasn't even "building Buddin" — it was chasing
        the small, clean hit of fixing something exactly.
      </p>
      <p style={p}>
        Buddin came out of a fast brain, a perfectionist streak, and one ordinary
        conversation with my mom. I think the best things usually start that quietly.
      </p>
    </>
  )
}

function perfectTimeBody() {
  return (
    <>
      <p style={p}>I have a confession that explains a lot about why I built Buddin: I freeze.</p>
      <p style={p}>
        There's a guy in my cricket coaching group. One session, every single ball I bowled,
        he defended perfectly — clean, calm, textbook. I genuinely wanted to tell him after.
        Just, "hey, that was really good batting." Nothing deep.
      </p>
      <p style={p}>
        Play ended. I went to go say it. Then I put it off a little. Then a little more. And a
        little more — until it was suddenly too much, and the moment was gone, and I said
        nothing.
      </p>
      <blockquote style={blockquote}>
        It's like gambling. Not for a good time to say it — for <em>the</em> perfect time. And
        the perfect time never comes, so you fold.
      </blockquote>

      <h2 style={h2}>I wasn't always like this</h2>
      <p style={p}>
        The strange part is that in 8th grade I was the opposite. If I didn't understand
        something, I told my teacher immediately — so often that my teacher (and honestly the
        whole class) sometimes got annoyed with me. I didn't care. And it worked: I averaged
        around 98.5% across all my classes that year.
      </p>
      <p style={p}>
        Then 9th grade happened, and I pulled back. I wanted to please my friends, and I'd
        convinced myself that all my 8th-grade questions had bothered people. So I went quiet
        with teachers and loud with friends. Bad friends, but friends. And 9th grade went
        poorly for me.
      </p>

      <h2 style={h2}>What this summer taught me</h2>
      <p style={p}>
        Looking back now, the lesson is almost embarrassingly simple: I'd rather be the
        teacher's pet than the people-pleaser. One of those is better for your actual life.
      </p>
      <p style={p}>
        This is the exact muscle Buddin is meant to rebuild. Not the gambling for a flawless
        moment — just the plain ability to say the thing while the moment's still here. If you
        can practice that somewhere low-stakes, maybe you don't freeze when it counts.
      </p>
    </>
  )
}

function scrollHabitBody() {
  return (
    <>
      <p style={p}>
        People love to frame doom-scrolling as escape — like you're running from something
        painful. For me, most of the time, that wasn't it.
      </p>
      <p style={p}>It was just habit. I'd done it so long my brain expected it.</p>
      <p style={p}>
        Even on days I didn't feel like scrolling, it felt almost like an obligation. The
        thought process was something like: "I've done this every day and felt fine, so if I
        scroll now I'll feel good too. Let me scroll." And I'd scroll.
      </p>
      <blockquote style={blockquote}>
        The honest version of the loop isn't "I'm sad, so I scroll." It's "I'm bored or
        neutral, scrolling is the default, and the default always wins."
      </blockquote>

      <h2 style={h2}>The good news</h2>
      <p style={p}>
        It's changeable. When I decided to lock in for 9th grade, I cut my scrolling down to
        the 10–15 minutes I actually wanted — not zero, just intentional. Turns out the
        default can be re-set.
      </p>

      <h2 style={h2}>The honest news</h2>
      <p style={p}>
        I can feel myself slipping a bit this summer. A late Saturday here, a binge there. It's
        not a one-time fix — it's a muscle you have to keep using, and it gets weak the second
        you stop paying attention.
      </p>
      <p style={p}>
        That's a big reason Buddin is boring on purpose: no streaks, no feed, nothing
        engineered to quietly become your new default. The goal was never to swap one
        compulsion for another. It's to give you a few honest minutes and then let you go.
      </p>
    </>
  )
}

function fastBrainBody() {
  return (
    <>
      <p style={p}>
        My mom tells me to go outside and play a lot. She's right to — I sit for most of the
        day and barely stand up for hours, which is genuinely not great for me.
      </p>
      <p style={p}>
        But the second she says it, my first thought is: "Is there a way out of this?" And then
        my brain runs a whole tree of outcomes at once — I'm in the middle of editing a
        feature, or I don't feel like getting up, or the friend I'd meet might not come out, or
        he'll complain, or he isn't really that great a friend anyway, or I've got something
        else I need to do next…
      </p>
      <p style={p}>
        My mind moves fast and forks into a lot of branches at the same time. Some of that is
        chess. Some is sports. Some is the math side of my brain. And some of it — I'll be
        honest — is just me being lazy. I'm not going to pretend it isn't.
      </p>

      <h2 style={h2}>Why a fast brain makes small things hard</h2>
      <p style={p}>
        The problem isn't the speed. It's that simple things — go outside, say hi, send the
        text — get buried under a tree of imagined outcomes until doing nothing feels like the
        easiest branch. Overthink it long enough and the decision makes itself: you stay put.
      </p>

      <h2 style={h2}>Why I'm telling you this</h2>
      <p style={p}>
        Not because I've solved it. I haven't. I'm telling you because I suspect a lot of
        people my age have the same overactive engine and feel alone in it. You're not.
      </p>
      <p style={p}>
        Part of what Buddin is, honestly, is me trying to build a calmer place to think —
        somewhere the branches slow down just enough that you can actually pick one.
      </p>
    </>
  )
}
