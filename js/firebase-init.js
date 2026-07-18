// ============================================================
// FIREBASE CONFIGURATION
// ============================================================
// Replace the values below with YOUR Firebase project's config.
// Get this from: Firebase Console → Project Settings → General
// → "Your apps" → Web app → SDK setup and configuration → Config
//
// This is safe to make public. It is NOT a secret key — it just
// tells the browser which Firebase project to talk to. Your real
// security comes from firestore.rules (included in this project).
// ============================================================
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

// Google Analytics Measurement ID (from analytics.google.com)
// Example: "G-XXXXXXXXXX"  — leave blank to disable.
const GA_MEASUREMENT_ID = "";

// ---- Do not edit below this line ----
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

if (GA_MEASUREMENT_ID) {
  const gaScript = document.createElement("script");
  gaScript.async = true;
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(gaScript);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
  window.gtag = gtag;
} else {
  window.gtag = function () {};
}
