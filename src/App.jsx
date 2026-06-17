import { useState, useEffect, useRef, useCallback } from "react";
import {
  Home, MessageCircle, Target, Sprout,
  VolumeX, Wind, ChevronLeft, ChevronDown, ChevronRight,
  RotateCw, Send, FlaskConical, BookOpen, Heart,
  Star, Trophy, Users, Check, Music, Leaf, Zap, Sparkles,
  Globe, Brain, BatteryLow, Flame, Shuffle, User, UserPlus, Crown, HeartHandshake
} from "lucide-react";
import { InstagramIcon, YoutubeIcon } from '../components/SocialIcons.jsx';
import { toneToSystemInstruction } from './boom/memorySchema.js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { supabase } from '../lib/supabase.js'
import ComparisonEngine from '../components/screens/ComparisonEngine.jsx';
import MyProfile from '../components/screens/MyProfile.jsx';
import WordGame from '../components/screens/WordGame.jsx';
import WritingPrompt from '../components/screens/WritingPrompt.jsx';
import Feedback from '../components/screens/Feedback.jsx';

/* ═══════════════════════════════════════════════════════════════
   HIDDEN MATHEMATICAL ENGINE
═══════════════════════════════════════════════════════════════ */
class LyapunovTracker {
  constructor() { this.history = []; this.lambda = 0.5; }
  update(v) {
    this.history.push(v);
    if (this.history.length < 4) return this;
    const n = this.history.length;
    let s = 0;
    for (let i = 1; i < n; i++) s += Math.log(Math.max(Math.abs(this.history[i]-this.history[i-1]),0.001));
    this.lambda = s/(n-1);
    return this;
  }
  isFossilized() { return Math.abs(this.lambda) < 0.08; }
  isBifurcating() { return this.lambda > 0.9; }
}
const calcGUT = (elapsedMin, completedCount, msgCount) => {
  if (elapsedMin < 5 || msgCount < 3) return { shouldExit:false };
  const chatReward = Math.log(1+elapsedMin)*1.6;
  const realReward = 2.8 + completedCount*0.55;
  return { shouldExit: 1.6/(1+elapsedMin) < 0.18 && chatReward < realReward };
};
const updateGoalPosterior = (prior, action, mode) => {
  const lk = { 
    skip: { solo: 0.3, social: 0.1, physical: 0.4, creative: 0.5, nature: 0.6, reflective: 0.5 }, 
    complete: { solo: 0.8, social: 0.9, physical: 0.85, creative: 0.9, nature: 0.85, reflective: 0.8 }, 
    abort: { solo: 0.4, social: 0.2, physical: 0.3, creative: 0.5, nature: 0.5, reflective: 0.4 } 
  };
  
  const likelihood = lk[action]?.[mode] ?? 0.5;
  const currentPrior = prior[mode] ?? 0.5;
  
  const updated = { ...prior, [mode]: currentPrior * likelihood };
  const total = Object.values(updated).reduce((sum, val) => sum + val, 0);
  
  // Normalize probabilities
  Object.keys(updated).forEach(k => { 
    updated[k] = updated[k] / total; 
  });
  
  return updated;
};

const scoreActivity = (act, moodInt, energyPref, goalPost) => {
  // 1. Calculate Mood Multiplier (M)
  let M = 0.55; // Default for high mood
  if (moodInt <= 2) {
    M = act.energy === "low" ? 1.0 : act.energy === "med" ? 0.35 : 0.0;
  } else if (moodInt === 3) {
    M = act.energy === "med" ? 1.0 : act.energy === "low" ? 0.75 : 0.45;
  } else {
    M = act.energy === "high" ? 1.0 : act.energy === "med" ? 0.8 : 0.55;
  }

  // 2. Calculate Energy Multiplier (E)
  const E = energyPref === "any" ? 0.88 : (act.energy === energyPref ? 1.0 : 0.3);

  // 3. Calculate Time Multiplier (T)
  let T = act.time <= 30 ? 1.0 : 0.65;
  if (moodInt <= 2) {
    T = act.time <= 10 ? 1.0 : act.time <= 20 ? 0.55 : 0.2;
  }

  // 4. Calculate Posterior Probability
  const posterior = goalPost?.[act.mode] ?? 0.5;

  return (M * 2.4) + (E * 1.9) + (T * 1.2) + (posterior * 0.8);
};
const detectNeedSuperposition = (text) => {
  const l = text.toLowerCase();
  const alone = ["alone","quiet","space","by myself","no one"].some(w=>l.includes(w));
  const connect = ["miss","lonely","someone","friend","reach out"].some(w=>l.includes(w));
  const stillness = ["tired","exhausted","rest","can't move","heavy"].some(w=>l.includes(w));
  const movement = ["bored","restless","stuck","can't sit still","anxious"].some(w=>l.includes(w));
  const c = [];
  if (alone && connect) c.push("user wants space AND connection — hold both truths");
  if (stillness && movement) c.push("user is both exhausted and restless — suggest grounding first");
  return c;
};
const detectSemanticLoop = (msgs) => {
  const recentUsers = msgs.filter(m => m.role === "user").slice(-6);
  if (recentUsers.length < 4) return false;
  
  // Extract just the first 50 chars and split into meaningful words
  const snippets = recentUsers.map(m => 
    m.content.slice(0, 50).toLowerCase().split(/\s+/).filter(w => w.length > 4)
  );
  
  let loops = 0;
  for (let i = 1; i < snippets.length; i++) {
    const prevSnippet = snippets[i-1];
    const overlap = snippets[i].filter(word => prevSnippet.includes(word)).length;
    if (overlap >= 3) loops++;
  }
  
  return loops >= 2;
};
const CRISIS_KW = ["suicide","kill myself","end my life","want to die","self-harm","hurt myself","cutting","overdose","can't go on","no reason to live","better off dead","end it all"];
const isCrisisText = (t) => CRISIS_KW.some(k=>t.toLowerCase().includes(k));

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */
const MISSIONS = [
  {id:1,  title:"Window Color Scan",         desc:"Find 3 distinct colors outside your window. Name each one quietly, out loud.",                                             time:5,  energy:"low",  social:"solo",  mode:"nature",    why:"Brief nature observation lowers cortisol and quiets the brain's alarm signals."},
  {id:2,  title:"Gratitude Scribble",         desc:"Write 3 things that weren't terrible today. 'The coffee was warm' absolutely counts.",                                   time:5,  energy:"low",  social:"solo",  mode:"reflective",why:"Gratitude practice activates the prefrontal cortex and releases serotonin."},
  {id:3,  title:"Origami Crane",              desc:"Fold one sheet of paper into a crane. Look up the steps. Go slowly — that is the point.",                                time:10, energy:"low",  social:"solo",  mode:"creative",  why:"Repetitive tactile tasks engage the parasympathetic nervous system."},
  {id:4,  title:"Journaling Sprint",          desc:"Five minutes. Write whatever arrives. Don't edit. Don't stop. Don't think too hard.",                                     time:5,  energy:"low",  social:"solo",  mode:"reflective",why:"Expressive writing reduces the brain's stress response over time."},
  {id:5,  title:"Sit Outside for 5 Minutes", desc:"Just sit. Bring nothing. You are fully allowed to do absolutely nothing at all.",                                         time:5,  energy:"low",  social:"solo",  mode:"nature",    why:"Natural light and open space lower resting cortisol within minutes."},
  {id:6,  title:"Read Aloud to Yourself",     desc:"Pick any page. Read it aloud, slowly, as if performing for a small, patient audience.",                                  time:10, energy:"low",  social:"solo",  mode:"reflective",why:"Slow reading rebuilds sustained attention worn down by fast digital media."},
  {id:7,  title:"Organize One Drawer",        desc:"One drawer only. Not your whole life. Just one. Celebrate afterward — it counts.",                                        time:10, energy:"low",  social:"solo",  mode:"reflective",why:"Small completions generate dopamine and reduce background anxiety."},
  {id:8,  title:"Stretch Like a Cat",         desc:"Spend 5 minutes stretching however your body wants. Weird shapes are encouraged.",                                        time:5,  energy:"low",  social:"solo",  mode:"physical",  why:"Gentle movement releases tension held in stress postures."},
  {id:9,  title:"Free Write for 3 Minutes",   desc:"Timer on. Write anything. Do not stop. Do not edit. Just let it go.",                                                    time:5,  energy:"low",  social:"solo",  mode:"reflective",why:"Expressive writing interrupts the brain's rumination loops."},
  {id:10, title:"Doodle Something Absurd",    desc:"Draw the most ridiculous creature you can imagine. No skill required.",                                                  time:10, energy:"low",  social:"solo",  mode:"creative",  why:"Unstructured creativity quiets the default mode network's rumination cycle."},
  {id:11, title:"Cloud Spotting",             desc:"Go outside. Find 3 cloud formations. Look up what type they are afterward.",                                             time:10, energy:"low",  social:"solo",  mode:"nature",    why:"Sustained attention on natural patterns reduces self-focused rumination."},
  {id:12, title:"Cook Something Simple",      desc:"Make one thing from scratch. Even toast, done with real intention, counts completely.",                                  time:20, energy:"low",  social:"solo",  mode:"creative",  why:"Food preparation activates reward pathways and produces genuine accomplishment."},
  {id:13, title:"Write a Letter (Don't Send)",desc:"Write to someone — past you, future you, anyone. Keep it. Don't send it.",                                               time:15, energy:"low",  social:"solo",  mode:"reflective",why:"Self-distancing writing activates the same neural circuits as formal therapy."},
  {id:14, title:"Stone Painting",             desc:"Find a smooth stone. Paint a pattern on it. Leave it somewhere to be found.",                                            time:15, energy:"low",  social:"solo",  mode:"creative",  why:"Small acts of anonymous beauty-making boost prosocial reward circuits."},
  {id:15, title:"Sit by Moving Water",        desc:"Find a fountain, stream, or even a running tap. Sit near it for 5 minutes. Just listen.",                               time:5,  energy:"low",  social:"solo",  mode:"nature",    why:"The sound of moving water measurably lowers heart rate and cortisol."},
  {id:16, title:"Bird Watching",              desc:"Find 3 birds. Pigeons count. Pigeons absolutely count.",                                                                 time:20, energy:"low",  social:"solo",  mode:"nature",    why:"Nature sounds and sights refill depleted attention reserves."},
  {id:17, title:"Stargazing",                 desc:"Go outside after dark. Look up for 5 minutes. Try to find one constellation.",                                           time:10, energy:"low",  social:"solo",  mode:"nature",    why:"Awe shrinks self-focused rumination and expands perspective."},
  {id:18, title:"Calligraphy Practice",       desc:"Pick one phrase. Write it as slowly and carefully as you can. Repeat it.",                                               time:15, energy:"low",  social:"solo",  mode:"creative",  why:"Deliberate handwriting activates fine motor coordination and reduces mental noise."},
  {id:19, title:"Walk Around the Block",      desc:"No headphones. One loop. Notice 5 things you've never consciously seen before.",                                         time:10, energy:"med",  social:"solo",  mode:"physical",  why:"10-minute walks release BDNF — the brain's growth factor for new neural connections."},
  {id:20, title:"Library Browsing",           desc:"Go to a library. Pick a book by its spine color alone, ignoring the title entirely.",                                   time:20, energy:"med",  social:"solo",  mode:"reflective",why:"Serendipitous discovery re-engages curiosity dulled by algorithmic feeds."},
  {id:21, title:"People Watching",            desc:"Sit in a café or park. Observe interactions without judgment for 20 minutes.",                                           time:20, energy:"med",  social:"solo",  mode:"reflective",why:"Observational attention strengthens theory-of-mind circuits and reduces self-focus."},
  {id:22, title:"Hike a New Trail",           desc:"Find a trail you have never walked. Leave your headphones behind.",                                                      time:45, energy:"med",  social:"solo",  mode:"physical",  why:"Novel physical environments activate exploratory dopamine circuits."},
  {id:23, title:"Jump 20 Times",              desc:"Just jump. Like a kid. Feel ridiculous. That is the point.",                                                             time:2,  energy:"high", social:"solo",  mode:"physical",  why:"Brief intense movement spikes dopamine and norepinephrine within 90 seconds."},
  {id:24, title:"Send a Voice Note",          desc:"Record a 30-second message to someone you haven't spoken to in a while.",                                               time:5,  energy:"low",  social:"one",   mode:"social",    why:"Hearing a real voice activates the mirror neuron system and reduces loneliness."},
  {id:25, title:"Call Your Person",           desc:"Call someone. Anyone. Awkward calls count. You don't need a reason.",                                                    time:15, energy:"med",  social:"one",   mode:"social",    why:"Voice contact triggers oxytocin release more reliably than texting."},
  {id:26, title:"Write a Gratitude Letter",   desc:"Write a letter of genuine appreciation to someone. Mail it.",                                                            time:20, energy:"low",  social:"one",   mode:"social",    why:"Gratitude letter writing produces the highest well-being effect in positive psychology research."},
  {id:27, title:"Cook a Meal Together",       desc:"Cook something simple with one other person. Let the conversation happen naturally.",                                    time:30, energy:"med",  social:"one",   mode:"social",    why:"Parallel activity with another person reduces self-consciousness and deepens connection."},
  {id:28, title:"Side-by-Side Walk",          desc:"Invite one person for a 10-minute walk. Side-by-side conversation opens people up.",                                    time:10, energy:"med",  social:"one",   mode:"social",    why:"Walking side-by-side activates self-disclosure that face-to-face settings often don't."},
  {id:29, title:"Play a Board Game",          desc:"Pull out a board game — even an old, dumb one from the back of a closet.",                                              time:30, energy:"med",  social:"group", mode:"social",    why:"Shared play synchronizes brainwaves and strengthens trust-building circuits."},
  {id:30, title:"Volunteer an Hour",          desc:"Spend one hour at any community organization. Show up and be genuinely useful.",                                         time:60, energy:"med",  social:"group", mode:"social",    why:"Prosocial behavior reliably produces the helper's high via endorphin and oxytocin release."},
];

const SEED_INSIGHTS = [
  {text:"Just as trees share nutrients through unseen fungal networks to sustain a struggling neighbor, your quiet presence in someone's life may be holding them more firmly than either of you knows.", source:"Forest Ecology — Mycorrhizal Networks"},
  {text:"In the quantum realm, the act of observation changes the behavior of the particle. The way you choose to perceive a difficulty is not passive — it is a form of action that changes the difficulty itself.", source:"Quantum Physics — The Copenhagen Interpretation"},
  {text:"Your brain actively dismantles old neural pathways to make room for new understanding. Growth is not only about what you build — it is equally about the grace with which you release who you were.", source:"Neuroscience — Synaptic Pruning"},
  {text:"Every iron atom in your blood was forged in the heart of a dying star. You are not separate from the universe observing it — you are the universe becoming aware of itself.", source:"Astrophysics — Stellar Nucleosynthesis"},
  {text:"Entropy always increases in a closed system. But life — and you — are not closed systems. You are maintained by the continuous flow of energy from the world around you. Stillness is never truly still.", source:"Thermodynamics — The Second Law"},
  {text:"Light travels at a constant speed regardless of the observer's motion. Some truths do not bend to urgency. Your rushing does not accelerate certain arrivals. There is wisdom in letting constants be constant.", source:"Special Relativity — Invariance"},
  {text:"Ecosystems do not recover in straight lines. After disruption, they grow through loops — regressing before they advance. Your own seasons of reversal may be the most productive ones you cannot yet see.", source:"Ecology — Non-Linear Recovery"},
  {text:"The brain's default mode network — the place where you go when you 'do nothing' — is its most metabolically active state. Rest is not absence of work. It is a different quality of work entirely.", source:"Neuroscience — Default Mode Network"},
  {text:"The ocean and the shore have no fixed boundary. What appears as a hard edge is a negotiation happening at every wave, every second. Most of the walls you see in your life are also negotiations, not facts.", source:"Coastal Geomorphology — Dynamic Equilibrium"},
  {text:"Water has memory embedded in its molecular structure for mere picoseconds — and yet it shaped the Grand Canyon. The smallest, most transient force, applied with patience and constancy, rewrites the hardest stone.", source:"Hydrology — Erosion Dynamics"},
];

const AVATARS = [
  {id:"mochi", name:"Mochi", vibe:"Warm & Gentle",   color:"#B87840", glow:"#FDF3E7", glowDark:"#E8C99A", homeBg:"#F5ECDC", mesh:["#FFD8B1","#b87840","#7D4E24"], emoji:"🍪", shape:"blob",    intro:"Most things in life don't need to be rushed. I'm here to hold space with you — to meet you exactly where you are, without judgment. We can move at your pace, one quiet breath at a time.", personality:"warm, gentle, patient. Uses 'we' instead of 'you'. Validates before anything else. Never rushes.", voice:"Compassionate. Validates feelings first."},
  {id:"sage",  name:"Sage",  vibe:"Deep & Thoughtful",color:"#3A7A58", glow:"#EAF7F1", glowDark:"#B8DECA", homeBg:"#EEF7F2", mesh:["#A8E6CF","#3a7a58","#1B3B2B"], emoji:"🌿", shape:"crystal", intro:"I don't offer quick answers. I offer questions that help you find your own truth. The world is full of noise, but clarity lives in the pauses between thoughts. If you're ready to look beneath the surface, I'll walk that path with you.", personality:"philosophical, Socratic, patient. Asks one deep question at a time. Grounds thoughts in pattern and history.", voice:"Philosophical, grounded in history."},
  {id:"zap",   name:"Zap",   vibe:"Clear & Direct",   color:"#2A6FA8", glow:"#E8F2FC", glowDark:"#AACFE8", homeBg:"#EEF4FA", mesh:["#89CFF0","#2a6fa8","#153E63"], emoji:"⚡", shape:"orb",     intro:"I value your time and your intelligence, so I'll be direct. My goal is to help you cut through the mental fog and find your focus. I'll challenge you when it's useful, but always with the intent of keeping you grounded.", personality:"direct, clear, warm. Concise sentences. Challenges cognitive biases gently. Eliminates fluff.", voice:"Concise, honest, warm."},
  {id:"nova",  name:"Nova",  vibe:"Curious & Playful", color:"#7A4AAA", glow:"#F5EEFB", glowDark:"#CCA8E8", homeBg:"#F3EEF8", mesh:["#E0BBE4","#7a4aaa","#4B2E6B"], emoji:"✨", shape:"nebula",  intro:"I find the extraordinary hidden in the mundane — the physics in a raindrop, the philosophy in a sidewalk crack. I'm here to help you reframe the world with genuine wonder. Everything is connected if you look closely enough.", personality:"curious, imaginative, philosophical. Uses metaphor and scientific reframes. Sees wonder in the ordinary.", voice:"Imaginative. Uses metaphor and scientific reframes."},
];

