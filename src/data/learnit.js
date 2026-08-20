// Learn It — a different job from Know Me. Know Me measures who someone already
// is; Learn It teaches practical competence that tends to be unevenly distributed
// by family background and that school rarely covers directly (spec 7.7).
//
// All five sub-modules share one shape: a scenario is presented, the user makes a
// choice, feedback follows, and progress accumulates toward a level. That shape
// is implemented once in LearnItModule.jsx and backed by the training_progress
// table. Adding a sub-module is writing content into a structure that already
// works, not building new infrastructure.
//
// Scoring: each option carries `score` 0-2. 2 = the move that actually works,
// 1 = defensible but costs something, 0 = the common instinct that backfires.
// There is deliberately no "you got it wrong" language anywhere — feedback
// explains the mechanism and moves on.
//
// LEVELS: every 6 scenarios completed is one level, per sub-module.
export const SCENARIOS_PER_LEVEL = 6;

export const ETIQUETTE = [
  {
    id: "etq1",
    situation: "You're at a sit-down dinner and there are more forks than you expected. Nobody's explained anything.",
    choices: [
      { text: "Work from the outside in — the outermost fork is for the first course.", score: 2,
        feedback: "That's the whole rule, and it's the same at every formal table in the world. Outside in, course by course. Once you know it there's nothing left to be anxious about." },
      { text: "Wait and copy whoever starts first.", score: 2,
        feedback: "Also completely fine, and honestly what most confident people do in an unfamiliar setting. Watching before acting isn't weakness — it's how you read a room you haven't been in before." },
      { text: "Use whichever fork and hope nobody notices.", score: 1,
        feedback: "Nobody's grading you, and picking wrong costs you nothing. But the outside-in rule takes five seconds to learn and removes the low-level worry entirely, which is worth more than it sounds." },
    ],
  },
  {
    id: "etq2",
    situation: "Someone introduces you to a group of four people you've never met. You catch maybe one name.",
    choices: [
      { text: "Ask them to repeat it right away — 'Sorry, I missed that, what was your name?'", score: 2,
        feedback: "Asking in the first ten seconds is free. Asking twenty minutes later is awkward. People are almost always pleased you cared enough to ask." },
      { text: "Nod, move on, and hope it comes up again later.", score: 0,
        feedback: "This is the most common instinct and it reliably makes things worse — the window to ask closes fast, and then you're stuck avoiding their name for the rest of the night." },
      { text: "Repeat each name back as you shake hands.", score: 2,
        feedback: "The strongest version of this. Saying it out loud once makes it stick, and it reads as genuine attention rather than a memory trick." },
    ],
  },
  {
    id: "etq3",
    situation: "You're invited to dinner at a friend's house for the first time. Their family is more formal than yours.",
    choices: [
      { text: "Bring something small — flowers, dessert, anything.", score: 2,
        feedback: "Arriving with something in hand is the single easiest way to land well in an unfamiliar house. It doesn't have to be expensive; it has to exist." },
      { text: "Show up on time with nothing, since you weren't asked to bring anything.", score: 1,
        feedback: "Nothing wrong with it, and nobody will say a word. But the small gift is one of those things that quietly separates people who were taught this from people who weren't — and it costs about four dollars to close that gap." },
      { text: "Ask beforehand what you should bring.", score: 2,
        feedback: "Genuinely good. It removes the guesswork and signals you're paying attention. Most hosts will say 'nothing' — bring something small anyway." },
    ],
  },
  {
    id: "etq4",
    situation: "An adult you've just met asks what you want to do after school. You don't actually know yet.",
    choices: [
      { text: "Say you're not sure yet, then name something you're genuinely curious about.", score: 2,
        feedback: "Honesty plus a direction. 'Not sure yet, but I've been getting into X' is a real answer that also gives the other person something to talk to you about." },
      { text: "Make something impressive up.", score: 0,
        feedback: "It works for about forty seconds and then you have to defend a plan you don't have. Adults ask this question constantly and can tell the difference immediately." },
      { text: "Just say 'I don't know.'", score: 1,
        feedback: "True, and there's no shame in it — but it ends the conversation, and the person asking was usually trying to start one." },
    ],
  },
  {
    id: "etq5",
    situation: "You're at a table and realise you've been talking for a while and nobody else has said much.",
    choices: [
      { text: "Ask the quietest person a direct question about themselves.", score: 2,
        feedback: "This is the move. Not a general 'so what do you all think' — a specific question aimed at one person. It hands the floor over cleanly and people remember being asked." },
      { text: "Stop talking and let a silence form.", score: 1,
        feedback: "Better than continuing, but a hard stop puts the work of restarting on someone else. Handing off deliberately is smoother than just going quiet." },
      { text: "Keep going — nobody's interrupted you, so it's probably fine.", score: 0,
        feedback: "Nobody interrupts because interrupting is hard, not because they're enjoying it. Noticing you've had the floor for a while is the skill; acting on it is the whole thing." },
    ],
  },
  {
    id: "etq6",
    situation: "You need to email a teacher you've never emailed before to ask about a missed assignment.",
    choices: [
      { text: "Use a clear subject line, greet them by name, state the ask in two sentences, sign off.", score: 2,
        feedback: "That structure works for every professional email you'll ever send — subject, greeting, ask, sign-off. It's not stiffness, it's making it easy for a busy person to help you." },
      { text: "Keep it casual, like a text — they know who you are.", score: 0,
        feedback: "Teachers get a lot of these, and the casual ones are the ones that sit unanswered longest. Not because anyone's offended — because they're harder to act on quickly." },
      { text: "Write a long apology first, then get to the question.", score: 1,
        feedback: "The instinct is kind but it buries the ask. One sentence of context, then the question. People helping you want to know what you need, fast." },
    ],
  },
  {
    id: "etq7",
    situation: "You arrive at an event and realise you're dressed noticeably more casually than everyone else.",
    choices: [
      { text: "Act completely normal and don't mention it.", score: 2,
        feedback: "This is genuinely the answer. Discomfort about clothes is only visible if you make it visible. People take their read of how you're dressed almost entirely from how you carry it." },
      { text: "Apologise for it to a few people so they know you know.", score: 0,
        feedback: "This is the one thing that turns a non-event into an event. Every apology draws attention to something most people hadn't registered." },
      { text: "Leave and change if you can.", score: 1,
        feedback: "Fine if it's genuinely easy. But leaving usually costs more social ground than the outfit ever would have." },
    ],
  },
  {
    id: "etq8",
    situation: "Someone gives you a compliment you don't think you deserve.",
    choices: [
      { text: "Say thank you and leave it there.", score: 2,
        feedback: "Two words, done. Accepting a compliment cleanly is a real skill and most people never learn it." },
      { text: "Deflect it — explain why it wasn't that impressive.", score: 0,
        feedback: "The instinct is modesty, but it puts the other person in the position of having to argue with you about their own opinion. It's more awkward for them than for you." },
      { text: "Thank them and return a compliment.", score: 1,
        feedback: "Warm, and often right. Just make sure it's real — a reflexive compliment back reads as a transaction rather than a response." },
    ],
  },
];

