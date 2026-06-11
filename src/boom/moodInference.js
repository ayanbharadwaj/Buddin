// Final path: api/boom/moodInference.js
import { QUESTION_BANK } from './questionBank.js';

export function buildInferencePrompt(question, responseText, contextSummary = "") {
  return `
System: You are an emotional inference engine for a companion app.
The user was asked this indirect scenario question:
"${question.text}"

They responded:
"${responseText}"

Context of the conversation so far:
"${contextSummary}"

Inference hint for this question:
${question.inferenceHint}

Do not diagnose. Do not psychoanalyze. Infer current emotional state across the following dimensions based purely on response content, word choice, specificity, and tone.

Return ONLY valid JSON with this exact schema:
{
  "energy": "low" | "medium" | "high",
  "social_openness": "withdrawn" | "neutral" | "open",
  "cognitive_load": "low" | "medium" | "high",
  "valence": "negative" | "neutral" | "positive",
  "self_compassion": "low" | "medium" | "high",
  "confidence": 0.0-1.0,
  "signal_notes": "1-2 sentence rationale for inference"
}

Notes on Confidence: A very short or ambiguous answer ("idk", "probably just chill") should produce a lower confidence score (e.g., < 0.5) than a detailed, textured response.

Do not include any text outside the JSON object.
`.trim();
}

/**
 * Selects an intelligent projective question based on time of day,
 * stale dimensions, recent questions, and current conversation context.
 *
 * @param {Array} history - Array of previously asked question IDs to avoid repeating.
 * @param {String} staleDimension - The dimension that we haven't tracked in a while.
 * @param {String} activeTopic - A current topic (e.g. "work stress") to avoid redundant probes.
 * @returns {Object} The selected question object.
 */
export function selectQuestion(history = [], staleDimension = null, activeTopic = null) {
  const currentHour = new Date().getHours();
  let timeOfDay = "afternoon";
  if (currentHour < 12) timeOfDay = "morning";
  else if (currentHour >= 18) timeOfDay = "evening";

  // Filter out recently asked questions
  let availableQuestions = QUESTION_BANK.filter(q => !history.includes(q.id));

  // Must match time of day appropriateness
  availableQuestions = availableQuestions.filter(q => q.timeOfDay.includes(timeOfDay));

  // Try to avoid probing dimensions the user is already actively talking about
  if (activeTopic) {
    if (activeTopic.includes("stress") || activeTopic.includes("work")) {
        availableQuestions = availableQuestions.filter(q => q.dimension !== "cognitive_load");
    } else if (activeTopic.includes("friend") || activeTopic.includes("lonely")) {
        availableQuestions = availableQuestions.filter(q => q.dimension !== "social_openness");
    }
  }

  // Prioritize stale dimension if provided and available
  if (staleDimension) {
      const staleQuestions = availableQuestions.filter(q => q.dimension === staleDimension);
      if (staleQuestions.length > 0) {
          return staleQuestions[Math.floor(Math.random() * staleQuestions.length)];
      }
  }

  // If no available questions after filtering, just pick a random one from the whole bank
  // (though in a real app, history would be trimmed so we don't run out completely)
  if (availableQuestions.length === 0) {
      return QUESTION_BANK[Math.floor(Math.random() * QUESTION_BANK.length)];
  }

  // Otherwise, pick a random appropriate question
  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
}
