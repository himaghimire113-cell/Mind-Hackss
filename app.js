/* ==========================================================================
   Health Years — app.js
   One shared file for the public site (index.html) and the admin panel
   (admin.html). Data lives in localStorage, so this whole site runs
   without a server — good for a single-editor personal blog. See the
   "HOOKING UP GOOGLE ANALYTICS & FIREBASE" section near the bottom for
   how to plug in real services later.
   ========================================================================== */

const HY = (() => {

  const KEYS = {
    posts: 'hy_posts',
    subs: 'hy_subscribers',
    settings: 'hy_settings',
    liked: 'hy_liked_ids',
    saved: 'hy_saved_ids',
  };

  const DEFAULT_SETTINGS = {
    aboutText: "Health Years publishes plain-language, well-sourced articles on staying healthy, active, and independent after 50. No jargon, no scare headlines — just clear guidance you can act on.",
    editorNote: "Every article here is written to be read in a few quiet minutes — no jargon, no scrolling past ads to find the point. If there's a topic you'd like us to cover, just write in. — The Health Years editors",
    contactEmail: "hello@healthyears.example",
    contactPhone: "",
    adminPassword: "healthyears2026",
    gaId: "G-648BS6BLC2",
    firebaseConfig: JSON.stringify({
      apiKey: "AIzaSyCVvqszP7rvTRXApR_VYEIxXTs84ToPfgs",
      authDomain: "mind-hacks-daily.firebaseapp.com",
      projectId: "mind-hacks-daily",
      storageBucket: "mind-hacks-daily.firebasestorage.app",
      messagingSenderId: "758474293685",
      appId: "1:758474293685:web:f83bb589bec0f9760059fc",
      measurementId: "G-DYTPZGMWZ5"
    }, null, 2),
    beehiivEmbed: ""
  };

  function seedPosts(){
    return [
      {
        id: "p1",
        title: "5 Simple Habits That Support Healthy Blood Pressure",
        slug: "healthy-blood-pressure-habits",
        excerpt: "Small, consistent changes make more difference than any single big effort. Here are five habits doctors recommend most often.",
        contentHTML: "<p>Blood pressure tends to creep up quietly with age, which is exactly why small daily habits matter so much. You don't need a dramatic lifestyle overhaul to make a real difference.</p><p><strong>1. Walk most days.</strong> Even a 20-minute walk lowers blood pressure measurably for hours afterward.</p><p><strong>2. Watch the salt, not just the salt shaker.</strong> Packaged soups, breads, and deli meats are often the biggest sources.</p><p><strong>3. Prioritize sleep.</strong> Poor sleep is linked to higher blood pressure over time.</p><p><strong>4. Limit alcohol.</strong> Even moderate drinking can raise numbers for some people.</p><p><strong>5. Track it at home.</strong> A simple home monitor helps you and your doctor spot trends early.</p>",
        coverImage: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=1200&auto=format&fit=crop",
        videoUrl: "",
        tags: ["Heart Health", "Habits"],
        featured: true,
        reviewedBy: "Dr. Alan Weiss, MD",
        promo: { label: "", url: "" },
        notifyOnPublish: true,
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        likes: 12,
        comments: [
          { name: "Diane R.", text: "The home monitor tip made the biggest difference for us. Great, clear advice.", date: new Date(Date.now() - 86400000).toISOString() }
        ]
      },
      {
        id: "p2",
        title: "Staying Active After 60: A Beginner-Friendly Guide",
        slug: "staying-active-after-60",
        excerpt: "You don't need a gym membership to protect your strength and balance. Here's where to start, safely.",
        contentHTML: "<p>Strength and balance are the two things most worth protecting as we age, because they're what keep us independent.</p><p>Start with chair-assisted squats, gentle resistance bands, and short daily walks. Consistency beats intensity — three short sessions a week is plenty to start.</p><p>Always check with your doctor before beginning a new routine, especially if you manage a chronic condition.</p>",
        coverImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200&auto=format&fit=crop",
        videoUrl: "",
        tags: ["Fitness", "Getting Started"],
        featured: false,
        promo: { label: "Our favorite resistance bands (affiliate link)", url: "https://example.com/resistance-bands" },
        notifyOnPublish: false,
        date: new Date(Date.now() - 86400000 * 6).toISOString(),
        likes: 8,
        comments: []
      },
      {
        id: "p3",
        title: "A 10-Minute Morning Stretch Routine",
        slug: "morning-stretch-routine",
        excerpt: "Follow along with this gentle, chair-friendly stretch routine to start your day feeling looser and steadier.",
        contentHTML: "<p>This short routine focuses on the joints that get stiff overnight: neck, shoulders, hips, and ankles. Follow along with the video below, and stop any movement that causes pain.</p>",
        coverImage: "",
        videoUrl: "https://www.youtube.com/embed/g_tea8ZNk5A",
        tags: ["Fitness", "Video"],
        featured: false,
        promo: { label: "", url: "" },
        notifyOnPublish: false,
        date: new Date(Date.now() - 86400000 * 10).toISOString(),
        likes: 5,
        comments: []
      }
    ];
  }

  function getPosts(){
    const raw = localStorage.getItem(KEYS.posts);
    if(!raw){
      const seeded = seedPosts();
      localStorage.setItem(KEYS.posts, JSON.stringify(seeded));
      return seeded;
    }
    try { return JSON.parse(raw); } catch(e){ return []; }
  }
  function savePosts(posts){ localStorage.setItem(KEYS.posts, JSON.stringify(posts)); }

  function getSettings(){
    const raw = localStorage.getItem(KEYS.settings);
    if(!raw){
      localStorage.setItem(KEYS.settings, JSON.stringify(DEFAULT_SETTINGS));
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  }
  function saveSettings(s){ localStorage.setItem(KEYS.settings, JSON.stringify(s)); }

  function getSubscribers(){
    try { return JSON.parse(localStorage.getItem(KEYS.subs)) || []; } catch(e){ return []; }
  }
  function saveSubscribers(list){ localStorage.setItem(KEYS.subs, JSON.stringify(list)); }

  function getLikedIds(){
    try { return JSON.parse(localStorage.getItem(KEYS.liked)) || []; } catch(e){ return []; }
  }
  function saveLikedIds(list){ localStorage.setItem(KEYS.liked, JSON.stringify(list)); }

  function getSavedIds(){
    try { return JSON.parse(localStorage.getItem(KEYS.saved)) || []; } catch(e){ return []; }
  }
  function saveSavedIds(list){ localStorage.setItem(KEYS.saved, JSON.stringify(list)); }

  function readTime(html){
    const text = (html || '').replace(/<[^>]*>/g, ' ');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }

  function uid(prefix){ return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

  function formatDate(iso){
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function escapeHTML(str){
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // Injects raw embed HTML (e.g. a beehiiv snippet) into a container and makes
  // any <script> tags inside it actually run — script tags added via
  // .innerHTML alone are inert, so we recreate them manually.
  function injectEmbed(container, html){
    container.innerHTML = '';
    const template = document.createElement('template');
    template.innerHTML = html;
    Array.from(template.content.childNodes).forEach(node => {
      if (node.nodeType === 1 && node.tagName === 'SCRIPT'){
        const script = document.createElement('script');
        Array.from(node.attributes).forEach(attr => script.setAttribute(attr.name, attr.value));
        script.text = node.textContent;
        container.appendChild(script);
      } else {
        container.appendChild(node.cloneNode(true));
      }
    });
  }

  return {
    KEYS, DEFAULT_SETTINGS,
    getPosts, savePosts, getSettings, saveSettings,
    getSubscribers, saveSubscribers, getLikedIds, saveLikedIds,
    getSavedIds, saveSavedIds, readTime,
    uid, formatDate, escapeHTML, injectEmbed
  };
})();

/* ==========================================================================
   HOOKING UP GOOGLE ANALYTICS & FIREBASE (do this later, no code edits needed)
   - Open admin.html → Settings tab → paste your GA4 Measurement ID and/or
     your Firebase config JSON, then save.
   - This script reads those values from storage and injects the official
     GA / Firebase SDK tags automatically, on every page load.
   ========================================================================== */
function initThirdPartyServices(){
  const settings = HY.getSettings();

  if (settings.gaId && settings.gaId.trim()){
    const gaId = settings.gaId.trim();
    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(s1);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', gaId);
    window.gtag = gtag;
  }

  if (settings.firebaseConfig && settings.firebaseConfig.trim()){
    try {
      const config = JSON.parse(settings.firebaseConfig);
      const s1 = document.createElement('script');
      s1.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js';
      s1.onload = () => {
        const s2 = document.createElement('script');
        s2.src = 'https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics-compat.js';
        s2.onload = () => {
          try {
            firebase.initializeApp(config);
            if (firebase.analytics) firebase.analytics();
          } catch(e){ console.warn('Firebase init failed:', e); }
        };
        document.head.appendChild(s2);
      };
      document.head.appendChild(s1);
    } catch(e){ console.warn('Firebase config is not valid JSON yet.'); }
  }
}

/* ==========================================================================
   SHARED UI: hamburger nav, reading-size toggle, toast
   ========================================================================== */
function initChrome(){
  const hamburger = document.querySelector('.hamburger-btn');
  const nav = document.getElementById('siteNav');
  const overlay = document.querySelector('.nav-overlay');
  const navClose = document.querySelector('.nav-close');

  function openNav(){
    nav.classList.add('open'); overlay.classList.add('open');
    nav.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
  }
  function closeNav(){
    nav.classList.remove('open'); overlay.classList.remove('open');
    nav.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
  }
  if (hamburger){
    hamburger.addEventListener('click', openNav);
    navClose && navClose.addEventListener('click', closeNav);
    overlay && overlay.addEventListener('click', closeNav);
    nav && nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
  }

  // Reading size toggle
  const sizeButtons = document.querySelectorAll('.reading-tools button');
  const savedSize = localStorage.getItem('hy_font_size') || 'normal';
  applyFontSize(savedSize);
  sizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size;
      applyFontSize(size);
      localStorage.setItem('hy_font_size', size);
    });
  });
  function applyFontSize(size){
    document.documentElement.classList.remove('fs-large', 'fs-xlarge');
    if (size === 'large') document.documentElement.classList.add('fs-large');
    if (size === 'xlarge') document.documentElement.classList.add('fs-xlarge');
    sizeButtons.forEach(b => b.classList.toggle('active', b.dataset.size === size));
  }
}