export const GRAMMAR = [
  {
    id: "gr1",
    situation: "Which one belongs in a college application essay?",
    choices: [
      { text: "\"The experience affected how I approach problems.\"", score: 2,
        feedback: "Affect is the verb, effect is the noun. 'Affected how I approach' is right. This one pair shows up in almost every application essay written." },
      { text: "\"The experience effected how I approach problems.\"", score: 0,
        feedback: "Close, and an extremely common slip. Effect as a verb does exist — 'to effect change' means to bring it about — but that's not what this sentence means." },
      { text: "Either is fine — people use them interchangeably.", score: 0,
        feedback: "People do, but readers who know the difference notice, and admissions readers are exactly that audience. It's a cheap point to win." },
    ],
  },
  {
    id: "gr2",
    situation: "You're tightening a sentence: \"I personally believe that in my own opinion the plan is basically a good one.\"",
    choices: [
      { text: "\"I think the plan is good.\"", score: 2,
        feedback: "Five words doing the work of thirteen. 'Personally', 'in my own opinion', and 'basically' were all saying the same thing, which was already said by 'I think'." },
      { text: "\"In my opinion, the plan is basically good.\"", score: 1,
        feedback: "Better, but 'in my opinion' and 'basically' are both still hedges. Hedging twice in one sentence reads as uncertainty even when you're not uncertain." },
      { text: "Leave it — the length shows you thought about it.", score: 0,
        feedback: "Length reads as padding, not thought. Short sentences read as confidence, which is exactly what you want in the sentence where you state your view." },
    ],
  },
  {
    id: "gr3",
    situation: "\"Me and my friend went\" or \"My friend and I went\"?",
    choices: [
      { text: "\"My friend and I went.\"", score: 2,
        feedback: "Right. The trick that always works: drop the other person. 'I went' sounds right, 'me went' doesn't. Same test works in reverse — 'she gave it to my friend and me' is correct because 'she gave it to me' is." },
      { text: "\"Me and my friend went.\"", score: 0,
        feedback: "Fine in speech, and nobody will correct you at lunch. In writing it's the single most-noticed slip there is, and the drop-the-other-person test catches it every time." },
      { text: "\"My friend and myself went.\"", score: 0,
        feedback: "'Myself' is doing nothing here. It only works when you're both the subject and the object — 'I taught myself.' Otherwise it's just a longer way to be wrong." },
    ],
  },
  {
    id: "gr4",
    situation: "You're texting a teacher about a deadline. What's the opening line?",
    choices: [
      { text: "\"Hi Ms. Reyes — quick question about the Friday deadline.\"", score: 2,
        feedback: "Names them, sets the topic, signals it's short. Everything a busy person needs before deciding whether to read on." },
      { text: "\"hey so i had a question\"", score: 0,
        feedback: "It's not the casing that costs you — it's that after reading it they still don't know what you want. Every extra round-trip makes it likelier the answer comes late." },
      { text: "\"Dear Ms. Reyes, I hope this message finds you well. I am writing to inquire...\"", score: 1,
        feedback: "Nothing wrong with it, but formal-by-default in a text reads as a template. Match the register to the medium — warm and direct beats stiff." },
    ],
  },
  {
    id: "gr5",
    situation: "Pick the stronger opening for a personal essay.",
    choices: [
      { text: "\"The bus was forty minutes late and I made a decision I still think about.\"", score: 2,
        feedback: "Specific, and it opens a question the reader wants answered. Concrete detail plus an unresolved thread is most of what a good opening line is." },
      { text: "\"Throughout my life, I have always been a person who values perseverance.\"", score: 0,
        feedback: "This sentence has been written a hundred thousand times. It states a conclusion before earning it, and 'throughout my life' is a phrase no one says out loud." },
      { text: "\"Merriam-Webster defines perseverance as...\"", score: 0,
        feedback: "The dictionary opening is the most recognisable shortcut in the genre. Readers see it and know what's coming." },
    ],
  },
  {
    id: "gr6",
    situation: "\"Its\" or \"it's\"? — \"The team lost ___ best player.\"",
    choices: [
      { text: "its", score: 2,
        feedback: "Right. It's = it is, always, no exceptions. If you can't swap in 'it is', it's 'its'. That's the entire rule and it never fails." },
      { text: "it's", score: 0,
        feedback: "Read it back as 'it is best player' — that's the test, and it catches this every single time." },
      { text: "its'", score: 0,
        feedback: "This one doesn't exist in English at all, which is oddly useful to know — if you've written it, it's wrong." },
    ],
  },
  {
    id: "gr7",
    situation: "You've written a paragraph you like, but it's one long sentence with four commas.",
    choices: [
      { text: "Break it into two or three sentences.", score: 2,
        feedback: "Almost always the right call. Long sentences make the reader hold too much at once. If you're not sure where to break, read it aloud and cut where you breathe." },
      { text: "Add semicolons to make the joins more correct.", score: 1,
        feedback: "Technically fixes the punctuation without fixing the problem. A correctly punctuated sentence that's too long is still too long." },
      { text: "Leave it — long sentences sound sophisticated.", score: 0,
        feedback: "They sound sophisticated when a writer controls them deliberately. Otherwise they read as someone who didn't stop to edit — and readers can tell which one it is." },
    ],
  },
  {
    id: "gr8",
    situation: "Someone asks you to proofread their essay. You spot a lot of problems.",
    choices: [
      { text: "Name the two biggest ones clearly, then a few line edits.", score: 2,
        feedback: "Two structural notes are actionable; twenty are paralysing. Leading with what matters most is a real skill and it's the same skill in code review, editing, and feedback of any kind." },
      { text: "Mark every single error you find.", score: 0,
        feedback: "Comprehensive and useless. Nobody rewrites an essay from forty margin notes — they get discouraged and change three things at random." },
      { text: "Say it's good so they don't feel bad.", score: 0,
        feedback: "Kind in the moment, worse for them. They asked because they wanted the thing to be better, and you're the last reader before it counts." },
    ],
  },
];

