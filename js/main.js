// ============================================================
// SETTINGS: apply saved theme (colors/fonts) from Firestore
// ============================================================
async function applySiteSettings() {
  try {
    const doc = await db.collection("siteSettings").doc("config").get();
    if (doc.exists) {
      const s = doc.data();
      const root = document.documentElement.style;
      if (s.primaryColor) root.setProperty("--color-navy", s.primaryColor);
      if (s.accentColor) root.setProperty("--color-green", s.accentColor);
      if (s.fontSize) root.setProperty("--font-size-base", s.fontSize);
      if (s.fontFamily === "sans") root.setProperty("--font-display", "var(--font-body)");
      if (s.siteName) {
        document.querySelectorAll(".site-title").forEach(el => {
          const small = el.querySelector("small");
          el.childNodes[0].textContent = s.siteName + " ";
          if (small && s.siteTagline) small.textContent = s.siteTagline;
        });
        document.title = s.siteName;
      }
    }
  } catch (e) { console.warn("Could not load site settings", e); }
}
applySiteSettings();

// ============================================================
// NAV DRAWER
// ============================================================
const drawer = document.getElementById("navDrawer");
const overlay = document.getElementById("drawerOverlay");
const hamburgerBtn = document.getElementById("hamburgerBtn");
document.getElementById("drawerClose").addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);
hamburgerBtn.addEventListener("click", () => {
  drawer.classList.toggle("open");
  overlay.classList.toggle("open");
});
drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", closeDrawer));
function closeDrawer() { drawer.classList.remove("open"); overlay.classList.remove("open"); }

document.getElementById("year").textContent = new Date().getFullYear();

// ============================================================
// ROUTER
// ============================================================
const app = document.getElementById("app");
window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);

function route() {
  const hash = location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);
  return parts;
}

async function render() {
  window.scrollTo(0, 0);
  const parts = route();
  app.innerHTML = `<div class="loading-spinner"></div>`;

  if (parts[0] === "post" && parts[1]) return renderPost(parts[1]);
  if (parts[0] === "category" && parts[1]) return renderHome(decodeURIComponent(parts[1]));
  if (parts[0] === "featured") return renderHome(null, true);
  if (parts[0] === "about") return renderAbout();
  if (parts[0] === "contact") { document.getElementById("contact").scrollIntoView(); return renderHome(); }
  return renderHome();
}

// ============================================================
// HOME (hero + featured carousel + grid, with category filter)
// ============================================================
async function renderHome(categoryFilter = null, featuredOnly = false) {
  let query = db.collection("posts").where("status", "==", "published");
  const snap = await query.get();
  let posts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const featured = posts.filter(p => p.featured);
  let shown = posts;
  if (categoryFilter) shown = posts.filter(p => (p.category || "").toLowerCase() === categoryFilter.toLowerCase());
  if (featuredOnly) shown = featured;

  // Build the filter bar from whatever categories actually exist on published posts
  const categories = [...new Set(posts.map(p => p.category).filter(Boolean))].sort();

  app.innerHTML = `
    <section class="hero">
      <h1>Straight answers on money and health, for the decisions that actually matter</h1>
      <p>Written in plain language, reviewed for accuracy, and free of jargon.</p>
    </section>

    <div class="container">
      ${featured.length && !featuredOnly ? `
      <div class="section-heading">
        <div><span class="eyebrow">Editor's Picks</span><h2>Featured Posts</h2></div>
      </div>
      <div class="carousel">${featured.map(cardHTML).join("")}</div>
      ` : ""}

      <div class="section-heading">
        <div>
          <span class="eyebrow">${featuredOnly ? "Editor's Picks" : "Latest"}</span>
          <h2>${featuredOnly ? "Featured Posts" : "All Posts"}</h2>
        </div>
      </div>
      <div class="filter-bar">
        <button class="filter-btn ${!categoryFilter && !featuredOnly ? "active" : ""}" onclick="location.hash='#/'">All</button>
        ${categories.map(c => `
          <button class="filter-btn ${categoryFilter && categoryFilter.toLowerCase() === c.toLowerCase() ? "active" : ""}" onclick="location.hash='#/category/${encodeURIComponent(c)}'">${escapeHTML(c)}</button>
        `).join("")}
      </div>
      <div class="blog-grid" id="blogGrid">
        ${shown.length ? shown.map(cardHTML).join("") : `<div class="empty-state">No posts here yet — check back soon.</div>`}
      </div>
    </div>
  `;
}

function categoryClass(category) {
  const c = (category || "").toLowerCase();
  return (c === "finance" || c === "health") ? c : "other";
}