function showToast(msg){
  let toast = document.querySelector('.toast');
  if (!toast){
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ==========================================================================
   PUBLIC SITE (index.html)
   ========================================================================== */
function initPublicSite(){
  const settings = HY.getSettings();
  let posts = HY.getPosts().slice().sort((a,b) => new Date(b.date) - new Date(a.date));

  // About + editor note text from settings
  const aboutEl = document.getElementById('aboutText');
  if (aboutEl) aboutEl.textContent = settings.aboutText;
  const editorNoteEl = document.getElementById('editorNoteText');
  if (editorNoteEl) editorNoteEl.textContent = settings.editorNote;
  const contactEmailEl = document.getElementById('contactEmail');
  if (contactEmailEl){
    contactEmailEl.textContent = settings.contactEmail;
    contactEmailEl.href = 'mailto:' + settings.contactEmail;
  }

  renderMainNewsletterEmbed(settings);
  renderFeatured(posts);
  renderTopicFilters(posts);
  renderPostsGrid(posts);
  renderVideos(posts);
  wireSearch(posts);
  wireNewsletterForm();
  wireModal();
}

const PUBLIC_STATE = { query: '', tag: '' };

function renderTopicFilters(posts){
  const wrap = document.getElementById('topicFilters');
  if (!wrap) return;
  const tags = Array.from(new Set(posts.flatMap(p => p.tags || []))).sort();
  if (tags.length === 0){ wrap.style.display = 'none'; return; }
  wrap.innerHTML = [`<button class="topic-chip active" data-tag="">All topics</button>`]
    .concat(tags.map(t => `<button class="topic-chip" data-tag="${HY.escapeHTML(t)}">${HY.escapeHTML(t)}</button>`))
    .join('');
  wrap.querySelectorAll('.topic-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      PUBLIC_STATE.tag = btn.dataset.tag;
      wrap.querySelectorAll('.topic-chip').forEach(b => b.classList.toggle('active', b === btn));
      renderPostsGrid(posts, PUBLIC_STATE.query, PUBLIC_STATE.tag);
    });
  });
}

