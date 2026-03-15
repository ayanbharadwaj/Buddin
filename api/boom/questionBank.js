// Final path: api/boom/questionBank.js
export const QUESTION_BANK = [
  // ENERGY / MOTIVATION (6 questions)
  {
    id: "e1",
    dimension: "energy",
    text: "You just got an unexpected free hour in the middle of your day. What do you actually do with it — be honest.",
    timeOfDay: ["morning", "afternoon", "evening"],
    weight: 1.0,
    inferenceHint: "Low energy = passive consumption (nap, scroll, rewatch). High energy = new plans, proactive tasks, movement. Flat texture = low energy."
  },
  {
    id: "e2",
    dimension: "energy",
    text: "A new café opened two blocks from you. Do you check it out this week or put it on the mental list?",
    timeOfDay: ["morning", "afternoon"],
    weight: 1.0,
    inferenceHint: "Mental list/procrastination = low/flat energy. Checking it out/planning = medium/high energy."
  },
  {
    id: "e3",
    dimension: "energy",
    text: "You wake up on a Saturday with zero obligations. What's the first thing you reach for?",
    timeOfDay: ["morning"],
    weight: 1.0,
    inferenceHint: "Phone/staying in bed = low energy. Getting up, specific activities = medium/high energy."
  },
  {
    id: "e4",
    dimension: "energy",
    text: "Your favorite song comes on shuffle while you're walking. Does your pace change?",
    timeOfDay: ["morning", "afternoon"],
    weight: 0.8,
    inferenceHint: "No change/ignoring it = low/flat energy. Speeding up, moving to the beat = high energy."
  },
  {
    id: "e5",
    dimension: "energy",
    text: "If you had to run a 5-minute errand right now, how much mental effort would it take to put on your shoes?",
    timeOfDay: ["afternoon", "evening"],
    weight: 1.2,
    inferenceHint: "High effort/ugh = low energy. No big deal = medium/high energy."
  },
  {
    id: "e6",
    dimension: "energy",
    text: "Think about your physical posture right now. What does it look like?",
    timeOfDay: ["morning", "afternoon", "evening"],
    weight: 1.0,
    inferenceHint: "Slumped, lying down, heavy = low energy. Upright, moving = medium/high energy."
  },

  // SOCIAL APPETITE (6 questions)
  {
    id: "so1",
    dimension: "social_openness",
    text: "A group chat pings — 12 unread messages. What's your relationship with that notification right now?",
    timeOfDay: ["morning", "afternoon", "evening"],
    weight: 1.0,
    inferenceHint: "Dread, ignoring, 'ugh' = withdrawn. Curiosity, jumping in = open."
  },
  {
    id: "so2",
    dimension: "social_openness",
    text: "Someone you like but haven't seen in months texts asking to catch up. What's your gut reaction before you reply?",
    timeOfDay: ["afternoon", "evening"],
    weight: 1.2,
    inferenceHint: "Delaying, feeling burdened = withdrawn. Excitement, immediate reply = open."
  },
  {
    id: "so3",
    dimension: "social_openness",
    text: "You're at a grocery store and see an acquaintance two aisles over. Do you say hi or take a detour?",
    timeOfDay: ["morning", "afternoon"],
    weight: 1.0,
    inferenceHint: "Detour/avoidance = withdrawn. Saying hi = open/neutral."
  },
  {
    id: "so4",
    dimension: "social_openness",
    text: "Your weekend plans just got canceled. Are you relieved or disappointed?",
    timeOfDay: ["afternoon", "evening"],
    weight: 1.0,
    inferenceHint: "Relieved = withdrawn/low social battery. Disappointed = open/seeking connection."
  },
  {
    id: "so5",
    dimension: "social_openness",
    text: "If you could instantly teleport to a room with 5 close friends, would you do it right now?",
    timeOfDay: ["evening"],
    weight: 1.0,
    inferenceHint: "No/wanting to be alone = withdrawn. Yes = open."
  },
  {
    id: "so6",
    dimension: "social_openness",
    text: "How long has it been since you heard another person's voice and genuinely enjoyed it?",
    timeOfDay: ["morning", "afternoon", "evening"],
    weight: 1.0,
    inferenceHint: "Long time/can't remember = withdrawn/lonely. Recently = open/connected."
  },

  // STRESS / COGNITIVE LOAD (6 questions)
  {
    id: "cl1",
    dimension: "cognitive_load",
    text: "You have three things due this week that all feel important. How do you start?",
    timeOfDay: ["morning", "afternoon"],
    weight: 1.0,
    inferenceHint: "Over-specific itemization, catastrophizing, or paralysis = high load. Methodical approach = low/medium load."
  },
  {
    id: "cl2",
    dimension: "cognitive_load",
    text: "Your phone battery is at 8% and you're out. Scale of 1-10, how much does that actually bother you?",
    timeOfDay: ["afternoon", "evening"],
    weight: 1.0,
    inferenceHint: "Disproportionate distress (8-10) = high underlying cognitive load/stress. Low bother = low load."
  },
  {
    id: "cl3",
    dimension: "cognitive_load",
    text: "You drop a spoon on the floor while making breakfast. What's your internal reaction?",
    timeOfDay: ["morning"],
    weight: 1.2,
    inferenceHint: "Anger, wanting to cry, 'of course' = high load. Picking it up and moving on = low load."
  },
  {
    id: "cl4",
    dimension: "cognitive_load",
    text: "If your brain was a browser right now, how many tabs are open and what's playing music?",
    timeOfDay: ["morning", "afternoon", "evening"],
    weight: 1.0,
    inferenceHint: "Countless tabs, loud chaotic music, freezing = high load. Few tabs, calm = low load."
  },
  {
    id: "cl5",
    dimension: "cognitive_load",
    text: "Someone asks you 'what do you want for dinner?' How hard is that question to answer right now?",
    timeOfDay: ["evening"],
    weight: 1.0,
    inferenceHint: "Very hard/decision fatigue = high load. Easy = low load."
  },
  {
    id: "cl6",
    dimension: "cognitive_load",
    text: "You have to fill out a 2-page form right now. Does that feel trivial or impossible?",
    timeOfDay: ["morning", "afternoon"],
    weight: 1.0,
    inferenceHint: "Impossible/daunting = high cognitive load. Trivial = low load."
  },

  // OUTLOOK / HOPE (VALENCE) (6 questions)
  {
    id: "v1",
    dimension: "valence",
    text: "You can move one thing on your calendar from this week to next week. What do you move, and why?",
    timeOfDay: ["morning", "afternoon", "evening"],
    weight: 1.0,
    inferenceHint: "Moving something to avoid it/dread = negative valence. Concrete/specific restructuring for breathing room = neutral/positive."
  },
  {
    id: "v2",
    dimension: "valence",
    text: "If this time next month looks really good for you — what happened?",
    timeOfDay: ["morning", "afternoon", "evening"],
    weight: 1.2,
    inferenceHint: "Vague deflection ('idk, less stressed') = negative/low future-orientation. Concrete, hopeful answers = positive."
  },
  {
    id: "v3",
    dimension: "valence",
    text: "Think about the last thing you actually looked forward to. What was it?",
    timeOfDay: ["morning", "afternoon", "evening"],
    weight: 1.0,
    inferenceHint: "Can't remember/nothing = negative valence. A specific small or big thing = neutral/positive."
  },
  {
    id: "v4",
    dimension: "valence",
    text: "You find a $20 bill in an old coat pocket. What's the immediate thought?",
    timeOfDay: ["morning", "afternoon"],
    weight: 1.0,
    inferenceHint: "Indifference or 'doesn't matter' = negative valence. Delight, planning a small treat = positive valence."
  },
  {
    id: "v5",
    dimension: "valence",
    text: "If your day tomorrow was a movie genre, what are you expecting it to be?",
    timeOfDay: ["evening"],
    weight: 1.0,
    inferenceHint: "Tragedy, boring documentary, horror = negative. Comedy, adventure, calm indie film = positive."
  },
  {
    id: "v6",
    dimension: "valence",
    text: "When you look out the nearest window, what's the first detail that catches your eye?",
    timeOfDay: ["morning", "afternoon"],
    weight: 0.8,
    inferenceHint: "Grey sky, dirt, bleak details = negative valence. Sunlight, a bird, people = neutral/positive valence."
  },

  // SELF-COMPASSION / INTERNAL VOICE (6 questions)
  {
    id: "sc1",
    dimension: "self_compassion",
    text: "You made a small mistake at work — forgot to reply to something, or sent the wrong version of a file. What happens in your head?",
    timeOfDay: ["morning", "afternoon", "evening"],
    weight: 1.2,
    inferenceHint: "Harsh self-criticism, calling oneself stupid = low self-compassion. Forgiving oneself, fixing it = high."
  },
  {
    id: "sc2",
    dimension: "self_compassion",
    text: "A friend tells you they've been struggling lately and didn't say anything sooner. What's your reaction?",
    timeOfDay: ["morning", "afternoon", "evening"],
    weight: 1.0,
    inferenceHint: "Extending immense grace to the friend usually indicates what they wish for themselves; compare with sc1 if possible. If they say 'I'd never want them to feel like a burden', they might feel like a burden themselves."
  },
  {
    id: "sc3",
    dimension: "self_compassion",
    text: "You look in the mirror before taking a shower. What's the immediate internal monologue?",
    timeOfDay: ["morning", "evening"],
    weight: 1.0,
    inferenceHint: "Criticism, focusing on flaws = low self-compassion. Neutrality or kindness = high."
  },
  {
    id: "sc4",
    dimension: "self_compassion",
    text: "You set a goal to exercise today, but you just didn't do it. What do you tell yourself before bed?",
    timeOfDay: ["evening"],
    weight: 1.0,
    inferenceHint: "'I'm lazy, I always fail' = low self-compassion. 'I needed rest today, tomorrow is a new day' = high."
  },
  {
    id: "sc5",
    dimension: "self_compassion",
    text: "If your inner critic had a physical voice, whose voice does it sound like?",
    timeOfDay: ["morning", "afternoon", "evening"],
    weight: 1.0,
    inferenceHint: "A harsh parent, angry boss, or loud self = struggle with internal voice. Doesn't have one/quiet = high self-compassion."
  },
  {
    id: "sc6",
    dimension: "self_compassion",
    text: "Think of a compliment you received recently. Did you believe it?",
    timeOfDay: ["morning", "afternoon", "evening"],
    weight: 1.0,
    inferenceHint: "Dismissal, thinking they lied = low self-compassion. Acceptance = high."
  }
];
