/* ============================================================
   projects.js  —  Logic specific to projects.html
   Connects to: GET /api/projects  (our_projects.py backend)

   Flow:
     1. Fetch projects from Firebase via Flask backend
     2. Render dynamic cards with images from Firebase Storage
     3. Fall back to static sample cards if API unavailable
     4. Category filter works for both dynamic + static cards
   ============================================================ */

const CARD_COLORS   = ['c1','c2','c3','c4','c5','c6'];
const CARD_ICONS    = ['🏗️','📐','⛏️','🚁','📋','🛰️'];

// Map Firebase category strings to filter keys
const CAT_MAP = {
  'construction':       'construction',
  'land survey':        'survey',
  'land surveying':     'survey',
  'survey':             'survey',
  'core drilling':      'drilling',
  'drilling':           'drilling',
  'drone mapping':      'drone',
  'drone':              'drone',
  'uav':                'drone',
  'design':             'design',
  'design & estimation':'design',
  'estimation':         'design',
};

function normCat(raw) {
  return CAT_MAP[(raw || '').toLowerCase().trim()] || 'construction';
}

// ── Build a project card element ──────────────────────────────
function buildCard(project, index) {
  const card     = document.createElement('div');
  const catKey   = normCat(project.category);
  card.className = 'proj-card';
  card.dataset.cat = catKey;

  const colorClass = CARD_COLORS[index % CARD_COLORS.length];
  const icon       = CARD_ICONS[index % CARD_ICONS.length];

  const imgContent = project.image_url
    ? `<img src="${project.image_url}" alt="${project.title}" loading="lazy"/>`
    : icon;

  const descText = project.description
    ? (project.description.length > 110
        ? project.description.substring(0, 110) + '…'
        : project.description)
    : '';

  card.innerHTML = `
    <div class="proj-img ${colorClass}">${imgContent}</div>
    <div class="proj-body">
      <div class="proj-cat">${project.category || 'Project'}</div>
      <h3>${project.title}</h3>
      <p>${descText}</p>
      <div class="proj-meta">
        <span>📅 ${project.year || new Date().getFullYear()}</span>
        ${project.client_name ? `<span>👤 ${project.client_name}</span>` : ''}
        ${project.tags && project.tags.length ? `<span>🏷 ${project.tags[0]}</span>` : ''}
      </div>
    </div>`;

  // stagger animation
  card.style.animationDelay = `${index * 0.07}s`;
  return card;
}

// ── Fetch projects from Flask → Firebase ──────────────────────
async function loadProjects() {
  const grid      = document.getElementById('projGrid');
  const statusTxt = document.getElementById('statusText');
  const countBadge= document.getElementById('projCount');

  try {
    const data = await apiGet('/projects');   // defined in main.js

    if (data.success && data.projects && data.projects.length > 0) {
      grid.innerHTML = '';

      data.projects.forEach((p, i) => {
        grid.appendChild(buildCard(p, i));
      });

      statusTxt.textContent = 'Projects loaded from database';
      countBadge.textContent = `${data.projects.length} Projects`;
      document.getElementById('uploadCta').style.display = 'block';

    } else {
      // API responded but no projects — show static
      showStatic('No projects found in database. Showing samples.');
    }

  } catch (err) {
    console.warn('[projects.js] Backend unreachable:', err.message);
    showStatic('Backend offline — showing sample projects.');
  }
}

function showStatic(msg) {
  document.getElementById('projGrid').style.display    = 'none';
  document.getElementById('staticGrid').style.display  = 'grid';
  document.getElementById('statusText').textContent    = msg;
  document.getElementById('projCount').textContent     = '6 Samples';

  // Animate static cards in
  document.querySelectorAll('#staticGrid .proj-card').forEach((c, i) => {
    c.style.animationDelay = `${i * 0.07}s`;
    c.style.animation = 'fadeUp 0.5s ease forwards';
    c.style.opacity = '0';
  });
}

// ── Init on mnp:ready (fired after Firebase config is fetched) ──
window.addEventListener('mnp:ready', ({ detail }) => {
  // detail.config   = Firebase config object (or null if offline)
  // detail.sdkOk    = true if Firebase SDK initialised
  // detail.apiBase  = API_BASE string

  if (detail.config) {
    console.info('[projects.js] Firebase connected — loading live projects.');
  } else {
    console.warn('[projects.js] Firebase offline — will show static fallback.');
  }

  // Load from Flask API → Firebase on page load
  loadProjects();

  // Filter buttons
  document.getElementById('filterRow').addEventListener('click', (e) => {
    const btn = e.target.closest('.filt-btn');
    if (!btn) return;

    document.querySelectorAll('.filt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.f;

    // Filter both dynamic and static grids
    document.querySelectorAll('#projGrid .proj-card, #staticGrid .proj-card').forEach(card => {
      const show = filter === 'all' || card.dataset.cat === filter;
      card.classList.toggle('hidden', !show);
    });

    // Update count badge
    const visible = document.querySelectorAll(
      '#projGrid .proj-card:not(.hidden), #staticGrid .proj-card:not(.hidden)'
    ).length;
    document.getElementById('projCount').textContent = `${visible} Shown`;
  });
});