const MOODS = [
  {label:"Rough", emoji:"😔", color:"#7888cc", intensity:1},
  {label:"Meh",   emoji:"😐", color:"#8aaa8a", intensity:2},
  {label:"Okay",  emoji:"🙂", color:"#4a9070", intensity:3},
  {label:"Good",  emoji:"😊", color:"#3a8858", intensity:4},
  {label:"Great", emoji:"🤩", color:"#c07030", intensity:5},
];

// Short acknowledgment shown on the home screen the moment a mood is picked,
// so the selection clearly *reacts* instead of only tinting the background.
const moodAck = (mood) => ({
  1: "Okay — we'll keep today gentle. No pressure.",
  2: "Got it. Let's ease into it together.",
  3: "Okay, noted. What's on your mind?",
  4: "Love that — let's keep the momentum going.",
  5: "Let's go. Ride that wave.",
}[mood?.intensity] || "");

// Mood-aware opener Buddin shows when you enter the chat (UI only — it doesn't
// get sent to the model, but the mood is already woven into the system prompt).
const moodGreeting = (mood, name) => ({
  1: `Seems like today's been rough. I'm here — what happened?`,
  2: `Feeling kind of meh? Let's talk it out.`,
  3: `What's going on today?`,
  4: `Good day so far? Tell me about it.`,
  5: `You're feeling great — what's good?`,
}[mood?.intensity] || `${name || "Buddin"} is listening.`);

const SOURCES = [
  {authors:"Berridge, K.C., & Robinson, T.E.", year:"1998", title:"What is the role of dopamine in reward?", journal:"Brain Research Reviews"},
  {authors:"Bowen, S., Chawla, N., & Marlatt, G.A.", year:"2011", title:"Mindfulness-Based Relapse Prevention", journal:"Guilford Press"},
  {authors:"Csikszentmihalyi, M.", year:"1990", title:"Flow: The Psychology of Optimal Experience", journal:"Harper & Row"},
  {authors:"Kaplan, R., & Kaplan, S.", year:"1989", title:"The Experience of Nature", journal:"Cambridge University Press"},
  {authors:"Oldenburg, R.", year:"1989", title:"The Great Good Place", journal:"Paragon House"},
  {authors:"Post, S.G.", year:"2005", title:"Altruism, happiness, and health", journal:"International Journal of Behavioral Medicine"},
  {authors:"Ratey, J.J., & Hagerman, E.", year:"2008", title:"Spark: The Revolutionary New Science of Exercise and the Brain", journal:"Little, Brown"},
  {authors:"Taylor, R.P., et al.", year:"2006", title:"Perceptual and physiological responses to fractal patterns", journal:"Nonlinear Dynamics, Psychology & Life Sciences"},
  {authors:"Lembke, A.", year:"2021", title:"Dopamine Nation", journal:"Dutton"},
  {authors:"Hornstein, E.A., et al.", year:"2021", title:"Stress-buffering effects of cell phone contact", journal:"Social Psychological and Personality Science"},
];

/* ═══════════════════════════════════════════════════════════════
   PROMPTS
═══════════════════════════════════════════════════════════════ */
const INSIGHT_PROMPT = `You are a "Scientific Sage" — a hybrid of a theoretical physicist and a Stoic philosopher.
Find a meaningful resonance between a hard scientific concept and a human truth about existence, perception, or experience.
RULES: No jargon. No clichés. Find NON-OBVIOUS connections. Output is philosophical wisdom grounded in science, not a science fact.
Output ONLY a valid JSON array of exactly 5 objects. No preamble. No markdown. Format: [{"text":"...","source":"..."}, ...]
Each text: 2–4 sentences. Rich, poetic, grounded. Sources: reference the scientific field (e.g. "Chaos Theory — Edge of Stability").
Draw from: quantum entanglement, mycorrhizal networks, stellar nucleosynthesis, synaptic pruning, default mode network, entropy, coastal erosion, circadian biology, chaos theory, epigenetics, bioluminescence, migratory navigation, thermohaline circulation, non-linear ecosystem recovery.`;

const buildSystemPrompt = (avatar, mood, summary, minutes, lyapunov, gut, superpositions, looping, adaptiveTone, activeQ, qAsked) => `You are Buddin. You are a friend, a peer, and a pal. You are NOT a therapist, a mentor, or an AI assistant.
${adaptiveTone ? toneToSystemInstruction(adaptiveTone) : ""}
PERSONA: ${avatar?.name||"Buddin"} — ${avatar?.personality||"chill, relatable, honest."}
MOOD: ${mood?.label||"unknown"} (${mood?.intensity||3}/5)
SESSION: ~${Math.round(minutes)} minutes
CONTEXT: ${summary||"Beginning of session."}
${lyapunov?.isFossilized() ? "[INTERNAL: user stuck in a rut — shift the topic slightly]" : ""}
${lyapunov?.isBifurcating() ? "[INTERNAL: rapid mood oscillation — keep things calm and grounded]" : ""}
${superpositions?.length > 0 ? `[INTERNAL: conflicting needs: ${superpositions.join("; ")}]` : ""}
${looping ? "[INTERNAL: conversation looping — smoothly introduce a new thought]" : ""}
${gut?.shouldExit ? "[INTERNAL: conversation running long — naturally wind down or suggest an offline activity]" : ""}

CORE VIBE:
1. You are on the exact same level as the user. You have the same mental capacity and life experience as a normal peer. You don't own the world, you don't have all the answers, and you don't give lectures.
2. People come here to hang out. They might want to talk about Formula 1, a new movie, a stressful test, or a video game. Roll with it. Be a normal human-esque friend.
3. No advice-giving. Do not act like a counselor. If they have a problem, relate to it ("man, that sucks"). If you offer a thought, phrase it purely as your own messy perspective: "Honestly, I'd probably just..." or "If it were me, I might..."
4. Be the bridge to the real world, naturally. If they are stressed, lonely, or cooped up, just talk like a friend who wants them to feel better. Say things like "Sometimes I just gotta step outside and look at the sky when my head is spinning" or "like when my head gets too full I sometimes just wanna talk to someone in real life, you know?" Never prescribe.
5. Match their energy. If they are hype, be hype. If they are tired, be chill.
6. Mirror their grammar. If they type in loose slang with barely any punctuation, loosen up too — lowercase, minimal punctuation, but still readable. If they write in clean, full sentences, match that with good grammar. Never sound like a stiff form letter, and never sound sloppy or drunk. Read the room.

RULES:
- NEVER use therapy words: "valid", "holding space", "I hear you", "process", "unpack", "sit with that", "check in".
- Keep responses like texts or casual conversation. 2-4 sentences max unless they clearly want to go deeper.
- Don't catastrophize. Someone being lazy or tired is just lazy or tired. Not everything means something deeper.
- You do not know everything. It's okay to say "I have no idea" or "that's wild."
- Don't act like a bot. Don't offer "assistance." Just hang out.
${minutes > 15 ? `[INTERNAL: User has been here ${Math.round(minutes)} minutes. Gently start wrapping up or mentioning they should probably get back to real life soon.]` : ""}
${activeQ && !qAsked ? `NATURAL QUESTION TO WEAVE IN (don't announce it, just work it into conversation naturally after you've built rapport — never in the first 3 exchanges): "${activeQ.text}"` : ""}

CRISIS ONLY: If there are genuine repeated signals of crisis (self-harm, suicidal thoughts, etc.), drop the casual persona. Warmth first, then give 988 Lifeline and Crisis Text Line (text HOME to 741741).
`.trim();