function renderFeatured(posts){
  const wrap = document.getElementById('featuredPost');
  const section = document.getElementById('featured');
  if (!wrap) return;
  const featured = posts.find(p => p.featured) || posts[0];
  if (!featured){ if(section) section.style.display = 'none'; return; }

  wrap.innerHTML = `
    <article class="featured-card">
      <div class="featured-media">
        ${featured.coverImage ? `<img src="${HY.escapeHTML(featured.coverImage)}" alt="">` : `<div style="height:100%;min-height:220px;background:var(--teal-700)"></div>`}
      </div>
      <div class="featured-body">
        <span class="badge">Featured</span>
        <span class="post-date" style="color:rgba(255,255,255,.7)">${HY.formatDate(featured.date)}</span>
        <h3>${HY.escapeHTML(featured.title)}</h3>
        <p class="featured-excerpt">${HY.escapeHTML(featured.excerpt)}</p>
        <button class="btn btn-primary" data-open-post="${featured.id}">Read full article</button>
      </div>
    </article>
  `;
  wrap.querySelector('[data-open-post]').addEventListener('click', () => openPostModal(featured.id));
}

function renderPostsGrid(posts, filterText, filterTag){
  const grid = document.getElementById('postsGrid');
  if (!grid) return;
  let list = posts;
  if (filterTag){
    list = list.filter(p => (p.tags || []).includes(filterTag));
  }
  if (filterText){
    const q = filterText.trim().toLowerCase();
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }
  if (list.length === 0){
    grid.innerHTML = `<p class="no-results">No articles match yet. Try a different word or topic.</p>`;
    return;
  }
  const likedIds = HY.getLikedIds();
  const savedIds = HY.getSavedIds();
  grid.innerHTML = list.map(p => `
    <article class="post-card">
      <div class="post-media">
        ${p.coverImage ? `<img src="${HY.escapeHTML(p.coverImage)}" alt="">` : `<div style="width:100%;height:100%;background:var(--teal-100)"></div>`}
        <button class="bookmark-btn ${savedIds.includes(p.id) ? 'saved' : ''}" data-save="${p.id}" aria-label="Save for later">🔖</button>
      </div>
      <div class="post-body">
        <div class="post-tags">${(p.tags||[]).map(t => `<span class="tag-chip">${HY.escapeHTML(t)}</span>`).join('')}</div>
        <div class="meta-row">
          <span class="post-date">${HY.formatDate(p.date)}</span>
          <span class="read-time">${HY.readTime(p.contentHTML)} min read</span>
        </div>
        <h3>${HY.escapeHTML(p.title)}</h3>
        <p class="post-excerpt">${HY.escapeHTML(p.excerpt)}</p>
        ${p.reviewedBy ? `<div class="reviewed-badge">✓ Reviewed by ${HY.escapeHTML(p.reviewedBy)}</div>` : ''}
        ${p.promo && p.promo.url ? `<div class="promo-note">✦ ${HY.escapeHTML(p.promo.label || 'Recommended product')}</div>` : ''}
        <div class="post-actions">
          <button class="icon-btn ${likedIds.includes(p.id) ? 'liked' : ''}" data-like="${p.id}">👍 <span data-like-count="${p.id}">${p.likes||0}</span></button>
          <button class="icon-btn" data-open-post="${p.id}">💬 ${(p.comments||[]).length}</button>
          <button class="icon-btn" data-share="${p.id}">🔗 Share</button>
          <a href="#" class="read-more" data-open-post="${p.id}">Read more →</a>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('[data-open-post]').forEach(el =>
    el.addEventListener('click', (e) => { e.preventDefault(); openPostModal(el.dataset.openPost || el.getAttribute('data-open-post')); })
  );
  grid.querySelectorAll('[data-like]').forEach(el =>
    el.addEventListener('click', () => toggleLike(el.dataset.like))
  );
  grid.querySelectorAll('[data-save]').forEach(el =>
    el.addEventListener('click', () => toggleSave(el.dataset.save))
  );
  grid.querySelectorAll('[data-share]').forEach(el =>
    el.addEventListener('click', () => sharePost(el.dataset.share))
  );
}

function renderVideos(posts){
  const grid = document.getElementById('videosGrid');
  const section = document.getElementById('videos');
  if (!grid) return;
  const videoPosts = posts.filter(p => p.videoUrl);
  if (videoPosts.length === 0){ if (section) section.style.display = 'none'; return; }
  grid.innerHTML = videoPosts.map(p => `
    <article class="video-card">
      <div class="video-embed"><iframe src="${HY.escapeHTML(p.videoUrl)}" title="${HY.escapeHTML(p.title)}" allowfullscreen loading="lazy"></iframe></div>
      <div class="post-body">
        <h3>${HY.escapeHTML(p.title)}</h3>
        <p class="post-excerpt">${HY.escapeHTML(p.excerpt)}</p>
        <button class="btn btn-outline btn-sm" data-open-post="${p.id}">Read the article</button>
      </div>
    </article>
  `).join('');
  grid.querySelectorAll('[data-open-post]').forEach(el =>
    el.addEventListener('click', () => openPostModal(el.dataset.openPost))
  );
}

function wireSearch(posts){
  const form = document.querySelector('.search-form');
  const input = document.getElementById('searchInput');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    PUBLIC_STATE.query = input.value;
    renderPostsGrid(posts, PUBLIC_STATE.query, PUBLIC_STATE.tag);
    document.getElementById('posts').scrollIntoView({ behavior: 'smooth' });
  });
  input.addEventListener('input', () => {
    PUBLIC_STATE.query = input.value;
    renderPostsGrid(posts, PUBLIC_STATE.query, PUBLIC_STATE.tag);
  });
}

function toggleSave(postId){
  const saved = HY.getSavedIds();
  const already = saved.includes(postId);
  const newSaved = already ? saved.filter(id => id !== postId) : [...saved, postId];
  HY.saveSavedIds(newSaved);
  document.querySelectorAll(`[data-save="${postId}"]`).forEach(btn => btn.classList.toggle('saved', !already));
  showToast(already ? 'Removed from your saved articles.' : 'Saved for later.');
}

function toggleLike(postId){
  const posts = HY.getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  const liked = HY.getLikedIds();
  const already = liked.includes(postId);
  post.likes = Math.max(0, (post.likes || 0) + (already ? -1 : 1));
  const newLiked = already ? liked.filter(id => id !== postId) : [...liked, postId];
  HY.saveLikedIds(newLiked);
  HY.savePosts(posts);

  document.querySelectorAll(`[data-like="${postId}"]`).forEach(btn => btn.classList.toggle('liked', !already));
  document.querySelectorAll(`[data-like-count="${postId}"]`).forEach(span => span.textContent = post.likes);
  const modalLike = document.querySelector(`[data-modal-like="${postId}"]`);
  if (modalLike){
    modalLike.classList.toggle('liked', !already);
    const countEl = modalLike.querySelector('[data-modal-like-count]');
    if (countEl) countEl.textContent = post.likes;
  }
}

function sharePost(postId){
  const posts = HY.getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  const url = `${location.origin}${location.pathname}?post=${encodeURIComponent(post.slug)}`;
  if (navigator.share){
    navigator.share({ title: post.title, text: post.excerpt, url }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url).then(() => showToast('Link copied — ready to paste and share.'))
      .catch(() => showToast(url));
  }
}

function openPostModal(postId){
  const posts = HY.getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  const modal = document.getElementById('postModal');
  const likedIds = HY.getLikedIds();
  const savedIds = HY.getSavedIds();
  const related = posts
    .filter(p => p.id !== post.id && (p.tags||[]).some(t => (post.tags||[]).includes(t)))
    .slice(0, 3);

  modal.innerHTML = `
    <div class="modal-topbar">
      <button class="modal-back" data-modal-back>← Back</button>
      <span class="brand-name">Health Years</span>
    </div>
    <div class="post-modal-card" role="dialog" aria-modal="true" aria-label="${HY.escapeHTML(post.title)}">
      ${post.coverImage ? `<div class="modal-media"><img src="${HY.escapeHTML(post.coverImage)}" alt=""></div>` : ''}
      <div class="post-tags">${(post.tags||[]).map(t => `<span class="tag-chip">${HY.escapeHTML(t)}</span>`).join('')}</div>
      <div class="meta-row">
        <span class="post-date">${HY.formatDate(post.date)}</span>
        <span class="read-time">${HY.readTime(post.contentHTML)} min read</span>
      </div>
      <h2>${HY.escapeHTML(post.title)}</h2>
      ${post.reviewedBy ? `<div class="reviewed-badge">✓ Reviewed by ${HY.escapeHTML(post.reviewedBy)}</div>` : ''}
      ${post.videoUrl ? `<div class="video-embed" style="margin-bottom:1.25rem;border-radius:10px;overflow:hidden"><iframe src="${HY.escapeHTML(post.videoUrl)}" title="${HY.escapeHTML(post.title)}" allowfullscreen loading="lazy"></iframe></div>` : ''}
      <div class="post-content">${post.contentHTML}</div>
      ${post.promo && post.promo.url ? `<p class="promo-note">✦ <a href="${HY.escapeHTML(post.promo.url)}" target="_blank" rel="noopener sponsored">${HY.escapeHTML(post.promo.label || 'Recommended product')}</a></p>` : ''}

      <div class="share-row">
        <button class="icon-btn ${likedIds.includes(post.id) ? 'liked' : ''}" data-modal-like="${post.id}">👍 Like <span data-modal-like-count>${post.likes||0}</span></button>
        <button class="icon-btn ${savedIds.includes(post.id) ? 'saved' : ''}" data-save="${post.id}">🔖 ${savedIds.includes(post.id) ? 'Saved' : 'Save for later'}</button>
        <button class="icon-btn" data-share="${post.id}">🔗 Share this article</button>
      </div>

      ${post.notifyOnPublish ? `
      <div class="newsletter-card" style="margin-top:1.5rem;padding:1.25rem;text-align:left">
        <h4 style="margin-top:0">Want articles like this one in your inbox?</h4>
        <div id="postBeehiivWrap-${post.id}"></div>
        <form class="post-newsletter-form" id="postNewsletterForm-${post.id}" data-post-newsletter="${post.id}">
          <div style="display:flex;gap:.6rem;flex-wrap:wrap">
            <label class="sr-only" for="postEmail-${post.id}">Email address</label>
            <input type="email" id="postEmail-${post.id}" required placeholder="you@example.com" style="flex:1;min-width:200px;border:2px solid var(--border);border-radius:999px;padding:.7rem 1rem">
            <button class="btn btn-primary" type="submit">Subscribe</button>
          </div>
        </form>
      </div>` : ''}

      <div class="comments-block">
        <h3>Comments (${(post.comments||[]).length})</h3>
        <div data-comments-list>
          ${(post.comments||[]).map(c => `
            <div class="comment">
              <span class="comment-name">${HY.escapeHTML(c.name)}</span><span class="comment-date">${HY.formatDate(c.date)}</span>
              <p style="margin:.4rem 0 0">${HY.escapeHTML(c.text)}</p>
            </div>`).join('') || '<p class="no-results">Be the first to share your thoughts.</p>'}
        </div>
        <form class="comment-form" data-comment-form="${post.id}">
          <label for="commentName-${post.id}">Your name</label>
          <input type="text" id="commentName-${post.id}" required maxlength="60">
          <label for="commentText-${post.id}">Your comment</label>
          <textarea id="commentText-${post.id}" required maxlength="600"></textarea>
          <button type="submit" class="btn btn-outline">Post comment</button>
        </form>
      </div>

      ${related.length ? `
      <div class="related-block">
        <h3>Related articles</h3>
        <div class="related-grid">
          ${related.map(r => `
            <button class="related-card" data-open-post="${r.id}">
              ${r.coverImage ? `<img src="${HY.escapeHTML(r.coverImage)}" alt="">` : `<div style="width:100%;height:100%;background:var(--teal-100)"></div>`}
              <span>${HY.escapeHTML(r.title)}</span>
            </button>
          `).join('')}
        </div>
      </div>` : ''}
    </div>
  `;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('post-open');
  window.scrollTo(0, 0);
  modal.querySelector('[data-modal-back]').addEventListener('click', closePostModal);

  modal.querySelectorAll('[data-open-post]').forEach(el =>
    el.addEventListener('click', () => openPostModal(el.dataset.openPost))
  );
  const saveBtn = modal.querySelector('[data-save]');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    toggleSave(post.id);
    const nowSaved = HY.getSavedIds().includes(post.id);
    saveBtn.classList.toggle('saved', nowSaved);
    saveBtn.innerHTML = `🔖 ${nowSaved ? 'Saved' : 'Save for later'}`;
  });

  const likeBtn = modal.querySelector('[data-modal-like]');
  if (likeBtn) likeBtn.addEventListener('click', () => toggleLike(post.id));
  const shareBtn = modal.querySelector('[data-share]');
  if (shareBtn) shareBtn.addEventListener('click', () => sharePost(post.id));

  const cForm = modal.querySelector('[data-comment-form]');
  cForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById(`commentName-${post.id}`).value.trim();
    const text = document.getElementById(`commentText-${post.id}`).value.trim();
    if (!name || !text) return;
    addComment(post.id, name, text);
    openPostModal(post.id); // re-render with the new comment
  });

  const pnForm = modal.querySelector('[data-post-newsletter]');
  if (pnForm){
    const settings = HY.getSettings();
    const beehiivWrap = document.getElementById(`postBeehiivWrap-${post.id}`);
    if (settings.beehiivEmbed && settings.beehiivEmbed.trim()){
      HY.injectEmbed(beehiivWrap, settings.beehiivEmbed);
      pnForm.style.display = 'none';
    } else {
      pnForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById(`postEmail-${post.id}`).value.trim();
        subscribeEmail(email, post.id);
        pnForm.innerHTML = `<p style="margin:0;font-weight:700;color:var(--teal-700)">You're subscribed. Thank you!</p>`;
      });
    }
  }
}

