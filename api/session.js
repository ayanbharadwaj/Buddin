import crypto from 'crypto';

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check if session cookie exists
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/buddin_session=([^;]+)/);
  let token = match ? match[1] : null;

  let created = false;

  if (!token) {
    // Generate UUID v4 for the new session
    token = crypto.randomUUID();

    // Set httpOnly cookie
    // In production, add Secure flag if HTTPS
    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', `buddin_session=${token}; HttpOnly; Path=/; Max-Age=31536000; SameSite=Lax${isProd ? '; Secure' : ''}`);
    created = true;
  }

  // Return a success response, we don't necessarily need to return the token to the client,
  // but we can return success status and whether it was newly created.
  return res.status(200).json({ success: true, created });
}