export const MONEY = [
  {
    id: "mn1",
    situation: "You've saved $200 for something specific. A thing you've wanted for months goes on sale today for $180.",
    choices: [
      { text: "Wait 48 hours. If you still want it, buy it.", score: 2,
        feedback: "The 48-hour rule beats almost every budgeting technique because it targets the actual problem — urgency, not arithmetic. Most 'today only' wants don't survive two days." },
      { text: "Buy it — you saved for something, and this is something.", score: 0,
        feedback: "This is exactly how saved money disappears. The money was allocated. 'Something' quietly became 'anything' the moment a deadline appeared." },
      { text: "Buy it, then rebuild the savings afterward.", score: 1,
        feedback: "Sometimes genuinely fine. But notice that the plan to rebuild came after the decision, not before — that ordering is what separates a choice from a rationalisation." },
    ],
  },
  {
    id: "mn2",
    situation: "Friends are going out and it costs about $40. You have the money but it wasn't in your plan for this week.",
    choices: [
      { text: "Go, and adjust something else this week to cover it.", score: 2,
        feedback: "Discipline that never bends breaks. The point isn't never spending — it's that the $40 came from somewhere you chose, instead of just being absorbed." },
      { text: "Skip it to stay on plan.", score: 1,
        feedback: "Defensible, and sometimes right. But a plan that costs you every social thing is a plan you'll abandon in a month. Sustainability matters more than any single week." },
      { text: "Go and don't think about it.", score: 0,
        feedback: "The spending isn't the problem — the not-thinking is. Forty dollars you decided on feels completely different a week later than forty dollars that just happened." },
    ],
  },
  {
    id: "mn3",
    situation: "You get $500 unexpectedly — a gift, a one-off job, doesn't matter.",
    choices: [
      { text: "Decide where all of it goes before you spend any of it.", score: 2,
        feedback: "Windfalls leak. Money without an assignment gets spent in small pieces you can't account for later. Assigning it — including an amount that's explicitly for fun — is what stops that." },
      { text: "Save all of it.", score: 1,
        feedback: "Good instinct, but all-or-nothing rules tend to snap. A plan with zero enjoyment in it is one you'll break, and then break the rest of the plan with it." },
      { text: "Spend some now and figure out the rest later.", score: 0,
        feedback: "'The rest' is the part that vanishes. It's not the first purchase that gets you — it's the four you don't remember making." },
    ],
  },
  {
    id: "mn4",
    situation: "A friend asks to borrow $60 and says they'll pay you back next month.",
    choices: [
      { text: "Only lend what you'd be genuinely okay never getting back.", score: 2,
        feedback: "This reframing solves the whole problem in advance. If $60 gone would hurt, the honest answer is no — and saying no now costs far less than the friendship damage of chasing it later." },
      { text: "Lend it and set a clear date to be paid back.", score: 1,
        feedback: "Better than nothing, and the clarity helps. But a date doesn't create money they may not have, and you'll still be the one deciding whether to chase it." },
      { text: "Lend it and say nothing about repayment to avoid awkwardness.", score: 0,
        feedback: "The awkwardness doesn't disappear — it just gets deferred and compounded. Every week of silence makes the conversation harder to have." },
    ],
  },
  {
    id: "mn5",
    situation: "Something you use costs $9.99 a month. You've had it for eight months.",
    choices: [
      { text: "Work out what it's cost so far — then decide if it's worth that.", score: 2,
        feedback: "$80 already, $120 a year. Subscriptions work precisely because $9.99 never feels like a decision. Annualising the number is the one move that makes it one again." },
      { text: "Keep it — $10 is nothing.", score: 0,
        feedback: "$10 is nothing. Six of them is $720 a year, and almost nobody who says '$10 is nothing' has only one." },
      { text: "Cancel everything on principle.", score: 1,
        feedback: "You'll re-subscribe to half of it within a month, having proven nothing. The question was never 'subscriptions bad', it's 'is this one worth $120 a year to me'." },
    ],
  },
  {
    id: "mn6",
    situation: "You're buying something online and there's a 'buy now, pay in 4 instalments' option at no interest.",
    choices: [
      { text: "Ask whether you'd buy it if you had to pay the whole amount today.", score: 2,
        feedback: "That's the entire test. Instalments don't make things cheaper, they make them feel cheaper — which is the product being sold, whether or not there's interest." },
      { text: "Use it — it's free money management, there's no interest.", score: 0,
        feedback: "There's no interest and there's still a cost: you now have four future weeks with less money, and a habit that scales badly when three purchases overlap." },
      { text: "Never use instalment plans under any circumstances.", score: 1,
        feedback: "Safe, and there are narrow cases where spreading a genuine necessity is sensible. The instinct worth building is the question above, not a blanket ban." },
    ],
  },
  {
    id: "mn7",
    situation: "You already know the advice — spend less than you earn, save first. You're still not doing it.",
    choices: [
      { text: "Make the saving automatic so it doesn't need a decision.", score: 2,
        feedback: "This is the whole insight. The gap between knowing and doing is almost never information — it's that every payday requires willpower. Automate it once and willpower stops being involved." },
      { text: "Try harder to be disciplined about it.", score: 0,
        feedback: "You've already tried that; it's why you're reading this. Systems that don't need discipline beat discipline, every time, for everyone." },
      { text: "Read more about personal finance first.", score: 0,
        feedback: "More information doesn't close a gap that isn't made of information. You could stop reading right now and be fine — the missing piece is a standing instruction, not a fact." },
    ],
  },
  {
    id: "mn8",
    situation: "A group of friends is splitting a bill and someone suggests dividing it evenly. You ordered much less than everyone else.",
    choices: [
      { text: "Say what you had and pay for it, casually and without apology.", score: 2,
        feedback: "'I only had the soup, I'll put in twelve' takes two seconds and almost never causes a problem. The discomfort you're imagining is much larger than the real one." },
      { text: "Pay the even split to avoid the conversation.", score: 1,
        feedback: "Once, fine. As a pattern it's expensive, and the people you're protecting from awkwardness have no idea it's happening." },
      { text: "Pay the even split but bring it up afterwards.", score: 0,
        feedback: "Worst of both — you've paid it and you're still having the conversation, now with the added weight of it sounding like a complaint." },
    ],
  },
];

