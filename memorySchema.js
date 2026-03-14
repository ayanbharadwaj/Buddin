export const createMemoryStore = () => ({
  snapshots: [],
  baseline: {
    energy: "medium",
    social_openness: "neutral",
    cognitive_load: "medium",
    valence: "neutral",
    self_compassion: "medium"
  },
  drift_alerts: []
});

/**
 * Stores a mood snapshot, calculates baseline, and triggers drift detection.
 * @param {Object} memoryStore The current user memory state.
 * @param {Object} inference The inferred snapshot object.
 */
export function addSnapshot(memoryStore, inference) {
  const snapshot = {
    date: new Date().toISOString(),
    ...inference
  };

  memoryStore.snapshots.push(snapshot);

  // Calculate baseline based on past N snapshots (e.g. 10)
  // Simplified for this example, but normally would involve averaging or mode
  // The drift detection relies on the recent N anyway.

  detectDrift(memoryStore);
}

/**
 * Detects multi-session emotional decline.
 * @param {Object} memoryStore
 */
export function detectDrift(memoryStore) {
  const snapshots = memoryStore.snapshots;
  if (snapshots.length < 3) return;

  const recent = snapshots.slice(-3);
  const dims = ["energy", "social_openness", "cognitive_load", "valence", "self_compassion"];

  // Weights:
  const valMap = {
    energy: { low: -1, medium: 0, high: 1 },
    social_openness: { withdrawn: -1, neutral: 0, open: 1 },
    cognitive_load: { low: 1, medium: 0, high: -1 }, // High load is negative drift
    valence: { negative: -1, neutral: 0, positive: 1 },
    self_compassion: { low: -1, medium: 0, high: 1 }
  };

  dims.forEach(dim => {
    let declining = true;
    for (let i = 1; i < recent.length; i++) {
        // Did it drop from the previous session? (or stay low/bad)
        const prevVal = valMap[dim][recent[i-1][dim]];
        const currVal = valMap[dim][recent[i][dim]];
        // A drift alert is specifically when they are in a negative state consistently or declining into it.
        // E.g., energy going medium -> low -> low, or high -> medium -> low
        if (currVal > prevVal || currVal === 1) { // They improved or are fine
            declining = false;
            break;
        }
    }

    // Only flag if it's consistently declining or staying in the negative territory for 3 sessions
    if (declining && valMap[dim][recent[2][dim]] === -1) {
      // Check if alert already exists and is active
      const existing = memoryStore.drift_alerts.find(a => a.dimension === dim);
      if (!existing || !existing.flagged) {
          memoryStore.drift_alerts.push({
              dimension: dim,
              direction: "declining",
              sessions: 3,
              flagged: true
          });
      }
    } else {
        // Remove or unflag existing alert if they recovered
        const existingIdx = memoryStore.drift_alerts.findIndex(a => a.dimension === dim);
        if (existingIdx !== -1) {
            memoryStore.drift_alerts.splice(existingIdx, 1);
        }
    }
  });
}

/**
 * Translates longitudinal data into an adaptive tone.
 * @param {Object} memoryStore
 * @returns {Object} A tone configuration object
 */
export function deriveAdaptiveTone(memoryStore) {
  let tone = {
    warmth: "standard",
    pacing: "standard",
    supportLevel: "standard",
    topicAvoidance: []
  };

  const flags = memoryStore.drift_alerts.filter(a => a.flagged).map(a => a.dimension);

  if (flags.includes("energy") || flags.includes("cognitive_load")) {
      tone.pacing = "gentler, slower";
      tone.supportLevel = "high";
      tone.topicAvoidance.push("heavy tasks", "complex choices");
  }

  if (flags.includes("valence") || flags.includes("self_compassion")) {
      tone.warmth = "high, intensely validating";
      tone.topicAvoidance.push("unsolicited advice", "toxic positivity");
  }

  if (flags.includes("social_openness")) {
      tone.topicAvoidance.push("group social activities", "reaching out to friends immediately");
  }

  return tone;
}

/**
 * Injects the adaptive tone invisibly into the system prompt.
 * @param {Object} tone
 * @returns {String} The formatted system instruction.
 */
export function toneToSystemInstruction(tone) {
  let instructions = [];

  if (tone.warmth === "high, intensely validating") {
      instructions.push("Respond with deeper warmth and explicit validation. Ground the user.");
  }

  if (tone.pacing === "gentler, slower") {
      instructions.push("Pacing should be gentle and slow. Give them space. Ask fewer questions.");
  }

  if (tone.supportLevel === "high") {
      instructions.push("Offer higher emotional support without being clinical or intrusive.");
  }

  if (tone.topicAvoidance.length > 0) {
      instructions.push(`Avoid the following topics right now: ${tone.topicAvoidance.join(", ")}.`);
  }

  return instructions.length > 0
      ? `\n\n[INVISIBLE TONE ADJUSTMENT BASED ON LONGITUDINAL STATE: ${instructions.join(" ")}]`
      : "";
}