function closePostModal(){
  const modal = document.getElementById('postModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = '';
  document.body.classList.remove('post-open');
}

function wireModal(){
  const modal = document.getElementById('postModal');
  if (!modal) return;
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) closePostModal(); });
}

function addComment(postId, name, text){
  const posts = HY.getPosts();
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  post.comments = post.comments || [];
  post.comments.push({ name, text, date: new Date().toISOString() });
  HY.savePosts(posts);
  showToast('Comment posted. Thank you for sharing.');
}

function subscribeEmail(email, postId){
  if (!email) return;
  const subs = HY.getSubscribers();
  subs.push({ email, date: new Date().toISOString(), postId: postId || null });
  HY.saveSubscribers(subs);
  showToast('You are subscribed to Health Years.');
}

function renderMainNewsletterEmbed(settings){
  const formWrap = document.getElementById('newsletterForm');
  const embedWrap = document.getElementById('beehiivEmbedWrap');
  if (!embedWrap) return;
  if (settings.beehiivEmbed && settings.beehiivEmbed.trim()){
    HY.injectEmbed(embedWrap, settings.beehiivEmbed);
    embedWrap.style.display = 'block';
    if (formWrap) formWrap.style.display = 'none';
  } else {
    embedWrap.style.display = 'none';
    if (formWrap) formWrap.style.display = 'flex';
  }
}