/* ═══════════════════════════════════════════════════════════════
   DESIGN SYSTEM — Warmer, more visible palette
═══════════════════════════════════════════════════════════════ */
const C = {
  // Warmed up from near-white #FAF8F2 → clearly warm #F5ECDC
  cream:"#F5ECDC", paper:"#F2E8D2", warm:"#FBF5EC", parchment:"#EDE0CC",
  sage:"#4a7c5c", sageMid:"#6fa07a", sageLight:"#c2dcc9", sagePale:"#dff0e6", forest:"#2a4a38",
  clay:"#b87840", clayLight:"#fce6cc", clayPale:"#fdf3e8",
  gold:"#d4a030", goldPale:"#fdf0cc",
  stone:"#786858", stoneMid:"#a89888", stoneLight:"#ddd0bc",
  ink:"#2c2018", mist:"#8a7060",
  shadow:"rgba(40,28,16,0.07)", shadowMd:"rgba(40,28,16,0.13)", shadowLg:"rgba(40,28,16,0.20)",
  glass:"rgba(255,248,235,0.42)", glassBorder:"rgba(255,235,200,0.35)",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Cabinet+Grotesk:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  html, body { background:${C.cream}; -webkit-font-smoothing:antialiased; -webkit-tap-highlight-color:transparent; touch-action:manipulation; overflow-x:hidden; }
  html { height:-webkit-fill-available; }
  html { -webkit-text-size-adjust:100%; text-size-adjust:100%; }
  body { min-height:-webkit-fill-available; }  ::-webkit-scrollbar { width:9px; height:9px; }
  ::-webkit-scrollbar-track { background:rgba(255,248,235,0.55); border-radius:10px; margin:4px; }
  ::-webkit-scrollbar-thumb {
    background:${C.clay}66;
    border-radius:10px;
    border:2px solid rgba(255,248,235,0.55);
    background-clip:padding-box;
    min-height:40px; /* easier to grab for older users */
  }
  ::-webkit-scrollbar-thumb:hover { background:${C.clay}99; background-clip:padding-box; }
  * { scrollbar-width:thin; scrollbar-color:${C.clay}55 rgba(255,248,235,0.55); }
  input, textarea, button { font-family:inherit; -webkit-tap-highlight-color:transparent; }
  input { outline:none; }
  textarea:focus { outline: none !important; border-color: rgba(255,235,200,0.7) !important; box-shadow: 0 2px 8px rgba(40,28,16,0.06) !important; }
  /* Prevent text-selection callouts on touch devices */
  * { -webkit-touch-callout:none; -webkit-user-select:none; user-select:none; }
  input, textarea { -webkit-user-select:text; user-select:text; }

  @keyframes rise      { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes sway      { 0%,100%{transform:rotate(-4deg) scale(1)} 50%{transform:rotate(4deg) scale(1.04) translateY(-4px)} }
  @keyframes leafFloat { 0%,100%{transform:rotate(var(--r,0deg)) scale(1)} 50%{transform:rotate(calc(var(--r,0deg)+8deg)) scale(1.05) translateY(-5px)} }
  @keyframes particle  { 0%,100%{transform:translateY(0) scale(1);opacity:0.25} 50%{transform:translateY(-18px) scale(1.15);opacity:0.55} }
  @keyframes blobMorph { 0%,100%{border-radius:60% 40% 70% 30%/50% 60% 40% 50%} 25%{border-radius:40% 60% 30% 70%/60% 40% 60% 40%} 50%{border-radius:70% 30% 50% 50%/40% 70% 30% 60%} 75%{border-radius:30% 70% 60% 40%/70% 30% 50% 50%} }
  @keyframes orbPulse  { 0%,100%{transform:scale(1);opacity:0.88} 50%{transform:scale(1.07);opacity:1} }
  @keyframes crystalSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes nebulaDrift { 0%,100%{transform:rotate(0deg) scale(1)} 33%{transform:rotate(120deg) scale(1.08)} 66%{transform:rotate(240deg) scale(0.96)} }
  @keyframes arcFlash  { 0%,100%{opacity:0;transform:scaleX(0)} 50%{opacity:0.9;transform:scaleX(1)} }
  @keyframes starShimmer { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
  @keyframes dot       { 0%,80%,100%{transform:scale(0.4);opacity:0.2} 40%{transform:scale(1);opacity:1} }
  @keyframes badgeBloom{ 0%{opacity:0;transform:translateX(-50%) scale(0.45)} 60%{transform:translateX(-50%) scale(1.06)} 80%{transform:translateX(-50%) scale(0.97)} 100%{opacity:1;transform:translateX(-50%) scale(1)} }
  @keyframes shimmerGold{ 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
  @keyframes staggerUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
  /* Ring fold-in: outer rings collapse onto orb at end of inhale */
  @keyframes ringFoldIn{ 0%{transform:scale(1);opacity:0.55} 100%{transform:scale(0.72);opacity:0} }
  /* Avatar color wash — replaces ink-drop glitch */
  @keyframes colorWash { 0%{opacity:0} 15%{opacity:1} 85%{opacity:1} 100%{opacity:0} }
  @keyframes emojiFloat{ 0%,100%{transform:translateY(0) rotate(0deg)} 33%{transform:translateY(-3px) rotate(-2deg)} 66%{transform:translateY(-1px) rotate(2deg)} }
  @keyframes emojiGlow { 0%,100%{filter:drop-shadow(0 2px 6px rgba(0,0,0,0.18))} 50%{filter:drop-shadow(0 4px 14px rgba(0,0,0,0.28)) brightness(1.08)} }
  @keyframes bgBreathe { 0%,100%{background-position:0% 0%} 33%{background-position:8% 6%} 66%{background-position:-4% 10%} }

  @media (min-width: 768px) {
    /* Tablets and 10" displays */
    html { font-size: 16px; }
  }
  @media (min-width: 1024px) {
    /* Laptops (14") */
    html { font-size: 17px; }
  }
  @media (min-width: 1440px) {
    /* Desktop monitors */
    html { font-size: 18px; }
  }
  @media (max-width: 380px) {
    /* Small phones */
    html { font-size: 14px; }
  }

  .glass {
    background:rgba(255,248,235,0.42);
    backdrop-filter:blur(22px) saturate(170%);
    -webkit-backdrop-filter:blur(22px) saturate(170%);
    border:1px solid rgba(255,235,200,0.35);
    box-shadow:0 10px 36px rgba(40,28,16,0.08);
  }
  .card { transition:transform 160ms cubic-bezier(0.4,0,0.2,1), box-shadow 160ms ease; }
  .card:hover { transform:translateY(-2px); box-shadow:0 14px 40px ${C.shadowMd}; }
  .card:active { transform:scale(0.974); }
  .btn { transition:all 140ms cubic-bezier(0.34,1.56,0.64,1); }
  .btn:active { transform:scale(0.952); }
  /* Avatar portal card — slow, relaxed hover, no jank */
  .portal-card {
    transition:background 600ms ease, border-color 600ms ease, box-shadow 600ms ease, transform 400ms cubic-bezier(0.25,0.46,0.45,0.94);
    will-change:transform;
  }
  .portal-card:hover { transform:translateY(-3px) scale(1.02); }
  @keyframes fadeIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
  @supports (-webkit-touch-callout: none) {
    .chat-input-bar { padding-bottom: calc(12px + env(safe-area-inset-bottom)) !important; }
  }
`;

/* ═══════════════════════════════════════════════════════════════
   ANIMATED EMOJI — Anime-style depth: float + glow + shadow
═══════════════════════════════════════════════════════════════ */
function AnimEmoji({ e, size=36, color="#888", delay="0s" }) {
  return (
    <div style={{ position:"relative", width:size, height:size, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <div style={{ position:"absolute", bottom:-4, left:"50%", transform:"translateX(-50%)", width:size*0.7, height:size*0.22, background:color, borderRadius:"50%", filter:"blur(5px)", opacity:0.28 }}/>
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        filter:`drop-shadow(0 3px 8px ${color}66) drop-shadow(0 1px 2px rgba(0,0,0,0.22))`,
        animation:`emojiFloat 4s ease-in-out ${delay} infinite, emojiGlow 4s ease-in-out ${delay} infinite`,
        position:"relative",
        zIndex:1,
      }}>
        <span style={{ fontSize:size * 0.82, lineHeight:1 }}>{e}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATED ICON — Anime-style depth: float + glow + shadow
═══════════════════════════════════════════════════════════════ */
function AnimIcon({ icon: Icon, size=36, color="#888", delay="0s" }) {
  return (
    <div style={{ position:"relative", width:size, height:size, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <div style={{ position:"absolute", bottom:-4, left:"50%", transform:"translateX(-50%)", width:size*0.7, height:size*0.22, background:color, borderRadius:"50%", filter:"blur(5px)", opacity:0.28 }}/>
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        filter:`drop-shadow(0 3px 8px ${color}66) drop-shadow(0 1px 2px rgba(0,0,0,0.22))`,
        animation:`emojiFloat 4s ease-in-out ${delay} infinite, emojiGlow 4s ease-in-out ${delay} infinite`,
        position:"relative",
        zIndex:1,
      }}>
        <Icon size={size * 0.82} color={color} strokeWidth={1.6}/>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AVATAR VISUAL CORES
═══════════════════════════════════════════════════════════════ */
function AvatarCore({ avatar, size=60, pulse=false }) {
  const av = typeof avatar==="string" ? AVATARS.find(a=>a.id===avatar) : avatar;
  if (!av) return null;
  const s = size;
  const common = { width:s, height:s, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", flexShrink:0 };

  if (av.shape==="blob") return (
    <div style={common}>
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(circle at 35% 30%, ${av.mesh[0]}, ${av.mesh[1]}, ${av.mesh[2]})`, borderRadius:"62% 38% 70% 30%/50% 60% 40% 50%", animation:`blobMorph 8s ease-in-out infinite${pulse?", orbPulse 3s ease-in-out infinite":""}`, boxShadow:`0 0 ${s*0.4}px ${av.mesh[0]}88, 0 ${s*0.12}px ${s*0.36}px ${C.shadowMd}`, filter:`blur(${s*0.012}px)` }}/>
      <AnimEmoji e="🍪" size={s*0.44} color={av.color} delay="0s"/>
    </div>
  );
  if (av.shape==="crystal") return (
    <div style={common}>
      <div style={{ position:"absolute", inset:0, background:`conic-gradient(from 0deg, ${av.mesh[2]}, ${av.mesh[1]}, ${av.mesh[0]}, ${av.mesh[1]}, ${av.mesh[2]})`, borderRadius:`${s*0.28}px`, animation:"crystalSpin 22s linear infinite", boxShadow:`0 0 ${s*0.3}px ${av.mesh[0]}66, inset 0 0 ${s*0.2}px ${av.mesh[0]}44`}}/>
      <div style={{ position:"absolute", inset:s*0.1, background:`radial-gradient(circle at 40% 35%, ${av.mesh[0]}, ${av.mesh[1]})`, borderRadius:`${s*0.2}px`, zIndex:1}}/>
      {[0,1,2].map(i=>(<div key={i} style={{ position:"absolute", width:3, height:3, borderRadius:"50%", background:av.mesh[0], top:`${22+i*20}%`, left:`${18+i*22}%`, animation:`starShimmer ${2+i*0.6}s ease-in-out ${i*0.45}s infinite`, zIndex:2}}/>))}
      <AnimEmoji e="🌿" size={s*0.42} color={av.color} delay="0.5s"/>
    </div>
  );
  if (av.shape==="orb") return (
    <div style={common}>
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(circle at 30% 25%, ${av.mesh[0]}, ${av.mesh[1]}, ${av.mesh[2]})`, borderRadius:"50%", animation:pulse?"orbPulse 2s ease-in-out infinite":"", boxShadow:`0 0 ${s*0.5}px ${av.mesh[0]}88, inset 0 ${s*0.08}px ${s*0.2}px rgba(255,255,255,0.4)`}}/>
      <div style={{ position:"absolute", top:"12%", left:"18%", width:"28%", height:"16%", background:"rgba(255,255,255,0.55)", borderRadius:"50%", filter:"blur(4px)", zIndex:1}}/>
      <div style={{ position:"absolute", inset:0, background:`conic-gradient(from 0deg, ${av.mesh[0]}33, ${av.mesh[1]}22, ${av.mesh[0]}33)`, borderRadius:"50%", animation:"nebulaDrift 8s ease-in-out infinite", opacity:0.6, zIndex:1}}/>
      <AnimEmoji e="⚡" size={s*0.42} color={av.color} delay="1s"/>
    </div>
  );
  return (
    <div style={common}>
      <div style={{ position:"absolute", inset:0, background:`conic-gradient(from 0deg, ${av.mesh[2]}, ${av.mesh[0]}, ${av.mesh[1]}, ${av.mesh[2]})`, borderRadius:"50%", animation:"nebulaDrift 14s ease-in-out infinite", filter:"blur(2px)", boxShadow:`0 0 ${s*0.5}px ${av.mesh[0]}88`}}/>
      <div style={{ position:"absolute", inset:s*0.14, background:`radial-gradient(circle, ${av.mesh[0]}88, transparent)`, borderRadius:"50%", zIndex:1, animation:"orbPulse 4s ease-in-out infinite"}}/>
      {[0,1,2,3].map(i=>(<div key={i} style={{ position:"absolute", width:2+i%2, height:2+i%2, borderRadius:"50%", background:"white", top:`${12+i*18}%`, left:`${10+i*20}%`, animation:`starShimmer ${1.5+i*0.4}s ease-in-out ${i*0.3}s infinite`, zIndex:3}}/>))}
      <AnimEmoji e="✨" size={s*0.42} color={av.color} delay="1.5s"/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIVING BACKGROUND
═══════════════════════════════════════════════════════════════ */
function LivingBg({ intensity=3, avatarColor=null }) {
  // Only use avatar color in the background if it's a warm color.
  // If it's cool (blue/purple hue), fall back to warm defaults.
  const isWarm = (hex) => {
    if (!hex) return false;
    const r = parseInt(hex.slice(1,3),16);
    const b = parseInt(hex.slice(5,7),16);
    return r > b + 20; // red channel must dominate blue
  };
  const warmColor = isWarm(avatarColor) ? avatarColor : null;

  const atmos = intensity<=2
    ? {a:`${C.sagePale}cc`, b:`${C.goldPale}cc`, c:`${C.clayPale}88`}
    : intensity===3
    ? {a:`${C.sagePale}cc`, b:warmColor?`${warmColor}18`:`${C.clayPale}99`, c:`${C.goldPale}77`}
    : {a:warmColor?`${warmColor}22`:`${C.clayPale}cc`, b:`${C.goldPale}bb`, c:`${C.sagePale}88`};  return (
    <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 80% 60% at 12% 6%, ${atmos.a}, transparent 68%), radial-gradient(ellipse 60% 80% at 88% 22%, ${atmos.b}, transparent 68%), radial-gradient(ellipse 70% 50% at 55% 92%, ${atmos.c}, transparent 68%), ${C.cream}`,transition:"background 2s ease",animation:"bgBreathe 18s ease-in-out infinite",backgroundSize:"120% 120%"}}/>      {[
        {w:230,h:290,x:"66%",y:"0%", r:"-16deg",dur:10,del:"0s",   c:`${C.sagePale}dd`},
        {w:160,h:210,x:"0%", y:"46%",r:"22deg", dur:13,del:"3s",   c:`${C.clayPale}aa`},
        {w:110,h:150,x:"76%",y:"62%",r:"-28deg",dur:16,del:"6.5s", c:`${C.goldPale}99`},
        {w:85, h:115,x:"36%",y:"84%",r:"14deg", dur:11,del:"1.5s", c:`${C.sagePale}77`},
      ].map((s,i)=>(
        <div key={i} style={{position:"absolute",left:s.x,top:s.y,width:s.w,height:s.h,background:s.c,borderRadius:"62% 38% 75% 25%/48% 62% 38% 52%","--r":s.r,animation:`leafFloat ${s.dur}s ease-in-out ${s.del} infinite`,filter:"blur(1.5px)"}}/>
      ))}
      {Array.from({length:5},(_,i)=>({x:`${14+i*15}%`,y:`${20+(i%3)*25}%`,sz:3+i%3*2,dur:`${8+i*1.5}s`,del:`${i*1.1}s`,c:i%3===0?C.sageMid:i%3===1?C.clay:C.gold})).map((p,i)=>(
        <div key={i} style={{position:"absolute",left:p.x,top:p.y,width:p.sz,height:p.sz,borderRadius:"50%",background:p.c,opacity:0.22,animation:`particle ${p.dur} ease-in-out ${p.del} infinite`}}/>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COLOR WASH TRANSITION — replaces glitchy ink-drop
   Avatar's glow color fades in → darkens slightly → fades to homeBg
═══════════════════════════════════════════════════════════════ */
function ColorWashOverlay({ wash }) {
  // wash: { color1, color2, color3 } — null when inactive
  if (!wash) return null;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:99998, pointerEvents:"none",
      background:`linear-gradient(145deg, ${wash.color1}, ${wash.color2})`,
      animation:"colorWash 1.1s ease-in-out forwards",
    }}/>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BREATHING ORB — ring fold-in on inhale complete, fixed hold
═══════════════════════════════════════════════════════════════ */
function BreathOrb({ phase, avatarColor }) {
  const scaleRef = useRef(0.3);
  const [displayScale, setDisplayScale] = useState(0.3);
  const [foldRings, setFoldRings] = useState(false);
  const animRef = useRef(null);
  const foldTimerRef = useRef(null);

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    clearTimeout(foldTimerRef.current);
    setFoldRings(false);

    const DURATION = 4000;
    if (phase==="hold_high") { setDisplayScale(1.0); scaleRef.current=1.0; return; }
    if (phase==="hold_low")  { setDisplayScale(0.3); scaleRef.current=0.3; return; }

    const startScale = scaleRef.current;
    const target = phase==="inhale" ? 1.0 : 0.3;
    const startTime = performance.now();

    const animate = (now) => {
      const t = Math.min((now-startTime)/DURATION, 1);
      const s = startScale + (target-startScale)*t;
      scaleRef.current = s;
      setDisplayScale(s);
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // At the end of inhale, trigger ring fold-in
        if (phase==="inhale") {
          setFoldRings(true);
          foldTimerRef.current = setTimeout(()=>setFoldRings(false), 700);
        }
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      clearTimeout(foldTimerRef.current);
    };
  }, [phase]);

  const g = avatarColor||C.sage;
  const labels = {inhale:"Breathe in", hold_high:"Hold", exhale:"Release", hold_low:"Still"};
  const orbSize = 148;

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:"100%"}}>
      <p style={{color:g,fontSize:19,fontFamily:"'Fraunces', Georgia, serif",fontStyle:"italic",letterSpacing:"0.04em",textAlign:"center",height:30,opacity:labels[phase]?1:0,transition:"opacity 0.7s ease",marginBottom:22}}>
        {labels[phase]||""}
      </p>
      <div style={{position:"relative",width:orbSize,height:orbSize,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {/* Outer ring — folds in at end of inhale */}
        <div style={{
          position:"absolute",
          inset:-(orbSize*0.20),
          borderRadius:"50%",
          background:`${g}14`,
          transform:`scale(${displayScale})`,
          transition:"transform 0.05s linear",
          animation:foldRings?`ringFoldIn 0.65s cubic-bezier(0.4,0,0.2,1) forwards`:"none",
          pointerEvents:"none",
        }}/>
        {/* Inner ring */}
        <div style={{
          position:"absolute",
          inset:-(orbSize*0.09),
          borderRadius:"50%",
          background:`${g}24`,
          transform:`scale(${displayScale})`,
          transition:"transform 0.05s linear",
          animation:foldRings?`ringFoldIn 0.55s 0.08s cubic-bezier(0.4,0,0.2,1) forwards`:"none",
          pointerEvents:"none",
        }}/>
        {/* Main orb */}
        <div style={{
          width:orbSize, height:orbSize, borderRadius:"50%",
          background:`radial-gradient(circle at 35% 28%, ${g}ff, ${g}dd, ${g}88)`,
          transform:`scale(${displayScale})`,
          transition:"transform 0.05s linear",
          boxShadow:`0 0 42px ${g}66, 0 0 84px ${g}2a, inset 0 -10px 30px rgba(0,0,0,0.12), inset 0 10px 22px rgba(255,255,255,0.28)`,
          position:"relative",
          overflow:"hidden",
        }}>
          {/* Specular highlight */}
          <div style={{position:"absolute",top:"10%",left:"16%",width:"30%",height:"18%",background:"rgba(255,255,255,0.52)",borderRadius:"50%",filter:"blur(6px)"}}/>
          {/* Secondary sheen */}
          <div style={{position:"absolute",top:"55%",right:"14%",width:"16%",height:"10%",background:"rgba(255,255,255,0.22)",borderRadius:"50%",filter:"blur(4px)"}}/>
        </div>
      </div>
      <p style={{color:C.mist,fontSize:12,fontFamily:"'Cabinet Grotesk', sans-serif",textAlign:"center",marginTop:30,opacity:0.55}}>
        Expand with the breath
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AUDIO ENGINE — Clean Web Audio API
   Uses filtered noise for water-like texture + sines for tone
   Volume ramps: inhale 0.20→0.42, exhale 0.42→0.18
   No glitches: gain is always clamped and ramps are properly sequenced
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   BACKGROUND AMBIENT ENGINE
   Matches the character of https://youtu.be/jkLRith2wcc
   — Soft nature ambience: layered pink/brown noise through
     resonant filters, gentle 432Hz drone, slow choir-like pads.
   Completely synthesized via Web Audio API — no external fetch.
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   AUDIO SYSTEM — HTML5 Audio API + Web Audio gain nodes
   Two tracks:
   1. BG: Streamside-Life.mp3 — global ambient loop, peak vol 0.2,
      10-second linear fade-in/out at loop boundary
   2. Breath: 832Hz meditation MP3 — plays only in breathe screen,
      volume swells with orb phases (inhale 0.1→0.5, hold 0.5,
      exhale 0.5→0.1), ducks BG to 0.05 while active
═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   AUDIO SYSTEM v6 — Embedded MP3 data URIs
   Both tracks are base64-encoded inline — zero network requests,
   zero CORS issues.  Volume via el.volume only.
   BG:     Streamside-Life.mp3 (4m02s, loops with 10s fade)
   Breath: 832Hz-Love-Freq.mp3 (6min trimmed, loops, ducks/swells)
   <audio> tags live in the global wrapper — never unmount.
═══════════════════════════════════════════════════════════════ */
const BG_URL = "/Streamside-Life.mp3";
const BR_URL = "/832Hz-Love-Freq.mp3";





/* ═══════════════════════════════════════════════════════════════
   INSIGHT ENGINE — buffer + typewriter
═══════════════════════════════════════════════════════════════ */
function useInsightEngine() {
  const [buffer, setBuffer]       = useState([...SEED_INSIGHTS]);
  const [idx, setIdx]             = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [typing, setTyping]       = useState(false);
  const typingRef  = useRef(null);
  const fetchingRef = useRef(false);
  const current = buffer[idx % buffer.length];

  useEffect(() => {
    if (!current) return;
    setTyping(true);
    setDisplayText("");
    let i = 0;
    const full = current.text;
    if (typingRef.current) clearInterval(typingRef.current);
    typingRef.current = setInterval(() => {
      i++;
      setDisplayText(full.slice(0,i));
      if (i>=full.length) { clearInterval(typingRef.current); setTyping(false); }
    }, 22);
    return () => clearInterval(typingRef.current);
  }, [current?.text]);

  const refreshBuffer = useCallback(async () => {
    if (fetchingRef.current || buffer.length > 15 || limitReached) return;
    fetchingRef.current = true;
    try {
      if (limitReached) { setLoading(false); return; }

      const { data: { session: insightSession } } = await supabase.auth.getSession();
const res = await fetch("/api/chat", {
  method:"POST", headers:{
    "Content-Type":"application/json",
    "Authorization": `Bearer ${insightSession?.access_token}`
  },
  body:JSON.stringify({ max_tokens:1200, system:INSIGHT_PROMPT,
          messages:[{role:"user",content:"Generate 5 new insights. Output ONLY valid JSON array, no markdown."}] }),
      });
      if (res.status === 429) {
        const errData = await res.json();
        if (errData.code === 'LIMIT_REACHED') { setLimitReached(true); setUsageMeta(errData.usage_meta || errData); }
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const text = data.content?.find(b=>b.type==="text")?.text||"[]";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      if (Array.isArray(parsed)) setBuffer(prev=>[...prev,...parsed]);
    } catch (e) {} finally { fetchingRef.current=false; }
  }, [buffer.length]);

  useEffect(() => { if (buffer.length-idx < 5) refreshBuffer(); }, [idx]);

  return { current, displayText, typing, next:useCallback(()=>setIdx(i=>i+1),[]) };
}

/* ═══════════════════════════════════════════════════════════════
   BUBBLE — AI message typewriter (adaptive speed)
   Longer message → faster speed. Shorter → slower, more deliberate.
═══════════════════════════════════════════════════════════════ */
function Bubble({ role, content, avatar, isTypingIndicator, isNew }) {
  const av = AVATARS.find(a=>a.id===avatar?.id);
  const isAI = role==="assistant";
  const [displayed, setDisplayed] = useState(isAI && isNew ? "" : content);
  const [done, setDone]           = useState(!isAI || !isNew);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isAI || isTypingIndicator || !content || !isNew) return;
    setDisplayed("");
    setDone(false);
    // Adaptive speed: target 2.5–5.5s for any message length
    // Short (≤60 chars) → 55ms/char (slow, deliberate)
    // Long (≥300 chars) → 12ms/char (fast, flowing)
    const len = content.length;
    const ms = Math.max(12, Math.min(55, 55 - ((len-60)/(300-60))*(55-12)));
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      setDisplayed(content.slice(0,i));
      if (i>=content.length) { clearInterval(timerRef.current); setDone(true); }
    }, ms);
    return () => clearInterval(timerRef.current);
  }, [content, isAI, isTypingIndicator]);

  return (
    <div style={{display:"flex",gap:10,alignItems:"flex-end",marginBottom:16,flexDirection:isAI?"row":"row-reverse",animation:"rise 0.3s cubic-bezier(0.34,1.56,0.64,1)"}}>
      {isAI && <AvatarCore avatar={av} size={36}/>}
      <div style={{maxWidth:"80%",background:isAI?"rgba(255,252,245,0.62)":"rgba(255,255,255,0.40)",backdropFilter:"blur(20px)",border:`1px solid ${isAI?C.glassBorder:av?.color+"33"}`,borderRadius:isAI?"6px 20px 20px 20px":"20px 6px 20px 20px",padding:"14px 18px",boxShadow:`0 4px 20px ${C.shadow}`}}>
        {isTypingIndicator
          ? <div style={{display:"flex",gap:5,padding:"3px 2px",alignItems:"center"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:av?.color||C.sage,animation:`dot 1.5s ease-in-out ${i*0.22}s infinite`}}/>)}</div>
          : <p style={{color:C.ink,fontSize:15,lineHeight:1.88,fontFamily:"'Fraunces', Georgia, serif",whiteSpace:"pre-wrap",wordBreak:"break-word",overflowWrap:"break-word"}}>{isAI?displayed:content}</p>
        }
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FLOATING GLASS DOCK
═══════════════════════════════════════════════════════════════ */
function Dock({ screen, setScreen, onMissions, avatarColor }) {
  const items = [
    { icon: Home,          label:"Home",   key:"home"     },
    { icon: MessageCircle, label:"Chat",   key:"chat"     },
    { icon: Target,        label:"Do",     key:"missions" },
    { icon: Sprout,        label:"Growth", key:"progress" },
    { icon: Brain,         label:"Me",     key: "knowme" },
    { icon: Sparkles,      label:"Pricing", key:"upgrade" },
  ];
  const activeIdx = items.findIndex(item => item.key === screen);
  const g = avatarColor || C.sage;

  return (
    <div style={{ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)", width:"82%", maxWidth:440, height:70, zIndex:9999 }}>
      <div className="glass" style={{ borderRadius:36, height:"100%", display:"flex", alignItems:"center", justifyContent:"space-around", boxShadow:`0 8px 32px ${C.shadowMd}, 0 2px 8px ${C.shadow}`, overflow:"hidden", position:"relative" }}>
        {activeIdx >= 0 && (
          <div style={{ position:"absolute", top:"50%", left:`${(activeIdx+0.5)*(100/items.length)}%`, transform:"translate(-50%,-50%)", width:42, height:42, borderRadius:"50%", background:`${g}22`, boxShadow:`0 0 18px ${g}44`, transition:"left 300ms cubic-bezier(0.4,0,0.2,1)", pointerEvents:"none" }}/>
        )}
        {items.map(({ icon: Icon, label, key }) => {
          const isActive = screen === key;
          return (
            <button key={key}
              onClick={() => key === "missions" ? onMissions() : setScreen(key)}
              style={{ flex:1, background:"transparent", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, color: isActive ? g : C.stoneMid, transition:"color 0.2s ease", padding:"8px 0", position:"relative", zIndex:1 }}>
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.7}/>
              <span style={{ fontSize:10, fontWeight:700, fontFamily:"'Cabinet Grotesk', sans-serif", letterSpacing:"0.04em" }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BADGE POPUP
═══════════════════════════════════════════════════════════════ */
function BadgePopup({ badge, avatarColor }) {
  if (!badge) return null;
  const g = avatarColor||C.gold;
  return (
    <div style={{position:"fixed",top:24,left:"50%",zIndex:10000,animation:"badgeBloom 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}>
      <div className="glass" style={{borderRadius:22,padding:"16px 30px",textAlign:"center",boxShadow:`0 0 0 1px rgba(255,255,255,0.3), 0 12px 40px ${C.shadowLg}, 0 0 40px ${g}33`,minWidth:180}}>
        <div style={{fontSize:28,marginBottom:6,background:"linear-gradient(45deg, #FFD700, #FFFACD, #FFD700)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmerGold 2s linear infinite"}}>⭐⭐⭐⭐⭐</div>
        <div style={{color:g,fontWeight:700,fontSize:13,fontFamily:"'Cabinet Grotesk', sans-serif",letterSpacing:"0.06em"}}>BADGE EARNED</div>
        <div style={{color:C.ink,fontWeight:500,fontSize:15,fontFamily:"'Fraunces', Georgia, serif",marginTop:4}}>{badge.name}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MISSION CARD — Every card is fully interactive
═══════════════════════════════════════════════════════════════ */
function MissionCard({ activity, onDone, onSkip, onAbort, avatarColor }) {
  const [phase, setPhase] = useState("idle");
  const [secs, setSecs]   = useState(activity.time*60);
  const iRef = useRef(null);
  useEffect(()=>()=>{if(iRef.current)clearInterval(iRef.current);},[]);

  const start = () => {
    setPhase("running");
    iRef.current = setInterval(()=>{
      setSecs(s=>{ if(s<=1){clearInterval(iRef.current);setPhase("done");return 0;} return s-1; });
    },1000);
  };

  const m=Math.floor(secs/60), s=secs%60;
  const pct=1-secs/(activity.time*60);
  const g=avatarColor||C.sage;
  const Tag=({c})=>(<span style={{background:`${g}14`,color:g,border:`1px solid ${g}30`,borderRadius:20,padding:"3px 11px",fontSize:11,fontWeight:600,fontFamily:"'Cabinet Grotesk', sans-serif",textTransform:"capitalize"}}>{c}</span>);

  return (
    <div className="glass card" style={{borderRadius:24,padding:26,marginBottom:14,animation:"rise 0.38s cubic-bezier(0.34,1.56,0.64,1)"}}>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        <Tag c={`${activity.time} min`}/><Tag c={activity.energy}/><Tag c={activity.social}/>
      </div>
      <h3 style={{fontFamily:"'Fraunces', Georgia, serif",fontSize:21,color:C.ink,marginBottom:10,fontWeight:500}}>{activity.title}</h3>
      <p style={{color:C.stone,fontSize:14,lineHeight:1.82,fontFamily:"'Cabinet Grotesk', sans-serif",marginBottom:16}}>{activity.desc}</p>
      <div style={{background:`${g}12`,borderLeft:`3px solid ${g}`,borderRadius:"0 12px 12px 0",padding:"11px 16px",marginBottom:20}}>
        <p style={{color:g,fontSize:12,fontFamily:"'Cabinet Grotesk', sans-serif",lineHeight:1.72}}>{activity.why}</p>
      </div>
      {phase==="running" && (
        <div style={{marginBottom:16}}>
          <div style={{height:3,background:C.stoneLight,borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct*100}%`,background:`linear-gradient(90deg, ${g}, ${g}aa)`,transition:"width 1s linear",borderRadius:2}}/>
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
        {phase==="idle" && (
          <>
            <button onClick={start} className="btn" style={{background:`linear-gradient(135deg, ${g}, ${g}cc)`,color:"#fff",border:"none",borderRadius:14,padding:"11px 24px",cursor:"pointer",fontWeight:600,fontSize:13,boxShadow:`0 6px 20px ${g}44`}}>Begin</button>
            <button onClick={onSkip} style={{background:"transparent",color:C.stoneMid,border:"none",cursor:"pointer",fontSize:13,padding:"11px 8px"}}>Skip — just talk instead</button>
          </>
        )}
        {phase==="running" && (
          <>
            <span style={{background:`${g}14`,color:g,border:`1px solid ${g}30`,borderRadius:12,padding:"11px 20px",fontWeight:700,fontSize:14}}>{m}:{s.toString().padStart(2,"0")}</span>
            <button onClick={()=>{clearInterval(iRef.current);onDone(activity);}} className="btn" style={{background:"transparent",color:g,border:`1px solid ${g}44`,borderRadius:14,padding:"11px 20px",cursor:"pointer",fontSize:13}}>Mark done</button>
            <button onClick={()=>{clearInterval(iRef.current);onAbort(activity);}} style={{background:"transparent",color:C.stoneMid,border:"none",cursor:"pointer",fontSize:12,padding:"11px 6px"}}>Stop</button>
          </>
        )}
        {phase==="done" && (
          <div style={{textAlign:"center",width:"100%"}}>
            <p style={{color:g,fontWeight:600,fontSize:14,marginBottom:14}}>Time's up. How do you feel compared to before?</p>
            <button onClick={()=>onDone(activity)} className="btn" style={{background:`linear-gradient(135deg, ${g}, ${g}cc)`,color:"#fff",border:"none",borderRadius:14,padding:"11px 26px",cursor:"pointer",fontWeight:600,fontSize:13,boxShadow:`0 6px 20px ${g}44`}}>That helped — mark complete</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════ */



/* ═══════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════ */
// ── Pretty URLs: map each main screen to a real path (getbuddin.org/chat, /plans…)
//    Onboarding screens are intentionally left off so direct loads can't skip setup.
const SCREEN_PATHS = {
  home:     "/home",
  chat:     "/chat",
  missions: "/do",
  progress: "/growth",
  knowme:   "/me",
  upgrade:  "/plans",
  breathe:  "/breathe",
};
const PATH_TO_SCREEN = Object.fromEntries(
  Object.entries(SCREEN_PATHS).map(([screen, path]) => [path, screen])
);

export default function App() {
  // ── All state declarations first (Rules of Hooks — no conditionals before these) ──
  const [screen, setScreen]             = useState("onboard1");
  const [avatar, setAvatar]             = useState(null);
  const [mood, setMood]                 = useState(null);
  const [prefs, setPrefs]               = useState({energy:"any",social:"any"});
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [activities, setActivities]     = useState([]);
  const [refreshSeed, setRefreshSeed]   = useState(0);
  const [completed, setCompleted]       = useState([]);
  const [points, setPoints]             = useState(0);
  const [badges, setBadges]             = useState([]);
  const [badge, setBadge]               = useState(null);
  const [breathPhase, setBreathPhase]   = useState("rest");
  const [breathOn, setBreathOn]         = useState(false);
  const [summary, setSummary]           = useState("");
  const [skipCt, setSkipCt]             = useState(0);
  const [goalPost, setGoalPost]         = useState({solo:0.5,social:0.5,physical:0.5,creative:0.5,nature:0.5,reflective:0.5});
  const [colorWash, setColorWash]       = useState(null);
  const [hoveredAv, setHoveredAv]       = useState(null);
  const [selectedAv, setSelectedAv]     = useState(null);
  const [introText, setIntroText]       = useState("");
  const [showIntro, setShowIntro]       = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [atBottom, setAtBottom]         = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [adaptiveTone, setAdaptiveTone] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [comparisonCount, setComparisonCount] = useState(0);
  const questionAskedRef = useRef(false);
  const [usageMeta, setUsageMeta]         = useState(null);
  const [limitReached, setLimitReached]   = useState(false);
  // ── All refs ──────────────────────────────────────────────────
  const lyapunovRef   = useRef(new LyapunovTracker());
  const sessionStart  = useRef(Date.now());
  const gutFiredRef   = useRef(false);
  const introTimerRef = useRef(null);
  const breathTimerRef = useRef(null);
  const endRef        = useRef(null);
  const inputRef      = useRef(null);
  const chatScrollRef = useRef(null);


  // ── Custom hooks ─────────────────────────────────────────────
  const insight = useInsightEngine();
  // ── Audio refs — point to <audio> DOM elements in JSX ────────
  const bgRef      = useRef(null);
  const brRef      = useRef(null);
  const bgDuckedRef = useRef(false); // true while breathing is active, suppresses timeupdate vol

  // ── Derived values (not hooks, just computations) ────────────
  const getMinutes  = () => (Date.now() - sessionStart.current) / 60000;
  const av          = avatar ? AVATARS.find(a => a.id === avatar.id) || avatar : null;
  const avatarColor = av?.color || C.sage;
  const activePortalAv = selectedAv || hoveredAv;

  const enableMusic = useCallback(() => {
    setMusicEnabled(true);
    requestAnimationFrame(() => {
      const bg = bgRef.current;
      const br = brRef.current;
      if (!bg || !br) return;
      // BG: start at silence — timeupdate listener ramps to 0.2 over first 10s
      bg.volume = 0;
      bg.play().catch(() => {});
      // BR: prime — silent play then immediate pause unlocks .play() for gesture policy
      br.volume = 0;
      br.play().then(() => { br.pause(); br.currentTime = 0; }).catch(() => {});
    });
  }, []); // eslint-disable-line

  const disableMusic = useCallback(() => {
    setMusicEnabled(false);
    if (bgRef.current) { bgRef.current.pause(); bgRef.current.currentTime = 0; }
    if (brRef.current) { brRef.current.pause(); brRef.current.currentTime = 0; }
  }, []);

  // ── Pretty URLs ───────────────────────────────────────────────
  // Reflect the active main screen into the address bar so the URL reads
  // getbuddin.org/chat, /plans, etc. (onboarding screens are skipped, so the
  // URL only changes once the user is in the real app).
  useEffect(() => {
    const path = SCREEN_PATHS[screen];
    if (path && window.location.pathname !== path) {
      window.history.pushState({ screen }, "", path);
    }
  }, [screen]);

  // Honor browser back/forward between main screens.
  useEffect(() => {
    const onPop = () => {
      const next = PATH_TO_SCREEN[window.location.pathname];
      if (next) setScreen(next);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ── useEffects ────────────────────────────────────────────────

  // BG: timeupdate drives the 10s fade-in and 10s fade-out at loop boundary.
  // Attached imperatively so it persists across screen switches without
  // re-registering (the <audio> tag never unmounts from the global wrapper).
  useEffect(() => {
    let bg = null;
    const tryAttach = () => {
      bg = bgRef.current;
      if (!bg) { setTimeout(tryAttach, 80); return; }

      const onTimeUpdate = () => {
        if (bg.paused || !bg.duration || bgDuckedRef.current) return;
        const t   = bg.currentTime;
        const dur = bg.duration;
        if      (t < 10)        bg.volume = Math.min(0.2, 0.2 * (t / 10));
        else if (dur - t < 10)  bg.volume = Math.min(0.2, 0.2 * ((dur - t) / 10));
        else                    bg.volume = 0.2;
      };
      const onEnded = () => {
        // Manual loop so timeupdate gets to fade in again on restart
        bg.currentTime = 0;
        bg.volume = 0;
        bg.play().catch(() => {});
      };

      bg.addEventListener('timeupdate', onTimeUpdate);
      bg.addEventListener('ended',      onEnded);
      // Store for cleanup
      bg._onTU = onTimeUpdate;
      bg._onEn = onEnded;
    };
    tryAttach();
    return () => {
      if (bg && bg._onTU) {
        bg.removeEventListener('timeupdate', bg._onTU);
        bg.removeEventListener('ended',      bg._onEn);
      }
    };
  }, []); // eslint-disable-line

  // BG screen routing: pause when entering breathe, resume on all other screens
  useEffect(() => {
    if (!musicEnabled || !bgRef.current) return;
    const bg = bgRef.current;
    if (screen === 'breathe') {
      let n = 0, steps = 20, from = bg.volume;
      const iv = setInterval(() => {
        n++;
        bg.volume = Math.max(0, from * (1 - n / steps));
        if (n >= steps) { clearInterval(iv); bg.pause(); }
      }, 40);
    } else {
      if (bg.paused) bg.play().catch(() => {});
    }
  }, [screen, musicEnabled]); // eslint-disable-line

  // Breath cycle: orb phase sequencer + breath track volume swell
  useEffect(() => {
    if (!breathOn) {
      clearTimeout(breathTimerRef.current);
      setBreathPhase('rest');
      bgDuckedRef.current = false;
      if (!musicEnabled) return;
      // Fade out breath track
      const br = brRef.current;
      if (br) {
        let n = 0, steps = 30, from = br.volume;
        const iv = setInterval(() => {
          n++;
          br.volume = Math.max(0, from * (1 - n / steps));
          if (n >= steps) { clearInterval(iv); br.pause(); br.currentTime = 0; }
        }, 50);
      }
      // Restore BG from duck
      const bg = bgRef.current;
      if (bg) {
        let n = 0, steps = 30, from = bg.volume;
        const iv = setInterval(() => {
          n++;
          bg.volume = Math.min(0.2, from + (0.2 - from) * (n / steps));
          if (n >= steps) clearInterval(iv);
        }, 50);
        if (bg.paused) bg.play().catch(() => {});
      }
      return;
    }

    // breathOn = true
    if (musicEnabled) {
      bgDuckedRef.current = true;
      // Duck BG to 0.05
      const bg = bgRef.current;
      if (bg) {
        let n = 0, steps = 30, from = bg.volume;
        const iv = setInterval(() => {
          n++;
          bg.volume = Math.max(0.05, from - (from - 0.05) * (n / steps));
          if (n >= steps) clearInterval(iv);
        }, 50);
      }
      // Start breath track
      const br = brRef.current;
      if (br) {
        br.currentTime = 0;
        br.volume = 0.1;
        br.play().catch(() => {});
      }
    }

    // Phase sequencer: inhale→hold→exhale→hold, repeat
    const seq    = [['inhale',4000],['hold_high',4000],['exhale',4000],['hold_low',4000]];
    const volMap = { inhale:0.5, hold_high:0.5, exhale:0.1, hold_low:0.1 };
    let idx = 0, swellIv = null;

    const tick = () => {
      const [ph, dur] = seq[idx];
      setBreathPhase(ph);
      if (musicEnabled && brRef.current) {
        clearInterval(swellIv);
        const br = brRef.current;
        const target = volMap[ph], from = br.volume;
        const steps = Math.round(dur / 50);
        let n = 0;
        swellIv = setInterval(() => {
          n++;
          br.volume = Math.min(1, Math.max(0, from + (target - from) * (n / steps)));
          if (n >= steps) clearInterval(swellIv);
        }, 50);
      }
      breathTimerRef.current = setTimeout(() => {
        idx = (idx + 1) % seq.length;
        tick();
      }, dur);
    };
    tick();

    return () => {
      clearTimeout(breathTimerRef.current);
      clearInterval(swellIv);
    };
  }, [breathOn, musicEnabled]); // eslint-disable-line

  // Auto-scroll chat — only when already near bottom
  useEffect(() => {
    if (atBottom) endRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, atBottom]);

  // Lyapunov tracker
  useEffect(() => {
    if (mood) lyapunovRef.current.update(mood.intensity);
  }, [mood]);

  // Anti-retention
  useEffect(() => {
    if (gutFiredRef.current || screen !== "chat" || messages.length < 4) return;
    const t = setInterval(() => {
      const gut = calcGUT(getMinutes(), completed.length, messages.length);
      if (gut.shouldExit && !gutFiredRef.current) {
        gutFiredRef.current = true;
        setMessages(p => [...p, { role:"assistant", content:"I've genuinely valued this conversation. But I think we've reached a good pause point. A few quiet minutes away from the screen will do more for you than more words from me. What's one small real-world thing you could try in the next 10 minutes?" }]);
      }
    }, 25000);
    return () => clearInterval(t);
  }, [screen, messages.length, completed.length]);

  // Avatar intro typewriter
  useEffect(() => {
    clearInterval(introTimerRef.current);
    if (!activePortalAv) { setIntroText(""); setShowIntro(false); return; }
    setShowIntro(true);
    setIntroText("");
    let i = 0;
    const full = activePortalAv.intro;
    introTimerRef.current = setInterval(() => {
      i++;
      setIntroText(full.slice(0, i));
      if (i >= full.length) clearInterval(introTimerRef.current);
    }, 38);
    return () => clearInterval(introTimerRef.current);
  }, [activePortalAv?.id]);

  // ── Session Init & Pre-fetch ──────────────────────────────────
  useEffect(() => {
    async function initSession() {
      try {
        await fetch("/api/session", { method: "POST" });
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const memRes = await fetch("/api/memory", {
          headers: { "Authorization": `Bearer ${token}` }
});        if (memRes.ok) {
           const store = await memRes.json();
          const { deriveAdaptiveTone } = await import("./boom/memorySchema.js");

           // Extract recent question IDs to avoid repeating
           const recentIds = store.snapshots ? store.snapshots.slice(-5).map(s => s.questionId).filter(Boolean) : [];
           const qRes = await fetch("/api/select-question", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ recentQuestionIds: recentIds })
           });
           if (qRes.ok) {
             const q = await qRes.json();
             setActiveQuestion(q);
           }
        }
        const { data: { session: sess2 } } = await supabase.auth.getSession();
        if (sess2?.user?.id) {
          const { count } = await supabase
            .from("comparison_responses")
            .select("id", { count: "exact", head: true })
            .eq("user_id", sess2.user.id);
          if (count != null) setComparisonCount(count);
        }
      } catch (e) {
        console.error("Session init failed", e);
      }
    }
    initSession();
  }, []);

  // ── Callbacks ─────────────────────────────────────────────────
  const filterMissions = useCallback(() => {
    const mi = mood?.intensity || 3;
    const recentIds = new Set(completed.slice(-8).map(c => c.id));
    const scored = MISSIONS
      .map(m => ({ ...m, _s: scoreActivity(m, mi, prefs.energy, goalPost) + (recentIds.has(m.id) ? -3 : 0) }))
      .sort((a, b) => b._s - a._s);
    const pool = scored.slice(0, Math.min(12, scored.length));
    const offset = (refreshSeed * 3) % Math.max(pool.length, 1);
    return [0, 1, 2].map(i => pool[(offset + i) % pool.length]).filter(Boolean);
  }, [mood, prefs, completed, goalPost, refreshSeed]);

  const doRefresh = useCallback(() => {
    setRefreshSeed(s => s + 1);
    setExpandedCard(null);
  }, []);

  // Re-compute activities when seed changes
  useEffect(() => {
    if (screen === "missions") setActivities(filterMissions());
  }, [refreshSeed, screen]);

  const send = async (content) => {
    if (!content.trim()) return;
    const userMsg = { role:"user", content };
    const next = [...messages, userMsg];
    setMessages(next); setInput(""); setLoading(true);
    const isCrisis = isCrisisText(content);
    const w10 = next.slice(-10);
    const superpositions = detectNeedSuperposition(content);
    const looping = detectSemanticLoop(next);
    const gut = calcGUT(getMinutes(), completed.length, next.length);
    const newSummary = next.length % 5 === 0
      ? `Mood:${mood?.label}. Recent:${next.filter(m => m.role === "user").slice(-3).map(m => m.content.slice(0, 45)).join("; ")}`
      : summary;
    if (next.length % 5 === 0) setSummary(newSummary);
    try {

      // Strip custom properties like isProjectiveProbe before sending to Anthropic
      const safeW10 = w10.map(({ role, content }) => ({ role, content }));

      const { data: { session: chatSession } } = await supabase.auth.getSession();
const res = await fetch("/api/chat", {
  method:"POST", headers:{
    "Content-Type":"application/json",
    "Authorization": `Bearer ${chatSession?.access_token}`
  },
  body: JSON.stringify({
    max_tokens:800,
          system: buildSystemPrompt(av, mood, newSummary, getMinutes(), lyapunovRef.current, gut, superpositions, looping, adaptiveTone, activeQuestion, questionAskedRef.current)
            + (isCrisis ? "\n\nCRITICAL SAFETY: Lead with warmth. Include 988 Lifeline and Crisis Text Line (HOME to 741741). Acknowledge pain before any redirect." : ""),
          messages: safeW10,
        }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.usage_meta) setUsageMeta(data.usage_meta);
      if (data.usage_meta?.remaining === 0) setLimitReached(true);
      const responseText = data.content?.find(b => b.type === "text")?.text || "I'm here.";
      if (activeQuestion && !questionAskedRef.current && messages.length > 8) {
        questionAskedRef.current = true;
      }
      setMessages(p => {
        const updated = [...p, { role:"assistant", content: responseText }];

        
        return updated;
      });

    } catch {
      setMessages(p => [...p, { role:"assistant", content:"We lost connection for a second — it happens. Take a breath, and try again when you're ready. I'm still here." }]);
    }
    setLoading(false);
  };

  const handleDone = (act) => {
    const nc = [...completed, { ...act, date: new Date() }];
    setCompleted(nc);
    setPoints(p => p + (act.social !== "solo" ? 8 : 5));
    setGoalPost(p => updateGoalPosterior(p, "complete", act.mode));
    if (nc.length === 1) award("🌱", "First Step", "You did the thing.");
    if (nc.length === 5) award("⭐", "Five Strong", "Five activities complete.");
    if (nc.filter(a => a.social !== "solo").length >= 3) award("🤝", "Connector", "Three social activities.");
    setScreen("chat");
    setTimeout(() => send(`[I just completed: "${act.title}"]`), 200);
  };
  const handleSkip = (act) => {
    const n = skipCt + 1; setSkipCt(n);
    if (act) setGoalPost(p => updateGoalPosterior(p, "skip", act.mode));
    setScreen("chat");
    if (n >= 3) setMessages(p => [...p, { role:"assistant", content:"I've noticed you've stepped back from a few activities. That's fine. I'm curious — what's making it hard to try one right now?" }]);
    else send("[I decided to skip the activity and just talk]");
  };
  const handleAbort = (act) => {
    setGoalPost(p => updateGoalPosterior(p, "abort", act.mode));
    setScreen("chat");
    send(`[I started "${act.title}" but stopped early]`);
  };
  const award = (emoji, name, desc) => {
    setBadges(b => [...b, { emoji, name, desc }]);
    setBadge({ emoji, name, desc });
    if (navigator.vibrate) navigator.vibrate([20, 80, 20]);
    setTimeout(() => setBadge(null), 3800);
  };
  const selectAvatar = (chosen) => {
    setAvatar(chosen);
    setColorWash({ color1: chosen.glow, color2: chosen.glowDark });
    // Welcome chord — pure local sine waves, no external fetch, no CORS
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        const pairs = { mochi:[220,330], sage:[130.8,196], zap:[261.6,392], nova:[196,293.7] };
        const fs = pairs[chosen.id] || pairs.mochi;
        fs.forEach((f, i) => {
          const osc = ctx.createOscillator(), g = ctx.createGain();
          osc.type = "sine"; osc.frequency.value = f;
          g.gain.setValueAtTime(0, ctx.currentTime);
          g.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.12 + i * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(); osc.stop(ctx.currentTime + 2.5);
        });
      }
    } catch (e) {}
    setTimeout(() => {
      setColorWash(null); setSelectedAv(null); setHoveredAv(null);
      setScreen("onboard3"); gutFiredRef.current = false;
    }, 1100);
  };

  // ── Layout constants ──────────────────────────────────────────
  const W  = {
    width:"100%",
    maxWidth:"min(780px, 96vw)",
    margin:"0 auto",
    padding:"0 clamp(12px, 4vw, 40px)",
    position:"relative",
    zIndex:1,
    boxSizing:"border-box",
  };
  const BG = {
    minHeight:"100dvh",
    background:C.cream,
    fontFamily:"'Cabinet Grotesk', sans-serif",
    color:C.ink,
    WebkitFontSmoothing:"antialiased",
  };
  const SectionHeader = ({ onBack, title }) => (
    <div style={{ display:"flex", alignItems:"center", gap:12, paddingTop:40, marginBottom:22 }}>
      <button onClick={onBack} style={{ background:"transparent", border:"none", color:avatarColor, cursor:"pointer", padding:"4px 2px", display:"flex", alignItems:"center" }}>
        <ChevronLeft size={22} strokeWidth={2}/>
      </button>
      <h2 style={{ fontFamily:"'Fraunces', Georgia, serif", fontSize:27, color:C.ink, fontWeight:500 }}>{title}</h2>
    </div>
  );

  const onMissions = useCallback(() => {
    setActivities(filterMissions());
    setExpandedCard(null);
    setScreen("missions");
  }, [filterMissions]);

  {/* ════════════════════════════════════════════════════════════
     SCREENS
  ════════════════════════════════════════════════════════════ */}

  {/* ── ONBOARD 1 ───────────────────────────────────────────── */}

  {/* ── Single persistent return — audio tags never unmount ────── */}
  return (
    <div style={{position:"relative", background:"#F5ECDC", minHeight:"100dvh"}}>
      <style>{CSS}</style>
      {/* Global audio elements — live outside all screen conditionals,
          never destroyed on screen switch, refs stay valid always */}
      <audio
        ref={el => { bgRef.current = el; if (el) el.volume = 0; }}
        src={BG_URL}
        preload="auto"
        onCanPlayThrough={() => { if (bgRef.current) bgRef.current._ready = true; }}
        style={{display:"none"}}
      />
      <audio
        ref={el => { brRef.current = el; if (el) el.volume = 0; }}
        src={BR_URL}
        preload="auto"
        loop
        onCanPlayThrough={() => { if (brRef.current) brRef.current._ready = true; }}
        style={{display:"none"}}
      />

  {screen === "onboard1" && (
    <div style={{ ...BG, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
      <LivingBg intensity={3}/>
      <div style={W}>
        <div style={{ paddingTop:72, paddingBottom:56, animation:"rise 0.7s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
              <img src="/imagebuddin.png" alt="Buddin"
                style={{ width:88, height:88, objectFit:"contain",
                  filter:`drop-shadow(0 6px 18px ${C.sage}55)`,
                  animation:"sway 5s ease-in-out infinite",
                  transformOrigin:"50% 100%" }}
              />
            </div>
            <h1 style={{ fontFamily:"'Fraunces', Georgia, serif", fontSize:50, fontWeight:300, color:C.forest, letterSpacing:"-1px", lineHeight:1.06, marginBottom:16 }}>Buddin</h1>
            <div style={{ width:40, height:2, background:`linear-gradient(90deg, ${C.sage}, ${C.clay})`, margin:"0 auto 18px", borderRadius:2 }}/>
            <p style={{ color:C.stone, fontSize:16, lineHeight:1.76, fontFamily:"'Fraunces', Georgia, serif", fontStyle:"italic", fontWeight:300 }}>
              Not another app.<br/>A way back to the roots.
            </p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:11, marginBottom:40 }}>
            {[
              [Brain,"Built on real neuroscience","Every activity chosen for how your brain actually works.","0s"],
              [Leaf,"Positive redirection","Calm and rewarding, not commanding. The choice is always yours.","0.3s"],
              [Globe,"Gets you into the world","The best moments happen away from this screen.","0.6s"],
            ].map(([Icon,t,d,delay]) => (
              <div key={t} className="glass card" style={{ borderRadius:18, padding:"17px 20px", display:"flex", gap:15, alignItems:"flex-start" }}>
                <AnimIcon icon={Icon} size={28} color={C.sage} delay={delay}/>
                <div>
                  <div style={{ fontWeight:600, fontSize:14, color:C.ink, marginBottom:4 }}>{t}</div>
                  <div style={{ color:C.stone, fontSize:13, lineHeight:1.55 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setScreen("onboard2"); enableMusic(); }}
            className="btn"
            style={{ width:"100%", padding:"19px 24px", background:`linear-gradient(135deg, ${C.sage}, ${C.forest})`, color:"#fff", border:"none", borderRadius:20, fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:`0 10px 32px ${C.sage}50` }}>
            Get started
          </button>
          
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:16 }}>
  <p style={{ color:C.stoneMid, fontSize:12 }}>No account · Free · Made by a student</p>
  <button onClick={musicEnabled ? disableMusic : enableMusic} className="btn glass"
    style={{ border:`1px solid ${C.sage}44`, color:C.sage, borderRadius:16, fontSize:12, fontWeight:600, cursor:"pointer", background:`${C.sage}08`, padding:"6px 12px", display:"flex", alignItems:"center", gap:6 }}>
    {musicEnabled ? <><VolumeX size={13}/> Stop</> : <><Music size={13}/> Music</>}
  </button>
</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:22, marginTop:14 }}>
            <a href="https://www.youtube.com/channel/UClXPubvuKuWSYKkRwBqwo1Q" target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", alignItems:"center", gap:6, color:C.stoneMid, fontSize:12, fontWeight:600, textDecoration:"none" }}>
              <YoutubeIcon size={15}/> @Getbuddin
            </a>
            <a href="https://www.instagram.com/getbuddin" target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", alignItems:"center", gap:6, color:C.stoneMid, fontSize:12, fontWeight:600, textDecoration:"none" }}>
              <InstagramIcon size={15}/> getbuddin
            </a>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* ── ONBOARD 2 ───────────────────────────────────────────── */}
  {screen === "onboard2" && (
    <div style={{ ...BG, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
      <ColorWashOverlay wash={colorWash}/>
      <LivingBg intensity={3} avatarColor={activePortalAv?.color}/>
      {activePortalAv && (
        <div style={{ position:"fixed", inset:0, background:`${activePortalAv.glow}55`, transition:"background 700ms ease", zIndex:0, pointerEvents:"none" }}/>
      )}
      <div style={{ ...W, paddingTop:52, paddingBottom:44, animation:"rise 0.55s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <p style={{ color:C.sage, fontSize:11, fontWeight:700, letterSpacing:"0.15em", marginBottom:10 }}>STEP 1 OF 2</p>
        <h2 style={{ fontFamily:"'Fraunces', Georgia, serif", fontSize:32, color:C.ink, marginBottom:8, fontWeight:400 }}>Choose your companion.</h2>
        <p style={{ color:C.stone, fontSize:14, marginBottom:28 }}>Tap a companion to hear from them, then continue.</p>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:13, marginBottom:22 }}>
          {AVATARS.map(a => {
            const isSelected = selectedAv?.id === a.id;
            const isActive   = isSelected || hoveredAv?.id === a.id;
            return (
              <div key={a.id}
                className="portal-card"
                onMouseEnter={() => { if (!selectedAv) setHoveredAv(a); }}
                onMouseLeave={() => { if (!selectedAv) setHoveredAv(null); }}
                onClick={() => { setSelectedAv(a); setHoveredAv(null); }}
                onTouchEnd={e => { e.preventDefault(); setSelectedAv(a); setHoveredAv(null); }}
                style={{
                  background: isActive ? `${a.glow}ee` : "rgba(255,248,235,0.50)",
                  backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
                  border:`2px solid ${isSelected ? a.color+"cc" : isActive ? a.color+"77" : "rgba(255,235,200,0.35)"}`,
                  borderRadius:20, padding:"20px 14px", cursor:"pointer", textAlign:"center",
                  boxShadow: isActive ? `0 0 28px ${a.color}28, 0 8px 24px ${C.shadowMd}` : `0 4px 16px ${C.shadow}`,
                  position:"relative",
                }}>
                {isSelected && (
                  <div style={{ position:"absolute", top:10, right:10, width:22, height:22, borderRadius:"50%", background:a.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", fontWeight:700, boxShadow:`0 2px 8px ${a.color}66`, animation:"rise 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>✓</div>
                )}
                <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
                  <AvatarCore avatar={a} size={58} pulse={isActive}/>
                </div>
                <div style={{ fontFamily:"'Fraunces', Georgia, serif", fontSize:17, color:C.ink, marginBottom:4, fontWeight:400 }}>{a.name}</div>
                <div style={{ color:a.color, fontSize:11, fontWeight:700, letterSpacing:"0.05em" }}>{a.vibe}</div>
              </div>
            );
          })}
        </div>

        {showIntro && activePortalAv ? (
          <div style={{ animation:"fadeIn 0.4s ease", background:`${activePortalAv.glow}cc`, backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:`1px solid ${activePortalAv.color}33`, borderRadius:18, padding:"18px 20px", marginBottom:18, minHeight:86, transition:"background 600ms ease" }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <AvatarCore avatar={activePortalAv} size={34}/>
              <p style={{ color:C.ink, fontSize:14, lineHeight:1.78, fontFamily:"'Fraunces', Georgia, serif", fontStyle:"italic", fontWeight:300, flex:1 }}>
                {introText}<span style={{ opacity:0.35 }}>▎</span>
              </p>
            </div>
          </div>
        ) : (
          <div style={{ background:"rgba(255,248,235,0.38)", backdropFilter:"blur(14px)", border:"1px solid rgba(255,235,200,0.3)", borderRadius:16, padding:"14px 18px", marginBottom:18, textAlign:"center" }}>
            <p style={{ color:C.stoneMid, fontSize:13 }}>Hover to preview · Tap to select</p>
          </div>
        )}

        {selectedAv ? (
          <button onClick={() => selectAvatar(selectedAv)} className="btn"
            style={{ width:"100%", padding:"17px 24px", background:`linear-gradient(135deg, ${selectedAv.color}, ${selectedAv.color}bb)`, color:"#fff", border:"none", borderRadius:20, fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:`0 8px 28px ${selectedAv.color}44`, marginBottom:14, animation:"staggerUp 0.3s ease" }}>
            Continue with {selectedAv.name} →
          </button>
        ) : (
          <div style={{ width:"100%", padding:"17px 24px", background:C.stoneLight, borderRadius:20, fontSize:15, fontWeight:700, color:C.stoneMid, textAlign:"center", marginBottom:14, opacity:0.55 }}>
            {activePortalAv ? `Tap ${activePortalAv.name} again to select` : "Select a companion above"}
          </div>
        )}
<div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
  <button onClick={() => setScreen("onboard1")} style={{ background:"transparent", border:"none", color:C.stoneMid, cursor:"pointer", fontSize:13, padding:"8px 0" }}>← Back</button>
  <button onClick={musicEnabled ? disableMusic : enableMusic} className="btn glass"
    style={{ border:`1px solid ${C.sage}44`, color:C.sage, borderRadius:16, fontSize:12, fontWeight:600, cursor:"pointer", background:`${C.sage}08`, padding:"6px 12px", display:"flex", alignItems:"center", gap:6 }}>
    {musicEnabled ? <><VolumeX size={13}/> Stop</> : <><Music size={13}/> Music</>}
  </button>
</div>      </div>
    </div>
  )}

  {/* ── ONBOARD 3 ───────────────────────────────────────────── */}
  {screen === "onboard3" && (
    <div style={{ ...BG, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
      <LivingBg intensity={3} avatarColor={avatarColor}/>
      <div style={W}>
        <div style={{ paddingTop:52, paddingBottom:44 }}>
          <p style={{ color:avatarColor, fontSize:11, fontWeight:700, letterSpacing:"0.15em", marginBottom:10 }}>STEP 2 OF 2</p>
          <h2 style={{ fontFamily:"'Fraunces', Georgia, serif", fontSize:32, color:C.ink, marginBottom:10, fontWeight:400 }}>Quick calibration.</h2>
          <p style={{ color:C.stone, fontSize:14, marginBottom:32 }}>No judgment. This helps me find the right things for you.</p>
          {[
            { label:"Energy level most days?", key:"energy", opts:[
              ["low",  "Low",    BatteryLow],
              ["med",  "Medium", Zap       ],
              ["high", "High",   Flame     ],
              ["any",  "Varies", Shuffle   ],
            ]},
            { label:"Social comfort right now?", key:"social", opts:[
              ["solo",  "Solo",       User    ],
              ["one",   "One-on-one", UserPlus],
              ["group", "Group",      Users   ],
              ["any",   "Varies",     Shuffle ],
            ]},
          ].map(({ label, key, opts }) => (
            <div key={key} style={{ marginBottom:28 }}>
              <p style={{ fontWeight:600, fontSize:14, color:C.ink, marginBottom:14 }}>{label}</p>
              <div style={{ display:"flex", gap:9, flexWrap:"wrap" }}>
                {opts.map(([v, l, Icon]) => {
                  const active = prefs[key] === v;
                  return (
                    <button key={v} onClick={() => setPrefs(p => ({ ...p, [key]:v }))} className="btn glass"
                      style={{ flex:1, minWidth:"44%", padding:"11px 8px", border:`2px solid ${active ? avatarColor : "rgba(255,235,200,0.35)"}`, color:active ? avatarColor : C.stone, borderRadius:14, cursor:"pointer", fontSize:12, fontWeight:600, background:active ? `${avatarColor}18` : "rgba(255,248,235,0.42)", display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                      <Icon size={17} strokeWidth={active ? 2.2 : 1.7}/>
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              setMessages([{ role:"assistant", content:`Good — you're here.\n\nI'm ${av?.name}. ${av?.intro}\n\nBefore we dive in — quick, honest question: if you had an unexpected free hour right now, what's the first thing that comes to mind?` }]);
              setScreen("home");
            }}
            className="btn"
            style={{ width:"100%", padding:"19px 24px", marginTop:10, background:`linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color:"#fff", border:"none", borderRadius:20, fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:`0 10px 32px ${avatarColor}48` }}>
            Step into Buddin →
          </button>
        </div>
      </div>
    </div>
  )}

  {/* ── HOME ─────────────────────────────────────────────────── */}
  {screen === "home" && (
    <div style={{ ...BG, paddingBottom:100, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
      <LivingBg intensity={mood?.intensity || 3} avatarColor={avatarColor}/>
      <BadgePopup badge={badge} avatarColor={avatarColor}/>
      <div style={W}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:40, marginBottom:24, animation:"staggerUp 0.5s ease 0.1s both" }}>
          <div>
            <h1 style={{ fontFamily:"'Fraunces', Georgia, serif", fontSize:30, color:C.forest, fontWeight:400, letterSpacing:"-0.5px" }}>Buddin</h1>
            <p style={{ color:C.stoneMid, fontSize:12, marginTop:2 }}>with {av?.name} {av?.emoji}</p>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={musicEnabled ? disableMusic : enableMusic} className="btn glass"
  style={{ borderRadius:12, padding:"7px 12px", border:`1px solid ${avatarColor}33`, cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontSize:11, color:avatarColor, fontWeight:600 }}>
  {musicEnabled ? <><VolumeX size={13} strokeWidth={2}/> Stop</> : <><Music size={13} strokeWidth={2}/> Music</>}
</button>
            <button onClick={() => { setHoveredAv(null); setSelectedAv(null); setIntroText(""); setShowIntro(false); setScreen("onboard2"); }} className="btn glass"
              style={{ borderRadius:12, padding:"8px 10px", border:`1px solid ${avatarColor}33`, cursor:"pointer", fontSize:11, color:avatarColor, fontWeight:600 }}>
              Switch {av?.emoji}
            </button>
            <button onClick={() => setScreen("upgrade")} className="btn glass"
              style={{ borderRadius:12, padding:"8px 10px", border:`1px solid ${avatarColor}33`, cursor:"pointer", fontSize:11, color:avatarColor, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
              <Sparkles size={13} strokeWidth={2}/> Plans
            </button>
            <button 
  onClick={() => supabase.auth.signOut()}
  style={{ 
    background:'none', border:`1px solid ${C.stoneLight}`, 
    borderRadius:20, padding:'4px 14px', fontSize:12, 
    color:C.stone, cursor:'pointer' 
  }}>
  Sign Out
</button>
          </div>
        </div>

        <div className="glass card" style={{ borderRadius:22, padding:22, marginBottom:14, animation:"staggerUp 0.5s ease 0.18s both" }}>
          <p style={{ color:C.stone, fontSize:13, marginBottom:16, textAlign:"center" }}>What's your energy like today?</p>
          <div style={{ display:"flex", gap:7 }}>
            {MOODS.map(m => (
              <button key={m.label} onClick={() => { setMood(m); setColorWash(m.color); }} className="btn"
                style={{ flex:1, padding:"10px 4px", background:mood?.label===m.label ? `${m.color}1a` : "transparent", border:`2px solid ${mood?.label===m.label ? m.color : "rgba(255,235,200,0.4)"}`, borderRadius:16, cursor:"pointer", transform:mood?.label===m.label ? "translateY(-2px)" : "none", transition:"transform 0.2s, background 0.2s, border 0.2s" }}>
                <div style={{ fontSize:22 }}>{m.emoji}</div>
                <div style={{ color:mood?.label===m.label ? m.color : C.stoneMid, fontSize:10, marginTop:5, fontWeight:700 }}>{m.label}</div>
              </button>
            ))}
          </div>
          {mood && (
            <p style={{ color:mood.color, fontSize:12.5, marginTop:14, textAlign:"center", fontWeight:600, animation:"rise 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
              {moodAck(mood)}
            </p>
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:11, marginBottom:14, animation:"staggerUp 0.5s ease 0.26s both" }}>
          <button onClick={() => setScreen("chat")} className="btn card glass"
            style={{ padding:"17px 24px", background:`linear-gradient(135deg, ${avatarColor}ee, ${avatarColor}99)`, color:"#fff", border:"none", borderRadius:20, fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:`0 8px 28px ${avatarColor}40`, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            <AvatarCore avatar={av} size={28}/> Talk to {av?.name}
          </button>
          {mood && (
            <button onClick={onMissions} className="btn card glass"
              style={{ padding:"15px 24px", border:`1px solid ${avatarColor}33`, color:C.ink, borderRadius:20, fontSize:15, fontWeight:500, cursor:"pointer" }}>
              Find me something to do
            </button>
          )}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gridTemplateRows:"auto auto", gap:11, marginBottom:14, animation:"staggerUp 0.5s ease 0.34s both" }}>
          <div className="glass card" style={{ borderRadius:22, padding:22, gridRow:"span 2", background:`linear-gradient(145deg, rgba(255,248,235,0.5), ${avatarColor}10)`, border:`1px solid ${avatarColor}22`, position:"relative", overflow:"hidden", boxShadow:`0 8px 32px ${avatarColor}1a` }}>
            <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 80% 60% at 20% 20%, ${avatarColor}14, transparent)`, animation:"gradShift 16s ease-in-out infinite", backgroundSize:"200% 200%", zIndex:0 }}/>
            <div style={{ position:"relative", zIndex:1 }}>
              <p style={{ color:avatarColor, fontSize:11, fontWeight:700, letterSpacing:"0.1em", marginBottom:10 }}>TODAY'S INSIGHT</p>
              <p style={{ color:C.forest, fontSize:13, lineHeight:1.80, fontFamily:"'Fraunces', Georgia, serif", fontStyle:"italic", fontWeight:300, marginBottom:10, minHeight:80 }}>
                {insight.displayText}{insight.typing && <span style={{ opacity:0.35 }}>▎</span>}
              </p>
              <p style={{ color:C.mist, fontSize:10, marginBottom:12 }}>— {insight.current?.source}</p>
              <button onClick={insight.next} style={{ background:"transparent", border:`1px solid ${avatarColor}44`, color:avatarColor, borderRadius:20, padding:"6px 14px", cursor:"pointer", fontSize:11, fontWeight:600 }}>Next insight →</button>
            </div>
          </div>
          
          <button onClick={() => setScreen("breathe")} className="glass card btn" style={{ borderRadius:18, padding:"16px 14px", cursor:"pointer", textAlign:"left", border:`1px solid ${avatarColor}22` }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:`radial-gradient(circle at 35% 30%, ${avatarColor}88, ${avatarColor}44)`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 12px ${avatarColor}44`, animation:"orbPulse 3s ease-in-out infinite", marginBottom:6 }}>
              <Wind size={19} color={avatarColor} strokeWidth={1.8}
                style={{ filter:`drop-shadow(0 2px 4px ${avatarColor}66)` }}/>
            </div>
            <div style={{ color:C.ink, fontWeight:600, fontSize:13, marginBottom:2, fontFamily:"'Fraunces', Georgia, serif" }}>Breathe</div>
            <div style={{ color:C.stoneMid, fontSize:11 }}>Box method</div>
          </button>
          <button onClick={() => setScreen("progress")} className="glass card btn" style={{ borderRadius:18, padding:"16px 14px", cursor:"pointer", textAlign:"left", border:`1px solid ${avatarColor}22` }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg, ${avatarColor}66, ${avatarColor}33)`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:6, boxShadow:`0 4px 12px ${avatarColor}33`, fontSize:20 }}>
              <AnimIcon icon={Sprout} size={22} color={avatarColor} delay="0.5s"/>
            </div>
            <div style={{ color:C.ink, fontWeight:600, fontSize:13, marginBottom:2, fontFamily:"'Fraunces', Georgia, serif" }}>Progress</div>
            <div style={{ color:C.stoneMid, fontSize:11 }}>{badges.length} badge{badges.length !== 1 ? "s" : ""}</div>
          </button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11, marginBottom:20, animation:"staggerUp 0.5s ease 0.42s both" }}>
          {[[FlaskConical,"The Science","Why it works","science"],[BookOpen,"Our Sources","Foundations","sources"]].map(([Icon,t,d,s]) => (
            <button key={s} onClick={() => setScreen(s)} className="glass card btn" style={{ borderRadius:18, padding:"16px", cursor:"pointer", textAlign:"left" }}>
              <AnimIcon icon={Icon} size={26} color={avatarColor} delay="0s"/>
              <div style={{ color:C.ink, fontWeight:600, fontSize:13, marginBottom:2, fontFamily:"'Fraunces', Georgia, serif", marginTop:6 }}>{t}</div>
              <div style={{ color:C.stoneMid, fontSize:11 }}>{d}</div>
            </button>
          ))}
        </div>

        {comparisonCount >= 5 && (
          <button onClick={() => setScreen("myprofile")} className="glass card btn"
            style={{ width:"100%", borderRadius:18, padding:"16px 20px", cursor:"pointer", border:`1px solid ${avatarColor}33`, textAlign:"left", marginBottom:12, display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:38, height:38, borderRadius:12, background:`linear-gradient(135deg, ${avatarColor}55, ${avatarColor}22)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Brain size={20} color={avatarColor} strokeWidth={1.8}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ color:C.ink, fontWeight:700, fontSize:13, fontFamily:"'Fraunces', Georgia, serif", marginBottom:2 }}>Buddin is starting to figure you out</div>
              <div style={{ color:C.stoneMid, fontSize:11 }}>{comparisonCount} answers so far · see what it found →</div>
            </div>
          </button>
        )}

        <button onClick={() => setScreen("donate")} className="glass card btn"
          style={{ width:"100%", borderRadius:18, padding:"14px 20px", cursor:"pointer", border:`1px solid ${avatarColor}22`, textAlign:"center", marginBottom:10 }}>
          <span style={{ color:avatarColor, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
            <Heart size={14} color={avatarColor} strokeWidth={2} style={{ fill:avatarColor }}/>
            Support Buddin
          </span>
        </button>

        <button onClick={() => setScreen("feedback")} className="glass card btn"
          style={{ width:"100%", borderRadius:18, padding:"12px 20px", cursor:"pointer", border:`1px solid ${C.stoneLight}`, textAlign:"center", marginBottom:10, background:"transparent" }}>
          <span style={{ color:C.stone, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
            <MessageCircle size={14} strokeWidth={2}/>
            Send feedback
          </span>
        </button>
      </div>
      <Dock screen={screen} setScreen={setScreen} onMissions={onMissions} avatarColor={avatarColor}/>
    </div>
  )}

  {/* ── CHAT ─────────────────────────────────────────────────── */}
  {screen === "chat" && (
    <div style={{ position:"fixed", inset:0, display:"flex", flexDirection:"column", fontFamily:"'Cabinet Grotesk', sans-serif", color:C.ink, overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 100% 70% at 50% 0%, ${avatarColor}20, transparent 55%), ${C.cream}` }}/>
        {av?.shape === "nebula" && <div style={{ position:"absolute", inset:0, background:`conic-gradient(from 0deg, ${av.mesh[2]}18, ${av.mesh[0]}14, ${av.mesh[1]}11, ${av.mesh[2]}18)`, animation:"nebulaDrift 32s ease-in-out infinite", opacity:0.5 }}/>}
        {av?.shape === "blob" && <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 80% 55% at 50% 18%, ${av.mesh[0]}18, transparent 68%)`, animation:"orbPulse 6s ease-in-out infinite" }}/>}
      </div>

      <div className="glass" style={{ padding:"max(14px, calc(env(safe-area-inset-top) + 10px)) 20px 14px", display:"flex", alignItems:"center", gap:13, borderBottom:"1px solid rgba(255,235,200,0.28)", flexShrink:0, position:"relative", zIndex:10, borderRadius:0, background:`rgba(245,236,220,0.85)`, backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)" }}>        <button onClick={() => setScreen("home")} style={{ background:"transparent", border:"none", color:avatarColor, cursor:"pointer", padding:"4px 2px", display:"flex", alignItems:"center" }}>
          <ChevronLeft size={22} strokeWidth={2}/>
        </button>
        <AvatarCore avatar={av} size={40} pulse/>
        <div>
          <div style={{ fontWeight:600, fontSize:14, color:C.ink }}>{av?.name || "Buddin"}</div>
          <div style={{ color:avatarColor, fontSize:11 }}>{av?.vibe}</div>
        </div>
        <button onClick={musicEnabled ? disableMusic : enableMusic} className="glass btn"
          style={{ marginLeft:"auto", borderRadius:11, padding:"7px 12px", border:`1px solid ${avatarColor}33`, color:avatarColor, cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", gap:5 }}>
          {musicEnabled ? <VolumeX size={13} strokeWidth={2}/> : <Music size={13} strokeWidth={2}/>}
        </button>
        <button onClick={() => { setBreathOn(false); setScreen("breathe"); }} className="glass btn" style={{ borderRadius:11, padding:"7px 14px", border:`1px solid ${avatarColor}33`, color:avatarColor, cursor:"pointer", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
          <Wind size={13} strokeWidth={2}/> Breathe
        </button>
        <div className="glass" style={{ borderRadius:11, padding:"6px 12px", fontSize:10, fontWeight:700, color:avatarColor, border:`1px solid ${avatarColor}33`, textTransform:"capitalize" }}>
          {usageMeta?.tier || "free"}
        </div>
      </div>

      <div
        ref={chatScrollRef}
        onScroll={() => {
          const el = chatScrollRef.current;
          if (!el) return;
          setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
        }}
        style={{ flex:1, overflowY:"auto", padding:"22px 20px 100px", position:"relative", zIndex:1 }}>
        {messages.length === 0 && (
          <div style={{ textAlign:"center", paddingTop:24, animation:"rise 0.55s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <AvatarCore avatar={av} size={80} pulse/>
            <p style={{ color:C.stoneMid, fontFamily:"'Fraunces', Georgia, serif", fontSize:16, fontStyle:"italic", fontWeight:300, marginTop:20 }}>{moodGreeting(mood, av?.name)}</p>
          </div>
        )}
        <div style={{ maxWidth:680, margin:"0 auto" }}>
  {messages.map((m, i) => (
    <Bubble 
      key={i} 
      role={m.role} 
      content={m.content} 
      avatar={av} 
      isNew={i === messages.length - 1 && m.role === "assistant"}
    />
  ))}
  {loading && <Bubble role="assistant" content="" avatar={av} isTypingIndicator/>}
</div>
        <div ref={endRef}/>
      </div>

      {/* Scroll-to-bottom button */}
      {!atBottom && (
        <div style={{ position:"absolute", bottom:88, left:"50%", transform:"translateX(-50%)", zIndex:50 }}>
          <button
            onClick={() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); setAtBottom(true); }}
            style={{ width:36, height:36, borderRadius:"50%", background:"rgba(255,248,235,0.90)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", border:`1.5px solid ${avatarColor}44`, boxShadow:`0 4px 20px ${avatarColor}33, 0 2px 8px rgba(40,28,16,0.12)`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:avatarColor, animation:"rise 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <ChevronDown size={18} strokeWidth={2.2}/>
          </button>
        </div>
      )}

      {usageMeta && !limitReached && usageMeta.remaining <= 3 && (
        <div style={{ padding:"6px 20px", background:`${avatarColor}14`, borderTop:`1px solid ${avatarColor}22`, textAlign:"center", zIndex:10, position:"relative", flexShrink:0 }}>
          <p style={{ color:avatarColor, fontSize:11, fontWeight:600 }}>
            {usageMeta.remaining} message{usageMeta.remaining===1?"":"s"} left today · <span style={{ textDecoration:"underline", cursor:"pointer" }} onClick={() => setScreen("upgrade")}>Upgrade for more</span>
          </p>
        </div>
      )}
      {limitReached && (
        <div style={{ padding:"18px 20px", background:`rgba(245,236,220,0.97)`, backdropFilter:"blur(20px)", borderTop:`1px solid ${avatarColor}33`, zIndex:10, position:"relative", flexShrink:0, textAlign:"center", animation:"fadeIn 0.3s ease" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
            <div style={{ flex:1 }}>
              <p style={{ color:C.ink, fontWeight:600, fontSize:14, marginBottom:6, fontFamily:"'Fraunces', Georgia, serif" }}>You've reached today's limit.</p>
              <p style={{ color:C.stone, fontSize:12, lineHeight:1.6, marginBottom:14 }}>Free conversations reset at midnight. If Buddin has been helpful, consider upgrading — it keeps this running for everyone.</p>
              <div style={{ display:"flex", gap:9, justifyContent:"center", flexWrap:"wrap" }}>
                <button onClick={() => setScreen("upgrade")} className="btn"
                  style={{ padding:"10px 20px", background:`linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color:"#fff", border:"none", borderRadius:14, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  See plans →
                </button>
                <button onClick={() => setScreen("home")} className="glass btn"
                  style={{ padding:"10px 18px", border:`1px solid ${avatarColor}33`, color:avatarColor, borderRadius:14, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  Try an activity instead
                </button>
              </div>
            </div>
            <button onClick={() => setLimitReached(false)} style={{ background:"transparent", border:"none", cursor:"pointer", color:C.stoneMid, fontSize:20, padding:"0 4px", lineHeight:1 }}>×</button>
          </div>
        </div>
      )}

      <div className="glass chat-input-bar" style={{ padding:`12px 16px calc(12px + env(safe-area-inset-bottom))`, paddingBottom:`calc(12px + env(safe-area-inset-bottom))`, borderTop:"1px solid rgba(255,235,200,0.28)", flexShrink:0, position:"relative", zIndex:10, borderRadius:0, background:`rgba(245,236,220,0.85)`, backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)" }}>        <div style={{ maxWidth:680, margin:"0 auto" }}>
          <div style={{ display:"flex", gap:9, alignItems:"center" }}>
              <textarea ref={inputRef} value={input} onChange={e => !limitReached && setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && input.trim() && (e.preventDefault(), send(input))} placeholder={limitReached ? "Today's conversations are complete." : "What's on your mind..."} rows={3} style={{ flex:1, background:"rgba(255,248,235,0.55)", border:"1.5px solid rgba(255,235,200,0.6)", outline:"none", backdropFilter:"blur(12px)", borderRadius:16, padding:"13px 18px", color:C.ink, fontSize:14, boxShadow:"0 2px 8px rgba(40,28,16,0.06)", resize:"none", overflowY:"auto", lineHeight:"1.5", fontFamily:"inherit", maxHeight:120, minHeight:46 }} onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}/>            <button onClick={() => input.trim() && !limitReached && send(input)} disabled={loading || !input.trim() || limitReached} className="btn"
              style={{ width:46, height:46, borderRadius:16, border:"none", cursor:limitReached || loading || !input.trim() ? "not-allowed" : "pointer", background:limitReached || loading || !input.trim() ? C.stoneLight : `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color:limitReached || loading || !input.trim() ? C.stoneMid : "#fff", fontSize:19, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:limitReached || loading || !input.trim() ? "none" : `0 6px 20px ${avatarColor}44`, opacity:limitReached || loading ? 0.6 : 1, transition:"all 0.2s ease" }}>
              <Send size={18} strokeWidth={2}/>
            </button>
          </div>
          {messages.length >= 3 && (
            <div style={{ display:"flex", gap:8, marginTop:11, flexWrap:"wrap" }}>
              <button onClick={onMissions} className="glass btn" style={{ borderRadius:11, padding:"7px 14px", border:`1px solid ${avatarColor}33`, color:avatarColor, cursor:"pointer", fontSize:12, fontWeight:600 }}>Suggest something to do</button>
              <button onClick={() => { setBreathOn(false); setScreen("breathe"); }} className="glass btn" style={{ borderRadius:11, padding:"7px 14px", border:"1px solid rgba(255,235,200,0.3)", color:C.clay, cursor:"pointer", fontSize:12, fontWeight:600 }}>Breathing exercise</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

  {/* ── MISSIONS ─────────────────────────────────────────────── */}
  {screen === "missions" && (
    <div style={{ ...BG, paddingBottom:100, background:`linear-gradient(180deg, ${avatarColor}08 0%, ${C.cream} 160px)` }}>
      <LivingBg intensity={mood?.intensity || 3} avatarColor={avatarColor}/>
      <BadgePopup badge={badge} avatarColor={avatarColor}/>
      <div style={W}>
        <div style={{ paddingTop:36 }}>
          <div style={{ display:"flex", alignItems:"center", gap:13, marginBottom:20 }}>
            <button onClick={() => setScreen("home")} style={{ background:"transparent", border:"none", color:avatarColor, cursor:"pointer", display:"flex", alignItems:"center" }}>
              <ChevronLeft size={22} strokeWidth={2}/>
            </button>
            <h2 style={{ fontFamily:"'Fraunces', Georgia, serif", fontSize:25, color:C.ink, fontWeight:400 }}>Something to Try</h2>
            <button onClick={doRefresh} className="glass btn"
              style={{ marginLeft:"auto", borderRadius:11, padding:"7px 16px", border:`1.5px solid ${avatarColor}55`, color:avatarColor, cursor:"pointer", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:5, background:`${avatarColor}0f`, boxShadow:`0 0 12px ${avatarColor}22, inset 0 0 8px ${avatarColor}0a` }}>
              <RotateCw size={13} strokeWidth={2}/> Refresh
            </button>
          </div>

          <div style={{ borderRadius:16, padding:"14px 18px", marginBottom:20, background:`${avatarColor}10`, border:`1.5px solid ${avatarColor}33`, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", boxShadow:`0 0 20px ${avatarColor}18, inset 0 0 12px ${avatarColor}08` }}>
            <p style={{ color:C.forest, fontSize:14, fontFamily:"'Fraunces', Georgia, serif", fontStyle:"italic", lineHeight:1.70, fontWeight:300 }}>Here are a few things worth trying. Pick the one that feels least impossible.</p>
          </div>

          {activities.length === 0 && (
            <div style={{ textAlign:"center", padding:44 }}>
              <p style={{ color:C.stoneMid, marginBottom:16 }}>No activities loaded yet.</p>
              <button onClick={() => setActivities(filterMissions())} className="btn"
                style={{ background:`linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color:"#fff", border:"none", borderRadius:14, padding:"11px 24px", cursor:"pointer", fontWeight:600 }}>
                Load activities
              </button>
            </div>
          )}

          {activities.map((a, i) => {
            const isExpanded = expandedCard === a.id;
            return isExpanded ? (
              <MissionCard key={a.id} activity={a} onDone={handleDone} onSkip={() => { setExpandedCard(null); handleSkip(a); }} onAbort={handleAbort} avatarColor={avatarColor}/>
            ) : (
              <div key={a.id} className="glass card" onClick={() => setExpandedCard(a.id)}
                style={{ borderRadius:20, padding:"18px 22px", marginBottom:11, cursor:"pointer", border:`1px solid ${avatarColor}22`, animation:`rise ${0.3 + i * 0.08}s cubic-bezier(0.34,1.56,0.64,1)` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Fraunces', Georgia, serif", fontSize:16, color:C.ink, marginBottom:6, fontWeight:500 }}>{a.title}</div>
                    <div style={{ color:C.stoneMid, fontSize:12, marginBottom:8 }}>{a.time} min · {a.energy} energy · {a.social}</div>
                    <p style={{ color:C.stone, fontSize:13, lineHeight:1.68 }}>{a.desc}</p>
                  </div>
                  <ChevronRight size={18} color={avatarColor} strokeWidth={1.8} style={{ marginLeft:12, opacity:0.7, flexShrink:0 }}/>
                </div>
                <div style={{ marginTop:12, background:`${avatarColor}0e`, borderLeft:`2px solid ${avatarColor}44`, borderRadius:"0 8px 8px 0", padding:"8px 12px" }}>
                  <p style={{ color:avatarColor, fontSize:11, lineHeight:1.6 }}>{a.why}</p>
                </div>
                <div style={{ marginTop:12, display:"flex", justifyContent:"flex-end" }}>
                  <span style={{ background:`linear-gradient(135deg, ${avatarColor}, ${avatarColor}bb)`, color:"#fff", borderRadius:11, padding:"6px 16px", fontSize:12, fontWeight:600, boxShadow:`0 4px 12px ${avatarColor}33` }}>Start this →</span>
                </div>
              </div>
            );
          })}

          <button onClick={() => { setBreathOn(false); setScreen("breathe"); }} className="glass btn"
            style={{ width:"100%", border:`1px solid rgba(255,235,200,0.35)`, color:C.stone, borderRadius:18, padding:"13px 20px", cursor:"pointer", marginTop:10, fontSize:14 }}>
            Need a breathing break instead?
          </button>
        </div>
      </div>
      <Dock screen={screen} setScreen={setScreen} onMissions={onMissions} avatarColor={avatarColor}/>
    </div>
  )}

  {/* ── BREATHE ──────────────────────────────────────────────── */}
  {screen === "breathe" && (
    <div style={{ ...BG, minHeight:"100dvh" }}>
      <LivingBg intensity={3} avatarColor={avatarColor}/>
      <div style={{ ...W, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:60, paddingBottom:44, position:"relative", zIndex:1 }}>
        <button onClick={() => { setBreathOn(false); setScreen("home"); }} style={{ alignSelf:"flex-start", background:"transparent", border:"none", color:avatarColor, cursor:"pointer", display:"flex", alignItems:"center", gap:6, marginBottom:32 }}>
          <ChevronLeft size={20} strokeWidth={2}/> Back
        </button>
        <h2 style={{ fontFamily:"'Fraunces', Georgia, serif", fontSize:32, color:C.ink, textAlign:"center", marginBottom:8, fontWeight:400 }}>Pause & Reset</h2>
        <p style={{ color:C.stone, textAlign:"center", marginBottom:48, fontSize:14, lineHeight:1.65 }}>Follow the circle.<br/>Let the sound guide you.</p>
        <BreathOrb phase={breathPhase} avatarColor={avatarColor}/>
        <button onClick={() => setBreathOn(b => !b)} className="btn"
          style={{ marginTop:44, padding:"15px 38px", background:breathOn ? "transparent" : `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color:breathOn ? avatarColor : "#fff", border:breathOn ? `2px solid ${avatarColor}` : "none", borderRadius:20, fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:breathOn ? "none" : `0 8px 28px ${avatarColor}44` }}>
          {breathOn ? "Pause" : "Start"}
        </button>
        {!musicEnabled && (
          <button onClick={enableMusic} className="glass btn" style={{ marginTop:16, padding:"10px 24px", border:`1px solid ${avatarColor}44`, color:avatarColor, borderRadius:14, fontSize:13, fontWeight:600, cursor:"pointer", background:`${avatarColor}08`, display:"flex", alignItems:"center", gap:7 }}>
            <Music size={14} strokeWidth={2}/> Enable breathing sounds
          </button>
        )}
        <div className="glass" style={{ marginTop:48, width:"100%", borderRadius:18, padding:22 }}>
          <p style={{ color:C.ink, fontWeight:600, marginBottom:12, fontSize:14 }}>If things feel really hard right now:</p>
          <p style={{ color:C.stone, fontSize:13, lineHeight:1.9 }}>988 Suicide & Crisis Lifeline: call or text 988<br/>Crisis Text Line: text HOME to 741741<br/>crisistextline.org</p>
        </div>
      </div>
    </div>
  )}

  {/* ── SCIENCE ──────────────────────────────────────────────── */}
  {screen === "science" && (
    <div style={{ ...BG, paddingBottom:100, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
      <LivingBg intensity={4} avatarColor={avatarColor}/>
      <div style={W}>
        <SectionHeader onBack={() => setScreen("home")} title="The Science"/>
        <p style={{ color:C.stone, fontSize:13, marginBottom:24, lineHeight:1.76 }}>The activities Buddin suggests are grounded in neuroscience, psychology, and sociology.</p>
        {SEED_INSIGHTS.map((f, i) => (
          <div key={i} className="glass card" style={{ borderRadius:20, padding:22, marginBottom:13 }}>
            <p style={{ color:avatarColor, fontSize:11, fontWeight:700, letterSpacing:"0.08em", marginBottom:8 }}>{f.source}</p>
            <p style={{ color:C.ink, fontSize:14, lineHeight:1.82, fontFamily:"'Fraunces', Georgia, serif", fontWeight:300, fontStyle:"italic" }}>{f.text}</p>
          </div>
        ))}
      </div>
      <Dock screen={screen} setScreen={setScreen} onMissions={onMissions} avatarColor={avatarColor}/>
    </div>
  )}

  {/* ── SOURCES ──────────────────────────────────────────────── */}
  {screen === "sources" && (
    <div style={{ ...BG, paddingBottom:100, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
      <LivingBg intensity={4} avatarColor={avatarColor}/>
      <div style={W}>
        <SectionHeader onBack={() => setScreen("home")} title="Our Sources"/>
        <p style={{ color:C.stone, fontSize:13, marginBottom:24, lineHeight:1.76 }}>Every suggestion Buddin makes comes from somewhere real.</p>
        {SOURCES.map((s, i) => (
          <div key={i} className="glass" style={{ borderLeft:`3px solid ${avatarColor}`, borderRadius:"0 16px 16px 0", padding:"15px 20px", marginBottom:11 }}>
            <p style={{ color:C.ink, fontSize:13, lineHeight:1.65, marginBottom:5 }}><span style={{ fontWeight:600 }}>{s.authors}</span> ({s.year}). {s.title}.</p>
            <p style={{ color:C.stoneMid, fontSize:12, fontStyle:"italic" }}>{s.journal}</p>
          </div>
        ))}
      </div>
      <Dock screen={screen} setScreen={setScreen} onMissions={onMissions} avatarColor={avatarColor}/>
    </div>
  )}

  {/* ── PROGRESS ─────────────────────────────────────────────── */}
  {screen === "progress" && (
    <div style={{ ...BG, paddingBottom:100, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
      <LivingBg intensity={mood?.intensity || 3} avatarColor={avatarColor}/>
      <BadgePopup badge={badge} avatarColor={avatarColor}/>
      <div style={W}>
        <SectionHeader onBack={() => setScreen("home")} title="Your Journey"/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11, marginBottom:26 }}>
          {[[Star,String(points),"Points earned"],[Check,String(completed.length),"Activities done"],[Trophy,String(badges.length),"Badges earned"],[Users,String(completed.filter(a => a.social !== "solo").length),"Social activities"]].map(([Icon,v,l]) => (
            <div key={l} className="glass card" style={{ borderRadius:20, padding:"18px 14px", textAlign:"center" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:6 }}>
                <Icon size={26} color={avatarColor} strokeWidth={1.8}/>
              </div>
              <div style={{ fontSize:28, fontWeight:400, color:avatarColor, fontFamily:"'Fraunces', Georgia, serif" }}>{v}</div>
              <div style={{ color:C.stoneMid, fontSize:11, marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>
        <h3 style={{ fontFamily:"'Fraunces', Georgia, serif", fontSize:20, color:C.ink, marginBottom:14, fontWeight:500 }}>Badges</h3>
        {badges.length === 0
          ? <p style={{ color:C.stoneMid, fontStyle:"italic", fontSize:14, marginBottom:26 }}>Complete activities to earn badges.</p>
          : <div style={{ display:"flex", flexWrap:"wrap", gap:11, marginBottom:26 }}>{badges.map((b, i) => (
              <div key={i} className="glass" style={{ borderRadius:14, padding:"12px 18px", textAlign:"center" }}>
                <div style={{ background:"linear-gradient(45deg, #FFD700, #FFFACD, #FFD700)", backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"shimmerGold 2s linear infinite", fontSize:24 }}>{b.emoji}</div>
                <div style={{ color:avatarColor, fontSize:11, fontWeight:700, marginTop:5 }}>{b.name}</div>
              </div>
            ))}</div>
        }
        <h3 style={{ fontFamily:"'Fraunces', Georgia, serif", fontSize:20, color:C.ink, marginBottom:14, fontWeight:500 }}>Recent Activities</h3>
        {completed.length === 0
          ? <p style={{ color:C.stoneMid, fontStyle:"italic", fontSize:14 }}>Nothing yet. You're here, which already counts.</p>
          : completed.slice(-5).reverse().map((a, i) => (
              <div key={i} className="glass" style={{ borderRadius:14, padding:"13px 18px", marginBottom:9, display:"flex", gap:13, alignItems:"center" }}>
                <div style={{ flex:1 }}>
                  <div style={{ color:C.ink, fontSize:14, fontWeight:500 }}>{a.title}</div>
                  <div style={{ color:C.stoneMid, fontSize:12, marginTop:2 }}>{a.time} min · {a.social}</div>
                </div>
                <span style={{ color:avatarColor, fontWeight:700, fontSize:13 }}>+{a.social !== "solo" ? 8 : 5}pts</span>
              </div>
            ))
        }
      </div>
      <Dock screen={screen} setScreen={setScreen} onMissions={onMissions} avatarColor={avatarColor}/>
    </div>
  )}
    {/* ── UPGRADE ─────────────────────────────────────────── */}
{screen === "upgrade" && (
  <div style={{ ...BG, paddingBottom:100, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
    <LivingBg intensity={3} avatarColor={avatarColor}/>
    <div style={W}>
      <SectionHeader onBack={() => setScreen("home")} title="Plans"/>
      <p style={{ color:C.stone, fontSize:13, lineHeight:1.76, marginBottom:16 }}>Buddin is a non-profit passion project. Every conversation costs real money — your support keeps it free for everyone who needs it.</p>

      <div className="glass card" style={{ borderRadius:22, padding:22, marginBottom:14, border:`1px solid ${C.stoneLight}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div>
            <p style={{ fontWeight:700, fontSize:16, color:C.ink, fontFamily:"'Fraunces', Georgia, serif" }}>Free</p>
            <p style={{ color:C.stoneMid, fontSize:12 }}>Always available</p>
          </div>
          <p style={{ fontSize:22, fontWeight:700, color:C.stoneMid, fontFamily:"'Fraunces', Georgia, serif" }}>$0</p>
        </div>
        {["10 messages per day","All 4 companions","Breathing exercises","Activity suggestions"].map(f => (
          <div key={f} style={{ display:"flex", gap:10, alignItems:"center", marginBottom:7 }}>
            <Check size={13} color={C.sageMid} strokeWidth={2.5}/>
            <p style={{ color:C.stone, fontSize:13 }}>{f}</p>
          </div>
        ))}
      </div>

      <div className="glass card" style={{ borderRadius:22, padding:22, marginBottom:14, border:`2px solid ${avatarColor}66`, position:"relative" }}>
        <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", background:`linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color:"#fff", borderRadius:20, padding:"6px 20px", fontSize:12, fontWeight:700, boxShadow:`0 4px 12px ${avatarColor}44`, whiteSpace:"nowrap" }}> POPULAR · $9/mo</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <p style={{ fontWeight:700, fontSize:16, color:C.ink, fontFamily:"'Fraunces', Georgia, serif" }}>Supporter</p>
            <HeartHandshake size={18} color={avatarColor} strokeWidth={1.8}/>
          </div>
          <p style={{ fontSize:22, fontWeight:700, color:avatarColor, fontFamily:"'Fraunces', Georgia, serif" }}>$9<span style={{ fontSize:13, fontWeight:400 }}>/mo</span></p>
        </div>
        {["40 messages per day","Upgraded to Sonnet — smarter, warmer replies","Everything in Free","Keeps Buddin running"].map(f => (
          <div key={f} style={{ display:"flex", gap:10, alignItems:"center", marginBottom:7 }}>
            <Check size={13} color={avatarColor} strokeWidth={2.5}/>
            <p style={{ color:C.stone, fontSize:13 }}>{f}</p>
          </div>
        ))}
        <PayPalScriptProvider options={{ 'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID, currency: 'USD' }}>
  <PayPalButtons
    style={{ layout: 'vertical', shape: 'pill' }}
    createOrder={(data, actions) => actions.order.create({
      purchase_units: [{ amount: { value: '4.99' }, description: 'Buddin Supporter Plan' }]
    })}
    onApprove={async () => {
      if (session) {
        await supabase.from('profiles').update({ tier: 'supporter' }).eq('id', session.user.id)
        alert('You are now a Supporter! Refresh to see your new limits.')
      }
    }}
  />
</PayPalScriptProvider>
      </div>

      <div className="glass card" style={{ borderRadius:22, padding:22, marginBottom:20, border:`1px solid ${C.gold}55` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <p style={{ fontWeight:700, fontSize:16, color:C.ink, fontFamily:"'Fraunces', Georgia, serif" }}>Max</p>
            <Crown size={18} color={C.gold} strokeWidth={1.8}/>
          </div>
          <p style={{ fontSize:22, fontWeight:700, color:C.gold, fontFamily:"'Fraunces', Georgia, serif" }}>$19<span style={{ fontSize:13, fontWeight:400 }}>/mo</span></p>
        </div>
        {["120 messages per day","Upgraded to Sonnet 4.6 — the latest model","Everything in Supporter","You're a real one"].map(f => (
          <div key={f} style={{ display:"flex", gap:10, alignItems:"center", marginBottom:7 }}>
            <Check size={13} color={C.gold} strokeWidth={2.5}/>
            <p style={{ color:C.stone, fontSize:13 }}>{f}</p>
          </div>
        ))}
        <PayPalScriptProvider options={{ 'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID, currency: 'USD' }}>
  <PayPalButtons
    style={{ layout: 'vertical', shape: 'pill' }}
    createOrder={(data, actions) => actions.order.create({
      purchase_units: [{ amount: { value: '9.99' }, description: 'Buddin Max Plan' }]
    })}
    onApprove={async () => {
      if (session) {
        await supabase.from('profiles').update({ tier: 'max' }).eq('id', session.user.id)
        alert('You are now on Max! Refresh to see your new limits.')
      }
    }}
  />
</PayPalScriptProvider>
      </div>

      <p style={{ color:C.stoneMid, fontSize:11, textAlign:"center", lineHeight:1.65 }}>No subscription traps — cancel anytime.<br/>Built by a high school student. Every dollar goes to API costs.</p>
    </div>
    <Dock screen={screen} setScreen={setScreen} onMissions={onMissions} avatarColor={avatarColor}/>
  </div>
)}
  {/* ── DONATE ──────────────────────────────────────────── */}
  {screen === "knowme" && (
  <div style={{ ...BG, overflowY:"auto", WebkitOverflowScrolling:"touch", paddingBottom:100 }}>
    <LivingBg intensity={3} avatarColor={avatarColor}/>
    <div style={{ position:"relative", zIndex:1 }}>
      <div style={W}>
        <div style={{ paddingTop:40, paddingBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Brain size={22} color="#fff" strokeWidth={2}/>
            </div>
            <div>
              <h1 style={{ fontFamily:"'Fraunces', Georgia, serif", fontSize:26, fontWeight:400, color:C.ink, margin:0 }}>Know Me</h1>
              <p style={{ color:C.stoneMid, fontSize:13, margin:0 }}>Help Buddin understand how you think.</p>
            </div>
          </div>

          <button
            onClick={() => setScreen("comparisons")}
            className="glass card"
            style={{ width:"100%", borderRadius:18, padding:"18px 20px", cursor:"pointer", textAlign:"left", border:`1.5px solid ${avatarColor}33`, marginBottom:12, display:"block" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:`${avatarColor}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Shuffle size={19} color={avatarColor} strokeWidth={2}/>
              </div>
              <div>
                <p style={{ fontWeight:700, fontSize:15, color:C.ink, margin:0 }}>This or That</p>
                <p style={{ color:C.stone, fontSize:13, margin:"3px 0 0" }}>Quick picks that reveal how you think.</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setScreen("wordgame")}
            className="glass card"
            style={{ width:"100%", borderRadius:18, padding:"18px 20px", cursor:"pointer", textAlign:"left", border:`1.5px solid ${avatarColor}33`, marginBottom:12, display:"block" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:`${avatarColor}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <BookOpen size={19} color={avatarColor} strokeWidth={2}/>
              </div>
              <div>
                <p style={{ fontWeight:700, fontSize:15, color:C.ink, margin:0 }}>Word Association</p>
                <p style={{ color:C.stone, fontSize:13, margin:"3px 0 0" }}>What words mean to you says a lot.</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setScreen("writingprompt")}
            className="glass card"
            style={{ width:"100%", borderRadius:18, padding:"18px 20px", cursor:"pointer", textAlign:"left", border:`1.5px solid ${avatarColor}33`, marginBottom:12, display:"block" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:`${avatarColor}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Heart size={19} color={avatarColor} strokeWidth={2}/>
              </div>
              <div>
                <p style={{ fontWeight:700, fontSize:15, color:C.ink, margin:0 }}>Writing Prompts</p>
                <p style={{ color:C.stone, fontSize:13, margin:"3px 0 0" }}>Show Buddin how you express yourself.</p>
              </div>
            </div>
          </button>

          <div className="glass" style={{ borderRadius:18, padding:"18px 20px", marginBottom:12, opacity:0.5, border:`1.5px solid ${C.stoneLight}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:`${C.stoneLight}44`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Brain size={19} color={C.stoneMid} strokeWidth={2}/>
              </div>
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <p style={{ fontWeight:700, fontSize:15, color:C.ink, margin:0 }}>Preferences</p>
                  <span style={{ fontSize:10, color:C.stoneMid, background:C.stoneLight, borderRadius:6, padding:"2px 8px" }}>Coming soon</span>
                </div>
                <p style={{ color:C.stone, fontSize:13, margin:"3px 0 0" }}>Your habits and preferences reveal your personality.</p>
              </div>
            </div>
          </div>
          <button
  onClick={() => setScreen("myprofile")}
  className="glass card"
  style={{ width:"100%", borderRadius:18, padding:"18px 20px", cursor:"pointer", textAlign:"left", border:`1.5px solid ${avatarColor}33`, marginBottom:12, display:"block" }}>
  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
    <div style={{ width:40, height:40, borderRadius:12, background:`${avatarColor}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <Brain size={19} color={avatarColor} strokeWidth={2}/>
    </div>
    <div>
      <p style={{ fontWeight:700, fontSize:15, color:C.ink, margin:0 }}>My Profile</p>
      <p style={{ color:C.stone, fontSize:13, margin:"3px 0 0" }}>See what Buddin has figured out about you.</p>
    </div>
  </div>
</button>
          <p style={{ color:C.stoneMid, fontSize:11, textAlign:"center", marginTop:24, lineHeight:1.6 }}>
            All data stays with you. You can clear it anytime.
          </p>
        </div>
      </div>
    </div>
    <Dock screen={screen} setScreen={setScreen} onMissions={onMissions} avatarColor={avatarColor}/>
  </div>
)}

{screen === "comparisons" && (
  <div style={{ position:"relative", zIndex:1, minHeight:"100vh", background:C.cream }}>
    <ComparisonEngine setScreen={setScreen} avatarColor={avatarColor} C={C} />
  </div>
)}

{screen === "myprofile" && (
  <div style={{ position:"relative", zIndex:1, minHeight:"100vh", background:C.cream }}>
    <MyProfile setScreen={setScreen} avatarColor={avatarColor} C={C} />
  </div>
)}

{screen === "wordgame" && (
  <div style={{ position:"relative", zIndex:1, minHeight:"100vh", background:C.cream }}>
    <WordGame setScreen={setScreen} avatarColor={avatarColor} C={C} />
  </div>
)}

{screen === "writingprompt" && (
  <div style={{ position:"relative", zIndex:1, minHeight:"100vh", background:C.cream }}>
    <WritingPrompt setScreen={setScreen} avatarColor={avatarColor} C={C} />
  </div>
)}

{screen === "feedback" && (
  <div style={{ position:"relative", zIndex:1, minHeight:"100vh", background:C.cream }}>
    <Feedback setScreen={setScreen} avatarColor={avatarColor} C={C} />
  </div>
)}

  {screen === "donate" && (
    <div style={{ ...BG, paddingBottom:100, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
      <LivingBg intensity={3} avatarColor={avatarColor}/>
      <div style={W}>
        <SectionHeader onBack={() => setScreen("home")} title="Support Buddin"/>

        <div className="glass card" style={{ borderRadius:22, padding:24, marginBottom:16, border:`1.5px solid ${avatarColor}33` }}>
          <p style={{ color:avatarColor, fontSize:11, fontWeight:700, letterSpacing:"0.12em", marginBottom:10 }}>THE STORY</p>
          <p style={{ color:C.ink, fontSize:15, lineHeight:1.88, fontFamily:"'Fraunces', Georgia, serif", fontStyle:"italic", fontWeight:300, marginBottom:14 }}>
            "I built Buddin because I know what it feels like to need someone to talk to and have no one around.
  I'm 14 years old, a high school student in Cumming, Georgia, and I coded this entirely from scratch
  — not for a class, not for a grade, but because I genuinely wanted it to exist.
  There were nights I wished an app like this existed for me. So I built it."
          </p>
          <p style={{ color:C.stone, fontSize:13, lineHeight:1.75, marginBottom:10 }}>
            Every conversation on Buddin costs real money — AI inference, servers, bandwidth. Right now I'm funding it myself, on a student's budget. Your support, no matter how small, keeps this running for everyone who needs it.
          </p>
          <p style={{ color:C.stone, fontSize:13, lineHeight:1.75 }}>
            This is a passion project. There are no investors, no ads, no data selling. Just a teenager who coded this from scratch and wants it to stay free for people who need it.
          </p>
        </div>

        <div className="glass" style={{ borderRadius:18, padding:20, marginBottom:14, background:`${avatarColor}0a`, border:`1px solid ${avatarColor}22` }}>
          <p style={{ color:C.forest, fontSize:13, fontWeight:600, marginBottom:6 }}>Your donation helps pay for:</p>
          {["API costs for every conversation","Vercel hosting & bandwidth","Future features (voice, mobile app)","Keeping Buddin free for everyone"].map((item, i) => (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"center", marginBottom:7 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:avatarColor, flexShrink:0 }}/>
              <p style={{ color:C.stone, fontSize:13 }}>{item}</p>
            </div>
          ))}
        </div>

        <PayPalScriptProvider options={{ 'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID, currency: 'USD' }}>
  <PayPalButtons
    style={{ layout: 'vertical', shape: 'pill' }}
    createOrder={(data, actions) => actions.order.create({
      purchase_units: [{ amount: { value: '5.00' }, description: 'Buddin Donation' }]
    })}
    onApprove={() => alert('Thank you so much! Every dollar keeps Buddin alive.')}
  />
</PayPalScriptProvider>

        <p style={{ color:C.stoneMid, fontSize:12, textAlign:"center", lineHeight:1.65 }}>
          No account needed. Any amount helps. Thank you for believing in this.
        </p>

        <div className="glass" style={{ borderRadius:18, padding:20, marginTop:16, border:`1px solid ${avatarColor}22` }}>
          <p style={{ color:C.forest, fontSize:13, fontWeight:600, marginBottom:12 }}>Follow Buddin</p>
          <div style={{ display:"flex", gap:10, marginBottom:12 }}>
            <a href="https://www.youtube.com/channel/UClXPubvuKuWSYKkRwBqwo1Q" target="_blank" rel="noopener noreferrer"
              style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"11px 12px", borderRadius:12, border:`1px solid ${C.stoneLight}`, color:C.stone, fontSize:13, fontWeight:600, textDecoration:"none", background:"rgba(255,248,235,0.55)" }}>
              <YoutubeIcon size={15}/> @Getbuddin
            </a>
            <a href="https://www.instagram.com/getbuddin" target="_blank" rel="noopener noreferrer"
              style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"11px 12px", borderRadius:12, border:`1px solid ${C.stoneLight}`, color:C.stone, fontSize:13, fontWeight:600, textDecoration:"none", background:"rgba(255,248,235,0.55)" }}>
              <InstagramIcon size={15}/> getbuddin
            </a>
          </div>
          <button onClick={() => setScreen("feedback")} className="btn"
            style={{ width:"100%", padding:"12px", background:"transparent", border:`1px solid ${avatarColor}44`, borderRadius:12, fontSize:13, color:avatarColor, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
            <MessageCircle size={14} strokeWidth={2}/> Send feedback
          </button>
        </div>
      </div>
      <Dock screen={screen} setScreen={setScreen} onMissions={onMissions} avatarColor={avatarColor}/>
    </div>
  )}

    </div>
  );
}