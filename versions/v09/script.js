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


  // ---- Theme toggle + circular reveal transition ----
  (function () {
    var btn = document.getElementById('themeBtn');
    var fx = document.getElementById('themeFx');
    if (!btn || !fx) return;
    var metaTheme = document.querySelector('meta[name="theme-color"]');
    var metaScheme = document.querySelector('meta[name="color-scheme"]');
    var COLORS = { dark: '#000000', light: '#ffffff' };
    var DUR = 1000, EASE = 'cubic-bezier(.7,0,.3,1)';
    var busy = false;

    function current() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
    function applyTheme(t) {
      root.setAttribute('data-theme', t);
      if (metaTheme) metaTheme.setAttribute('content', COLORS[t]);
      if (metaScheme) metaScheme.setAttribute('content', t);
      btn.setAttribute('aria-checked', String(t === 'light'));
      btn.setAttribute('aria-label', t === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
      document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: t } }));
    }
    applyTheme(current());

    var MOON = '<svg class="fx-moon" viewBox="0 0 24 24"><mask id="fxm"><rect x="-4" y="-4" width="32" height="32" fill="#fff"/><circle cx="18" cy="7" r="7.5" fill="#000"/></mask><circle cx="12" cy="12" r="9" fill="#f1efe6" mask="url(#fxm)"/></svg>';
    var SUN = '<svg class="fx-sun" viewBox="0 0 24 24"><g stroke="#ffb627" stroke-width="2" stroke-linecap="round"><path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></g><circle cx="12" cy="12" r="5" fill="#ffd766"/></svg>';

    // Build the overlay contents: returns { done: Promise } and plays all celestial animations
    function playFx(next, cx, cy, R, cover) {
      var vw = window.innerWidth, vh = window.innerHeight;
      fx.innerHTML = '';
      var anims = [];
      function add(el, kf, opt) { fx.appendChild(el); anims.push(el.animate(kf, opt)); return el; }
      function div(cls) { var d = document.createElement('div'); d.className = cls; return d; }
      var opts = { duration: DUR, easing: 'linear', fill: 'both' };

      if (cover) {  // fallback reveal layer in the new theme's bg colour
        var c = div('fx-cover');
        c.style.background = cover;
        add(c, [
          { opacity: 1, clipPath: 'circle(0px at ' + cx + 'px ' + cy + 'px)', offset: 0 },
          { opacity: 1, clipPath: 'circle(' + R + 'px at ' + cx + 'px ' + cy + 'px)', easing: EASE, offset: 1 }
        ], { duration: DUR, fill: 'both' });
      }

      // celestial body: starts as the icon, swells while drifting toward the centre, then settles back
      var dx = (vw / 2 - cx) * 0.16, dy = (vh / 2 - cy) * 0.16;
      var base = 'translate(' + (cx - 16) + 'px,' + (cy - 16) + 'px)';
      var big = next === 'dark' ? 6 : 6.5;
      var body = div('');
      body.innerHTML = next === 'dark' ? MOON : SUN;
      body = body.firstChild;
      var spin = next === 'light';
      function tf(x, y, sc, rot) { return base + ' translate(' + x + 'px,' + y + 'px) scale(' + sc + ') rotate(' + rot + 'deg)'; }
      add(body, [
        { opacity: 0, transform: tf(0, 0, .6, spin ? -30 : -18), offset: 0 },
        { opacity: 1, transform: tf(0, 0, 1.4, spin ? 0 : -18), easing: 'cubic-bezier(.3,.7,.3,1)', offset: .1 },
        { opacity: 1, transform: tf(dx, dy, big, spin ? 70 : -18), easing: 'cubic-bezier(.5,0,.6,1)', offset: .52 },
        { opacity: 1, transform: tf(dx * .6, dy * .6, big * .85, spin ? 100 : -18), easing: 'cubic-bezier(.6,0,.3,1)', offset: .66 },
        { opacity: .9, transform: tf(0, 0, 1.15, spin ? 140 : -18), offset: .94 },
        { opacity: 0, transform: tf(0, 0, 1, spin ? 150 : -18), offset: 1 }
      ], { duration: DUR, fill: 'both' });

      if (next === 'light') {
        // warm glow riding the leading edge of the reveal
        var g = div('fx-glow');
        var gs = 2 * R;
        g.style.cssText = 'width:' + gs + 'px;height:' + gs + 'px;left:' + (cx - R) + 'px;top:' + (cy - R) + 'px;background:radial-gradient(circle closest-side,rgba(255,200,90,0) 80%,rgba(255,200,90,.35) 96%,rgba(255,200,90,0) 100%)';
        // scale 0 -> 1 with the same easing as the clip-path circle keeps the glow on the leading edge
        add(g, { scale: ['0', '1'] }, { duration: DUR, easing: EASE, fill: 'both' });
        anims.push(g.animate([{ opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .8 }, { opacity: 0 }], { duration: DUR, fill: 'both' }));
      } else {
        // a handful of stars twinkling in as the edge sweeps past
        var n = 0, tries = 0;
        while (n < 11 && tries++ < 400) {
          var t0 = .1 + Math.random() * .5, pe = t0 * t0 * t0 * (t0 * (t0 * 6 - 15) + 10);
          var rr = R * pe * (.72 + Math.random() * .24), ang = Math.random() * Math.PI * 2;
          var x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr;
          if (x < 12 || x > vw - 12 || y < 12 || y > vh - 12 || rr < 20) continue;
          n++;
          var len = .24 + Math.random() * .12;
          var st = div('fx-star');
          st.style.left = x + 'px'; st.style.top = y + 'px';
          var sc = .8 + Math.random() * 1.2;
          add(st, [
            { opacity: 0, transform: 'scale(0) rotate(-40deg)', offset: 0 },
            { opacity: 0, transform: 'scale(0) rotate(-40deg)', offset: t0 },
            { opacity: 1, transform: 'scale(' + sc + ') rotate(0deg)', offset: t0 + len * .35 },
            { opacity: .35, transform: 'scale(' + sc * .7 + ') rotate(20deg)', offset: t0 + len * .65 },
            { opacity: .9, transform: 'scale(' + sc * .95 + ') rotate(30deg)', offset: t0 + len * .8 },
            { opacity: 0, transform: 'scale(0) rotate(60deg)', offset: Math.min(1, t0 + len) }
          ], { duration: DUR, fill: 'both' });
        }
      }
      return Promise.all(anims.map(function (a) { return a.finished; }));
    }

    function endFx() { fx.classList.remove('on'); fx.innerHTML = ''; busy = false; }

    function switchTheme() {
      if (busy) return;
      var next = current() === 'dark' ? 'light' : 'dark';
      if (reduce) { applyTheme(next); return; }
      busy = true;
      var r = btn.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var vw = window.innerWidth, vh = window.innerHeight;
      var R = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy)) + 2;
      var circle = function (rad) { return 'circle(' + rad + 'px at ' + cx + 'px ' + cy + 'px)'; };

      if (typeof document.startViewTransition === 'function') {
        var vt;
        try {
          vt = document.startViewTransition(function () {
            applyTheme(next);
            // overlay joins the NEW state only, under its own view-transition-name, so it is never duplicated in the root snapshot
            fx.classList.add('on');
          });
        } catch (e) { applyTheme(next); busy = false; return; }
        vt.ready.then(function () {
          playFx(next, cx, cy, R, null).then(endFx, endFx);
          root.animate({ clipPath: [circle(0), circle(R)] },
            { duration: DUR, easing: EASE, fill: 'both', pseudoElement: '::view-transition-new(root)' });
        }).catch(endFx);
        vt.finished.then(endFx, endFx);
      } else {
        // Fallback: new-theme-coloured cover expands, then the theme is applied under it and it fades away
        var bg = next === 'light' ? '#ffffff' : '#000000';
        fx.classList.add('on');
        playFx(next, cx, cy, R, bg).then(function () {
          applyTheme(next);
          var cover = fx.querySelector('.fx-cover');
          if (cover) {
            var a = cover.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'both' });
            a.finished.then(endFx, endFx);
          } else endFx();
        }, endFx);
      }
    }

    btn.addEventListener('click', switchTheme);
    document.addEventListener('keydown', function (e) {
      if ((e.key !== 't' && e.key !== 'T') || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      switchTheme();
    });
  })();

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
  var skyDim = 1;
  function readDim() { skyDim = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sky-dim')) || 1; }
  readDim();
  function css(c) { return 'rgb(' + c.map(function (v) { return Math.round(v * skyDim); }).join(',') + ')'; }
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
  function tick(force) {
    var now = new Date();
    cities.forEach(function (li) {
      var tz = li.getAttribute('data-tz');
      if (!fmt[tz]) return;
      var card = li.querySelector('.ccard'), clock = li.querySelector('.clock');
      var txt = fmt[tz].format(now);
      if (!force && clock.textContent === txt) return;
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
  // theme switched: re-read --sky-dim and repaint every sky card
  document.addEventListener('themechange', function () { readDim(); tick(true); });

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

/* ---- Education emblems: enter once, replay on hover / focus / tap ---- */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cards = Array.prototype.filter.call(document.querySelectorAll('.card'), function (c) { return c.querySelector('.emblem'); });
  if (reduce || !cards.length) return;
  function play(c) {
    if (!c.classList.contains('emblem-in') || c.classList.contains('emblem-play')) return;
    c.classList.add('emblem-play');
  }
  cards.forEach(function (c) {
    var lion = !!c.querySelector('.emblem-lion');
    c.addEventListener('mouseenter', function () { play(c); });
    c.addEventListener('focusin', function () { play(c); });
    c.addEventListener('click', function () { play(c); });
    c.addEventListener('animationend', function (e) {
      if (e.animationName === 'flare' || e.animationName === 'jaw') c.classList.remove('emblem-play');
    });
    c._lion = lion;
  });
  function enter(c) {
    c.classList.add('emblem-in');
    if (c._lion) setTimeout(function () { c.classList.add('emblem-play'); }, 550);
  }
  if (!('IntersectionObserver' in window)) { cards.forEach(enter); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { enter(en.target); io.unobserve(en.target); }
    });
  }, { threshold: 0.4 });
  cards.forEach(function (c) { io.observe(c); });
})();

