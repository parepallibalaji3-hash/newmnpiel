/* ============================================================
   contact.js  —  Logic specific to contact.html
   Connects to: POST /api/contact  (contact_form.py backend)

   Flow:
     1. Validate all 5 required fields (name/phone/email/subject/message)
     2. POST JSON to Flask /api/contact
     3. Backend saves to Firebase + sends two emails via SMTP
     4. Show success state
     5. Fall back to demo-success if backend is unreachable
   ============================================================ */

console.log("contact.js loaded");

// ── Helpers ──────────────────────────────────────────────────────
function getField(id) {
  return document.getElementById(id).value.trim();
}

function showError(msg) {
  const el = document.getElementById('formErr');
  el.textContent = '⚠ ' + msg;
  el.classList.add('show');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearError() {
  const el = document.getElementById('formErr');
  el.textContent = '';
  el.classList.remove('show');
}

function setLoading(loading) {
  const btn  = document.getElementById('submitBtn');
  const txt  = document.getElementById('btnTxt');
  const load = document.getElementById('btnLoad');
  btn.disabled  = loading;
  txt.style.display  = loading ? 'none'  : 'inline';
  load.style.display = loading ? 'inline': 'none';
}

// ── Validation ───────────────────────────────────────────────────
function validateForm(data) {
  if (!data.name)    return 'Full name is required.';
  
  // ── Phone validation (exactly 10 digits) ──
  if (!data.phone)   return 'Phone number is required.';
  
  // Remove all non-digit characters (spaces, dashes, parentheses, etc.)
  const cleanPhone = data.phone.replace(/\D/g, '');
  
  // Check if it has exactly 10 digits
  if (cleanPhone.length !== 10) {
    return 'Phone number must be exactly 10 digits.';
  }
  
  // ── Email validation ──
  if (!data.email)   return 'Email address is required.';
  if (!data.email.includes('@') || !data.email.split('@')[1]?.includes('.'))
                     return 'Please enter a valid email address.';
  
  if (!data.subject) return 'Please select a service / subject.';
  if (!data.message) return 'Message cannot be empty.';
  if (data.message.length < 10)
                     return 'Please write a more detailed message (at least 10 characters).';
  return null; // valid
}

// ── Submit ────────────────────────────────────────────────────────
async function submitContactForm() {
  console.log("Submitting form...");
  clearError();

  const data = {
    name:    getField('fn'),
    phone:   getField('fp'),
    email:   getField('fe'),
    subject: document.getElementById('fs').value,
    message: getField('fm'),
  };

  // Client-side validation
  const err = validateForm(data);
  if (err) { showError(err); return; }

  setLoading(true);

  try {
    // ── POST to Flask backend → Firebase + SMTP ─────────────────
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    console.log("SERVER RESPONSE:", result);

    if (result.success) {
      showSuccess();
      if (typeof showToast === 'function') {
        showToast('Message sent! We\'ll be in touch soon.', 'success');
      } else {
        alert("✅ Message sent successfully");
      }
    } else {
      showError(result.message || 'Something went wrong. Please try again.');
    }

  } catch (networkErr) {
    // Backend unreachable → demo mode (still show success to user)
    console.warn('[contact.js] Backend unreachable. Running in demo mode.', networkErr.message);
    console.error("FETCH ERROR:", networkErr);
    showSuccess();
    if (typeof showToast === 'function') {
      showToast('Demo mode — backend not connected.', 'error');
    } else {
      alert("❌ Cannot reach backend - running in demo mode");
    }
  }

  setLoading(false);
}

// ── Success State ─────────────────────────────────────────────────
function showSuccess() {
  document.getElementById('formArea').style.display = 'none';
  document.getElementById('formOk').classList.add('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Reset Form ────────────────────────────────────────────────────
function resetContactForm() {
  ['fn', 'fp', 'fe', 'fm'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fs').value = '';
  clearError();
  setLoading(false);
  document.getElementById('formArea').style.display = 'block';
  document.getElementById('formOk').classList.remove('show');
}

// ── Init on mnp:ready (Firebase config fetched from .env via backend) ──
window.addEventListener('mnp:ready', ({ detail }) => {
  if (!detail.config) {
    if (typeof showToast === 'function') {
      showToast('Backend offline — demo mode active.', 'error');
    }
  } else {
    console.info('[contact.js] Firebase connected · project:', detail.config.projectId);
  }
});

// ── Allow Enter key in inputs to submit form ──────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#formArea input, #formArea select').forEach(el => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitContactForm();
    });
  });
});