export const PEOPLE = [
  {
    id: "pp1",
    situation: "A friend says 'it's fine, don't worry about it' — but their replies have gotten shorter all week.",
    choices: [
      { text: "It's probably not fine. Ask again, later, in private, more specifically.", score: 2,
        feedback: "Words and pattern disagree, and pattern is the more reliable signal. 'Don't worry about it' plus a week of short replies usually means 'I don't want to get into it here'." },
      { text: "Take them at their word — pushing would be intrusive.", score: 0,
        feedback: "Respecting stated boundaries matters. But 'it's fine' said once is a boundary; 'it's fine' plus a visible behaviour change is usually a test of whether you're paying attention." },
      { text: "Ask right then, in front of whoever's around.", score: 0,
        feedback: "Right instinct, wrong setting. Asking in public forces them to perform 'fine' again, and now they've had to do it twice." },
    ],
  },
  {
    id: "pp2",
    situation: "In a group project, one person keeps agreeing with every suggestion immediately and never proposes anything.",
    choices: [
      { text: "They may have an idea they don't think will be welcome. Ask them directly for one.", score: 2,
        feedback: "Fast agreement from someone who never proposes is more often self-protection than enthusiasm. A direct, specific ask — 'what would you do differently?' — is what gives them a way in." },
      { text: "They're easy to work with. Take the agreement at face value.", score: 0,
        feedback: "Comfortable, and you lose whatever they actually thought. The quietest person in a group is frequently the one who spotted the problem first." },
      { text: "Point out in front of everyone that they haven't contributed.", score: 0,
        feedback: "This reads as a callout no matter how gently you mean it, and it makes contributing feel more dangerous, not less." },
    ],
  },
  {
    id: "pp3",
    situation: "Someone tells you about a problem in detail. They haven't asked for advice.",
    choices: [
      { text: "Ask whether they want help thinking it through or just want to say it out loud.", score: 2,
        feedback: "One question that prevents most of the friction in these conversations. People are usually clear about which they want — they just don't get asked." },
      { text: "Offer the solution you can already see.", score: 0,
        feedback: "Sometimes right, often not. Jumping to a fix tells someone the venting was a problem to be solved, and they'll bring you less next time." },
      { text: "Say nothing and just listen.", score: 1,
        feedback: "Frequently exactly right. The only risk is when they genuinely did want input and read the silence as disinterest — which is why asking beats guessing." },
    ],
  },
  {
    id: "pp4",
    situation: "A teacher says 'this is good work' but their tone is flat and they hand it back without eye contact.",
    choices: [
      { text: "Ask what would have made it stronger.", score: 2,
        feedback: "You've noticed a mismatch between the words and everything around them. Asking a specific follow-up gives them permission to say the thing the flat tone was already saying." },
      { text: "Take the compliment and move on.", score: 1,
        feedback: "Nothing bad happens. You've just left the actual feedback — which was in the delivery, not the sentence — on the table." },
      { text: "Assume they don't like you.", score: 0,
        feedback: "Possible, and much less likely than the alternatives: they're tired, they're rushed, or they had a note they didn't feel like getting into. Reading flat tone as personal is the most common misread there is." },
    ],
  },
  {
    id: "pp5",
    situation: "Two friends are arguing and both separately tell you their side, expecting agreement.",
    choices: [
      { text: "Tell each of them honestly what you think, including the parts they won't like.", score: 2,
        feedback: "Harder in the moment and the only version that survives. Agreeing with both privately always surfaces eventually, and then you've lost trust with both at once." },
      { text: "Agree with whoever you're talking to.", score: 0,
        feedback: "Buys you an easy hour and costs you the friendship when they compare notes — and they will compare notes." },
      { text: "Refuse to engage with either of them about it.", score: 1,
        feedback: "Clean, and sometimes the right boundary. But total neutrality can read as not caring, especially to people who came to you specifically because they trust you." },
    ],
  },
  {
    id: "pp6",
    situation: "Someone makes a joke at your expense in a group. Everyone laughs, including them, but it landed wrong.",
    choices: [
      { text: "Let it pass in the moment, mention it to them privately later.", score: 2,
        feedback: "Public correction turns one uncomfortable moment into a scene about you. Privately, later, they'll almost always hear it — and most people genuinely didn't intend it." },
      { text: "Call it out immediately in front of everyone.", score: 0,
        feedback: "Sometimes necessary, usually costly. It shifts the group's attention from what they said to how you reacted, which isn't the outcome you wanted." },
      { text: "Laugh along and never mention it.", score: 1,
        feedback: "Fine for a one-off. But if it's a pattern, laughing along is how the pattern gets taught that it's working." },
    ],
  },
  {
    id: "pp7",
    situation: "A quiet classmate suddenly starts talking a lot and seems unusually upbeat.",
    choices: [
      { text: "Notice it, stay warm, don't make it a thing.", score: 2,
        feedback: "A change in baseline is worth noticing without being interpreted. It might be good news, it might be something else — either way, warmth without commentary leaves the door open." },
      { text: "Point out that they seem different today.", score: 1,
        feedback: "Well-meant, and it can land fine. It can also make someone suddenly self-conscious about the one day they felt like talking." },
      { text: "Assume something's wrong and ask if they're okay.", score: 0,
        feedback: "Reading every change as a warning sign is its own kind of misread, and being asked 'are you okay?' while genuinely happy is a strange experience." },
    ],
  },
  {
    id: "pp8",
    situation: "Someone apologises to you, but the apology is mostly about how bad they feel.",
    choices: [
      { text: "Notice that it's about them, and say what would actually help.", score: 2,
        feedback: "Reading the difference between 'I'm sorry that happened to you' and 'I feel awful' is a genuine skill. Naming what you need turns an apology-about-them into something useful for both of you." },
      { text: "Reassure them that it's okay so they feel better.", score: 0,
        feedback: "Extremely common, and it ends with you managing their feelings about a thing that happened to you. Notice how often this one is the automatic response." },
      { text: "Refuse to accept it.", score: 0,
        feedback: "A flawed apology is usually still an attempt. Rejecting it outright skips over the part where you could have said what would actually help." },
    ],
  },
];