function wireNewsletterForm(){
  const form = document.getElementById('newsletterForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('newsletterEmail');
    const email = input.value.trim();
    if (!email) return;
    subscribeEmail(email, null);
    form.innerHTML = `<p style="font-weight:700;color:var(--teal-700);margin:0">Thanks — you're on the list!</p>`;
  });
}

/* ==========================================================================
   ADMIN PANEL (admin.html)
   ========================================================================== */
function initAdmin(){
  const settings = HY.getSettings();
  const loginWrap = document.getElementById('loginWrap');
  const dashboard = document.getElementById('adminDashboard');
  const loginForm = document.getElementById('loginForm');
  const loggedIn = sessionStorage.getItem('hy_admin_logged_in') === 'true';

  function showDashboard(){
    loginWrap.style.display = 'none';
    dashboard.style.display = 'block';
    renderAdmin();
  }

  if (loggedIn){ showDashboard(); }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pass = document.getElementById('loginPassword').value;
    const current = HY.getSettings();
    if (pass === current.adminPassword){
      sessionStorage.setItem('hy_admin_logged_in', 'true');
      showDashboard();
    } else {
      document.getElementById('loginError').textContent = 'That password is not correct. Please try again.';
    }
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('hy_admin_logged_in');
    location.reload();
  });
}

