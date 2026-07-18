const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
let currentAdminEmail = null;

// ============================================================
// STARTUP SAFETY CHECK — shows a visible message instead of a
// silently broken page if Firebase failed to load/initialize
// ============================================================
try {
  if (typeof firebase === "undefined") throw new Error("Firebase SDK scripts did not load (check your internet connection or CDN access).");
  if (typeof auth === "undefined" || typeof db === "undefined") throw new Error("firebase-init.js did not run correctly — auth/db were never created.");

  // ============================================================
  // AUTH GATE
  // ============================================================
  auth.onAuthStateChanged(async (user) => {
    try {
      if (!user) { showLogin(); return; }

      // Secondary check: must also be listed in authorizedAdmins
      const adminDoc = await db.collection("authorizedAdmins").doc(user.email).get();
      if (!adminDoc.exists) {
        document.getElementById("loginMsg").innerHTML =
          `<div class="form-msg error">This account is not authorized for admin access. Ask an existing admin to grant you access.</div>`;
        await auth.signOut();
        return;
      }

      currentAdminEmail = user.email;
      document.getElementById("whoami").textContent = user.email;
      showDashboard();
      loadPosts();
      loadAppearance();
    } catch (err) {
      document.getElementById("loginMsg").innerHTML =
        `<div class="form-msg error">Startup error: ${err.message}</div>`;
    }
  });
} catch (err) {
  document.getElementById("loginMsg").innerHTML =
    `<div class="form-msg error">Startup error: ${err.message}</div>`;
  console.error(err);
}

function showLogin() {
  loginView.classList.remove("hidden");
  dashboardView.classList.add("hidden");
}
function showDashboard() {
  loginView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
}

document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const msg = document.getElementById("loginMsg");
  msg.innerHTML = "";
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    msg.innerHTML = `<div class="form-msg error">${friendlyAuthError(err)}</div>`;
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => auth.signOut());

function friendlyAuthError(err) {
  if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") return "Incorrect email or password.";
  if (err.code === "auth/user-not-found") return "No account found with that email.";
  if (err.code === "auth/too-many-requests") return "Too many attempts. Please wait and try again.";
  return "Sign-in failed: " + err.message;
}

// ============================================================
// TABS
// ============================================================
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.remove("hidden");
    if (btn.dataset.tab === "subscribers") loadSubscribers();
    if (btn.dataset.tab === "messages") loadMessages();
    if (btn.dataset.tab === "admins") loadAdmins();
  });
});

// ============================================================
// POSTS: LIST
// ============================================================
async function loadPosts() {
  const tbody = document.getElementById("postsTableBody");
  const snap = await db.collection("posts").get();
  const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  if (!posts.length) { tbody.innerHTML = `<tr><td colspan="5">No posts yet. Click "New Post" to create your first one.</td></tr>`; return; }
  tbody.innerHTML = posts.map(p => `
    <tr>
      <td>${escapeHTML(p.title || "Untitled")}${p.featured ? " ⭐" : ""}</td>
      <td style="text-transform:capitalize;">${p.category || ""}</td>
      <td><span class="status-pill ${p.status}">${p.status}</span></td>
      <td>${p.likes || 0}</td>
      <td>
        <div class="row-actions">
          <button class="btn-sm" onclick="editPost('${p.id}')">Edit</button>
          <a class="btn-sm" href="index.html#/post/${p.id}" target="_blank" style="text-decoration:none;display:inline-block;">View</a>
          <button class="btn-sm danger" onclick="deletePost('${p.id}')">Delete</button>
        </div>
      </td>
    </tr>`).join("");
}

// ============================================================
// POSTS: EDITOR MODAL
// ============================================================
const editorModal = document.getElementById("editorModal");
let editingPostId = null;
let imageUrlRows = [];
let affiliateRows = [];

document.getElementById("newPostBtn").addEventListener("click", () => openEditor(null));
document.getElementById("cancelEditorBtn").addEventListener("click", () => editorModal.classList.add("hidden"));

