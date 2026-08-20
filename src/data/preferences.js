// Preferences — the one Know Me module where asking directly is the right call.
// Grouped into four clusters because the clusters, not the individual questions,
// are what give the screen its structure (spec 7.3).
//
// Each question stores under `key` inside user_profile.preferences (JSONB).
// `insight` matches the tagging convention used by This-or-That and the word bank
// so the inference engine can read all three the same way.

export const PREFERENCE_CLUSTERS = [
  {
    id: "rhythm",
    title: "Your daily rhythm",
    blurb: "When your brain actually shows up.",
    questions: [
      {
        key: "peak_hours",
        label: "When do you think most clearly?",
        insight: "circadian_rhythm",
        options: [
          { value: "early_morning", label: "Early morning" },
          { value: "midday", label: "Midday" },
          { value: "evening", label: "Evening" },
          { value: "late_night", label: "Late at night" },
        ],
      },
      {
        key: "wake_style",
        label: "Mornings, honestly?",
        insight: "routine_anchoring",
        options: [
          { value: "up_immediately", label: "Up right away" },
          { value: "slow_start", label: "Slow start" },
          { value: "snooze_cycle", label: "Several alarms" },
          { value: "depends", label: "Totally depends" },
        ],
      },
      {
        key: "schedule_shape",
        label: "A good week looks like…",
        insight: "structure_reliance",
        options: [
          { value: "planned_out", label: "Planned out" },
          { value: "loose_frame", label: "Loose frame, flexible middle" },
          { value: "open", label: "Mostly open" },
        ],
      },
    ],
  },
  {
    id: "environment",
    title: "How you work",
    blurb: "The conditions you actually get things done in.",
    questions: [
      {
        key: "sound_focus",
        label: "Sound while you're focusing?",
        insight: "sensory_preference",
        options: [
          { value: "silence", label: "Silence" },
          { value: "instrumental", label: "Music without words" },
          { value: "lyrics", label: "Music with lyrics" },
          { value: "ambient_noise", label: "Background noise / people around" },
        ],
      },
      {
        key: "sound_relax",
        label: "And when you're winding down?",
        insight: "sensory_preference",
        options: [
          { value: "silence", label: "Silence" },
          { value: "music", label: "Music" },
          { value: "video_podcast", label: "Something playing" },
          { value: "varies", label: "Depends on the day" },
        ],
      },
      {
        key: "workspace",
        label: "Where do you do your best thinking?",
        insight: "environmental_stimulation",
        options: [
          { value: "own_room", label: "My own space" },
          { value: "shared_quiet", label: "A quiet shared space" },
          { value: "public_busy", label: "Somewhere busy" },
          { value: "outside", label: "Outside" },
        ],
      },
    ],
  },
  {
    id: "social",
    title: "Social battery",
    blurb: "What fills you back up, and what drains you.",
    questions: [
      {
        key: "recharge_mode",
        label: "After a long day, you recharge by…",
        insight: "social_pattern",
        options: [
          { value: "alone", label: "Being alone" },
          { value: "one_person", label: "One person you trust" },
          { value: "small_group", label: "A small group" },
          { value: "crowd", label: "Being around a lot of people" },
        ],
      },
      {
        key: "plans_reaction",
        label: "Plans get cancelled last minute. First feeling?",
        insight: "social_bandwidth",
        options: [
          { value: "relief", label: "Relief" },
          { value: "disappointment", label: "Disappointment" },
          { value: "neutral", label: "Neither, really" },
          { value: "depends_who", label: "Depends who it was" },
        ],
      },
      {
        key: "new_people",
        label: "Meeting people you don't know is…",
        insight: "social_expansion",
        options: [
          { value: "energizing", label: "Energizing" },
          { value: "fine", label: "Fine, once it starts" },
          { value: "draining", label: "Draining" },
          { value: "avoid", label: "Something I avoid" },
        ],
      },
    ],
  },
  {
    id: "risk",
    title: "Rules and risk",
    blurb: "How you handle the parts nobody's watching.",
    questions: [
      {
        key: "rule_stance",
        label: "A rule that makes no sense to you — you…",
        insight: "authority_relationship",
        options: [
          { value: "follow_anyway", label: "Follow it anyway" },
          { value: "ask_why", label: "Ask why first" },
          { value: "quietly_ignore", label: "Quietly work around it" },
          { value: "push_back", label: "Push back openly" },
        ],
      },
      {
        key: "risk_appetite",
        label: "A choice with a real chance of failing but a big upside?",
        insight: "risk_appetite",
        options: [
          { value: "take_it", label: "I take it" },
          { value: "think_hard", label: "I think about it for a while" },
          { value: "need_backup", label: "Only with a backup plan" },
          { value: "pass", label: "I pass" },
        ],
      },
      {
        key: "deadline_style",
        label: "Work that's due Friday usually gets done…",
        insight: "time_management",
        options: [
          { value: "early", label: "Early" },
          { value: "steady", label: "A bit at a time" },
          { value: "night_before", label: "The night before" },
          { value: "last_hour", label: "The last possible hour" },
        ],
      },
    ],
  },
];

export const PREFERENCE_QUESTION_COUNT = PREFERENCE_CLUSTERS
  .reduce((n, c) => n + c.questions.length, 0);

// Flat lookup so the inference engine can label a stored answer without
// walking the cluster tree.
export const PREFERENCE_LOOKUP = Object.fromEntries(
  PREFERENCE_CLUSTERS.flatMap(c =>
    c.questions.map(q => [q.key, { ...q, cluster: c.id, clusterTitle: c.title }])
  )
);
