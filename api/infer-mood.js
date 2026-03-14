import { buildInferencePrompt } from './boom/moodInference.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { questionId, userResponse } = req.body;

  if (!questionId || !userResponse) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Load the inferenceHint server-side!
  const { QUESTION_BANK } = await import('./boom/questionBank.js');
  const question = QUESTION_BANK.find(q => q.id === questionId);

  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY' });
  }

  try {
    const systemPrompt = buildInferencePrompt(question, userResponse);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256, // small max tokens for JSON only output
        messages: [{
          role: 'user',
          content: 'Return the JSON based on the system instructions.'
        }],
        system: systemPrompt
      })
    });

    const data = await response.json();
    if (!response.ok) {
        return res.status(response.status).json(data);
    }

    // Parse the returned JSON
    let parsedJson;
    try {
        const text = data.content?.[0]?.text || '{}';
        // Remove markdown formatting if any
        parsedJson = JSON.parse(text.replace(/```json|```/g,"").trim());
    } catch (e) {
        return res.status(500).json({ error: 'Failed to parse inference result' });
    }

    return res.status(200).json(parsedJson);
  } catch (error) {
    console.error('Inference API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