async function openEditor(id) {
  editingPostId = id;
  document.getElementById("editorMsg").innerHTML = "";
  imageUrlRows = [];
  affiliateRows = [];

  if (id) {
    document.getElementById("editorTitle").textContent = "Edit Post";
    const doc = await db.collection("posts").doc(id).get();
    const p = doc.data();
        document.getElementById("pTitle").value = p.title || "";
    document.getElementById("pAuthorName").value = p.authorName || "";
    document.getElementById("pCategory").value = p.category || "";
    document.getElementById("pStatus").value = p.status || "draft";

    document.getElementById("pSummary").value = p.summary || "";
    document.getElementById("pContent").value = p.content || "";
    document.getElementById("pCoverImage").value = p.coverImageUrl || "";
    document.getElementById("pVideoUrl").value = p.videoEmbedUrl || "";
    document.getElementById("pFeatured").checked = !!p.featured;
    imageUrlRows = [...(p.imageEmbedUrls || [])];
    affiliateRows = [...(p.affiliateLinks || [])];
  } else {
    document.getElementById("editorTitle").textContent = "New Post";
    ["pTitle","pSummary","pContent","pCoverImage","pVideoUrl"].forEach(id2 => document.getElementById(id2).value = "");
        ["pTitle","pAuthorName","pSummary","pContent","pCoverImage","pVideoUrl"].forEach(id2 => document.getElementById(id2).value = "");
    document.getElementById("pCategory").value = "";
    document.getElementById("pStatus").value = "draft";

  }
  renderImageUrlRows();
  renderAffiliateRows();
  editorModal.classList.remove("hidden");
}
window.editPost = (id) => openEditor(id);

function renderImageUrlRows() {
  const wrap = document.getElementById("imageUrlsList");
  wrap.innerHTML = imageUrlRows.map((url, i) => `
    <div class="repeatable-row">
      <input type="url" value="${escapeAttr(url)}" data-idx="${i}" class="img-url-input" placeholder="https://...">
      <button type="button" class="btn-sm danger" onclick="removeImageRow(${i})">Remove</button>
    </div>`).join("");
  wrap.querySelectorAll(".img-url-input").forEach(inp => {
    inp.addEventListener("input", () => imageUrlRows[Number(inp.dataset.idx)] = inp.value);
  });
}
document.getElementById("addImageUrlBtn").addEventListener("click", () => { imageUrlRows.push(""); renderImageUrlRows(); });
window.removeImageRow = (i) => { imageUrlRows.splice(i, 1); renderImageUrlRows(); };

function renderAffiliateRows() {
  const wrap = document.getElementById("affiliateList");
  wrap.innerHTML = affiliateRows.map((row, i) => `
    <div class="repeatable-row">
      <input type="text" value="${escapeAttr(row.label)}" data-idx="${i}" data-field="label" class="aff-input" placeholder="Button label, e.g. Compare Rates">
      <input type="url" value="${escapeAttr(row.url)}" data-idx="${i}" data-field="url" class="aff-input" placeholder="https://...">
      <button type="button" class="btn-sm danger" onclick="removeAffiliateRow(${i})">Remove</button>
    </div>`).join("");
  wrap.querySelectorAll(".aff-input").forEach(inp => {
    inp.addEventListener("input", () => affiliateRows[Number(inp.dataset.idx)][inp.dataset.field] = inp.value);
  });
}
document.getElementById("addAffiliateBtn").addEventListener("click", () => { affiliateRows.push({ label: "", url: "" }); renderAffiliateRows(); });
window.removeAffiliateRow = (i) => { affiliateRows.splice(i, 1); renderAffiliateRows(); };

document.getElementById("savePostBtn").addEventListener("click", async () => {
  const msg = document.getElementById("editorMsg");
  const title = document.getElementById("pTitle").value.trim();
  if (!title) { msg.innerHTML = `<div class="form-msg error">Please add a title.</div>`; return; }

  const data = {
    title,
    category: document.getElementById("pCategory").value,
    status: document.getElementById("pStatus").value,
    summary: document.getElementById("pSummary").value.trim(),
    content: document.getElementById("pContent").value,
    coverImageUrl: document.getElementById("pCoverImage").value.trim(),
    videoEmbedUrl: document.getElementById("pVideoUrl").value.trim(),
    imageEmbedUrls: imageUrlRows.filter(u => u.trim()),
    affiliateLinks: affiliateRows.filter(r => r.label.trim() && r.url.trim()),
    featured: document.getElementById("pFeatured").checked,
    author: currentAdminEmail,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    if (editingPostId) {
      await db.collection("posts").doc(editingPostId).update(data);
    } else {
      data.likes = 0;
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection("posts").add(data);
    }
    editorModal.classList.add("hidden");
    loadPosts();
  } catch (err) {
    msg.innerHTML = `<div class="form-msg error">Could not save: ${err.message}</div>`;
  }
});

