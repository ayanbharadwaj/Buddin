import { selectQuestion } from './boom/moodInference.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { recentQuestionIds = [], dimensionLastSeen = null, conversationContext = null } = req.body;

  try {
    const question = selectQuestion(recentQuestionIds, dimensionLastSeen, conversationContext);

    // Do not expose inferenceHint or weights
    return res.status(200).json({ id: question.id, text: question.text });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to select question' });
  }
}
