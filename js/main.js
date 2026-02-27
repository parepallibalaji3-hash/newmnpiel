/* ============================================================
   main.js  —  Shared across ALL pages
   Handles: Firebase config fetch from backend, Firebase init,
            navbar, footer, mobile menu, API helpers, toast

   ┌──────────────────────────────────────────────────────────┐
   │  HOW FIREBASE CONFIG FLOWS — NO HARDCODED CREDENTIALS   │
   │                                                          │
   │  .env  ──►  firebase_config.py  ──►  app.py             │
   │              (reads FIREBASE_* vars)   GET /api/firebase-config
   │                                          │               │
   │                                     main.js (you are here)
   │                                       fetchFirebaseConfig()
   │                                          │               │
   │                                     initFirebaseSDK(config)
   │                                     Firebase JS SDK ready│
   │                                                          │
   │  ✅ Zero credentials hardcoded in any frontend file      │
   └──────────────────────────────────────────────────────────┘
   ============================================================ */

'use strict';

// ── Backend API Base URL ────────────────────────────────────────
// ✏️  Change this ONE line when you deploy your Flask server
const API_BASE = 'http://localhost:5000/api';

// ── Firebase state ──────────────────────────────────────────────
let _firebaseConfig = null;
let _firebaseApp    = null;
let _db             = null;   // Firestore (available as window.mnpDb)
let _storage        = null;   // Storage   (available as window.mnpStorage)

// ── Active page (derived from filename) ────────────────────────
const _page = (() => {
  const p = window.location.pathname.split('/').pop().replace('.html', '');
  return (!p || p === 'index') ? 'home' : p;
})();

/* =================================================================
   FIREBASE CONFIG  ──  fetch from Flask backend
   The backend reads FIREBASE_* from .env and returns them as JSON.
   This means the frontend NEVER contains any credentials.
   ================================================================= */