window.deletePost = async (id) => {
  if (!confirm("Delete this post permanently? This cannot be undone.")) return;
  await db.collection("posts").doc(id).delete();
  loadPosts();
};

// ============================================================
// APPEARANCE
// ============================================================
async function loadAppearance() {
  const doc = await db.collection("siteSettings").doc("config").get();
  const s = doc.exists ? doc.data() : {};
  document.getElementById("siteName").value = s.siteName || "Sound Living";
  document.getElementById("siteTagline").value = s.siteTagline || "Finance & Health, Explained Plainly";
  document.getElementById("primaryColor").value = s.primaryColor || "#14324d";
  document.getElementById("accentColor").value = s.accentColor || "#2e7d5b";
  document.getElementById("fontSizeSelect").value = s.fontSize || "19px";
  document.getElementById("fontFamilySelect").value = s.fontFamily || "serif";
  updateColorHexLabels();
}
document.getElementById("primaryColor").addEventListener("input", updateColorHexLabels);
document.getElementById("accentColor").addEventListener("input", updateColorHexLabels);
function updateColorHexLabels() {
  document.getElementById("primaryColorHex").textContent = document.getElementById("primaryColor").value;
  document.getElementById("accentColorHex").textContent = document.getElementById("accentColor").value;
}

document.getElementById("saveAppearanceBtn").addEventListener("click", async () => {
  const msg = document.getElementById("appearanceMsg");
  const settings = {
    siteName: document.getElementById("siteName").value.trim(),
    siteTagline: document.getElementById("siteTagline").value.trim(),
    primaryColor: document.getElementById("primaryColor").value,
    accentColor: document.getElementById("accentColor").value,
    fontSize: document.getElementById("fontSizeSelect").value,
    fontFamily: document.getElementById("fontFamilySelect").value
  };
  try {
    await db.collection("siteSettings").doc("config").set(settings, { merge: true });
    msg.innerHTML = `<div class="form-msg success">Appearance saved. Changes will appear on the live site immediately.</div>`;
  } catch (err) {
    msg.innerHTML = `<div class="form-msg error">Could not save: ${err.message}</div>`;
  }
});

// ============================================================
// CHANGE PASSWORD
// ============================================================
document.getElementById("changePwBtn").addEventListener("click", async () => {
  const current = document.getElementById("currentPw").value;
  const next = document.getElementById("newPw").value;
  const msg = document.getElementById("pwMsg");
  if (!next || next.length < 8) { msg.innerHTML = `<div class="form-msg error">New password must be at least 8 characters.</div>`; return; }
  try {
    const user = auth.currentUser;
    const cred = firebase.auth.EmailAuthProvider.credential(user.email, current);
    await user.reauthenticateWithCredential(cred);
    await user.updatePassword(next);
    msg.innerHTML = `<div class="form-msg success">Password updated successfully.</div>`;
    document.getElementById("currentPw").value = "";
    document.getElementById("newPw").value = "";
  } catch (err) {
    msg.innerHTML = `<div class="form-msg error">${friendlyAuthError(err)}</div>`;
  }
});

// ============================================================
// SUBSCRIBERS
// ============================================================
let subscribersCache = [];
async function loadSubscribers() {
  const tbody = document.getElementById("subscribersTableBody");
  const snap = await db.collection("subscribers").orderBy("subscribedAt", "desc").get();
  subscribersCache = snap.docs.map(d => d.data());
  if (!subscribersCache.length) { tbody.innerHTML = `<tr><td colspan="2">No subscribers yet.</td></tr>`; return; }
  tbody.innerHTML = subscribersCache.map(s => `
    <tr><td>${escapeHTML(s.email)}</td><td>${s.subscribedAt ? new Date(s.subscribedAt.seconds * 1000).toLocaleDateString() : ""}</td></tr>
  `).join("");
}