function renderAdmin(){
  wireAdminTabs();
  wirePostForm();
  renderPostTable();
  wireSettingsForm();
  renderSubscribers();
}

function wireAdminTabs(){
  const tabs = document.querySelectorAll('.admin-tabs button');
  const panels = document.querySelectorAll('.admin-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.panel).classList.add('active');
    });
  });
}

/* ---- Rich text editor toolbar (font size + color on selected text) ---- */
function wireEditorToolbar(){
  const editor = document.getElementById('postEditor');
  if (!editor) return;
  let savedRange = null;

  editor.addEventListener('keyup', saveSelection);
  editor.addEventListener('mouseup', saveSelection);
  function saveSelection(){
    const sel = window.getSelection();
    if (sel.rangeCount > 0 && editor.contains(sel.anchorNode)) savedRange = sel.getRangeAt(0);
  }
  function restoreSelection(){
    if (!savedRange) return false;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
    return true;
  }
  function wrapSelection(styleProp, value){
    if (!restoreSelection()) { showToast('Select some text in the article first.'); return; }
    const sel = window.getSelection();
    if (sel.rangeCount === 0 || sel.isCollapsed) { showToast('Select some text in the article first.'); return; }
    const range = sel.getRangeAt(0);
    const span = document.createElement('span');
    span.style[styleProp] = value;
    try {
      range.surroundContents(span);
    } catch(e){
      // selection spans multiple elements — fall back to extract/wrap
      const content = range.extractContents();
      span.appendChild(content);
      range.insertNode(span);
    }
    sel.removeAllRanges();
  }

  document.getElementById('boldBtn').addEventListener('click', () => { restoreSelection(); document.execCommand('bold'); });
  document.getElementById('italicBtn').addEventListener('click', () => { restoreSelection(); document.execCommand('italic'); });
  document.getElementById('underlineBtn').addEventListener('click', () => { restoreSelection(); document.execCommand('underline'); });

  document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
    const sizeMap = { small: '.9em', normal: '1em', large: '1.3em', xlarge: '1.6em' };
    wrapSelection('fontSize', sizeMap[e.target.value]);
    e.target.selectedIndex = 0;
  });

  document.querySelectorAll('.color-swatch').forEach(btn => {
    btn.addEventListener('click', () => wrapSelection('color', btn.dataset.color));
  });
  document.getElementById('customColor').addEventListener('input', (e) => wrapSelection('color', e.target.value));
  document.getElementById('clearFormatBtn').addEventListener('click', () => { restoreSelection(); document.execCommand('removeFormat'); });
}

