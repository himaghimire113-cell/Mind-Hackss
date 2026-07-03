/* =========================================================
   COSMIC SPACE EXPLORER — shared script (blog + admin)
   Powered by Appwrite Cloud. No localStorage is used —
   every post lives in your Appwrite database.
   ========================================================= */

/* ---------- 1. APPWRITE CONFIG -------------------------- */
/* Fill in DATABASE_ID and COLLECTION_ID after you create them
   in your Appwrite console (see README.md for exact steps). */
const APPWRITE_ENDPOINT   = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = 'health-guide';
const DATABASE_ID         = 'REPLACE_WITH_YOUR_DATABASE_ID';
const COLLECTION_ID       = 'REPLACE_WITH_YOUR_COLLECTION_ID';

const { Client, Databases, Account, ID, Query } = Appwrite;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const databases = new Databases(client);
const account   = new Account(client);

/* ---------- 2. MEDIA EMBED HELPERS ----------------------- */

function detectMediaType(url){
  if (!url) return 'none';
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('facebook.com') || u.includes('fb.watch')) return 'facebook';
  if (u.includes('instagram.com')) return 'instagram';
  if (/\.(jpe?g|png|gif|webp|avif|svg)(\?.*)?$/i.test(u)) return 'image';
  return 'link';
}

function getYouTubeId(url){
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/
  ];
  for (const p of patterns){
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getInstagramEmbedUrl(url){
  const clean = url.split('?')[0].replace(/\/$/, '');
  return `${clean}/embed`;
}

/** Builds an HTML string that embeds the given media URL. */
function buildEmbedHTML(mediaType, mediaUrl, { forCard = false } = {}){
  if (!mediaUrl) return '';
  const type = (!mediaType || mediaType === 'auto') ? detectMediaType(mediaUrl) : mediaType;

  switch (type){
    case 'image':
      return `<img src="${escapeAttr(mediaUrl)}" alt="" loading="lazy">`;
    case 'youtube': {
      const id = getYouTubeId(mediaUrl);
      if (!id) return linkFallback(mediaUrl);
      if (forCard){
        return `<img src="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy">`;
      }
      return `<iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    }
    case 'facebook': {
      if (forCard) return '';
      const encoded = encodeURIComponent(mediaUrl);
      return `<iframe src="https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false" title="Facebook video" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    }
    case 'instagram': {
      if (forCard) return '';
      return `<iframe src="${escapeAttr(getInstagramEmbedUrl(mediaUrl))}" title="Instagram post" allowtransparency="true"></iframe>`;
    }
    default:
      return forCard ? '' : linkFallback(mediaUrl);
  }
}

function linkFallback(url){
  return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">View media ↗</a>`;
}

function mediaLabel(mediaType, mediaUrl){
  const type = (!mediaType || mediaType === 'auto') ? detectMediaType(mediaUrl) : mediaType;
  const labels = { image: 'Image', youtube: 'YouTube', facebook: 'Facebook', instagram: 'Instagram', link: 'Link' };
  return labels[type] || null;
}

function escapeHtml(str = ''){
  return str.replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
function escapeAttr(str = ''){ return escapeHtml(str); }

function formatDate(iso){
  try{
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }catch(e){ return ''; }
}

/* ---------- 3. PUBLIC BLOG (index.html) ------------------ */

async function loadPublicFeed(){
  const grid = document.getElementById('postGrid');
  if (!grid) return; // not on the blog page

  grid.innerHTML = `<div class="loading-state">Scanning the galaxy for posts…</div>`;

  try{
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.orderDesc('$createdAt'),
      Query.limit(100)
    ]);

    if (!res.documents.length){
      grid.innerHTML = `<div class="empty-state">No transmissions yet. Check back soon — the admin panel is where new posts get launched.</div>`;
      return;
    }

    grid.innerHTML = '';
    res.documents.forEach((post) => grid.appendChild(renderPostCard(post)));
  }catch(err){
    console.error('Failed to load posts:', err);
    grid.innerHTML = `<div class="error-state">Signal lost — could not reach Appwrite. Check your DATABASE_ID / COLLECTION_ID and collection read permissions in script.js.</div>`;
  }
}

function renderPostCard(post){
  const card = document.createElement('article');
  card.className = 'post-card';

  const thumbHTML = buildEmbedHTML(post.mediaType, post.mediaUrl, { forCard: true });
  const badge = mediaLabel(post.mediaType, post.mediaUrl);
  const excerpt = (post.content || '').slice(0, 160);

  card.innerHTML = `
    ${thumbHTML ? `<div class="media-thumb">${thumbHTML}</div>` : ''}
    ${badge ? `<span class="media-badge">${badge}</span>` : ''}
    <h3>${escapeHtml(post.title || 'Untitled')}</h3>
    <p>${escapeHtml(excerpt)}${(post.content || '').length > 160 ? '…' : ''}</p>
    <span class="post-date">${formatDate(post.$createdAt)}</span>
    <span class="read-more">Read full post →</span>
  `;

  card.addEventListener('click', () => openPostModal(post));
  return card;
}

function openPostModal(post){
  const overlay = document.getElementById('postModal');
  if (!overlay) return;

  document.getElementById('modalTitle').textContent = post.title || 'Untitled';
  document.getElementById('modalDate').textContent = formatDate(post.$createdAt);
  document.getElementById('modalBody').textContent = post.content || '';

  const mediaWrap = document.getElementById('modalMedia');
  const embed = buildEmbedHTML(post.mediaType, post.mediaUrl, { forCard: false });
  mediaWrap.innerHTML = embed;
  mediaWrap.style.display = embed ? 'block' : 'none';

  overlay.classList.add('is-open');
}

