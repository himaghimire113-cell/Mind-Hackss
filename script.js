/* =========================================================
   COSMIC CHRONICLES — Blog Engine + Admin CRUD
   ========================================================= */

const STORAGE_KEY = 'cosmicChroniclesPosts';
const ADMIN_PASS = 'admin123';

/* ---------- DEFAULT PLACEHOLDER POSTS ---------- */
const defaultPosts = [
  {
    id: 1,
    title: "Journey to the Event Horizon",
    intro: "What happens when you cross the point of no return? A deep dive into the physics of black holes.",
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800",
    video: "https://www.youtube.com/embed/T1NextVRmZM",
    content: "Black holes are regions of spacetime where gravity is so strong that nothing — not even light — can escape once past the event horizon.\n\nFirst predicted by Einstein's general relativity, these cosmic monsters lurk at the centers of most galaxies, including our own Milky Way.\n\nIn this transmission, we explore the strange physics of spaghettification, time dilation, and the information paradox that has baffled physicists for decades.",
    date: "2026-06-28"
  },
  {
    id: 2,
    title: "The James Webb Telescope's Greatest Hits",
    intro: "Stunning new images from the edge of the observable universe — and what they mean for humanity.",
    image: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800",
    video: "https://www.youtube.com/embed/9J4tKn9kqZs",
    content: "Since its launch, the James Webb Space Telescope has rewritten our understanding of the cosmos.\n\nFrom the deepest infrared images of the universe ever captured, to detailed atmospheric studies of exoplanets, JWST is delivering on its promise to unveil the universe's hidden secrets.\n\nJoin us as we tour the greatest discoveries so far.",
    date: "2026-06-20"
  },
  {
    id: 3,
    title: "Life on Europa: A Real Possibility?",
    intro: "Jupiter's icy moon may harbor a subsurface ocean — and possibly life. Here's the latest science.",
    image: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800",
    video: "https://www.youtube.com/embed/WTVNvbrQ9aY",
    content: "Europa, one of Jupiter's Galilean moons, has long fascinated astrobiologists.\n\nBeneath its frozen crust lies a global ocean containing more water than all of Earth's oceans combined. Hydrothermal vents on its seabed could provide the energy needed for life.\n\nNASA's upcoming Europa Clipper mission aims to answer the question: are we alone?",
    date: "2026-06-15"
  },
  {
    id: 4,
    title: "Mars Colony: Blueprint for 2040",
    intro: "How humanity plans to build the first permanent settlement on the Red Planet.",
    image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800",
    video: "https://www.youtube.com/embed/od82qq4H3vo",
    content: "From SpaceX's Starship to NASA's Artemis program, the race to Mars is accelerating.\n\nThis post breaks down the engineering challenges — radiation shielding, food production, psychological isolation — and the bold solutions being developed.\n\nThe first Martians may already be training right now.",
    date: "2026-06-10"
  }
];

/* ---------- STATE ---------- */
let posts = loadPosts();
let isAdmin = false;

function loadPosts() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPosts));
  return defaultPosts;
}
function savePosts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

/* ---------- RENDER BLOG GRID ---------- */
function renderBlog() {
  const grid = document.getElementById('blogGrid');
  grid.innerHTML = '';
  if (posts.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-dim);grid-column:1/-1;padding:40px;">No transmissions yet. Stand by...</p>';
    return;
  }
  posts.forEach((post, i) => {
    const card = document.createElement('article');
    card.className = 'blog-card';
    card.style.animationDelay = `${i * 0.1}s`;
    card.innerHTML = `
      <img src="${post.image || 'https://via.placeholder.com/600x400/0b0524/8a2be2?text=Cosmic'}" alt="${post.title}" class="card-image" onerror="this.src='https://via.placeholder.com/600x400/0b0524/8a2be2?text=Cosmic'"/>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(post.title)}</h3>
        <p class="card-intro">${escapeHtml(post.intro || '')}</p>
        <div class="card-meta">
          <span class="card-tag">📡 Transmission</span>
          <span>${formatDate(post.date)}</span>
          ${post.video ? '<span>🎬 Video</span>' : ''}
        </div>
      </div>
    `;
    card.addEventListener('click', () => openPost(post.id));
    grid.appendChild(card);
  });
  document.getElementById('statPosts').textContent = posts.length;
}