function wirePostForm(){
  wireEditorToolbar();
  const form = document.getElementById('postForm');
  const editor = document.getElementById('postEditor');
  const editingIdField = document.getElementById('editingPostId');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const posts = HY.getPosts();
    const editingId = editingIdField.value;

    const title = document.getElementById('postTitle').value.trim();
    const excerpt = document.getElementById('postExcerpt').value.trim();
    const coverImage = document.getElementById('postImage').value.trim();
    const videoUrl = document.getElementById('postVideo').value.trim();
    const tags = document.getElementById('postTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const featured = document.getElementById('postFeatured').checked;
    const notifyOnPublish = document.getElementById('postNotify').checked;
    const promoLabel = document.getElementById('promoLabel').value.trim();
    const promoUrl = document.getElementById('promoUrl').value.trim();
    const reviewedBy = document.getElementById('postReviewedBy').value.trim();
    const contentHTML = editor.innerHTML.trim();

    if (!title || !contentHTML){ showToast('Please add a title and some article content.'); return; }

    if (featured){ posts.forEach(p => p.featured = false); }

    if (editingId){
      const post = posts.find(p => p.id === editingId);
      Object.assign(post, {
        title, excerpt, coverImage, videoUrl, tags, featured, notifyOnPublish, reviewedBy,
        promo: { label: promoLabel, url: promoUrl },
        contentHTML,
        slug: slugify(title)
      });
      showToast('Article updated.');
    } else {
      posts.unshift({
        id: HY.uid('p'), title, slug: slugify(title), excerpt, contentHTML,
        coverImage, videoUrl, tags, featured, notifyOnPublish, reviewedBy,
        promo: { label: promoLabel, url: promoUrl },
        date: new Date().toISOString(), likes: 0, comments: []
      });
      if (notifyOnPublish){
        const count = HY.getSubscribers().length;
        showToast(`Article published. (${count} subscriber${count===1?'':'s'} would be notified once email sending is connected.)`);
      } else {
        showToast('Article published.');
      }
    }

    HY.savePosts(posts);
    resetPostForm();
    renderPostTable();
  });

  cancelEditBtn.addEventListener('click', resetPostForm);
}

function resetPostForm(){
  document.getElementById('postForm').reset();
  document.getElementById('postEditor').innerHTML = '';
  document.getElementById('editingPostId').value = '';
  document.getElementById('cancelEditBtn').style.display = 'none';
  document.getElementById('formTitle').textContent = 'Write a new article';
  document.getElementById('submitPostBtn').textContent = 'Publish article';
}

