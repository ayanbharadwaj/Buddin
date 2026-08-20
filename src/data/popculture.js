// Pop Culture Recognition — names only. No images, no logos, no reproduced media
// of any kind (spec 7.4). Not recognising a name is exactly as useful a signal as
// recognising one, so nothing in this bank is framed as "should know".
//
// The category structure was drafted before the names were, and the bank is
// checked on three axes: domain spread, era spread, and mainstream vs. niche.
// A bank that's eighty percent one category produces a lopsided signal no matter
// how good the screen is.
//
// era:  "classic" (pre-2000) | "modern" (2000-2015) | "current" (2015-now)
// reach: "mainstream" | "niche"

export const POP_CATEGORIES = {
  music:      "Music",
  screen:     "Film & TV",
  character:  "Fictional characters",
  sport:      "Sport",
  tech:       "Tech & business",
  writing:    "Writers & thinkers",
  internet:   "Internet & creators",
  art:        "Art & design",
  science:    "Science",
};

export const POP_NAMES = [
  // ── Music ────────────────────────────────────────────────────────────────
  { id: 1,  name: "Taylor Swift",        category: "music",     era: "current",  reach: "mainstream", insight: "generational_alignment" },
  { id: 2,  name: "Kendrick Lamar",      category: "music",     era: "modern",   reach: "mainstream", insight: "lyrical_engagement" },
  { id: 3,  name: "Nina Simone",         category: "music",     era: "classic",  reach: "niche",      insight: "historical_depth" },
  { id: 4,  name: "Fela Kuti",           category: "music",     era: "classic",  reach: "niche",      insight: "global_music_reach" },
  { id: 5,  name: "Mitski",              category: "music",     era: "current",  reach: "niche",      insight: "subculture_membership" },
  { id: 6,  name: "Johnny Cash",         category: "music",     era: "classic",  reach: "mainstream", insight: "inherited_taste" },
  { id: 7,  name: "Bad Bunny",           category: "music",     era: "current",  reach: "mainstream", insight: "global_pop_fluency" },
  { id: 8,  name: "Nujabes",             category: "music",     era: "modern",   reach: "niche",      insight: "internet_subculture" },
  { id: 9,  name: "Aretha Franklin",     category: "music",     era: "classic",  reach: "mainstream", insight: "historical_depth" },
  { id: 10, name: "Ryuichi Sakamoto",    category: "music",     era: "modern",   reach: "niche",      insight: "ambient_sensibility" },

  // ── Film & TV ────────────────────────────────────────────────────────────
  { id: 11, name: "Greta Gerwig",        category: "screen",    era: "current",  reach: "mainstream", insight: "contemporary_film_awareness" },
  { id: 12, name: "Akira Kurosawa",      category: "screen",    era: "classic",  reach: "niche",      insight: "cinematic_literacy" },
  { id: 13, name: "Zendaya",             category: "screen",    era: "current",  reach: "mainstream", insight: "generational_alignment" },
  { id: 14, name: "Denzel Washington",   category: "screen",    era: "modern",   reach: "mainstream", insight: "cross_generational_reach" },
  { id: 15, name: "Bong Joon-ho",        category: "screen",    era: "current",  reach: "niche",      insight: "international_film_reach" },
  { id: 16, name: "Lucille Ball",        category: "screen",    era: "classic",  reach: "niche",      insight: "comedy_history" },
  { id: 17, name: "Hayao Miyazaki",      category: "screen",    era: "modern",   reach: "mainstream", insight: "animation_affinity" },
  { id: 18, name: "Phoebe Waller-Bridge",category: "screen",    era: "current",  reach: "niche",      insight: "writerly_comedy_taste" },
  { id: 19, name: "Sidney Poitier",      category: "screen",    era: "classic",  reach: "niche",      insight: "historical_depth" },
  { id: 20, name: "Christopher Nolan",   category: "screen",    era: "modern",   reach: "mainstream", insight: "blockbuster_engagement" },

  // ── Fictional characters ────────────────────────────────────────────────
  { id: 21, name: "Sherlock Holmes",     category: "character", era: "classic",  reach: "mainstream", insight: "archetype_affinity" },
  { id: 22, name: "Harvey Specter",      category: "character", era: "modern",   reach: "niche",      insight: "composure_ideal" },
  { id: 23, name: "Hermione Granger",    category: "character", era: "modern",   reach: "mainstream", insight: "generational_alignment" },
  { id: 24, name: "Atticus Finch",       category: "character", era: "classic",  reach: "mainstream", insight: "moral_archetype" },
  { id: 25, name: "Tony Soprano",        category: "character", era: "modern",   reach: "mainstream", insight: "antihero_engagement" },
  { id: 26, name: "Edmond Dantès",       category: "character", era: "classic",  reach: "niche",      insight: "literary_depth" },
  { id: 27, name: "Katniss Everdeen",    category: "character", era: "modern",   reach: "mainstream", insight: "generational_alignment" },
  { id: 28, name: "Don Draper",          category: "character", era: "modern",   reach: "mainstream", insight: "aspirational_archetype" },
  { id: 29, name: "Elizabeth Bennet",    category: "character", era: "classic",  reach: "mainstream", insight: "literary_depth" },
  { id: 30, name: "Spider-Man",          category: "character", era: "classic",  reach: "mainstream", insight: "baseline_recognition" },

  // ── Sport ────────────────────────────────────────────────────────────────
  { id: 31, name: "Serena Williams",     category: "sport",     era: "modern",   reach: "mainstream", insight: "sport_engagement" },
  { id: 32, name: "Lionel Messi",        category: "sport",     era: "current",  reach: "mainstream", insight: "global_sport_reach" },
  { id: 33, name: "Muhammad Ali",        category: "sport",     era: "classic",  reach: "mainstream", insight: "historical_depth" },
  { id: 34, name: "Simone Biles",        category: "sport",     era: "current",  reach: "mainstream", insight: "current_sport_awareness" },
  { id: 35, name: "Jackie Robinson",     category: "sport",     era: "classic",  reach: "mainstream", insight: "history_civics_overlap" },
  { id: 36, name: "Caitlin Clark",       category: "sport",     era: "current",  reach: "mainstream", insight: "current_sport_awareness" },
  { id: 37, name: "Eliud Kipchoge",      category: "sport",     era: "current",  reach: "niche",      insight: "endurance_culture" },
  { id: 38, name: "Magnus Carlsen",      category: "sport",     era: "current",  reach: "niche",      insight: "strategy_game_culture" },
  { id: 39, name: "Kobe Bryant",         category: "sport",     era: "modern",   reach: "mainstream", insight: "work_ethic_archetype" },
  { id: 40, name: "Billie Jean King",    category: "sport",     era: "classic",  reach: "niche",      insight: "history_civics_overlap" },

  // ── Tech & business ──────────────────────────────────────────────────────
  { id: 41, name: "Steve Jobs",          category: "tech",      era: "modern",   reach: "mainstream", insight: "founder_archetype" },
  { id: 42, name: "Ada Lovelace",        category: "tech",      era: "classic",  reach: "niche",      insight: "computing_history" },
  { id: 43, name: "Sam Altman",          category: "tech",      era: "current",  reach: "mainstream", insight: "ai_era_awareness" },
  { id: 44, name: "Grace Hopper",        category: "tech",      era: "classic",  reach: "niche",      insight: "computing_history" },
  { id: 45, name: "Warren Buffett",      category: "tech",      era: "modern",   reach: "mainstream", insight: "financial_curiosity" },
  { id: 46, name: "Linus Torvalds",      category: "tech",      era: "modern",   reach: "niche",      insight: "engineering_subculture" },
  { id: 47, name: "Jensen Huang",        category: "tech",      era: "current",  reach: "mainstream", insight: "ai_era_awareness" },
  { id: 48, name: "Reshma Saujani",      category: "tech",      era: "current",  reach: "niche",      insight: "cs_education_awareness" },
  { id: 49, name: "Satoshi Nakamoto",    category: "tech",      era: "modern",   reach: "niche",      insight: "internet_subculture" },
  { id: 50, name: "Mary Barra",          category: "tech",      era: "current",  reach: "niche",      insight: "industry_awareness" },

  // ── Writers & thinkers ───────────────────────────────────────────────────
  { id: 51, name: "James Baldwin",       category: "writing",   era: "classic",  reach: "niche",      insight: "literary_depth" },
  { id: 52, name: "Toni Morrison",       category: "writing",   era: "classic",  reach: "mainstream", insight: "literary_depth" },
  { id: 53, name: "Haruki Murakami",     category: "writing",   era: "modern",   reach: "niche",      insight: "international_literature" },
  { id: 54, name: "Maya Angelou",        category: "writing",   era: "classic",  reach: "mainstream", insight: "poetic_exposure" },
  { id: 55, name: "Ocean Vuong",         category: "writing",   era: "current",  reach: "niche",      insight: "contemporary_poetry" },
  { id: 56, name: "Marcus Aurelius",     category: "writing",   era: "classic",  reach: "niche",      insight: "philosophical_orientation" },
  { id: 57, name: "Chimamanda Ngozi Adichie", category: "writing", era: "current", reach: "niche",   insight: "global_literature" },
  { id: 58, name: "Malcolm Gladwell",    category: "writing",   era: "modern",   reach: "mainstream", insight: "pop_nonfiction_diet" },
  { id: 59, name: "Hannah Arendt",       category: "writing",   era: "classic",  reach: "niche",      insight: "political_philosophy" },
  { id: 60, name: "Rupi Kaur",           category: "writing",   era: "current",  reach: "mainstream", insight: "social_media_poetry" },

  // ── Internet & creators ──────────────────────────────────────────────────
  { id: 61, name: "MrBeast",             category: "internet",  era: "current",  reach: "mainstream", insight: "creator_economy_fluency" },
  { id: 62, name: "Hank Green",          category: "internet",  era: "modern",   reach: "niche",      insight: "edu_content_diet" },
  { id: 63, name: "Bo Burnham",          category: "internet",  era: "current",  reach: "mainstream", insight: "internet_native_comedy" },
  { id: 64, name: "Grant Sanderson",     category: "internet",  era: "current",  reach: "niche",      insight: "math_curiosity" },
  { id: 65, name: "Emma Chamberlain",    category: "internet",  era: "current",  reach: "mainstream", insight: "generational_alignment" },
  { id: 66, name: "Marques Brownlee",    category: "internet",  era: "modern",   reach: "niche",      insight: "tech_review_diet" },
  { id: 67, name: "Ira Glass",           category: "internet",  era: "modern",   reach: "niche",      insight: "audio_storytelling" },
  { id: 68, name: "Kurzgesagt",          category: "internet",  era: "modern",   reach: "niche",      insight: "science_content_diet" },
  { id: 69, name: "Rick Steves",         category: "internet",  era: "classic",  reach: "niche",      insight: "cross_generational_reach" },
  { id: 70, name: "Khaby Lame",          category: "internet",  era: "current",  reach: "mainstream", insight: "short_form_fluency" },

  // ── Art & design ─────────────────────────────────────────────────────────
  { id: 71, name: "Frida Kahlo",         category: "art",       era: "classic",  reach: "mainstream", insight: "art_exposure" },
  { id: 72, name: "Yayoi Kusama",        category: "art",       era: "modern",   reach: "niche",      insight: "contemporary_art_reach" },
  { id: 73, name: "Banksy",              category: "art",       era: "modern",   reach: "mainstream", insight: "street_art_affinity" },
  { id: 74, name: "Virgil Abloh",        category: "art",       era: "current",  reach: "niche",      insight: "fashion_design_fluency" },
  { id: 75, name: "Dieter Rams",         category: "art",       era: "classic",  reach: "niche",      insight: "design_philosophy" },
  { id: 76, name: "Basquiat",            category: "art",       era: "classic",  reach: "mainstream", insight: "art_exposure" },
  { id: 77, name: "Zaha Hadid",          category: "art",       era: "modern",   reach: "niche",      insight: "architecture_awareness" },
  { id: 78, name: "Vivienne Westwood",   category: "art",       era: "classic",  reach: "niche",      insight: "fashion_history" },
  { id: 79, name: "Ansel Adams",         category: "art",       era: "classic",  reach: "niche",      insight: "photographic_sensibility" },
  { id: 80, name: "Es Devlin",           category: "art",       era: "current",  reach: "niche",      insight: "stage_design_awareness" },

  // ── Science ──────────────────────────────────────────────────────────────
  { id: 81, name: "Marie Curie",         category: "science",   era: "classic",  reach: "mainstream", insight: "science_baseline" },
  { id: 82, name: "Katherine Johnson",   category: "science",   era: "classic",  reach: "niche",      insight: "science_history_depth" },
  { id: 83, name: "Jane Goodall",        category: "science",   era: "modern",   reach: "mainstream", insight: "nature_orientation" },
  { id: 84, name: "Richard Feynman",     category: "science",   era: "classic",  reach: "niche",      insight: "physics_curiosity" },
  { id: 85, name: "Neil deGrasse Tyson", category: "science",   era: "modern",   reach: "mainstream", insight: "pop_science_diet" },
  { id: 86, name: "Jennifer Doudna",     category: "science",   era: "current",  reach: "niche",      insight: "biotech_awareness" },
  { id: 87, name: "Carl Sagan",          category: "science",   era: "classic",  reach: "niche",      insight: "cosmic_perspective" },
  { id: 88, name: "Alan Turing",         category: "science",   era: "classic",  reach: "mainstream", insight: "computing_history" },
  { id: 89, name: "Vandana Shiva",       category: "science",   era: "modern",   reach: "niche",      insight: "environmental_orientation" },
  { id: 90, name: "Demis Hassabis",      category: "science",   era: "current",  reach: "niche",      insight: "ai_era_awareness" },
];
