// js/admin.js

const STORAGE_KEY = 'blogAdminToken';

document.addEventListener('DOMContentLoaded', () => {
  const loginCard = document.getElementById('login-card');
  const adminPanel = document.getElementById('admin-panel');
  const loginButton = document.getElementById('loginButton');
  const logoutButton = document.getElementById('logoutButton');
  const loginError = document.getElementById('loginError');

  const newPostButton = document.getElementById('newPostButton');
  const postList = document.getElementById('postList');
  const postForm = document.getElementById('postForm');
  const editorTitle = document.getElementById('editorTitle');
  const deletePostButton = document.getElementById('deletePostButton');
  const saveStatus = document.getElementById('saveStatus');

  const postIdInput = document.getElementById('postId');
  const postTitleInput = document.getElementById('postTitle');
  const postDateInput = document.getElementById('postDate');
  const postSummaryInput = document.getElementById('postSummary');
  const postContentInput = document.getElementById('postContent');
  const postTagsInput = document.getElementById('postTags');
  const postPdfUrlInput = document.getElementById('postPdfUrl');

  function getToken() {
    return localStorage.getItem(STORAGE_KEY) || '';
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function showLogin() {
    loginCard.classList.remove('d-none');
    adminPanel.classList.add('d-none');
  }

  function showAdmin() {
    loginCard.classList.add('d-none');
    adminPanel.classList.remove('d-none');
    loginError.classList.add('d-none');
    loadPosts();
  }

  async function tryLogin(password) {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (!res.ok) {
        loginError.classList.remove('d-none');
        return;
      }

      const data = await res.json();
      setToken(data.token);
      showAdmin();
    } catch (err) {
      console.error(err);
      loginError.textContent = 'Network error.';
      loginError.classList.remove('d-none');
    }
  }

  async function loadPosts() {
    postList.innerHTML = '<li class="list-group-item">Loading…</li>';
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const posts = await res.json();

      postList.innerHTML = '';
      if (!posts.length) {
        postList.innerHTML =
          '<li class="list-group-item text-muted">No posts yet.</li>';
        clearForm();
        return;
      }

      posts.forEach(post => {
        const li = document.createElement('li');
        li.className = 'list-group-item list-group-item-action';
        li.textContent = `${post.title} (${post.date || ''})`;
        li.dataset.id = post.id;
        li.addEventListener('click', () => {
          fillForm(post);
        });
        postList.appendChild(li);
      });

      // open first post by default
      fillForm(posts[0]);
    } catch (err) {
      console.error(err);
      postList.innerHTML =
        '<li class="list-group-item text-danger">Could not load posts.</li>';
    }
  }

  function clearForm() {
    editorTitle.textContent = 'New post';
    postIdInput.value = '';
    postTitleInput.value = '';
    postDateInput.valueAsDate = new Date();
    postSummaryInput.value = '';
    postContentInput.value = '';
    postTagsInput.value = '';
    postPdfUrlInput.value = '';
    deletePostButton.classList.add('d-none');
    saveStatus.textContent = '';
  }

  function fillForm(post) {
    editorTitle.textContent = 'Edit post';
    postIdInput.value = post.id || '';
    postTitleInput.value = post.title || '';
    postDateInput.value = (post.date || '').slice(0, 10);
    postSummaryInput.value = post.summary || '';
    postContentInput.value = post.content || '';
    postTagsInput.value = Array.isArray(post.tags)
      ? post.tags.join(', ')
      : (post.tags || '');
    postPdfUrlInput.value = post.pdfUrl || '';
    deletePostButton.classList.remove('d-none');
    saveStatus.textContent = '';
  }

  async function savePost(evt) {
    evt.preventDefault();
    saveStatus.textContent = 'Saving…';

    const id = postIdInput.value.trim();
    const payload = {
      title: postTitleInput.value.trim(),
      date: postDateInput.value,
      summary: postSummaryInput.value,
      content: postContentInput.value,
      tags: postTagsInput.value,
      pdfUrl: postPdfUrlInput.value.trim()
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/posts/${encodeURIComponent(id)}` : '/api/posts';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        saveStatus.textContent = 'Not authorized. Please log in again.';
        showLogin();
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        saveStatus.textContent = `Error: ${text}`;
        return;
      }

      await res.json();
      saveStatus.textContent = 'Saved.';
      await loadPosts();
    } catch (err) {
      console.error(err);
      saveStatus.textContent = 'Network error.';
    }
  }

  async function deletePost() {
    const id = postIdInput.value.trim();
    if (!id) return;
    if (!confirm('Delete this post?')) return;

    saveStatus.textContent = 'Deleting…';

    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      if (res.status === 401) {
        saveStatus.textContent = 'Not authorized. Please log in again.';
        showLogin();
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        saveStatus.textContent = `Error: ${text}`;
        return;
      }

      saveStatus.textContent = 'Deleted.';
      await loadPosts();
    } catch (err) {
      console.error(err);
      saveStatus.textContent = 'Network error.';
    }
  }

  // --- Event bindings ---

  loginButton.addEventListener('click', () => {
    const passwordInput = document.getElementById('passwordInput');
    loginError.classList.add('d-none');
    tryLogin(passwordInput.value);
  });

  logoutButton.addEventListener('click', () => {
    setToken('');
    showLogin();
  });

  newPostButton.addEventListener('click', clearForm);
  postForm.addEventListener('submit', savePost);
  deletePostButton.addEventListener('click', deletePost);

  // Auto-login if token exists
  if (getToken()) {
    showAdmin();
  } else {
    showLogin();
  }
});
