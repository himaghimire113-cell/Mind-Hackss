const firebaseConfig = {
  apiKey: "AIzaSyBVD4VIxCJAXoMbhSmsFi1VeA38RP9aErM",
  authDomain: "mind-hackss.firebaseapp.com",
  projectId: "mind-hackss",
  storageBucket: "mind-hackss.firebasestorage.app",
  messagingSenderId: "522496244281",
  appId: "1:522496244281:web:469eaa354279db14d5ebe8"
};

const GA_MEASUREMENT_ID = "G-D83LP4Y3P0";

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