async function fetchFirebaseConfig() {
  try {
    const res  = await fetch(`${API_BASE}/firebase-config`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    if (data.success && data.config && data.config.projectId) {
      _firebaseConfig = data.config;
      console.info(
        `%c[MNPIEPL] Firebase config fetched ✓  project: ${data.config.projectId}`,
        'color:#cc1a1a;font-weight:bold;'
      );
      return data.config;
    }

    console.warn('[MNPIEPL] Backend returned invalid Firebase config:', data.message);
    return null;

  } catch (err) {
    console.warn('[MNPIEPL] Could not fetch Firebase config from backend:', err.message);
    return null;
  }
}

/* =================================================================
   FIREBASE SDK INIT  ──  uses fetched config
   Requires the Firebase compat CDN scripts in the HTML <head>.
   After init, exposes:
     window.mnpDb       → Firestore client
     window.mnpStorage  → Storage client
   ================================================================= */
function initFirebaseSDK(config) {
  if (!config) return false;
  if (typeof firebase === 'undefined') {
    console.warn('[MNPIEPL] Firebase JS SDK scripts not loaded on this page.');
    return false;
  }
  if (_firebaseApp) return true; // already initialised

  try {
    _firebaseApp = firebase.apps.length
      ? firebase.app()                   // reuse existing app
      : firebase.initializeApp(config);  // first init

    _db      = firebase.firestore ? firebase.firestore()   : null;
    _storage = firebase.storage   ? firebase.storage()     : null;

    window.mnpDb      = _db;
    window.mnpStorage = _storage;

    console.info('%c[MNPIEPL] Firebase SDK initialised ✓', 'color:#22c55e;font-weight:bold;');
    return true;
  } catch (err) {
    console.error('[MNPIEPL] Firebase SDK init failed:', err.message);
    return false;
  }
}

/* =================================================================
   FIREBASE STATUS INDICATOR
   Shows the connected project ID in the footer.
   A small badge can be made visible in dev mode (see CSS comment).
   ================================================================= */
function renderFirebaseStatus(config, sdkOk) {
  // Footer note — subtle, small text
  const footNote = document.getElementById('footProjectId');
  if (footNote && config) {
    footNote.textContent = `Firebase · ${config.projectId}`;
  }

  // Dev badge in top-right — set display:block in DevTools to see
  const badge = document.getElementById('fbStatusBadge');
  if (badge && config) {
    badge.style.borderLeftColor = sdkOk ? '#22c55e' : '#f59e0b';
    badge.textContent = sdkOk
      ? `✓ Firebase: ${config.projectId}`
      : `Firebase config loaded (SDK not initialised on this page)`;
  }

  if (!config) {
    if (badge) {
      badge.style.borderLeftColor = '#cc1a1a';
      badge.textContent = '⚠ Firebase: backend not reachable — check .env';
    }
    if (footNote) footNote.textContent = 'Firebase: offline';
  }
}

/* =================================================================
   NAVBAR INJECTION
   ================================================================= */
function injectNavbar() {
  const links = [
    { id: 'home',     href: 'index.html',    label: 'Home' },
    { id: 'about',    href: 'about.html',    label: 'About Us' },
    { id: 'projects', href: 'projects.html', label: 'Our Projects' },
    { id: 'contact',  href: 'contact.html',  label: 'Contact Us', cta: true },
  ];

  const html = `
  <nav id="mainNav">
    <a class="nav-logo" href="index.html">
      <img src="assets/logo.jpg" alt="MNPIEPL"/>
      <div class="nav-brand">
        <span class="nav-abbr">MNPIEPL</span>
        <span class="nav-full">Mulleti's &amp; Pusuluri's Infracon &amp; Engineers (P) Ltd</span>
      </div>
    </a>

    <ul class="nav-links">
      ${links.map(l => `
        <li>
          <a href="${l.href}" class="${l.cta ? 'nav-cta' : ''}${_page === l.id ? ' active' : ''}">
            ${l.label}
          </a>
        </li>`).join('')}
    </ul>

    <div class="hamburger" id="hamburger">
      <span></span><span></span><span></span>
    </div>
  </nav>

  <!-- Firebase dev badge — hidden by default, set display:block to inspect -->
  <div id="fbStatusBadge" style="
    display:none; position:fixed; top:78px; right:14px; z-index:8000;
    font-family:'Barlow Condensed',sans-serif; font-size:0.68rem; letter-spacing:2px;
    text-transform:uppercase; color:#888; background:rgba(13,13,13,0.92);
    border:1px solid rgba(204,26,26,0.25); border-left:3px solid #cc1a1a;
    padding:6px 14px; white-space:nowrap;
  "></div>

  <div class="mob-menu" id="mobMenu">
    ${links.map(l => `
      <a href="${l.href}" class="${_page === l.id ? 'active' : ''}">${l.label}</a>
    `).join('')}
  </div>`;

  document.body.insertAdjacentHTML('afterbegin', html);

  // Mobile toggle
  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('mobMenu').classList.toggle('open');
  });

  // Scroll shadow
  window.addEventListener('scroll', () => {
    document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* =================================================================
   FOOTER INJECTION
   ================================================================= */
function injectFooter() {
  const html = `
  <footer>
    <div class="foot-top">
      <div class="foot-brand">
        <div class="foot-brand-logo">
          <img src="assets/logo.jpg" alt="MNPIEPL"/>
          <span>MNPIEPL</span>
        </div>
        <p>Mulleti's and Pusuluri's Infracon and Engineers (P) Ltd —
           delivering precision construction, survey, and mapping services
           across Telangana and Andhra Pradesh.</p>
        <div class="socials">
          <div class="soc" title="LinkedIn">in</div>
          <div class="soc" title="Twitter">𝕏</div>
          <div class="soc" title="Facebook">f</div>
          <div class="soc" title="YouTube">▶</div>
        </div>
      </div>

      <div class="foot-col">
        <h4>Quick Links</h4>
        <ul class="foot-links">
          <li><a href="index.html">Home</a></li>
          <li><a href="about.html">About Us</a></li>
          <li><a href="projects.html">Our Projects</a></li>
          <li><a href="contact.html">Contact Us</a></li>
        </ul>
      </div>

      <div class="foot-col">
        <h4>Services</h4>
        <ul class="foot-links">
          <li><a>Construction</a></li>
          <li><a>Land Surveying</a></li>
          <li><a>Core Drilling</a></li>
          <li><a>Drone Mapping</a></li>
          <li><a>Design &amp; Estimation</a></li>
        </ul>
      </div>
    </div>

    <div class="foot-bottom">
      <div>© ${new Date().getFullYear()} <span>MNPIEPL</span>. All rights reserved.</div>
      <!-- Firebase project ID injected here after config fetch -->
      <div id="footProjectId" style="font-size:0.68rem;opacity:0.4;font-family:'Barlow Condensed',sans-serif;letter-spacing:1px;"></div>
    </div>
  </footer>

  <div id="toast"></div>`;

  document.body.insertAdjacentHTML('beforeend', html);
}

/* =================================================================
   TOAST  ──  showToast(message, 'success'|'error'|'info', ms)
   ================================================================= */
function showToast(msg, type = 'success', duration = 3500) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className   = `show ${type}`;
  clearTimeout(t._tid);
  t._tid = setTimeout(() => { t.className = ''; }, duration);
}

/* =================================================================
   API HELPERS  ──  all data flows through Flask, never direct to Firebase
   ================================================================= */
async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`GET ${endpoint} → HTTP ${res.status}`);
  return res.json();
}

async function apiPost(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `POST ${endpoint} → HTTP ${res.status}`);
  }
  return res.json();
}

/* =================================================================
   MAIN INIT  ──  runs on every page
   ================================================================= */
document.addEventListener('DOMContentLoaded', async () => {

  // 1. Render layout shell
  injectNavbar();
  injectFooter();

  // 2. Fetch Firebase config from backend (GET /api/firebase-config)
  //    This reads FIREBASE_* keys from .env on the server
  const config = await fetchFirebaseConfig();

  // 3. Initialise Firebase JS SDK (requires CDN scripts in HTML)
  const sdkOk = initFirebaseSDK(config);

  // 4. Show project ID in footer / dev badge
  renderFirebaseStatus(config, sdkOk);

  // 5. Signal page scripts that everything is ready
  window.dispatchEvent(new CustomEvent('mnp:ready', {
    detail: {
      config,
      sdkOk,
      apiBase: API_BASE,
    },
  }));
});
