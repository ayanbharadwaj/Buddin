// Career Discovery — oblique questions only.
//
// "What do you want to be when you grow up" is one of the least reliable
// questions you can ask a teenager: the answer is shaped by what sounds
// impressive, what parents expect, and whatever was recently on their mind, far
// more than by aptitude or interest (spec 7.5). None of these questions mention
// a job, a field, or a subject. They ask about behaviour under specific
// conditions, and the synthesis does the rest by combining them with the
// comparison, word, writing, preference and recognition data already on file.

export const CAREER_QUESTIONS = [
  {
    key: "failure_response",
    prompt: "You put real effort into something and it didn't work. What's the first thing you do?",
    insight: "failure_response",
    options: [
      { value: "diagnose", label: "Figure out exactly where it went wrong" },
      { value: "retry_fast", label: "Try again right away, differently" },
      { value: "step_away", label: "Step away from it for a while" },
      { value: "ask_someone", label: "Find someone who's done it before" },
    ],
  },
  {
    key: "recognition",
    prompt: "Which of these would actually mean something to you?",
    insight: "motivation_source",
    options: [
      { value: "expert_respect", label: "Someone who's genuinely good at it says you did well" },
      { value: "wide_reach", label: "A lot of people saw it and it helped them" },
      { value: "private_knowing", label: "Nobody found out, but you know it was right" },
      { value: "close_people", label: "The people closest to you were proud" },
    ],
  },
  {
    key: "free_hour",
    prompt: "An hour opens up unexpectedly. Nothing's due. What actually happens?",
    insight: "default_pull",
    options: [
      { value: "make_something", label: "You make or build something" },
      { value: "go_deep", label: "You fall down a rabbit hole on something you're curious about" },
      { value: "find_people", label: "You find people" },
      { value: "move", label: "You go outside or move your body" },
      { value: "rest", label: "You genuinely rest" },
    ],
  },
  {
    key: "problem_type",
    prompt: "Two problems, both unsolved. Which one bothers you more?",
    insight: "problem_orientation",
    options: [
      { value: "broken_system", label: "Something is set up badly and everyone just lives with it" },
      { value: "unfair_outcome", label: "Someone is getting a raw deal and nobody's noticed" },
      { value: "unexplained", label: "Something happens and nobody can explain why" },
      { value: "ugly_thing", label: "Something works fine but it's clumsy and unpleasant to use" },
    ],
  },
  {
    key: "work_shape",
    prompt: "Same amount of work either way. Which week sounds worse?",
    insight: "work_rhythm",
    options: [
      { value: "same_every_day", label: "The same thing every day, predictable, no surprises" },
      { value: "all_different", label: "Something different every day, nothing finished" },
      { value: "one_long_thing", label: "One long thing you won't see the end of for months" },
      { value: "constant_people", label: "Back-to-back with other people, no time alone" },
    ],
  },
  {
    key: "credit",
    prompt: "A thing you worked on succeeds. Someone else gets most of the credit.",
    insight: "ego_pattern",
    options: [
      { value: "genuinely_fine", label: "Genuinely fine — the thing worked" },
      { value: "fine_but_notice", label: "Fine, but you notice it and remember" },
      { value: "bothers_a_lot", label: "It bothers you more than you'd admit out loud" },
      { value: "depends_who", label: "Depends entirely on who got it" },
    ],
  },
];
