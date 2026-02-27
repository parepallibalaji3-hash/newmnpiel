/* ============================================================
   contact.js  —  Logic specific to contact.html
   Connects to: Google Apps Script (Email + Firebase)
   ============================================================ */

console.log("contact.js loaded");

// ── Google Apps Script URL ────────────────────────────────────────
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxKj_lW4lZYoiLXh_DLdltNYbXeH2ijGmMMKm_yKZ_Vjpvvvj_1hp3zHIIqt2XToiOfig/exec";

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
  btn.disabled       = loading;
  txt.style.display  = loading ? 'none'   : 'inline';
  load.style.display = loading ? 'inline' : 'none';
}

// ── Validation ───────────────────────────────────────────────────
function validateForm(data) {
  if (!data.name) return 'Full name is required.';

  if (!data.phone) return 'Phone number is required.';
  const cleanPhone = data.phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) return 'Phone number must be exactly 10 digits.';

  if (!data.email) return 'Email address is required.';
  if (!data.email.includes('@') || !data.email.split('@')[1]?.includes('.'))
    return 'Please enter a valid email address.';

  if (!data.subject) return 'Please select a service / subject.';
  if (!data.message) return 'Message cannot be empty.';
  if (data.message.length < 10) return 'Please write a more detailed message (at least 10 characters).';

  return null; // valid
}

// ── Submit ────────────────────────────────────────────────────────
async function submitContactForm() {
  console.log("Submitting form...");
  clearError();

  const data = {
    name:       getField('fn'),
    phone:      getField('fp'),
    email:      getField('fe'),
    subject:    document.getElementById('fs').value,
    message:    getField('fm'),
    ip_address: "unknown"
  };

  // Client-side validation
  const err = validateForm(data);
  if (err) { showError(err); return; }

  setLoading(true);

  try {
    // ── POST to Google Apps Script ────────────────────────────
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(data)
    });

    const result = await res.json();
    console.log("SERVER RESPONSE:", result);

    if (result.success) {
      showSuccess();
      if (typeof showToast === 'function') {
        showToast("Message sent! We'll be in touch soon.", 'success');
      } else {
        alert("✅ Message sent successfully");
      }
    } else {
      showError(result.message || 'Something went wrong. Please try again.');
    }

  } catch (networkErr) {
    console.warn('[contact.js] Backend unreachable.', networkErr.message);
    showError('Cannot reach server. Please try again later.');
    if (typeof showToast === 'function') {
      showToast('Server unreachable. Please try again.', 'error');
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

// ── Allow Enter key in inputs to submit form ──────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#formArea input, #formArea select').forEach(el => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitContactForm();
    });
  });
});
