// Number Preference — the smallest module in the system.
//
// Standalone-versus-embedded was left genuinely open in spec 7.6. The call made
// here is standalone, for one concrete reason: the obvious place to embed it was
// mid-chat, and spec 5.6 says no AI turn asks more than one thing. Slipping a
// data-collection prompt into a conversation would also cut against the
// peer-not-therapist tone the chat is built around — it would start to feel like
// the companion was harvesting rather than talking.
//
// It stays lightweight in a different way instead: there is no queue to finish
// and no completion state to chase. Numbers climb as long as someone keeps going
// and the screen says so plainly.
//
// The ladder is ordered, not shuffled — "starting small, growing over time" is
// the point. Later entries carry more cultural and mathematical baggage than
// early ones, which is where the signal is.

export const NUMBER_LADDER = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 27, 28, 30, 31, 33, 36,
  37, 40, 42, 44, 45, 47, 49, 50, 52, 56,
  60, 64, 66, 69, 72, 73, 77, 80, 81, 88,
  90, 96, 99, 100, 101, 108, 111, 112, 121, 123,
  127, 128, 137, 144, 150, 153, 168, 180, 196, 200,
  216, 222, 231, 243, 250, 256, 300, 314, 333, 360,
  365, 400, 404, 420, 432, 500, 512, 555, 600, 616,
  666, 700, 720, 777, 786, 800, 808, 888, 900, 911,
  999, 1000, 1010, 1024, 1089, 1111, 1234, 1337, 1440, 1729,
  1836, 2000, 2048, 2187, 2500, 3141, 4096, 5000, 6174, 9999,
];

export const REACTIONS = [
  { value: "like",    label: "Like it" },
  { value: "neutral", label: "Nothing" },
  { value: "dislike", label: "Don't like it" },
];