function closePostModal(){
  const overlay = document.getElementById('postModal');
  if (overlay) overlay.classList.remove('is-open');
}

/* ---------- 4. ADMIN PANEL (admin.html) ------------------ */

let editingPostId = null;

function showStatus(el, message, type = 'success'){
  if (!el) return;
  el.textContent = message;
  el.className = `status-msg is-visible ${type}`;
}

async function initAdmin(){
  const loginPanel = document.getElementById('loginPanel');
  const dashPanel  = document.getElementById('dashboardPanel');
  if (!loginPanel || !dashPanel) return; // not on the admin page

  // Is there already a logged-in session?
  try{
    const user = await account.get();
    enterDashboard(user);
  }catch(e){
    loginPanel.style.display = 'block';
    dashPanel.style.display = 'none';
  }

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const statusEl = document.getElementById('loginStatus');

    try{
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      enterDashboard(user);
    }catch(err){
      showStatus(statusEl, err.message || 'Login failed. Check your credentials.', 'error');
    }
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try{ await account.deleteSession('current'); }catch(e){}
    location.reload();
  });

  document.getElementById('postForm').addEventListener('submit', handlePostFormSubmit);
  document.getElementById('resetFormBtn').addEventListener('click', resetPostForm);
}

function enterDashboard(user){
  document.getElementById('loginPanel').style.display = 'none';
  document.getElementById('dashboardPanel').style.display = 'block';
  document.getElementById('sessionEmail').textContent = user.email;
  loadAdminPosts();
}

async function handlePostFormSubmit(e){
  e.preventDefault();
  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  const data = {
    title: document.getElementById('postTitle').value.trim(),
    content: document.getElementById('postContent').value.trim(),
    mediaType: document.getElementById('postMediaType').value,
    mediaUrl: document.getElementById('postMediaUrl').value.trim()
  };

  if (!data.title || !data.content){
    showStatus(statusEl, 'Title and content are required.', 'error');
    return;
  }

  submitBtn.disabled = true;
  try{
    if (editingPostId){
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, editingPostId, data);
      showStatus(statusEl, 'Post updated.', 'success');
    }else{
      await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), data);
      showStatus(statusEl, 'Post published.', 'success');
    }
    resetPostForm();
    loadAdminPosts();
  }catch(err){
    console.error(err);
    showStatus(statusEl, err.message || 'Could not save post. Check collection permissions.', 'error');
  }finally{
    submitBtn.disabled = false;
  }
}

function resetPostForm(){
  editingPostId = null;
  document.getElementById('postForm').reset();
  document.getElementById('formTitleLabel').textContent = 'Publish a new post';
  document.getElementById('submitBtn').textContent = 'Publish post';
}

async function loadAdminPosts(){
  const list = document.getElementById('adminPostList');
  list.innerHTML = `<div class="loading-state">Loading your posts…</div>`;

  try{
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.orderDesc('$createdAt'),
      Query.limit(100)
    ]);

    if (!res.documents.length){
      list.innerHTML = `<div class="empty-state">Nothing published yet.</div>`;
      return;
    }

    list.innerHTML = '';
    res.documents.forEach((post) => list.appendChild(renderAdminRow(post)));
  }catch(err){
    console.error(err);
    list.innerHTML = `<div class="error-state">Could not load posts: ${escapeHtml(err.message || '')}</div>`;
  }
}

function renderAdminRow(post){
  const row = document.createElement('div');
  row.className = 'admin-post-row';
  row.innerHTML = `
    <div class="admin-post-info">
      <h4>${escapeHtml(post.title || 'Untitled')}</h4>
      <span>${formatDate(post.$createdAt)} · ${mediaLabel(post.mediaType, post.mediaUrl) || 'No media'}</span>
    </div>
    <div class="admin-post-actions">
      <button class="btn btn-ghost" data-action="edit">Edit</button>
      <button class="btn btn-danger" data-action="delete">Delete</button>
    </div>
  `;

  row.querySelector('[data-action="edit"]').addEventListener('click', () => loadPostIntoForm(post));
  row.querySelector('[data-action="delete"]').addEventListener('click', () => deletePost(post.$id));
  return row;
}

function loadPostIntoForm(post){
  editingPostId = post.$id;
  document.getElementById('postTitle').value = post.title || '';
  document.getElementById('postContent').value = post.content || '';
  document.getElementById('postMediaType').value = post.mediaType || 'none';
  document.getElementById('postMediaUrl').value = post.mediaUrl || '';
  document.getElementById('formTitleLabel').textContent = 'Editing post';
  document.getElementById('submitBtn').textContent = 'Save changes';
  document.getElementById('postForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deletePost(id){
  if (!confirm('Delete this post permanently? This cannot be undone.')) return;
  try{
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
    loadAdminPosts();
  }catch(err){
    alert('Could not delete post: ' + (err.message || ''));
  }
}

/* ---------- 5. BOOTSTRAP ---------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  loadPublicFeed();
  initAdmin();

  const closeBtn = document.getElementById('modalCloseBtn');
  const overlay = document.getElementById('postModal');
  if (closeBtn) closeBtn.addEventListener('click', closePostModal);
  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closePostModal(); });
});