export const PRESENCE = [
  {
    id: "pr1",
    situation: "You're asked a question in front of a group and you don't know the answer.",
    choices: [
      { text: "Say you don't know, and say what you'd do to find out.", score: 2,
        feedback: "Composure isn't knowing everything — it's being unbothered by not knowing. 'I don't know, but here's how I'd find out' is one of the most credible things anyone can say in a room." },
      { text: "Talk around it confidently until the topic moves on.", score: 0,
        feedback: "Everyone in the room can tell, always. This is the single fastest way to spend credibility you'll want later." },
      { text: "Apologise for not knowing.", score: 1,
        feedback: "Honest, but the apology adds a layer of anxiety that the fact itself didn't have. Not knowing something is neutral until you frame it as a failure." },
    ],
  },
  {
    id: "pr2",
    situation: "Someone interrupts you mid-sentence in a meeting or class discussion.",
    choices: [
      { text: "Let them finish, then continue exactly where you left off.", score: 2,
        feedback: "This is the whole technique. No annoyance, no comment on the interruption — just picking the thread back up. It's more effective than talking over them and it costs nothing." },
      { text: "Raise your voice and keep going.", score: 0,
        feedback: "Volume reads as rattled. The reference points for this module — the composed ones — never get louder; they get slower." },
      { text: "Stop and let them have it.", score: 1,
        feedback: "Gracious, and sometimes right. But if it becomes the pattern, you've quietly taught the room that your point ends whenever someone else starts." },
    ],
  },
  {
    id: "pr3",
    situation: "You made a visible mistake and someone points it out publicly.",
    choices: [
      { text: "Acknowledge it plainly, say what you'll do, move on.", score: 2,
        feedback: "Short, no defensiveness, no self-flagellation. Composure under a correction is more impressive than never being corrected — and it ends the moment instead of extending it." },
      { text: "Explain in detail how it happened.", score: 0,
        feedback: "Every extra sentence sounds more like a defence, even when it's genuinely just context. Keep the room's attention on the fix, not the cause." },
      { text: "Deflect with a joke.", score: 1,
        feedback: "Can work, and it can also read as not taking it seriously. If you use it, land the acknowledgement first and the joke second." },
    ],
  },
  {
    id: "pr4",
    situation: "You're waiting for someone to respond to something you said and the silence is stretching.",
    choices: [
      { text: "Let the silence sit.", score: 2,
        feedback: "Tolerating silence is one of the most underrated forms of composure. The person who fills every pause is the person who is uncomfortable, and everyone can feel it." },
      { text: "Fill it by restating your point in different words.", score: 0,
        feedback: "Restating reads as backpedalling even when you're just nervous. You said it once and it was clear — let it stand." },
      { text: "Ask if they heard you.", score: 1,
        feedback: "Fine after a genuinely long pause. Within the first few seconds it just signals that the silence bothered you." },
    ],
  },
  {
    id: "pr5",
    situation: "Someone is clearly trying to get a reaction out of you in front of other people.",
    choices: [
      { text: "Respond calmly and briefly to the content, ignore the provocation entirely.", score: 2,
        feedback: "Answering the substance while declining the bait is the move. It doesn't escalate, it doesn't submit, and it leaves the provocation sitting alone in the open where everyone can see it." },
      { text: "Match their energy so they know you won't be pushed around.", score: 0,
        feedback: "This is the swagger version, and it's the thing this module is specifically not about. Matching energy hands them control of the temperature of the room." },
      { text: "Say nothing at all.", score: 1,
        feedback: "Sometimes strong. But complete silence can read as being caught off guard — a brief, level response usually reads as more deliberate." },
    ],
  },
  {
    id: "pr6",
    situation: "You have to deliver news someone won't want to hear.",
    choices: [
      { text: "Lead with the news, then the reasoning.", score: 2,
        feedback: "Making someone wait through a preamble while they can tell bad news is coming is its own small cruelty. Say it, then explain. It reads as respect, not bluntness." },
      { text: "Build up to it gradually so it lands softer.", score: 0,
        feedback: "The build-up doesn't soften anything — it extends the part where they know something's wrong and don't know what. Most people would rather have the sentence." },
      { text: "Have someone else tell them.", score: 0,
        feedback: "If it's yours to deliver, delegating it is the one thing they'll remember about how it was handled." },
    ],
  },
  {
    id: "pr7",
    situation: "You walk into a room where you don't know anyone and everyone's already in conversation.",
    choices: [
      { text: "Move at a normal pace, find one group, listen before speaking.", score: 2,
        feedback: "Unhurried entry plus listening first. Composure in an unfamiliar room is almost entirely about pace — people read speed as nerves before they read anything else." },
      { text: "Get on your phone until someone approaches you.", score: 0,
        feedback: "The universal instinct and it closes the door completely. A phone is a visible signal that you're not available, and people respect it." },
      { text: "Introduce yourself loudly to the nearest group.", score: 1,
        feedback: "Braver than the phone and it can work. Just note that volume is doing the work there, and volume isn't the same thing as ease." },
    ],
  },
  {
    id: "pr8",
    situation: "You want something from someone — a favour, a recommendation, a chance — and you're nervous about asking.",
    choices: [
      { text: "Ask directly and specifically, then stop talking.", score: 2,
        feedback: "Specific ask, then silence. The stopping is the hard part and it's what makes it read as composed — people who are nervous keep adding qualifiers, and the qualifiers are what make it easy to say no." },
      { text: "Hint at it and hope they offer.", score: 0,
        feedback: "It puts the work on them and gives you deniability you don't need. Most people don't take the hint, and the ones who do resent being managed into it." },
      { text: "Ask, then immediately offer them a way out.", score: 1,
        feedback: "Considerate, and it's also how a real request becomes an easy no. Give them the out only if they hesitate — not before they've had a chance to say yes." },
    ],
  },
];

