// /api/posts/[id].js
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

function getIdFromReq(req) {
  // Vercel should populate req.query.id, but this is a safe fallback
  const fromQuery = req.query?.id;
  if (fromQuery) return String(fromQuery);
  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.split('/');
  return parts[parts.length - 1];
}

export default async function handler(req, res) {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
  const id = getIdFromReq(req);

  if (req.method === 'GET') {
    const posts = (await kv.get('posts')) || [];
    const post = posts.find(p => String(p.id) === String(id));
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(post);
  }

  if (req.method === 'PUT') {
    if (getAuthToken(req) !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const payload = await readJson(req);
    const posts = (await kv.get('posts')) || [];
    const i = posts.findIndex(p => String(p.id) === String(id));
    if (i === -1) return res.status(404).json({ error: 'Not found' });

    const { title, date, summary, content, tags, pdfUrl } = payload;
    const normalisedTags =
      tags === undefined
        ? posts[i].tags
        : (Array.isArray(tags)
            ? tags
            : (typeof tags === 'string'
                ? tags.split(',').map(t => t.trim()).filter(Boolean)
                : []));

    posts[i] = {
      ...posts[i],
      ...(title   !== undefined ? { title }   : {}),
      ...(date    !== undefined ? { date }    : {}),
      ...(summary !== undefined ? { summary } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(pdfUrl  !== undefined ? { pdfUrl }  : {}),
      tags: normalisedTags
    };

    await kv.set('posts', posts);
    return res.status(200).json(posts[i]);
  }

  if (req.method === 'DELETE') {
    if (getAuthToken(req) !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const posts = (await kv.get('posts')) || [];
    const i = posts.findIndex(p => String(p.id) === String(id));
    if (i === -1) return res.status(404).json({ error: 'Not found' });
    const removed = posts.splice(i, 1)[0];
    await kv.set('posts', posts);
    return res.status(200).json({ success: true, removed });
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  res.status(405).end('Method Not Allowed');
}
