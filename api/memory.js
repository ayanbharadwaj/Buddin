import fs from 'fs';
import path from 'path';
import { addSnapshot, deriveAdaptiveTone, createMemoryStore } from './boom/memorySchema.js';

// Use /tmp for Vercel serverless environment compatibility
const DATA_DIR = process.env.NODE_ENV === 'production' ? '/tmp/data' : path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export default function handler(req, res) {
  // Extract token from cookie
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/buddin_session=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: missing session' });
  }

  // Basic validation to prevent path traversal
  if (!/^[0-9a-fA-F-]+$/.test(token)) {
    return res.status(400).json({ error: 'Invalid session token format' });
  }

  const filePath = path.join(DATA_DIR, `${token}.json`);

  let store;
  if (fs.existsSync(filePath)) {
    try {
      store = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      store = createMemoryStore();
    }
  } else {
    store = createMemoryStore();
  }

  if (req.method === 'GET') {
    return res.status(200).json(store);
  }

  if (req.method === 'POST') {
    try {
      const snapshot = req.body.snapshot;
      if (!snapshot) return res.status(400).json({ error: 'Missing snapshot' });

      // Record snapshot which also runs detectDrift
      addSnapshot(store, snapshot);

      // Save the store
      fs.writeFileSync(filePath, JSON.stringify(store, null, 2));

      // Derive adaptive tone
      const adaptiveTone = deriveAdaptiveTone(store);

      return res.status(200).json({ success: true, adaptiveTone, store });
    } catch (error) {
      console.error('Error in /api/memory:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