export const LEARN_MODULES = [
  {
    id: "etiquette",
    title: "Etiquette",
    blurb: "What's expected in rooms nobody explained to you.",
    why: "Baseline social confidence is one of the more quietly unequal things about growing up. This closes the gap directly instead of leaving it to whatever your family happened to model.",
    scenarios: ETIQUETTE,
  },
  {
    id: "grammar",
    title: "Grammar & Writing",
    blurb: "The stuff that shows up the next time you write something that matters.",
    why: "The most immediately useful of the five — the payoff arrives the next time you send an email, an application, or a message you want to get right.",
    scenarios: GRAMMAR,
  },
  {
    id: "money",
    title: "Financial Self-Control",
    blurb: "Scenarios and consequences, not lectures about budgeting.",
    why: "Most people who struggle with money already know the textbook advice and still don't act on it under pressure. This is aimed at the gap between knowing and doing.",
    scenarios: MONEY,
  },
  {
    id: "people",
    title: "People Reading",
    blurb: "What someone actually means underneath what they said.",
    why: "Situational judgment is trainable the same way any other pattern recognition is trainable — by seeing a lot of situations and finding out what was really going on.",
    scenarios: PEOPLE,
  },
  {
    id: "presence",
    title: "Commanded Presence",
    blurb: "Calm under pressure. Not volume, not dominance.",
    why: "Composure, not swagger — the specific quality of being unbothered when things get uncomfortable. Every scenario here is written to protect that distinction.",
    scenarios: PRESENCE,
  },
];

export const LEARN_LOOKUP = Object.fromEntries(LEARN_MODULES.map(m => [m.id, m]));