function openPost(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <img src="${post.image}" class="modal-image" onerror="this.style.display='none'"/>
    <h2 class="modal-title">${escapeHtml(post.title)}</h2>
    <p class="modal-intro">${escapeHtml(post.intro || '')}</p>
    ${post.video ? `<div class="modal-video"><iframe src="${post.video}" allowfullscreen></iframe></div>` : ''}
    <div class="modal-content-text">${escapeHtml(post.content || '')}</div>
  `;
  document.getElementById('postModal').classList.add('active');
}

/* ---------- ADMIN PANEL ---------- */
document.getElementById('adminToggle').addEventListener('click', () => {
  if (isAdmin) {
    document.getElementById('adminPanel').classList.remove('hidden');
    document.getElementById('adminPanel').scrollIntoView({ behavior: 'smooth' });
  } else {
    document.getElementById('adminLogin').classList.add('active');
  }
});

document.getElementById('loginSubmit').addEventListener('click', () => {
  const pw = document.getElementById('adminPassword').value;
  if (pw === ADMIN_PASS) {
    isAdmin = true;
    document.getElementById('adminLogin').classList.remove('active');
    document.getElementById('adminPassword').value = '';
    document.getElementById('loginError').textContent = '';
    document.getElementById('adminPanel').classList.remove('hidden');
    document.getElementById('adminPanel').scrollIntoView({ behavior: 'smooth' });
    renderAdminList();
  } else {
    document.getElementById('loginError').textContent = '⚠ Access denied. Invalid credentials.';
  }
});

document.getElementById('loginClose').addEventListener('click', () => {
  document.getElementById('adminLogin').classList.remove('active');
});

document.getElementById('adminLogout').addEventListener('click', () => {
  isAdmin = false;
  document.getElementById('adminPanel').classList.add('hidden');
  resetForm();
});

/* ---------- CRUD ---------- */
document.getElementById('savePost').addEventListener('click', () => {
  const id = document.getElementById('editId').value;
  const title = document.getElementById('postTitle').value.trim();
  const intro = document.getElementById('postIntro').value.trim();
  const image = document.getElementById('postImage').value.trim();
  const videoRaw = document.getElementById('postVideo').value.trim();
  const content = document.getElementById('postContent').value.trim();

  if (!title) { alert('Title is required!'); return; }

  const video = convertToEmbed(videoRaw);

  if (id) {
    // UPDATE
    const idx = posts.findIndex(p => p.id === parseInt(id));
    if (idx !== -1) {
      posts[idx] = { ...posts[idx], title, intro, image, video, content };
    }
  } else {
    // CREATE
    const newPost = {
      id: Date.now(),
      title, intro, image, video, content,
      date: new Date().toISOString().split('T')[0]
    };
    posts.unshift(newPost);
  }
  savePosts();
  renderBlog();
  renderAdminList();
  resetForm();
  alert('✅ Transmission saved!');
});

document.getElementById('cancelEdit').addEventListener('click', resetForm);

function editPost(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;
  document.getElementById('editId').value = post.id;
  document.getElementById('postTitle').value = post.title;
  document.getElementById('postIntro').value = post.intro || '';
  document.getElementById('postImage').value = post.image || '';
  document.getElementById('postVideo').value = post.video || '';
  document.getElementById('postContent').value = post.content || '';
  document.getElementById('formTitle').textContent = '✏️ Edit Transmission';
  document.querySelector('.admin-form').scrollIntoView({ behavior: 'smooth' });
}

function deletePost(id) {
  if (!confirm('Delete this transmission permanently?')) return;
  posts = posts.filter(p => p.id !== id);
  savePosts();
  renderBlog();
  renderAdminList();
}

function renderAdminList() {
  const list = document.getElementById('adminList');
  if (posts.length === 0) {
    list.innerHTML = '<p style="color:var(--text-dim);">No posts yet.</p>';
    return;
  }
  list.innerHTML = posts.map(p => `
    <div class="admin-item">
      <span class="admin-item-title">${escapeHtml(p.title)}</span>
      <div class="admin-actions">
        <button class="btn-sm btn-edit" onclick="editPost(${p.id})">Edit</button>
        <button class="btn-sm btn-delete" onclick="deletePost(${p.id})">Delete</button>
      </div>
    </div>
  `).join('');
}
// expose to inline onclick
window.editPost = editPost;
window.deletePost = deletePost;

function resetForm() {
  document.getElementById('editId').value = '';
  ['postTitle','postIntro','postImage','postVideo','postContent'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('formTitle').textContent = '🛰️ New Transmission';
}

/* ---------- VIDEO URL → EMBED ---------- */
function convertToEmbed(url) {
  if (!url) return '';
  // YouTube watch?v=
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  // already embed
  if (url.includes('/embed/')) return url;
  // Facebook
  m = url.match(/facebook\.com\/.*\/videos\/(\d+)/);
  if (m) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0`;
  // Instagram
  m = url.match(/instagram\.com\/(p|reel)\/([\w-]+)/);
  if (m) return `https://www.instagram.com/${m[1]}/${m[2]}/embed`;
  return url;
}

/* ---------- UTILS ---------- */
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ---------- MODAL CLOSE ---------- */
document.getElementById('modalClose').addEventListener('click', () => {
  document.getElementById('postModal').classList.remove('active');
  // stop video
  const iframe = document.querySelector('#modalBody iframe');
  if (iframe) iframe.src = '';
});
document.getElementById('postModal').addEventListener('click', e => {
  if (e.target.id === 'postModal') document.getElementById('postModal').classList.remove('active');
});

/* ---------- NAV LINKS ---------- */
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    document.getElementById('navLinks')?.classList.remove('open');
  });
});

/* ---------- MOBILE MENU ---------- */
document.getElementById('mobileMenu').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('open');
});

/* ---------- INIT ---------- */
renderBlog();

