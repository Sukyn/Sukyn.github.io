// /api/login.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
  let body = {};
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    body = raw ? JSON.parse(raw) : {};
  } catch {}

  const { password } = body || {};
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  // Simple approach: the "token" is the password itself (same as before).
  // Fine for a personal site; upgrade to JWT later if you like.
  return res.status(200).json({ token: ADMIN_PASSWORD });
}