function slugify(str){
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function renderPostTable(){
  const tbody = document.getElementById('postTableBody');
  if (!tbody) return;
  const posts = HY.getPosts().slice().sort((a,b) => new Date(b.date) - new Date(a.date));
  if (posts.length === 0){
    tbody.innerHTML = `<tr><td colspan="5">No articles yet. Use the form above to publish your first one.</td></tr>`;
    return;
  }
  tbody.innerHTML = posts.map(p => `
    <tr>
      <td><strong>${HY.escapeHTML(p.title)}</strong><br><span class="post-date">${HY.formatDate(p.date)}</span></td>
      <td>${p.videoUrl ? 'Video' : (p.coverImage ? 'Image' : '—')}</td>
      <td>${p.promo && p.promo.url ? 'Yes' : 'No'}</td>
      <td><span class="status-pill ${p.featured ? 'featured' : 'normal'}">${p.featured ? 'Featured' : 'Standard'}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn btn-ghost btn-sm" data-edit="${p.id}">Edit</button>
          <button class="btn btn-ghost btn-sm" data-feature="${p.id}">${p.featured ? 'Unfeature' : 'Feature'}</button>
          <button class="btn btn-danger btn-sm" data-delete="${p.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => editPost(btn.dataset.edit)));
  tbody.querySelectorAll('[data-feature]').forEach(btn => btn.addEventListener('click', () => toggleFeature(btn.dataset.feature)));
  tbody.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => deletePost(btn.dataset.delete)));
}

function editPost(id){
  const posts = HY.getPosts();
  const post = posts.find(p => p.id === id);
  if (!post) return;

  document.getElementById('editingPostId').value = post.id;
  document.getElementById('postTitle').value = post.title;
  document.getElementById('postExcerpt').value = post.excerpt;
  document.getElementById('postImage').value = post.coverImage || '';
  document.getElementById('postVideo').value = post.videoUrl || '';
  document.getElementById('postTags').value = (post.tags || []).join(', ');
  document.getElementById('postFeatured').checked = !!post.featured;
  document.getElementById('postNotify').checked = !!post.notifyOnPublish;
  document.getElementById('promoLabel').value = post.promo?.label || '';
  document.getElementById('promoUrl').value = post.promo?.url || '';
  document.getElementById('postReviewedBy').value = post.reviewedBy || '';
  document.getElementById('postEditor').innerHTML = post.contentHTML || '';

  document.getElementById('cancelEditBtn').style.display = 'inline-flex';
  document.getElementById('formTitle').textContent = 'Edit article';
  document.getElementById('submitPostBtn').textContent = 'Save changes';
  document.querySelector('[data-panel="panel-write"]').click();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleFeature(id){
  const posts = HY.getPosts();
  const post = posts.find(p => p.id === id);
  if (!post) return;
  const makeFeatured = !post.featured;
  if (makeFeatured) posts.forEach(p => p.featured = false);
  post.featured = makeFeatured;
  HY.savePosts(posts);
  renderPostTable();
  showToast(makeFeatured ? 'Set as featured article.' : 'Removed from featured.');
}

function deletePost(id){
  if (!confirm('Delete this article? This cannot be undone.')) return;
  const posts = HY.getPosts().filter(p => p.id !== id);
  HY.savePosts(posts);
  renderPostTable();
  showToast('Article deleted.');
}

function wireSettingsForm(){
  const form = document.getElementById('settingsForm');
  if (!form) return;
  const settings = HY.getSettings();
  document.getElementById('siteAbout').value = settings.aboutText;
  document.getElementById('siteContactEmail').value = settings.contactEmail;
  document.getElementById('siteContactPhone').value = settings.contactPhone;
  document.getElementById('gaIdInput').value = settings.gaId;
  document.getElementById('firebaseConfigInput').value = settings.firebaseConfig;
  document.getElementById('siteEditorNote').value = settings.editorNote;
  document.getElementById('beehiivEmbedInput').value = settings.beehiivEmbed;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const updated = {
      ...settings,
      aboutText: document.getElementById('siteAbout').value.trim(),
      editorNote: document.getElementById('siteEditorNote').value.trim(),
      contactEmail: document.getElementById('siteContactEmail').value.trim(),
      contactPhone: document.getElementById('siteContactPhone').value.trim(),
      gaId: document.getElementById('gaIdInput').value.trim(),
      firebaseConfig: document.getElementById('firebaseConfigInput').value.trim(),
      beehiivEmbed: document.getElementById('beehiivEmbedInput').value.trim(),
    };
    HY.saveSettings(updated);
    showToast('Settings saved.');
  });

  const pwForm = document.getElementById('passwordForm');
  pwForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const current = HY.getSettings();
    const newPass = document.getElementById('newPassword').value.trim();
    if (newPass.length < 6){ showToast('Choose a password with at least 6 characters.'); return; }
    HY.saveSettings({ ...current, adminPassword: newPass });
    document.getElementById('newPassword').value = '';
    showToast('Admin password updated.');
  });
}

function renderSubscribers(){
  const tbody = document.getElementById('subscriberTableBody');
  const countEl = document.getElementById('subscriberCount');
  if (!tbody) return;
  const subs = HY.getSubscribers().slice().sort((a,b) => new Date(b.date) - new Date(a.date));
  if (countEl) countEl.textContent = subs.length;
  tbody.innerHTML = subs.length ? subs.map(s => `
    <tr><td>${HY.escapeHTML(s.email)}</td><td>${HY.formatDate(s.date)}</td><td>${s.postId ? 'Specific article' : 'General newsletter'}</td></tr>
  `).join('') : `<tr><td colspan="3">No subscribers yet.</td></tr>`;

  const exportBtn = document.getElementById('exportSubsBtn');
  if (exportBtn){
    exportBtn.onclick = () => {
      const csv = 'email,date,source\n' + subs.map(s => `${s.email},${s.date},${s.postId ? 'post:' + s.postId : 'general'}`).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'healthyears-subscribers.csv';
      a.click();
    };
  }
}

/* ==========================================================================
   Boot
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initThirdPartyServices();
  initChrome();
  if (document.body.dataset.page === 'public') initPublicSite();
  if (document.body.dataset.page === 'admin') initAdmin();
});