/* ---- Skills: pouch & pebbles ---- */
(function () {
  var sec = document.getElementById('skills'), host = document.getElementById('toolkit');
  if (!sec || !host) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var GLYPH = {
    py: '<path d="M2 8.5C2 5 6 7.5 6 4.5S9 2 10 4"/>',
    java: '<path d="M2.5 6.5h6v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2zM8.5 7.2h1a1 1 0 0 1 0 2h-1M4 1.5c-.8 1 .8 1.5 0 2.5M6.5 1.5c-.8 1 .8 1.5 0 2.5"/>',
    dart: '<path d="M2 6h8M7 3l3 3-3 3"/>',
    html: '<path d="M4.5 3L1.5 6l3 3M7.5 3l3 3-3 3"/>',
    git: '<circle cx="3" cy="2.5" r="1.2"/><circle cx="3" cy="9.5" r="1.2"/><circle cx="9" cy="4.5" r="1.2"/><path d="M3 3.7v4.6M9 5.7c0 2-6 1.5-6 3"/>',
    ble: '<circle cx="3" cy="6" r=".8"/><path d="M5.8 3.6a3.4 3.4 0 0 1 0 4.8M8.2 1.8a6 6 0 0 1 0 8.4"/>'
  };
  var CATS = [
    { id: 'lang', label: 'Languages', count: '5 languages', cap: 'Programming languages', say: 'Languages',
      items: [['Python', 'py'], ['Dart', 'dart'], ['Java', 'java'], ['Objective-C'], ['HTML/CSS', 'html']] },
    { id: 'tools', label: 'Tools', count: '7 tools', sub: 'incl. agentic dev', cap: 'Tools and frameworks. Claude Code and Cursor: agentic development', say: 'Tools',
      items: [['Claude Code'], ['Cursor'], ['Flutter'], ['FastAPI'], ['Flask'], ['Playwright'], ['Selenium']] },
    { id: 'sys', label: 'Systems', count: '3 systems', cap: 'Systems and other', say: 'Systems',
      items: [['REST APIs'], ['Bluetooth LE', 'ble'], ['Git', 'git']] },
    { id: 'spoken', label: 'Spoken', count: '5 spoken', cap: 'Spoken languages. Larger stones: fluent', say: 'Spoken',
      items: [['English', 0, 1], ['Hindi', 0, 1], ['Mandarin'], ['Spanish'], ['French']] }
  ];

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }

  /* ---- build DOM ---- */
  var pouch = el('div', 'pouch'), grid = el('div', 'pouch-grid');
  pouch.setAttribute('role', 'group'); pouch.setAttribute('aria-label', 'Skill pockets');
  var pockets = {};
  CATS.forEach(function (c) {
    var b = el('button', 'pocket'); b.type = 'button';
    b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'tray'); b.dataset.cat = c.id;
    var flap = el('span', 'p-flap'), tag = el('span', 'p-tag', c.label);
    var body = el('span', 'p-body'); body.appendChild(el('span', 'p-count', c.count));
    if (c.sub) body.appendChild(el('span', 'p-cap', c.sub));
    b.appendChild(tag); b.appendChild(flap); b.appendChild(body); grid.appendChild(b); pockets[c.id] = b;
  });
  pouch.appendChild(grid);
  var hint = el('p', 'toolkit-hint', 'Tap a pocket to tip it out. Pebbles can be tossed.');
  var tray = el('div', 'tray'); tray.id = 'tray'; tray.setAttribute('role', 'group'); tray.setAttribute('aria-label', 'Skill tray');
  var cap = el('p', 'tray-cap'); cap.setAttribute('aria-hidden', 'true');
  var tipAll = el('button', 'tip-all', 'Tip out everything'); tipAll.type = 'button';
  var live = el('div', 'sr-only'); live.setAttribute('aria-live', 'polite');
  tray.appendChild(cap);

  var bodies = [], n = 0;
  CATS.forEach(function (c) {
    c.items.forEach(function (it) {
      var i = n++, h = function (k) { return 44 + ((i * 37 + k * 53 + 11) % 13); }; // deterministic 44-56%
      var e = el('div', 'pebble c-' + c.id); e.tabIndex = -1; e.setAttribute('aria-label', it[0]); e.setAttribute('role', 'img');
      var pb = el('div', 'pb');
      pb.style.setProperty('--br', h(0) + '% ' + (100 - h(1)) + '% ' + h(2) + '% ' + (100 - h(3)) + '% / ' + h(4) + '% ' + (100 - h(5)) + '% ' + h(6) + '% ' + (100 - h(7)) + '%');
      if (it[1]) { pb.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true">' + GLYPH[it[1]] + '</svg>'; }
      var words = it[0].split(' ');
      words.forEach(function (w) { pb.appendChild(el('span', '', w)); });
      e.appendChild(pb); e.classList.add('gone'); tray.appendChild(e);
      bodies.push({ name: it[0], cat: c.id, fluent: !!it[2], el: e, pb: pb, x: 0, y: 0, vx: 0, vy: 0, r: 36, rot: 0, state: 'home', drag: false, contact: false });
    });
  });
  tray.appendChild(tipAll);
  host.appendChild(pouch); host.appendChild(hint); host.appendChild(tray); host.appendChild(live);
  sec.classList.add('toolkit-on');

  /* ---- geometry ---- */
  var W = 0, H = 0, PAD = 7, L, R, F, small = false;
  function measure() {
    W = tray.clientWidth; H = tray.clientHeight; L = PAD; R = W - PAD; F = H - PAD;
    var s = W < 560;
    if (s !== small || !bodies[0].sized) { small = s; sizeAll(); }
  }
  function sizeAll() {
    var fs = small ? 12 : 12.5, minR = small ? 27 : 34;
    bodies.forEach(function (b) {
      b.pb.style.setProperty('--fs', fs + 'px'); b.el.style.width = b.el.style.height = '120px';
      var w = 0; Array.prototype.forEach.call(b.pb.children, function (c) { if (c.tagName === 'SPAN') w = Math.max(w, c.offsetWidth); });
      var r = Math.min(48, Math.max(minR, w / 2 + (small ? 8 : 10)));
      if (b.fluent) r *= 1.15;
      b.r = r; b.sized = true;
      b.el.style.width = b.el.style.height = (r * 2) + 'px';
    });
  }
  function pocketPos(cat, r) {
    var tr = tray.getBoundingClientRect(), pr = pockets[cat].getBoundingClientRect();
    return { x: Math.max(L + r, Math.min(R - r, pr.left + pr.width / 2 - tr.left)), y: pr.bottom - tr.top - r * 0.5 - 6 };
  }

  /* ---- physics ---- */
  var G = 1700, E = 0.4, DT = 1 / 120, pool = [];
  function im(b) { return b.drag ? 0 : 1 / (b.r * b.r); }
  function solve() {
    var i, j, a, b, it, n = pool.length;
    for (it = 0; it < 4; it++) {
      for (i = 0; i < n; i++) {
        a = pool[i]; if (a.drag) continue;
        if (a.x < L + a.r) { a.x = L + a.r; if (a.vx < 0) a.vx = a.vx < -40 ? -a.vx * E : 0; }
        else if (a.x > R - a.r) { a.x = R - a.r; if (a.vx > 0) a.vx = a.vx > 40 ? -a.vx * E : 0; }
        if (a.y > F - a.r) { a.y = F - a.r; a.contact = true; if (a.vy > 0) a.vy = a.vy > 70 ? -a.vy * E : 0; }
      }
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
        a = pool[i]; b = pool[j];
        var dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
        if (dx > rr || dx < -rr || dy > rr || dy < -rr) continue;
        var d2 = dx * dx + dy * dy; if (d2 >= rr * rr) continue;
        var d = Math.sqrt(d2) || 0.001, nx = dx / d, ny = dy / d, ia = im(a), ib = im(b), s = ia + ib;
        if (!s) continue;
        var ov = rr - d, corr = Math.max(ov - 0.2, 0) * 0.8 / s;
        a.x -= nx * corr * ia; a.y -= ny * corr * ia; b.x += nx * corr * ib; b.y += ny * corr * ib;
        var vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (vn < 0) {
          var jn = -(1 + (vn < -60 ? E : 0)) * vn / s;
          a.vx -= jn * nx * ia; a.vy -= jn * ny * ia; b.vx += jn * nx * ib; b.vy += jn * ny * ib;
          var vt = -(b.vx - a.vx) * ny + (b.vy - a.vy) * nx, jt = -vt * 0.3 / s;
          a.vx += jt * ny * ia; a.vy -= jt * nx * ia; b.vx -= jt * ny * ib; b.vy += jt * nx * ib;
        }
        a.contact = b.contact = true;
      }
    }
  }
  function step(dt) {
    var i, a, k = 1 - 0.25 * dt;
    for (i = 0; i < pool.length; i++) {
      a = pool[i]; a.contact = false;
      if (a.drag) { a.vx = a.vy = 0; continue; }
      a.vy += G * dt; a.vx *= k; a.x += a.vx * dt; a.y += a.vy * dt;
    }
    solve();
    var maxv = 0;
    for (i = 0; i < pool.length; i++) {
      a = pool[i]; if (a.drag) { maxv = 99; continue; }
      var v = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
      if (a.contact) {
        if (a.y >= F - a.r - 0.5) { var f = 1500 * dt; a.vx = Math.abs(a.vx) <= f ? 0 : a.vx - (a.vx > 0 ? f : -f); }
        a.vx *= 1 - 2 * dt; if (v < 30) { a.vx *= 1 - 8 * dt; a.vy *= 1 - 8 * dt; }
        a.rot += (a.vx / a.r) * 0.4 * 57.3 * dt; a.rot *= 1 - 1.6 * dt;
      } else a.rot *= 1 - 0.5 * dt;
      if (a.rot > 26) a.rot = 26; else if (a.rot < -26) a.rot = -26;
      if (v > maxv) maxv = v;
    }
    sleepT = (maxv < 14 && !pending) ? sleepT + dt : 0;
  }
  function render() {
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (b.state === 'live') b.el.style.transform = 'translate3d(' + (b.x - b.r).toFixed(2) + 'px,' + (b.y - b.r).toFixed(2) + 'px,0) rotate(' + b.rot.toFixed(2) + 'deg)';
    }
  }
  var awake = false, visible = true, raf = 0, last = 0, acc = 0, sleepT = 0, pending = 0;
  function frame(t) {
    raf = 0; if (!awake || !visible) return;
    acc += Math.min((t - last) / 1000, 0.05); last = t;
    while (acc >= DT) { step(DT); acc -= DT; }
    render();
    if (sleepT > 0.45) {
      awake = false;
      pool.forEach(function (b) { b.vx = b.vy = 0; });
      return;
    }
    raf = requestAnimationFrame(frame);
  }
  function wake() {
    if (reduce) return;
    sleepT = 0; awake = true;
    if (!raf && visible) { last = performance.now(); acc = 0; raf = requestAnimationFrame(frame); }
  }

  /* ---- state ---- */
  var active = [], gen = 0, timers = [], touched = false;
  function setActive(ids) {
    active = ids;
    CATS.forEach(function (c) { pockets[c.id].setAttribute('aria-expanded', String(ids.indexOf(c.id) > -1)); });
    cap.classList.toggle('on', ids.length > 0);
    if (ids.length === 1) cap.textContent = CATS.filter(function (c) { return c.id === ids[0]; })[0].cap;
    else if (ids.length) cap.textContent = 'Larger stones: fluent';
  }
  function layoutRows(list) {
    var gap = 6, avail = W - PAD * 2, rows = [], row = [], w = 0, i;
    list.forEach(function (b) {
      var bw = b.r * 2 + gap;
      if (row.length && w + bw > avail) { rows.push(row); row = []; w = 0; }
      row.push(b); w += bw;
    });
    if (row.length) rows.push(row);
    var base = F;
    rows.forEach(function (rw, ri) {
      var tw = rw.reduce(function (s, b) { return s + b.r * 2 + gap; }, -gap), x = (W - tw) / 2, mr = 0;
      rw.forEach(function (b, k) {
        var j = ((b.name.length * 7 + k * 5 + ri * 3) % 7) - 3;
        b.x = x + b.r + j * 0.6; b.y = base - b.r - (ri % 2 ? 2 : 0) - Math.abs(j) * 0.4; b.rot = j * 2.4; x += b.r * 2 + gap; mr = Math.max(mr, b.r);
      });
      base -= mr * 1.75;
    });
    pool = list.slice(); pool.forEach(function (b) { b.vx = b.vy = 0; });
    for (i = 0; i < 30; i++) solve();
    pool.forEach(function (b) { b.vx = b.vy = 0; });
  }
  function show(b) {
    b.state = 'live'; clearTimeout(b.homeT);
    b.el.classList.add('live'); b.el.classList.remove('gone'); b.el.tabIndex = 0; b.el.style.transition = 'none';
  }
  function spill(list, announce) {
    if (!list.length) return;
    measure();
    if (reduce) {
      list.forEach(show);
      pool = bodies.filter(function (b) { return b.state === 'live'; });
      layoutRows(pool); render();
      return;
    }
    pending = list.length;
    list.forEach(function (b, i) {
      timers.push(setTimeout(function () {
        var p = pocketPos(b.cat, b.r);
        show(b);
        b.x = Math.max(L + b.r, Math.min(R - b.r, p.x + ((i % 3) - 1) * 30 + (Math.random() - 0.5) * 16)); b.y = p.y;
        // Nudge toward the tray's centre so edge pockets don't pile up against a wall
        b.vx = ((L + R) / 2 - b.x) * (0.35 + Math.random() * 0.5) + (Math.random() - 0.5) * 90; b.vy = 160 + Math.random() * 100; b.rot = 0;
        pool.push(b); render(); pending--; wake();
      }, i * 70));
    });
  }
  function sendHome(b) {
    if (b.state !== 'live') return;
    b.drag = false; b.el.classList.remove('dragging');
    pool = pool.filter(function (p) { return p !== b; });
    if (reduce) { b.state = 'home'; b.el.classList.remove('live'); b.el.classList.add('gone'); b.el.tabIndex = -1; return; }
    var p = pocketPos(b.cat, b.r);
    b.state = 'away'; b.el.style.transition = 'transform .4s var(--ease)';
    b.el.style.transform = 'translate3d(' + (p.x - b.r) + 'px,' + (p.y - b.r) + 'px,0) rotate(0deg)';
    b.el.classList.add('gone'); b.el.tabIndex = -1;
    b.homeT = setTimeout(function () { b.state = 'home'; b.el.classList.remove('live'); b.el.style.transition = ''; }, 430);
  }
  function clearAll() {
    timers.forEach(clearTimeout); timers = []; pending = 0;
    var any = false;
    bodies.forEach(function (b) { if (b.state === 'live') { any = true; sendHome(b); } });
    return any;
  }
  function choose(id) {
    touched = true;
    var g = ++gen, same = active.length === 1 && active[0] === id, next = same ? [] : [id];
    setActive(next);
    var any = clearAll();
    var cat = CATS.filter(function (c) { return c.id === id; })[0];
    if (!next.length) { live.textContent = cat.label + ' put back'; return; }
    var go = function () {
      if (g !== gen) return;
      spill(bodies.filter(function (b) { return b.cat === id; }));
      live.textContent = cat.say + ': ' + cat.items.map(function (i) { return i[0]; }).join(', ');
    };
    if (any && !reduce) timers.push(setTimeout(go, 440)); else go();
  }
  function tipEverything() {
    touched = true; ++gen;
    timers.forEach(clearTimeout); timers = [];
    setActive(CATS.map(function (c) { return c.id; }));
    spill(bodies.filter(function (b) { return b.state !== 'live'; }));
    live.textContent = 'All skills tipped out: ' + bodies.map(function (b) { return b.name; }).join(', ');
  }
  grid.addEventListener('click', function (e) { var b = e.target.closest('.pocket'); if (b) choose(b.dataset.cat); });
  tipAll.addEventListener('click', tipEverything);

  /* ---- drag & toss ---- */
  var drag = null;
  function local(e) { var r = tray.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  if (!reduce) {
    tray.addEventListener('pointerdown', function (e) {
      var pe = e.target.closest('.pebble'); if (!pe || e.button > 0) return;
      var b = bodies.filter(function (q) { return q.el === pe; })[0];
      if (!b || b.state !== 'live') return;
      var p = local(e);
      drag = { b: b, id: e.pointerId, ox: p.x - b.x, oy: p.y - b.y, s: [] };
      b.drag = true; pe.classList.add('dragging');
      try { pe.setPointerCapture(e.pointerId); } catch (x) {}
      e.preventDefault(); wake();
    });
    tray.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var p = local(e), b = drag.b, t = performance.now();
      b.x = Math.max(L + b.r, Math.min(R - b.r, p.x - drag.ox));
      b.y = Math.max(b.r, Math.min(F - b.r, p.y - drag.oy));
      drag.s.push({ t: t, x: b.x, y: b.y });
      while (drag.s.length > 1 && t - drag.s[0].t > 100) drag.s.shift();
      wake();
    });
    var end = function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var b = drag.b, s = drag.s, now = performance.now(), vx = 0, vy = 0;
      if (s.length > 1 && now - s[s.length - 1].t < 70) {
        var f = s[0], l = s[s.length - 1], dt = Math.max((l.t - f.t) / 1000, 0.016);
        vx = (l.x - f.x) / dt; vy = (l.y - f.y) / dt;
        var sp = Math.sqrt(vx * vx + vy * vy); if (sp > 2400) { vx *= 2400 / sp; vy *= 2400 / sp; }
      }
      b.drag = false; b.vx = vx; b.vy = vy; b.el.classList.remove('dragging'); drag = null; wake();
    };
    tray.addEventListener('pointerup', end); tray.addEventListener('pointercancel', end);
    tray.addEventListener('keydown', function (e) {
      var pe = e.target.closest && e.target.closest('.pebble'); if (!pe) return;
      var b = bodies.filter(function (q) { return q.el === pe; })[0], k = e.key;
      if (!b || b.state !== 'live') return;
      if (k === 'ArrowLeft') b.vx -= 420; else if (k === 'ArrowRight') b.vx += 420;
      else if (k === 'ArrowUp' || k === ' ' || k === 'Enter') b.vy -= 560; else return;
      e.preventDefault(); wake();
    });
  }

  /* ---- resize, visibility, first view ---- */
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      measure();
      pool.forEach(function (b) {
        b.x = Math.max(L + b.r, Math.min(R - b.r, b.x)); b.y = Math.min(F - b.r, b.y);
      });
      if (reduce) { if (pool.length) { layoutRows(pool); render(); } } else { render(); wake(); }
    }, 150);
  });
  measure();
  if ('IntersectionObserver' in window) {
    var started = false;
    new IntersectionObserver(function (en) {
      var e = en[0];
      visible = e.isIntersecting;
      if (visible && awake && !raf) { last = performance.now(); acc = 0; raf = requestAnimationFrame(frame); }
      if (!started && e.intersectionRatio >= 0.4) {
        started = true;
        setTimeout(function () { if (!touched) choose('lang'); }, 400);
      }
    }, { threshold: [0, 0.4] }).observe(host);
  }
  window.addEventListener('load', function () { sizeAll(); });
})();