function cardHTML(p) {
  const summary = (p.summary || "").slice(0, 130);
  const date = p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  return `
    <a class="card" href="#/post/${p.id}">
      <img class="card-img" src="${p.coverImageUrl || fallbackImg(p.category)}" alt="" loading="lazy">
      <div class="card-body">
        <span class="card-category ${categoryClass(p.category)}">${escapeHTML(p.category || "General")}</span>
        <div class="card-title">${escapeHTML(p.title || "Untitled")}</div>
        <p class="card-summary">${escapeHTML(summary)}${(p.summary || "").length > 130 ? "…" : ""}</p>
        <div class="card-meta">${date} &middot; ${p.likes || 0} likes</div>
      </div>
    </a>`;
}

function fallbackImg(category) {
  return (category || "").toLowerCase() === "health"
    ? "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&q=60"
    : "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=60";
}

// ============================================================
// SINGLE POST VIEW
// ============================================================
async function renderPost(id) {
  const doc = await db.collection("posts").doc(id).get();
  if (!doc.exists) { app.innerHTML = `<div class="container empty-state">Post not found.</div>`; return; }
  const p = { id: doc.id, ...doc.data() };
  const likedKey = "liked_" + id;
  const alreadyLiked = localStorage.getItem(likedKey);
  const byline = p.authorName && p.authorName.trim() ? p.authorName.trim() : "Sound Living Editorial";

  const videoEmbed = p.videoEmbedUrl ? `
    <div class="post-video"><iframe src="${toEmbedUrl(p.videoEmbedUrl)}" allowfullscreen title="Post video"></iframe></div>` : "";

  const extraImages = (p.imageEmbedUrls || []).map(u => `<img src="${u}" alt="">`).join("");

  const affiliateBox = (p.affiliateLinks && p.affiliateLinks.length) ? `
    <div class="affiliate-box">
      <span class="label">Recommended</span>
      ${p.affiliateLinks.map(l => `<a class="affiliate-link" href="${l.url}" target="_blank" rel="noopener sponsored">${escapeHTML(l.label)}</a>`).join("")}
      <p class="affiliate-disclosure">Some links above are affiliate/promotional links. We may earn a commission at no extra cost to you.</p>
    </div>` : "";

  app.innerHTML = `
    <div class="container post-view">
      <a class="back-link" href="#/">&larr; Back to all posts</a>
      <span class="card-category ${categoryClass(p.category)}">${escapeHTML(p.category || "General")}</span>
      <h1>${escapeHTML(p.title || "")}</h1>
      <div class="author-line">By ${escapeHTML(byline)} <span class="verified-badge" title="Verified author">&#10003;</span></div>

      <div class="post-media">
        ${p.coverImageUrl ? `<img class="post-hero-img" src="${p.coverImageUrl}" alt="">` : ""}
        ${videoEmbed}
        <div class="post-content">${p.content || ""}</div>
        ${extraImages}
      </div>
      ${affiliateBox}

      <div class="post-actions">
        <button class="action-btn ${alreadyLiked ? "liked" : ""}" id="likeBtn">&#9825; <span id="likeCount">${p.likes || 0}</span> Like${(p.likes || 0) === 1 ? "" : "s"}</button>
        <button class="action-btn" id="shareBtn">&#8599; Share</button>
        <button class="action-btn" onclick="document.getElementById('reviewsSection').scrollIntoView({behavior:'smooth'})">&#128172; Comments &amp; Reviews</button>
      </div>

      <section class="reviews" id="reviewsSection">
        <h2>Comments &amp; Reviews</h2>
        <div class="review-form">
          <div id="reviewMsg"></div>
          <label>Your Rating (optional)</label>
          <div class="star-input" id="starInput">
            ${[1,2,3,4,5].map(n => `<button type="button" data-star="${n}" aria-label="${n} stars">&#9733;</button>`).join("")}
          </div>
          <label for="reviewName">Your Name</label>
          <input type="text" id="reviewName" placeholder="e.g. Linda M.">
          <label for="reviewText">Your Comment</label>
          <textarea id="reviewText" placeholder="Share your thoughts..."></textarea>
          <button class="btn" id="reviewSubmit">Post Comment</button>
        </div>
        <div id="reviewList"><div class="loading-spinner"></div></div>
      </section>
    </div>
  `;

  gtag("event", "page_view", { page_title: p.title, page_path: "#/post/" + id });

  document.getElementById("likeBtn").addEventListener("click", () => handleLike(id, alreadyLiked));
  document.getElementById("shareBtn").addEventListener("click", () => handleShare(p));

  let selectedStars = 0;
  document.querySelectorAll("#starInput button").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedStars = Number(btn.dataset.star);
      document.querySelectorAll("#starInput button").forEach(b => b.classList.toggle("selected", Number(b.dataset.star) <= selectedStars));
    });
  });
  document.getElementById("reviewSubmit").addEventListener("click", () => submitReview(id, selectedStars));

  loadReviews(id);
}

function toEmbedUrl(url) {
  // Converts common YouTube/Vimeo share links into embeddable iframe URLs
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vim = url.match(/vimeo\.com\/(\d+)/);
  if (vim) return `https://player.vimeo.com/video/${vim[1]}`;
  return url; // already an embed URL
}