document.getElementById("exportCsvBtn").addEventListener("click", () => {
  if (!subscribersCache.length) { alert("No subscribers to export yet."); return; }
  let csv = "Email,Subscribed Date\n";
  subscribersCache.forEach(s => {
    const date = s.subscribedAt ? new Date(s.subscribedAt.seconds * 1000).toLocaleDateString() : "";
    csv += `"${s.email}","${date}"\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "newsletter-subscribers.csv";
  link.click();
});

// ============================================================
// MESSAGES
// ============================================================
async function loadMessages() {
  const wrap = document.getElementById("messagesList");
  const snap = await db.collection("contactMessages").orderBy("createdAt", "desc").get();
  if (snap.empty) { wrap.innerHTML = "<p>No messages yet.</p>"; return; }
  wrap.innerHTML = snap.docs.map(d => {
    const m = d.data();
    const date = m.createdAt ? new Date(m.createdAt.seconds * 1000).toLocaleString() : "";
    return `
      <div class="panel" style="margin-bottom:12px;padding:16px;${m.read ? "opacity:0.6;" : ""}">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <strong>${escapeHTML(m.name)} &lt;${escapeHTML(m.email)}&gt;</strong>
          <span style="color:var(--color-text-muted);font-size:0.85rem;">${date}</span>
        </div>
        <p style="margin:10px 0;">${escapeHTML(m.message)}</p>
        <div class="row-actions">
          ${!m.read ? `<button class="btn-sm" onclick="markRead('${d.id}')">Mark as Read</button>` : ""}
          <button class="btn-sm danger" onclick="deleteMessage('${d.id}')">Delete</button>
        </div>
      </div>`;
  }).join("");
}
window.markRead = async (id) => { await db.collection("contactMessages").doc(id).update({ read: true }); loadMessages(); };
window.deleteMessage = async (id) => { if (confirm("Delete this message?")) { await db.collection("contactMessages").doc(id).delete(); loadMessages(); } };

// ============================================================
// ADMIN ACCESS
// ============================================================
document.getElementById("inviteBtn").addEventListener("click", async () => {
  const email = document.getElementById("inviteEmail").value.trim();
  const msg = document.getElementById("inviteMsg");
  if (!email) { msg.innerHTML = `<div class="form-msg error">Enter an email address.</div>`; return; }
  try {
    await db.collection("authorizedAdmins").doc(email).set({
      invitedBy: currentAdminEmail,
      addedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    msg.innerHTML = `<div class="form-msg success">${escapeHTML(email)} now has admin access (once their Firebase Auth account is created).</div>`;
    document.getElementById("inviteEmail").value = "";
    loadAdmins();
  } catch (err) {
    msg.innerHTML = `<div class="form-msg error">Could not grant access: ${err.message}</div>`;
  }
});

async function loadAdmins() {
  const tbody = document.getElementById("adminsTableBody");
  const snap = await db.collection("authorizedAdmins").get();
  if (snap.empty) { tbody.innerHTML = `<tr><td colspan="3">No admins listed.</td></tr>`; return; }
  tbody.innerHTML = snap.docs.map(d => {
    const a = d.data();
    const date = a.addedAt ? new Date(a.addedAt.seconds * 1000).toLocaleDateString() : "";
    return `
      <tr>
        <td>${escapeHTML(d.id)}</td>
        <td>${date}</td>
        <td>${d.id === currentAdminEmail ? "<em>You</em>" : `<button class="btn-sm danger" onclick="removeAdmin('${escapeAttr(d.id)}')">Remove Access</button>`}</td>
      </tr>`;
  }).join("");
}
window.removeAdmin = async (email) => {
  if (!confirm(`Remove admin access for ${email}?`)) return;
  await db.collection("authorizedAdmins").doc(email).delete();
  loadAdmins();
};

// ============================================================
// UTIL
// ============================================================
function escapeHTML(str) {
  return String(str || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function escapeAttr(str) { return escapeHTML(str); }

