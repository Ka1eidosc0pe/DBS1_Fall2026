(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Mobile nav
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  function setNav(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', function () { setNav(!nav.classList.contains('open')); });
  document.getElementById('navLinks').addEventListener('click', function (e) {
    if (e.target.closest('a')) setNav(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });

  // Reveals
  var items = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    // stagger siblings within the same parent
    items.forEach(function (el) {
      var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains('reveal'); });
      var i = sibs.indexOf(el);
      if (sibs.length > 1) el.style.setProperty('--d', (i % 4) * 0.08 + 's');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  // Hero scroll-linked scale/fade
  var hero = document.getElementById('heroInner');
  if (hero && !reduce) {
    var ticking = false;
    var update = function () {
      var p = Math.min(Math.max(window.scrollY / (window.innerHeight * 0.7), 0), 1);
      hero.style.opacity = String(1 - p * 0.9);
      hero.style.transform = 'translateY(' + (p * 40) + 'px) scale(' + (1 - p * 0.06) + ')';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }
})();
