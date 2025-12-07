// /api/posts/index.js
import { kv } from '@vercel/kv';

function getAuthToken(req) {
  const h = req.headers['authorization'] || '';
  const [type, token] = h.split(' ');
  return type === 'Bearer' ? token : '';
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

export default async function handler(req, res) {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

  if (req.method === 'GET') {
    const posts = (await kv.get('posts')) || [];
    posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(posts);
  }

  if (req.method === 'POST') {
    if (getAuthToken(req) !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, date, summary, content, tags, pdfUrl } = await readJson(req);
    if (!title || !date) return res.status(400).json({ error: 'title and date are required' });

    const normalisedTags = Array.isArray(tags)
      ? tags
      : (typeof tags === 'string'
          ? tags.split(',').map(t => t.trim()).filter(Boolean)
          : []);

    const posts = (await kv.get('posts')) || [];
    const post = {
      id: Date.now().toString(),
      title,
      date,
      summary: summary || '',
      content: content || '',
      tags: normalisedTags,
      pdfUrl: pdfUrl || ''
    };
    posts.push(post);
    await kv.set('posts', posts);
    return res.status(201).json(post);
  }

  res.setHeader('Allow', 'GET, POST');
  res.status(405).end('Method Not Allowed');
}
