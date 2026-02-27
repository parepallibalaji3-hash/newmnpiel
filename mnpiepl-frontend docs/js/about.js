/* ============================================================
   about.js  —  Logic specific to about.html
   Handles: scroll-to anchor from hash, scroll reveal
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Scroll to service section if hash is present ─────────────
  // e.g. about.html#drone will smooth-scroll to the drone card
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }

  // ── Scroll Reveal for service cards ─────────────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.svc-detail-card, .team-card, .value-card').forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.5s ${i * 0.08}s ease, transform 0.5s ${i * 0.08}s ease`;
    observer.observe(el);
  });

});
