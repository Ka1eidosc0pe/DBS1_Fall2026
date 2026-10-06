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


/* ---- Journey: route animation, city clocks, sky cards ---- */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var route = document.getElementById('route');
  var svg = document.getElementById('routeSvg');
  if (!route || !svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var cities = Array.prototype.slice.call(route.querySelectorAll('.city'));
  var replayBtn = document.getElementById('replay');

  /* Sky colours by local hour */
  var STOPS = [
    [0, '#0a0f2c', '#1b2257'], [5, '#1c2559', '#3d3d86'], [6.5, '#54589f', '#f0a39b'],
    [8, '#a9c9f0', '#fde3d0'], [11, '#8cc3f5', '#dcefff'], [15, '#8cc3f5', '#e8f3ff'],
    [17, '#8fb9ea', '#fde6b8'], [18.3, '#f0a257', '#ffd490'], [19.5, '#4d3f8f', '#d9739a'],
    [21, '#1a1f55', '#34306f'], [24, '#0a0f2c', '#1b2257']
  ];
  function rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function mixc(a, b, t) { return a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }); }
  function css(c) { return 'rgb(' + c.join(',') + ')'; }
  function lum(c) {
    var l = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
  }
  function sky(h) {
    var i = 0;
    while (i < STOPS.length - 2 && h >= STOPS[i + 1][0]) i++;
    var a = STOPS[i], b = STOPS[i + 1];
    var t = (h - a[0]) / (b[0] - a[0]); t = t * t * (3 - 2 * t);
    var top = mixc(rgb(a[1]), rgb(b[1]), t), bot = mixc(rgb(a[2]), rgb(b[2]), t);
    return { top: top, bot: bot, dark: (lum(top) * 0.65 + lum(bot) * 0.35) < 0.3 };
  }

  var fmt = {}, fmtH = {};
  cities.forEach(function (li) {
    var tz = li.getAttribute('data-tz');
    if (fmt[tz]) return;
    try {
      fmt[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' });
      fmtH[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
    } catch (e) { fmt[tz] = null; }
  });
  function hourOf(tz, d) {
    var h = 0, m = 0;
    fmtH[tz].formatToParts(d).forEach(function (p) {
      if (p.type === 'hour') h = parseInt(p.value, 10) % 24;
      if (p.type === 'minute') m = parseInt(p.value, 10);
    });
    return h + m / 60;
  }
  function tick() {
    var now = new Date();
    cities.forEach(function (li) {
      var tz = li.getAttribute('data-tz');
      if (!fmt[tz]) return;
      var card = li.querySelector('.ccard'), clock = li.querySelector('.clock');
      var txt = fmt[tz].format(now);
      if (clock.textContent === txt) return;
      clock.textContent = txt;
      var h = hourOf(tz, now), s = sky(h);
      card.style.setProperty('--top', css(s.top));
      card.style.setProperty('--bot', css(s.bot));
      card.classList.toggle('on-dark', s.dark);
      var g = li.querySelector('.glyph'), day = h >= 6 && h < 19, p, f;
      p = day ? (h - 6) / 13 : ((h - 19 + 24) % 24) / 11;
      f = Math.sin(Math.PI * p);  // only drives glyph opacity; position is fixed in CSS
      g.className = 'glyph ' + (day ? 'sun' : 'moon');
      g.style.opacity = String(0.3 + 0.7 * Math.min(1, f * 2.5));
    });
  }
  tick();
  setInterval(tick, 15000);

  /* Geometry */
  var legs = [], total = 0, planeG, planeAngle = null;
  var planePath = 'M13 0C13-1.5 11.5-2 10-2L3-2.2-3-10-6.5-10-4-2.2-9-2-11.5-5.5-13.5-5.5-12.5 0-13.5 5.5-11.5 5.5-9 2-4 2.2-6.5 10-3 10 3 2.2 10 2C11.5 2 13 1.5 13 0Z';
  var plan, flown;

  var note = document.getElementById('legNote');
  function build() {
    var vertical = window.innerWidth < 735;
    if (note) {
      // Mobile: caption sits after the Singapore card, just before Boston. Desktop: floats near the arc apex.
      var host = vertical ? cities[1] : route;
      if (note.parentNode !== host) host.appendChild(note);
      note.classList.toggle('vert', vertical); note.classList.toggle('flt', !vertical);
    }
    var rect = route.getBoundingClientRect();
    var pts = cities.map(function (li) {
      var r = li.querySelector('.node').getBoundingClientRect();
      return { x: r.left + r.width / 2 - rect.left, y: r.top + r.height / 2 - rect.top };
    });
    svg.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var d = '', specs = [], i;
    var dx = pts.length > 1 ? Math.abs(pts[1].x - pts[0].x) : 150;
    for (i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1], apex, dir, k = i === 1;
      if (vertical) { apex = k ? 30 : 16; dir = [i % 2 ? 1 : -1, 0]; }
      else { apex = Math.min(k ? dx * 0.52 : dx * 0.17, k ? 96 : 34); dir = [0, -1]; }
      var c = apex / 0.75;
      var c1 = [a.x + (b.x - a.x) * 0.3 + dir[0] * c, a.y + (b.y - a.y) * 0.3 + dir[1] * c];
      var c2 = [b.x - (b.x - a.x) * 0.3 + dir[0] * c, b.y - (b.y - a.y) * 0.3 + dir[1] * c];
      var seg = 'M' + a.x + ' ' + a.y + 'C' + c1[0] + ' ' + c1[1] + ' ' + c2[0] + ' ' + c2[1] + ' ' + b.x + ' ' + b.y;
      specs.push(seg);
      if (k && note && !vertical) {
        // apex of the cubic at t = .5
        var ax = (a.x + 3 * c1[0] + 3 * c2[0] + b.x) / 8, ay = (a.y + 3 * c1[1] + 3 * c2[1] + b.y) / 8;
        // right of the apex: find where the arc's descending side sits ~12px below the apex, then clear it
        var tx = ax, t;
        for (t = 0.5; t <= 1; t += 0.01) {
          var u = 1 - t, yy = u*u*u*a.y + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*b.y;
          if (yy >= ay + 12) { tx = u*u*u*a.x + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*b.x; break; }
        }
        note.style.width = '210px';
        note.style.left = (tx + 30).toFixed(1) + 'px';
        note.style.top = (ay + 3).toFixed(1) + 'px';
      }
      // One continuous path: separate M subpaths restart the dash pattern,
      // which made every leg turn blue at once instead of only behind the plane.
      d += i ? seg.slice(seg.indexOf('C')) : seg;
    }
    plan = document.createElementNS(NS, 'path'); plan.setAttribute('class', 'r-plan'); plan.setAttribute('d', d);
    flown = document.createElementNS(NS, 'path'); flown.setAttribute('class', 'r-flown'); flown.setAttribute('d', d);
    planeG = document.createElementNS(NS, 'g'); planeG.setAttribute('class', 'plane');
    var pp = document.createElementNS(NS, 'path'); pp.setAttribute('d', planePath);
    planeG.appendChild(pp);
    svg.appendChild(plan); svg.appendChild(flown); svg.appendChild(planeG);
    legs = []; total = 0;
    specs.forEach(function (s) {
      var p = document.createElementNS(NS, 'path'); p.setAttribute('d', s); svg.appendChild(p);
      var len = p.getTotalLength();
      legs.push({ el: p, len: len, start: total });
      total += len;
      svg.removeChild(p);
    });
    flown.style.strokeDasharray = total + ' ' + (total + 2);
    planeAngle = null;
    paint(elapsed);
  }

  /* Timeline (ms) */
  var START = 500, PAUSE = 350, DUR = [1400, 2100, 1300, 1400];
  var legStart = [], legEnd = [], t0 = START;
  DUR.forEach(function (dur, i) { legStart[i] = t0; legEnd[i] = t0 + dur; t0 += dur + PAUSE; });
  var END = legEnd[3];
  var elapsed = 0, done = false, raf = 0, startTime = 0, litCount = 1;
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function setLit(n, ripple) {
    cities.forEach(function (li, i) {
      var on = i < n;
      if (on && !li.classList.contains('lit') && ripple) {
        li.classList.add('ripple');
        li.classList.remove('ripple'); void li.offsetWidth; li.classList.add('ripple');
      }
      li.classList.toggle('lit', on);
      if (!on) li.classList.remove('ripple');
    });
  }

  function paint(ms) {
    if (!legs.length) return;
    var li = 0, e = 0, i;
    if (ms >= END) { li = 3; e = 1; }
    else {
      for (i = 0; i < 4; i++) { if (ms >= legStart[i]) { li = i; e = ms >= legEnd[i] ? 1 : ease((ms - legStart[i]) / DUR[i]); } }
      if (ms < legStart[0]) { li = 0; e = 0; }
    }
    if (note) note.classList.toggle('show', ms >= legStart[1] + DUR[1] * 0.5);
    var L = legs[li], dist = e * L.len;
    flown.style.strokeDashoffset = String(total - (L.start + dist));
    var p = L.el.getPointAtLength(dist);
    var q1 = L.el.getPointAtLength(Math.max(0, dist - 1)), q2 = L.el.getPointAtLength(Math.min(L.len, dist + 1));
    var target = Math.atan2(q2.y - q1.y, q2.x - q1.x) * 180 / Math.PI;
    if (planeAngle === null) planeAngle = target;
    else { var df = ((target - planeAngle + 540) % 360) - 180; planeAngle += df * 0.2; }
    planeG.setAttribute('transform', 'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ') rotate(' + planeAngle.toFixed(1) + ')');
    var n = 1;
    for (i = 0; i < 4; i++) if (ms >= legEnd[i]) n = i + 2;
    if (n !== litCount) { var up = n > litCount; litCount = n; setLit(n, up); }
  }

  function frame(now) {
    elapsed = now - startTime;
    paint(elapsed);
    if (elapsed >= END + 400) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }
  function finish() {
    done = true; elapsed = END + 400; paint(elapsed);
    route.classList.add('done');
    if (replayBtn) replayBtn.hidden = false;
  }
  function play() {
    cancelAnimationFrame(raf);
    done = false; elapsed = 0; litCount = 1; planeAngle = null;
    route.classList.remove('done'); route.classList.add('go');
    if (replayBtn) replayBtn.hidden = true;
    setLit(1, false);
    startTime = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function showFinal() {
    route.classList.add('done');
    litCount = 5; setLit(5, false);
    elapsed = END + 400; paint(elapsed);
    planeG.style.display = 'none';
  }

  build();
  route.classList.add('ready');

  if (reduce || !('IntersectionObserver' in window)) {
    showFinal();
  } else {
    route.classList.add('armed');
    litCount = 1; setLit(1, false); elapsed = 0; paint(0);
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { io.disconnect(); play(); }
    }, { threshold: 0.35 });
    io.observe(route);
    if (replayBtn) replayBtn.addEventListener('click', play);
  }

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      build();
      if (reduce || !('IntersectionObserver' in window)) planeG.style.display = 'none';
    }, 150);
  });
  window.addEventListener('load', function () { build(); if (reduce) planeG.style.display = 'none'; });
})();

/* ---- Closing headline: "Together." ---- */
(function () {
  var word = document.getElementById('together');
  var sect = document.getElementById('contact');
  if (!word || !sect) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;
  var text = word.textContent;
  word.textContent = '';
  var tw = document.createElement('span');
  tw.className = 'tw';
  var chars = [];
  text.split('').forEach(function (c, i) {
    var s = document.createElement('span');
    s.className = 'ch'; s.textContent = c; s.style.setProperty('--i', i);
    tw.appendChild(s); chars.push(s);
  });
  word.appendChild(tw);
  word.classList.add('split');
  function measure() {
    var w = tw.offsetWidth;
    chars.forEach(function (s) {
      s.style.setProperty('--x', s.offsetLeft + 'px');
      s.style.setProperty('--w', w + 'px');
    });
  }
  measure();
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(measure, 150); });
  window.addEventListener('load', measure);
  var io = new IntersectionObserver(function (en) {
    if (en[0].isIntersecting) { io.disconnect(); word.classList.add('go'); }
  }, { threshold: 0.35 });
  io.observe(sect);
})();
