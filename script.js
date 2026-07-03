/* =========================================================
   HEALTH GUIDE — Blog Engine + Admin CRUD
   ========================================================= */

// Wait for DOM to be fully loaded before running code
document.addEventListener('DOMContentLoaded', function() {
  
  // Appwrite Configuration
  import('https://cdn.skypack.dev/appwrite').then(({ Client, Databases }) => {
    const client = new Client();
    client
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject('health-guide');

    const databases = new Databases(client);
    window.databases = databases; // Make available globally if needed
  }).catch(err => {
    console.log("Appwrite not loaded, using localStorage only");
  });

  const STORAGE_KEY = 'cosmicChroniclesPosts';
  const ADMIN_PASS = '@@&&$$123';

  /* ---------- DEFAULT PLACEHOLDER POSTS ---------- */
  const defaultPosts = [
    {
      id: 1,
      title: "10 Morning Habits for Better Health",
      intro: "Start your day right with these science-backed morning routines.",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
      video: "",
      content: "Morning habits set the tone for your entire day. From hydration to meditation, discover the routines that successful, healthy people swear by.\n\n1. Drink water immediately\n2. Get sunlight exposure\n3. Move your body\n4. Practice gratitude\n5. Eat a nutritious breakfast",
      date: "2026-07-01"
    },
    {
      id: 2,
      title: "The Science of Sleep Optimization",
      intro: "Unlock better rest with these evidence-based sleep strategies.",
      image: "https://images.unsplash.com/photo-1511295742361-61b3e75f347c?w=800",
      video: "https://www.youtube.com/embed/T1NextVRmZM",
      content: "Quality sleep is the foundation of health. Learn about circadian rhythms, sleep cycles, and how to create the perfect sleep environment.\n\nKey tips:\n- Keep your room cool (65-68°F)\n- Avoid screens 1 hour before bed\n- Maintain consistent sleep schedule",
      date: "2026-06-28"
    },
    {
      id: 3,
      title: "Nutrition Myths Debunked",
      intro: "Separating fact from fiction in the world of diet and nutrition.",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800",
      video: "",
      content: "The internet is full of conflicting nutrition advice. We examine the most common myths and reveal what science actually says about carbs, fats, and meal timing.",
      date: "2026-06-25"
    },
    {
      id: 4,
      title: "Mindfulness for Beginners",
      intro: "Simple meditation techniques to reduce stress and improve focus.",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
      video: "https://www.youtube.com/embed/9J4tKn9kqZs",
      content: "Mindfulness doesn't require hours of meditation. Learn simple techniques you can practice anywhere, anytime to reduce stress and increase mental clarity.",
      date: "2026-06-20"
    }
  ];

  /* ---------- STATE ---------- */
  let posts = [];
  let isAdmin = false;

  /* ---------- LOAD POSTS ---------- */
  function loadPosts() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      posts = JSON.parse(stored);
      renderBlog();
      return;
    }
    
    posts = [...defaultPosts];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    renderBlog();
  }

  function savePosts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }

  /* ---------- RENDER BLOG GRID ---------- */
  function renderBlog() {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;
    
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
        <img src="${post.image || 'https://via.placeholder.com/600x400/0b0524/8a2be2?text=Health'}" alt="${post.title}" class="card-image" onerror="this.src='https://via.placeholder.com/600x400/0b0524/8a2be2?text=Health'"/>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(post.title)}</h3>
          <p class="card-intro">${escapeHtml(post.intro || '')}</p>
          <div class="card-meta">
            <span class="card-tag">📡 Health Tip</span>
            <span>${formatDate(post.date)}</span>
            ${post.video ? '<span>🎬 Video</span>' : ''}
          </div>
        </div>
      `;
      card.addEventListener('click', () => openPost(post.id));
      grid.appendChild(card);
    });
    const statPosts = document.getElementById('statPosts');
    if (statPosts) statPosts.textContent = posts.length;
  }

  function openPost(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const body = document.getElementById('modalBody');
    if (!body) return;
    
    body.innerHTML = `
      <img src="${post.image}" class="modal-image" onerror="this.style.display='none'"/>
      <h2 class="modal-title">${escapeHtml(post.title)}</h2>
      <p class="modal-intro">${escapeHtml(post.intro || '')}</p>
      ${post.video ? `<div class="modal-video"><iframe src="${post.video}" allowfullscreen></iframe></div>` : ''}
      <div class="modal-content-text">${escapeHtml(post.content || '')}</div>
    `;
    const modal = document.getElementById('postModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  /* ========== MOBILE MENU - FIXED ========== */
  const mobileMenuBtn = document.getElementById('mobileMenu');
  const navLinks = document.getElementById('navLinks');
  
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', function() {
      navLinks.classList.toggle('open');
      
      // Toggle button icon
      if (navLinks.classList.contains('open')) {
        mobileMenuBtn.textContent = '✕';
      } else {
        mobileMenuBtn.textContent = '☰';
      }
    });
  }

  /* ---------- NAV LINKS ---------- */
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Close mobile menu when link clicked
      if (navLinks) {
        navLinks.classList.remove('open');
      }
      if (mobileMenuBtn) {
        mobileMenuBtn.textContent = '☰';
      }
    });
  });

  /* ---------- ADMIN PANEL ---------- */
  const adminToggle = document.getElementById('adminToggle');
  if (adminToggle) {
    adminToggle.addEventListener('click', () => {
      if (isAdmin) {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
          adminPanel.classList.remove('hidden');
          adminPanel.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        const adminLogin = document.getElementById('adminLogin');
        if (adminLogin) {
          adminLogin.classList.add('active');
        }
      }
      // Close mobile menu if open
      if (navLinks) {
        navLinks.classList.remove('open');
      }
      if (mobileMenuBtn) {
        mobileMenuBtn.textContent = '☰';
      }
    });
  }

  const loginSubmit = document.getElementById('loginSubmit');
  if (loginSubmit) {
    loginSubmit.addEventListener('click', () => {
      const pw = document.getElementById('adminPassword').value;
      if (pw === ADMIN_PASS) {
        isAdmin = true;
        const adminLogin = document.getElementById('adminLogin');
        if (adminLogin) adminLogin.classList.remove('active');
        const adminPassword = document.getElementById('adminPassword');
        if (adminPassword) adminPassword.value = '';
        const loginError = document.getElementById('loginError');
        if (loginError) loginError.textContent = '';
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
          adminPanel.classList.remove('hidden');
          adminPanel.scrollIntoView({ behavior: 'smooth' });
        }
        renderAdminList();
      } else {
        const loginError = document.getElementById('loginError');
        if (loginError) loginError.textContent = '⚠ Access denied. Invalid credentials.';
      }
    });
  }

  const loginClose = document.getElementById('loginClose');
  if (loginClose) {
    loginClose.addEventListener('click', () => {
      const adminLogin = document.getElementById('adminLogin');
      if (adminLogin) adminLogin.classList.remove('active');
    });
  }

  const adminLogout = document.getElementById('adminLogout');
  if (adminLogout) {
    adminLogout.addEventListener('click', () => {
      isAdmin = false;
      const adminPanel = document.getElementById('adminPanel');
      if (adminPanel) adminPanel.classList.add('hidden');
      resetForm();
    });
  }

  /* ---------- CRUD ---------- */
  const savePost = document.getElementById('savePost');
  if (savePost) {
    savePost.addEventListener('click', () => {
      const id = document.getElementById('editId').value;
      const title = document.getElementById('postTitle').value.trim();
      const intro = document.getElementById('postIntro').value.trim();
      const image = document.getElementById('postImage').value.trim();
      const videoRaw = document.getElementById('postVideo').value.trim();
      const content = document.getElementById('postContent').value.trim();

      if (!title) { alert('Title is required!'); return; }

      const video = convertToEmbed(videoRaw);

      if (id) {
        const idx = posts.findIndex(p => p.id === parseInt(id));
        if (idx !== -1) {
          posts[idx] = { ...posts[idx], title, intro, image, video, content };
        }
      } else {
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
  }

  const cancelEdit = document.getElementById('cancelEdit');
  if (cancelEdit) {
    cancelEdit.addEventListener('click', resetForm);
  }

  // Expose functions globally
  window.editPost = function(id) {
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
  };

  window.deletePost = function(id) {
    if (!confirm('Delete this transmission permanently?')) return;
    posts = posts.filter(p => p.id !== id);
    savePosts();
    renderBlog();
    renderAdminList();
  };

  function renderAdminList() {
    const list = document.getElementById('adminList');
    if (!list) return;
    
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

  function resetForm() {
    document.getElementById('editId').value = '';
    ['postTitle','postIntro','postImage','postVideo','postContent'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = '🛰️ New Transmission';
  }

  /* ---------- VIDEO URL → EMBED ---------- */
  function convertToEmbed(url) {
    if (!url) return '';
    let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
    if (url.includes('/embed/')) return url;
    m = url.match(/facebook\.com\/.*\/videos\/(\d+)/);
    if (m) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0`;
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
  const modalClose = document.getElementById('modalClose');
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      const modal = document.getElementById('postModal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        const iframe = document.querySelector('#modalBody iframe');
        if (iframe) iframe.src = '';
      }
    });
  }

  const postModal = document.getElementById('postModal');
  if (postModal) {
    postModal.addEventListener('click', e => {
      if (e.target.id === 'postModal') {
        postModal.classList.remove('active');
        document.body.style.overflow = '';
        const iframe = document.querySelector('#modalBody iframe');
        if (iframe) iframe.src = '';
      }
    });
  }

  /* ---------- INIT ---------- */
  loadPosts();
  
}); // End of DOMContentLoaded