async function handleLike(id, alreadyLiked) {
  if (alreadyLiked) return;
  const ref = db.collection("posts").doc(id);
  await ref.update({ likes: firebase.firestore.FieldValue.increment(1) });
  localStorage.setItem("liked_" + id, "1");
  const doc = await ref.get();
  document.getElementById("likeCount").textContent = doc.data().likes || 0;
  document.getElementById("likeBtn").classList.add("liked");
  gtag("event", "like_post", { post_id: id });
}

function handleShare(p) {
  const url = location.href;
  if (navigator.share) {
    navigator.share({ title: p.title, url });
  } else {
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  }
  gtag("event", "share_post", { post_id: p.id });
}

async function loadReviews(postId) {
  const snap = await db.collection("posts").doc(postId).collection("comments").orderBy("createdAt", "desc").get();
  const list = document.getElementById("reviewList");
  if (snap.empty) { list.innerHTML = `<p style="color:var(--color-text-muted)">Be the first to comment.</p>`; return; }
  list.innerHTML = snap.docs.map(d => {
    const r = d.data();
    const date = r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
    return `
      <div class="review-item">
        <span class="rname">${escapeHTML(r.name || "Anonymous")}</span>
        ${r.rating ? `<div class="rstars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>` : ""}
        <div class="rdate">${date}</div>
        <p>${escapeHTML(r.text || "")}</p>
      </div>`;
  }).join("");
}

async function submitReview(postId, stars) {
  const name = document.getElementById("reviewName").value.trim() || "Anonymous";
  const text = document.getElementById("reviewText").value.trim();
  const msg = document.getElementById("reviewMsg");
  if (!text) { msg.innerHTML = `<div class="form-msg error">Please write a comment before posting.</div>`; return; }
  await db.collection("posts").doc(postId).collection("comments").add({
    name, text, rating: stars || null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  document.getElementById("reviewText").value = "";
  document.getElementById("reviewName").value = "";
  msg.innerHTML = `<div class="form-msg success">Thanks — your comment has been posted!</div>`;
  loadReviews(postId);
  gtag("event", "post_comment", { post_id: postId });
}

// ============================================================
// ABOUT (simple)
// ============================================================
function renderAbout() {
  app.innerHTML = `
    <div class="container post-view">
      <h1>About Sound Living</h1>
      <div class="post-content">
        <p>Sound Living publishes clear, carefully reviewed articles on personal finance and health, written for readers who want dependable information without the jargon or the sales pitch.</p>
        <p>Every article is written in plain language and reviewed before publishing. Where we recommend a product or service, we say so clearly.</p>
      </div>
    </div>`;
}

// ============================================================
// NEWSLETTER FORM
// ============================================================
document.getElementById("newsletterForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("newsletterEmail").value.trim().toLowerCase();
  const msg = document.getElementById("newsletterMsg");
  try {
    await db.collection("subscribers").doc(email).set({
      email,
      subscribedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    msg.innerHTML = `<div class="form-msg success">You're subscribed. Thank you!</div>`;
    document.getElementById("newsletterForm").reset();
    gtag("event", "newsletter_signup");
  } catch (err) {
    if (err.code === "permission-denied") {
      msg.innerHTML = `<div class="form-msg success">You're already on the list — thank you!</div>`;
      document.getElementById("newsletterForm").reset();
    } else {
      msg.innerHTML = `<div class="form-msg error">Something went wrong. Please try again.</div>`;
    }
  }
});

// ============================================================
// CONTACT FORM
// ============================================================
document.getElementById("contactForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("cName").value.trim();
  const email = document.getElementById("cEmail").value.trim();
  const message = document.getElementById("cMessage").value.trim();
  const msg = document.getElementById("contactMsg");
  try {
    await db.collection("contactMessages").add({ name, email, message, read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    msg.innerHTML = `<div class="form-msg success">Message sent — we'll be in touch soon.</div>`;
    document.getElementById("contactForm").reset();
    gtag("event", "contact_form_submit");
  } catch (err) {
    msg.innerHTML = `<div class="form-msg error">Something went wrong. Please try again.</div>`;
  }
});

// ============================================================
// UTILITY
// ============================================================
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
