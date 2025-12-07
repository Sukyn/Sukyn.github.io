// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Very simple "auth"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

// Where blog posts are stored
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'posts.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

function loadPosts() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function savePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8');
}

let posts = loadPosts();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- Auth ---------------------------------------------------

app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  // Super simple: the token IS the password. Good enough for non‑sensitive content.
  res.json({ token: ADMIN_PASSWORD });
});

function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ---- Blog API -----------------------------------------------

// Public: list posts
app.get('/api/posts', (req, res) => {
  const sorted = [...posts].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  res.json(sorted);
});

// Public: get single post
app.get('/api/posts/:id', (req, res) => {
  const id = String(req.params.id);
  const post = posts.find(p => String(p.id) === id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(post);
});

// Admin: create post
app.post('/api/posts', requireAuth, (req, res) => {
  const { title, date, summary, content, tags, pdfUrl } = req.body || {};
  if (!title || !date) {
    return res.status(400).json({ error: 'title and date are required' });
  }

  const normalisedTags =
    Array.isArray(tags)
      ? tags
      : (typeof tags === 'string'
          ? tags.split(',').map(t => t.trim()).filter(Boolean)
          : []);

  const post = {
    id: Date.now().toString(),
    title,
    date,                 // store as YYYY-MM-DD (from <input type="date">)
    summary: summary || '',
    content: content || '',
    tags: normalisedTags,
    pdfUrl: pdfUrl || ''
  };

  posts.push(post);
  savePosts(posts);
  res.status(201).json(post);
});

// Admin: update post
app.put('/api/posts/:id', requireAuth, (req, res) => {
  const id = String(req.params.id);
  const index = posts.findIndex(p => String(p.id) === id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });

  const { title, date, summary, content, tags, pdfUrl } = req.body || {};
  const normalisedTags =
    tags === undefined
      ? posts[index].tags
      : (Array.isArray(tags)
          ? tags
          : (typeof tags === 'string'
              ? tags.split(',').map(t => t.trim()).filter(Boolean)
              : []));

  posts[index] = {
    ...posts[index],
    ...(title !== undefined ? { title } : {}),
    ...(date !== undefined ? { date } : {}),
    ...(summary !== undefined ? { summary } : {}),
    ...(content !== undefined ? { content } : {}),
    tags: normalisedTags,
    ...(pdfUrl !== undefined ? { pdfUrl } : {})
  };

  savePosts(posts);
  res.json(posts[index]);
});

// Admin: delete post
app.delete('/api/posts/:id', requireAuth, (req, res) => {
  const id = String(req.params.id);
  const index = posts.findIndex(p => String(p.id) === id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });

  const removed = posts.splice(index, 1)[0];
  savePosts(posts);
  res.json({ success: true, removed });
});

// Serve admin HTML explicitly
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
