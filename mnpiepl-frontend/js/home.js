/* ============================================================
   home.js  —  Logic specific to index.html
   Handles: animated counters
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Animated Counters ────────────────────────────────────────
  function animateCounter(el, target, suffix = '') {
    let current = 0;
    const step  = Math.ceil(target / 60);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = current + suffix;
    }, 25);
  }

  // Use IntersectionObserver to trigger when stats come into view
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const statNums = entry.target.querySelectorAll('.stat-n[data-target]');
        statNums.forEach(el => {
          const target = parseInt(el.dataset.target);
          // last stat gets a % suffix
          const suffix = el.closest('.stat').querySelector('.stat-l').textContent.includes('%') ? '+' : '+';
          animateCounter(el, target, '+');
        });
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  const statsRow = document.querySelector('.hero-stats');
  if (statsRow) statsObserver.observe(statsRow);

});
