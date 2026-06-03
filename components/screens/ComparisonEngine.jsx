import { useState, useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from '../../lib/supabase.js';

const COMPARISONS = [
  {id: 1, category: "everyday", a: "Pen", b: "Pencil", insight: "organization_style"},
  {id: 2, category: "everyday", a: "Book", b: "Film", insight: "processing_modality"},
  {id: 3, category: "everyday", a: "Cash", b: "Card", insight: "financial_tangibility"},
  {id: 4, category: "everyday", a: "Coffee", b: "Tea", insight: "energy_regulation"},
  {id: 5, category: "everyday", a: "Shower morning", b: "Shower night", insight: "routine_anchoring"},
  {id: 6, category: "everyday", a: "Digital planner", b: "Paper planner", insight: "task_visualization"},
  {id: 7, category: "everyday", a: "Window seat", b: "Aisle seat", insight: "spatial_autonomy"},
  {id: 8, category: "everyday", a: "Blind down", b: "Blind up", insight: "environmental_control"},
  {id: 9, category: "everyday", a: "Backpack", b: "Briefcase", insight: "utility_vs_formality"},
  {id: 10, category: "everyday", a: "Glasses", b: "Contacts", insight: "barrier_preference"},
  {id: 11, category: "everyday", a: "Watch", b: "Phone time", insight: "temporal_awareness"},
  {id: 12, category: "everyday", a: "Sweet", b: "Savory", insight: "sensory_preference"},
  {id: 13, category: "everyday", a: "E-reader", b: "Physical book", insight: "tactile_attachment"},
  {id: 14, category: "everyday", a: "Desktop", b: "Laptop", insight: "mobility_vs_stability"},
  {id: 15, category: "everyday", a: "Podcasts", b: "Music", insight: "auditory_engagement"},
  {id: 16, category: "aesthetic", a: "Deep orange", b: "Light green", insight: "color_intensity"},
  {id: 17, category: "aesthetic", a: "Maroon", b: "Hot pink", insight: "vibrancy_preference"},
  {id: 18, category: "aesthetic", a: "Minimalist", b: "Maximalist", insight: "visual_complexity"},
  {id: 19, category: "aesthetic", a: "Matte", b: "Glossy", insight: "textural_preference"},
  {id: 20, category: "aesthetic", a: "Symmetrical", b: "Asymmetrical", insight: "order_vs_chaos"},
  {id: 21, category: "aesthetic", a: "Vintage", b: "Modern", insight: "temporal_aesthetics"},
  {id: 22, category: "aesthetic", a: "Pastel", b: "Neon", insight: "saturation_tolerance"},
  {id: 23, category: "aesthetic", a: "Geometric", b: "Organic", insight: "structural_preference"},
  {id: 24, category: "aesthetic", a: "Monochrome", b: "Multicolor", insight: "chromatic_focus"},
  {id: 25, category: "aesthetic", a: "Warm lighting", b: "Cool lighting", insight: "environmental_mood"},
  {id: 26, category: "aesthetic", a: "Silver", b: "Gold", insight: "metallic_affinity"},
  {id: 27, category: "aesthetic", a: "Wood", b: "Metal", insight: "material_warmth"},
  {id: 28, category: "aesthetic", a: "Sharp edges", b: "Rounded corners", insight: "silhouette_preference"},
  {id: 29, category: "aesthetic", a: "Matte black", b: "Stark white", insight: "contrast_baseline"},
  {id: 30, category: "aesthetic", a: "Florals", b: "Stripes", insight: "pattern_complexity"},
  {id: 31, category: "lifestyle", a: "Home gym", b: "Public gym", insight: "fitness_environment"},
  {id: 32, category: "lifestyle", a: "Early nights", b: "Late nights", insight: "circadian_rhythm"},
  {id: 33, category: "lifestyle", a: "City", b: "Countryside", insight: "environmental_stimulation"},
  {id: 34, category: "lifestyle", a: "Apartment", b: "House", insight: "spatial_responsibility"},
  {id: 35, category: "lifestyle", a: "Cook at home", b: "Eat out", insight: "culinary_autonomy"},
  {id: 36, category: "lifestyle", a: "Routine", b: "Spontaneous", insight: "structure_reliance"},
  {id: 37, category: "lifestyle", a: "Save", b: "Spend", insight: "resource_allocation"},
  {id: 38, category: "lifestyle", a: "Commute by car", b: "Commute by transit", insight: "transit_independence"},
  {id: 39, category: "lifestyle", a: "Big family", b: "Small family", insight: "familial_density"},
  {id: 40, category: "lifestyle", a: "Busy schedule", b: "Open calendar", insight: "time_management"},
  {id: 41, category: "lifestyle", a: "Work to live", b: "Live to work", insight: "vocational_identity"},
  {id: 42, category: "lifestyle", a: "Tidy desk", b: "Messy desk", insight: "workspace_organization"},
  {id: 43, category: "lifestyle", a: "Fast fashion", b: "Thrifted", insight: "consumption_ethics"},
  {id: 44, category: "lifestyle", a: "DIY", b: "Hire a pro", insight: "self_reliance"},
  {id: 45, category: "lifestyle", a: "Hustle", b: "Slow living", insight: "pace_of_life"},
  {id: 46, category: "luxury", a: "Lamborghini", b: "Rolls Royce", insight: "flash_vs_elegance"},
  {id: 47, category: "luxury", a: "Penthouse", b: "Mansion", insight: "vertical_vs_horizontal_wealth"},
  {id: 48, category: "luxury", a: "Rolex", b: "Patek Philippe", insight: "brand_conspicuousness"},
  {id: 49, category: "luxury", a: "Private jet", b: "Superyacht", insight: "speed_vs_leisure"},
  {id: 50, category: "luxury", a: "Fine dining", b: "Private chef", insight: "public_vs_private_exclusivity"},
  {id: 51, category: "luxury", a: "Gucci", b: "Bottega Veneta", insight: "logomania_vs_stealth_wealth"},
  {id: 52, category: "luxury", a: "First class flight", b: "Five star hotel", insight: "journey_vs_destination"},
  {id: 53, category: "luxury", a: "Diamond", b: "Emerald", insight: "classic_vs_distinctive"},
  {id: 54, category: "luxury", a: "Personal driver", b: "Personal assistant", insight: "delegation_preference"},
  {id: 55, category: "luxury", a: "Caviar", b: "Truffle", insight: "palate_prestige"},
  {id: 56, category: "luxury", a: "Art collection", b: "Car collection", insight: "cultural_vs_mechanical_capital"},
  {id: 57, category: "luxury", a: "Vineyard", b: "Equestrian estate", insight: "lifestyle_investment"},
  {id: 58, category: "luxury", a: "Bespoke suit", b: "Designer streetwear", insight: "formal_vs_casual_luxury"},
  {id: 59, category: "luxury", a: "Spa day", b: "Shopping spree", insight: "experiential_vs_material_reward"},
  {id: 60, category: "luxury", a: "Vintage wine", b: "Aged whiskey", insight: "libation_sophistication"},
  {id: 61, category: "tech", a: "iPhone", b: "Android", insight: "ecosystem_conformity"},
  {id: 62, category: "tech", a: "MacBook", b: "Windows", insight: "workflow_philosophy"},
  {id: 63, category: "tech", a: "PS5", b: "Xbox", insight: "gaming_loyalty"},
  {id: 64, category: "tech", a: "Smartwatch", b: "Analog watch", insight: "biological_tracking"},
  {id: 65, category: "tech", a: "AirPods", b: "Over-ear headphones", insight: "auditory_isolation"},
  {id: 66, category: "tech", a: "Spotify", b: "Apple Music", insight: "algorithm_trust"},
  {id: 67, category: "tech", a: "Notion", b: "Evernote", insight: "digital_organization"},
  {id: 68, category: "tech", a: "Wireless charging", b: "Wired charging", insight: "convenience_vs_speed"},
  {id: 69, category: "tech", a: "Mechanical keyboard", b: "Membrane keyboard", insight: "tactile_feedback"},
  {id: 70, category: "tech", a: "Google", b: "DuckDuckGo", insight: "privacy_prioritization"},
  {id: 71, category: "tech", a: "Two monitors", b: "Ultrawide monitor", insight: "visual_segmentation"},
  {id: 72, category: "tech", a: "Touch ID", b: "Face ID", insight: "biometric_preference"},
  {id: 73, category: "tech", a: "Dark mode", b: "Light mode", insight: "visual_comfort"},
  {id: 74, category: "tech", a: "Cloud storage", b: "External hard drive", insight: "data_sovereignty"},
  {id: 75, category: "tech", a: "Smart home", b: "Dumb home", insight: "domestic_automation"},
  {id: 76, category: "adventure", a: "Camping", b: "Hiking", insight: "immersion_vs_progression"},
  {id: 77, category: "adventure", a: "Road trip", b: "Flight", insight: "journey_pacing"},
  {id: 78, category: "adventure", a: "Solo travel", b: "Group travel", insight: "social_independence"},
  {id: 79, category: "adventure", a: "Beach", b: "Mountains", insight: "topographical_preference"},
  {id: 80, category: "adventure", a: "Plan everything", b: "Wing it", insight: "uncertainty_tolerance"},
  {id: 81, category: "adventure", a: "Resort", b: "Hostel", insight: "comfort_vs_connection"},
  {id: 82, category: "adventure", a: "Museum", b: "Theme park", insight: "cultural_vs_visceral_thrill"},
  {id: 83, category: "adventure", a: "Scuba diving", b: "Skydiving", insight: "depth_vs_height_thrill"},
  {id: 84, category: "adventure", a: "Backpacking", b: "Suitcase travel", insight: "mobility_priority"},
  {id: 85, category: "adventure", a: "Winter sports", b: "Summer water sports", insight: "climate_affinity"},
  {id: 86, category: "adventure", a: "Local exploration", b: "International travel", insight: "familiarity_vs_novelty"},
  {id: 87, category: "adventure", a: "Guidebook", b: "Local advice", insight: "information_sourcing"},
  {id: 88, category: "adventure", a: "Tourist spots", b: "Hidden gems", insight: "mainstream_vs_niche"},
  {id: 89, category: "adventure", a: "Souvenirs", b: "Photos", insight: "memory_preservation"},
  {id: 90, category: "adventure", a: "Early start", b: "Sleep in on vacation", insight: "leisure_maximization"},
  {id: 91, category: "food", a: "Pizza", b: "Sushi", insight: "comfort_vs_refinement"},
  {id: 92, category: "food", a: "Chocolate", b: "Vanilla", insight: "flavor_complexity"},
  {id: 93, category: "food", a: "Fries", b: "Onion rings", insight: "deep_fried_preference"},
  {id: 94, category: "food", a: "Spicy", b: "Mild", insight: "sensation_seeking"},
  {id: 95, category: "food", a: "Dine in", b: "Takeout", insight: "atmospheric_value"},
  {id: 96, category: "food", a: "Soup", b: "Salad", insight: "textural_comfort"},
  {id: 97, category: "food", a: "Beer", b: "Wine", insight: "beverage_formality"},
  {id: 98, category: "food", a: "Pancakes", b: "Waffles", insight: "structural_preference"},
  {id: 99, category: "food", a: "Ketchup", b: "Mustard", insight: "condiment_profile"},
  {id: 100, category: "food", a: "Tacos", b: "Burritos", insight: "format_preference"},
  {id: 101, category: "food", a: "Ice cream", b: "Gelato", insight: "dairy_richness"},
  {id: 102, category: "food", a: "Steak", b: "Seafood", insight: "protein_heaviness"},
  {id: 103, category: "food", a: "Buffet", b: "A la carte", insight: "quantity_vs_curation"},
  {id: 104, category: "food", a: "Crispy", b: "Chewy", insight: "texture_priority"},
  {id: 105, category: "food", a: "Tap water", b: "Sparkling water", insight: "hydration_elevation"},
  {id: 106, category: "animals", a: "Wolf", b: "Fox", insight: "pack_vs_solitary"},
  {id: 107, category: "animals", a: "Eagle", b: "Falcon", insight: "power_vs_speed"},
  {id: 108, category: "animals", a: "Lion", b: "Tiger", insight: "social_dominance_vs_independence"},
  {id: 109, category: "animals", a: "Dog", b: "Cat", insight: "affection_style"},
  {id: 110, category: "animals", a: "Dolphin", b: "Shark", insight: "playful_vs_predatory"},
  {id: 111, category: "animals", a: "Bear", b: "Moose", insight: "brute_force_vs_imposing_presence"},
  {id: 112, category: "animals", a: "Owl", b: "Hawk", insight: "nocturnal_wisdom_vs_diurnal_focus"},
  {id: 113, category: "animals", a: "Elephant", b: "Rhino", insight: "communal_memory_vs_solitary_defense"},
  {id: 114, category: "animals", a: "Snake", b: "Lizard", insight: "slithering_vs_scuttling"},
  {id: 115, category: "animals", a: "Butterfly", b: "Moth", insight: "diurnal_vs_nocturnal_beauty"},
  {id: 116, category: "animals", a: "Horse", b: "Zebra", insight: "domesticated_vs_wild"},
  {id: 117, category: "animals", a: "Raven", b: "Parrot", insight: "dark_intellect_vs_colorful_mimicry"},
  {id: 118, category: "animals", a: "Turtle", b: "Frog", insight: "shelled_defense_vs_amphibious_agility"},
  {id: 119, category: "animals", a: "Octopus", b: "Squid", insight: "benthic_intelligence_vs_pelagic_speed"},
  {id: 120, category: "animals", a: "Gorilla", b: "Chimpanzee", insight: "quiet_strength_vs_vocal_energy"},
  {id: 121, category: "hypothetical", a: "Fly", b: "Invisible", insight: "spotlight_vs_stealth"},
  {id: 122, category: "hypothetical", a: "Time travel past", b: "Future", insight: "nostalgia_vs_anticipation"},
  {id: 123, category: "hypothetical", a: "Read minds", b: "Predict future", insight: "interpersonal_vs_event_control"},
  {id: 124, category: "hypothetical", a: "Stop time", b: "Rewind time", insight: "pause_vs_correction"},
  {id: 125, category: "hypothetical", a: "Talk to animals", b: "Speak all languages", insight: "interspecies_vs_global_connection"},
  {id: 126, category: "hypothetical", a: "Never sleep", b: "Never eat", insight: "biological_transcendence"},
  {id: 127, category: "hypothetical", a: "Immortal", b: "Reincarnate", insight: "continuity_vs_renewal"},
  {id: 128, category: "hypothetical", a: "Live underwater", b: "Live in space", insight: "depth_vs_void_exploration"},
  {id: 129, category: "hypothetical", a: "Teleport", b: "Super speed", insight: "instant_arrival_vs_journey_experience"},
  {id: 130, category: "hypothetical", a: "Infinite money", b: "Infinite knowledge", insight: "resource_vs_intellect"},
  {id: 131, category: "hypothetical", a: "Know how you die", b: "Know when you die", insight: "mechanism_vs_timeline"},
  {id: 132, category: "hypothetical", a: "Restart life", b: "Continue as is", insight: "regret_vs_acceptance"},
  {id: 133, category: "hypothetical", a: "Be a genius", b: "Be famous", insight: "internal_vs_external_validation"},
  {id: 134, category: "hypothetical", a: "Master every instrument", b: "Master every sport", insight: "artistic_vs_athletic_supremacy"},
  {id: 135, category: "hypothetical", a: "Control fire", b: "Control water", insight: "destructive_vs_fluid_element"},
  {id: 136, category: "social", a: "Text", b: "Call", insight: "communication_immediacy"},
  {id: 137, category: "social", a: "Big group", b: "Two close friends", insight: "social_bandwidth"},
  {id: 138, category: "social", a: "Center of party", b: "Corner deep talk", insight: "extroversion_vs_intimacy"},
  {id: 139, category: "social", a: "Host", b: "Guest", insight: "social_responsibility"},
  {id: 140, category: "social", a: "Plan the hangout", b: "Go with the flow", insight: "social_orchestration"},
  {id: 141, category: "social", a: "Small talk", b: "Deep conversation", insight: "intimacy_pacing"},
  {id: 142, category: "social", a: "Argue to win", b: "Argue to understand", insight: "conflict_resolution_style"},
  {id: 143, category: "social", a: "Forgive", b: "Hold a grudge", insight: "emotional_retention"},
  {id: 144, category: "social", a: "Vent", b: "Keep it in", insight: "emotional_expression"},
  {id: 145, category: "social", a: "Leader", b: "Follower", insight: "group_dynamics"},
  {id: 146, category: "social", a: "Advice giver", b: "Listener", insight: "support_role"},
  {id: 147, category: "social", a: "Confront directly", b: "Drop hints", insight: "assertiveness_level"},
  {id: 148, category: "social", a: "Share everything", b: "Keep secrets", insight: "transparency_preference"},
  {id: 149, category: "social", a: "Meet new people", b: "Stick to old friends", insight: "social_expansion"},
  {id: 150, category: "social", a: "Flirtatious", b: "Reserved", insight: "romantic_approach"}
];

const PRIME_SCALES = [97, 107, 113, 127, 151];

function getRandomScale() {
  return PRIME_SCALES[Math.floor(Math.random() * PRIME_SCALES.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ComparisonEngine({ setScreen, avatarColor, C, onSave }) {
  const [queue, setQueue] = useState([]);  
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [intensity, setIntensity] = useState(null);
  const [scale, setScale] = useState(getRandomScale());
  const [saved, setSaved] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);  const [phase, setPhase] = useState("pick"); // pick | rate | next
  const [exiting, setExiting] = useState(false);
  const startTime = useRef(Date.now());

  const [answeredIds, setAnsweredIds] = useState(new Set());
const [loaded, setLoaded] = useState(false);

useEffect(() => {
  async function loadAnswered() {
  try {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s?.user?.id) {
      setQueue(shuffle(COMPARISONS));
      setLoaded(true);
      return;
    }
    const res = await fetch("/api/comparisons", {
      headers: { "Authorization": `Bearer ${s?.access_token}` }
    });
    if (res.ok) {
      const data = await res.json();
      const ids = new Set(data.map(r => r.comparison_id).filter(Boolean));
      setAnsweredIds(ids);
      setTotalAnswered(ids.size);
      const remaining = COMPARISONS.filter(c => !ids.has(c.id));
      setQueue(shuffle(remaining.length > 0 ? remaining : COMPARISONS));
    } else {
      setQueue(shuffle(COMPARISONS));
    }
  } catch (e) {
    console.error(e);
    setQueue(shuffle(COMPARISONS));
  }
  setLoaded(true);
}
  loadAnswered();
}, []);

  const current = queue[idx];
  const remaining = queue.length - idx;

  const handlePick = (choice) => {
    setChosen(choice);
    setPhase("rate");
  };

  const handleRate = async (val) => {
    setIntensity(val);
    const responseTime = Date.now() - startTime.current;

    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (s?.user?.id) {
        console.log('session token:', s?.access_token?.slice(0, 20));
        await fetch("/api/comparisons", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${s?.access_token}`
          },
          body: JSON.stringify({
            comparison_id: current.id,
            category: current.category,
            option_a: current.a,
            option_b: current.b,
            chosen: chosen,
            intensity: val,
            scale_max: scale,
            insight: current.insight,
            response_time_ms: responseTime
          })
        });
        setSaved(p => p + 1);
        if (onSave) onSave(saved + 1);
      }
    } catch (e) {
      console.error("Save failed:", e);
    }

    setExiting(true);
    setTimeout(() => {
      setIdx(i => i + 1);
      setChosen(null);
      setIntensity(null);
      setScale(getRandomScale());
      setPhase("pick");
      setExiting(false);
      startTime.current = Date.now();
    }, 300);
  };

  if (!loaded) return (
  <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.cream }}>
    <p style={{ color:C.stoneMid, fontSize:14 }}>Loading your progress...</p>
  </div>
);

  if (loaded && idx >= queue.length) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Cabinet Grotesk', sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", color: C.ink, fontWeight: 400, marginBottom: 8 }}>You finished all of them.</h2>
          <p style={{ color: C.stone, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            {saved} responses saved. Buddin now has a much clearer picture of how you think.
          </p>
          <button onClick={() => setScreen("myprofile")} style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`, color: "#fff", border: "none", borderRadius: 16, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            See what Buddin knows →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Cabinet Grotesk', sans-serif", background: C.cream }}>
      {/* Header */}
      <div style={{ padding: "max(14px, calc(env(safe-area-inset-top) + 10px)) 20px 14px", display: "flex", alignItems: "center", gap: 12, background: "rgba(245,236,220,0.85)", backdropFilter: "blur(22px)", borderBottom: "1px solid rgba(255,235,200,0.28)" }}>
        <button onClick={() => setScreen("myprofile")} style={{ background: "transparent", border: "none", cursor: "pointer", color: avatarColor, padding: "4px 2px", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, margin: 0 }}>This or That</p>
          <p style={{ color: C.stoneMid, fontSize: 11, margin: 0 }}>{totalAnswered + saved} answered · keep going</p>
        </div>
        {/* Progress bar */}
        <div style={{ width: 80, height: 4, background: C.stoneLight, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((idx) / queue.length) * 100}%`, background: avatarColor, borderRadius: 4, transition: "width 0.3s ease" }} />
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", maxWidth: 600, margin: "0 auto", width: "100%" }}>
        
        {/* Category label */}
        <p style={{ color: avatarColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 28, textTransform: "uppercase" }}>
          {current.category}
        </p>

        {/* Card */}
        <div style={{ width: "100%", opacity: exiting ? 0 : 1, transform: exiting ? "translateY(12px)" : "translateY(0)", transition: "all 0.3s ease" }}>
          
          {phase === "pick" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[current.a, current.b].map(opt => (
                <button
                  key={opt}
                  onClick={() => handlePick(opt)}
                  style={{
                    background: "rgba(255,248,235,0.7)",
                    border: `2px solid ${avatarColor}33`,
                    borderRadius: 20,
                    padding: "32px 20px",
                    cursor: "pointer",
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontSize: 20,
                    fontWeight: 400,
                    color: C.ink,
                    lineHeight: 1.3,
                    transition: "all 0.15s ease",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${avatarColor}18`; e.currentTarget.style.borderColor = avatarColor; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,248,235,0.7)"; e.currentTarget.style.borderColor = `${avatarColor}33`; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {phase === "rate" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ background: `${avatarColor}15`, border: `1.5px solid ${avatarColor}33`, borderRadius: 18, padding: "24px 20px", marginBottom: 28 }}>
                <p style={{ color: avatarColor, fontWeight: 700, fontSize: 18, fontFamily: "'Fraunces', Georgia, serif", marginBottom: 4 }}>{chosen}</p>
                <p style={{ color: C.stone, fontSize: 13 }}>How strongly do you feel about this?</p>
              </div>
              <p style={{ color: C.stoneMid, fontSize: 12, marginBottom: 16 }}>1 = not really · {scale} = absolutely</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {[1, Math.round(scale * 0.2), Math.round(scale * 0.4), Math.round(scale * 0.6), Math.round(scale * 0.8), scale].map(val => (
                  <button
                    key={val}
                    onClick={() => handleRate(val)}
                    style={{
                      background: "rgba(255,248,235,0.7)",
                      border: `1.5px solid ${avatarColor}44`,
                      borderRadius: 12,
                      padding: "12px 20px",
                      cursor: "pointer",
                      fontSize: 15,
                      fontWeight: 600,
                      color: C.ink,
                      fontFamily: "inherit",
                      minWidth: 60,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${avatarColor}18`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,248,235,0.7)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <button onClick={() => handleRate(Math.round(scale * 0.5))} style={{ marginTop: 20, background: "transparent", border: "none", color: C.stoneMid, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                Skip rating →
              </button>
            </div>
          )}
        </div>

        {/* VS divider shown during pick phase */}
        {phase === "pick" && (
          <div style={{ marginTop: 24, color: C.stoneMid, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em" }}>VS</div>
        )}
      </div>
    </div>
  );
}