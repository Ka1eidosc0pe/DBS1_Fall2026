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
      if (vy < -500 && window.__kup) {  // easter egg: the same pebble tossed up 3 times in 4s
        b.tosses = (b.tosses || []).filter(function (t) { return now - t < 4000; });
        b.tosses.push(now);
        if (b.tosses.length >= 3) { b.tosses = []; setTimeout(function () { window.__kup.open(); }, 350); }
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

/* ---- Command palette (Cmd/Ctrl+K) ---- */
(function () {
  var box = document.getElementById('cmdk');
  if (!box) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var panel = box.querySelector('.cmdk-panel');
  var input = document.getElementById('cmdkInput');
  var list = document.getElementById('cmdkList');
  var toastEl = document.getElementById('toast');
  var EMAIL = 'adiselvam@uchicago.edu';
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  var hintKey = document.getElementById('cmdHintKey');
  if (hintKey && !isMac) hintKey.textContent = 'Ctrl K';

  var ICON = {
    hash: '<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 8l8 5.5L20 8"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    code: '<path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
    theme: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    replay: '<path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5"/>',
    doc: '<path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5zM14 3.5V8h4M9 12.5h6M9 16h6"/>',
    bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
    ball: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8.2l3.4 2.5-1.3 4h-4.2l-1.3-4zM12 8.2V3.7M15.4 10.7l4.2-1.4M14.1 14.7l2.6 3.5M9.9 14.7l-2.6 3.5M8.6 10.7L4.4 9.3"/>',
    pebble: '<ellipse cx="9" cy="14" rx="5" ry="4"/><ellipse cx="16.5" cy="9.5" rx="3.5" ry="3"/><ellipse cx="17" cy="17" rx="3" ry="2.5"/>'
  };

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }
  function copyEmail() {
    function ok() { toast('Copied'); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = EMAIL; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      var done = false;
      try { done = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      if (done) ok(); else toast(EMAIL);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(EMAIL).then(ok, fallback);
    else fallback();
  }
  function goTo(id) {
    var t = document.getElementById(id);
    if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  function openUrl(u) { window.open(u, '_blank', 'noopener,noreferrer'); }
  function clickEl(sel) { var e = document.querySelector(sel); if (e) e.click(); }

  // sync: run before the palette closes (needs user activation); otherwise runs after the close animation
  var ITEMS = [
    { g: 'Navigate', label: 'Journey', kw: 'cities travel', icon: 'hash', hint: 'Section', run: function () { goTo('journey'); } },
    { g: 'Navigate', label: 'Experience', kw: 'allthenticate work', icon: 'hash', hint: 'Section', run: function () { goTo('experience'); } },
    { g: 'Navigate', label: 'Projects', kw: 'dof.me work', icon: 'hash', hint: 'Section', run: function () { goTo('projects'); } },
    { g: 'Navigate', label: 'Education', kw: 'uchicago ntu degrees', icon: 'hash', hint: 'Section', run: function () { goTo('education'); } },
    { g: 'Navigate', label: 'Skills', kw: 'toolkit', icon: 'hash', hint: 'Section', run: function () { goTo('skills'); } },
    { g: 'Navigate', label: 'Contact', kw: 'hire', icon: 'hash', hint: 'Section', run: function () { goTo('contact'); } },
    { g: 'Actions', label: 'Open 30-second view', kw: 'resume summary recruiter tldr cv pdf print', icon: 'bolt', hint: '', run: function () { window.__tldr && window.__tldr.open(); } },
    { g: 'Actions', label: 'Copy email', kw: EMAIL, icon: 'copy', hint: 'Copy', sync: true, run: copyEmail },
    { g: 'Actions', label: 'Email Aditya', kw: 'mail contact', icon: 'mail', hint: 'Mail', sync: true, run: function () { window.location.href = 'mailto:' + EMAIL; } },
    { g: 'Actions', label: 'Open LinkedIn', kw: 'profile', icon: 'link', hint: '↗', sync: true, run: function () { openUrl('https://www.linkedin.com/in/aditya-selvam'); } },
    { g: 'Actions', label: 'Open GitHub', kw: 'code', icon: 'code', hint: '↗', sync: true, run: function () { openUrl('https://github.com/Ka1eidosc0pe'); } },
    { g: 'Actions', label: 'Visit DoF.me', kw: 'soccer game', icon: 'globe', hint: '↗', sync: true, run: function () { openUrl('https://dof-me.vercel.app/'); } },
    { g: 'Actions', label: 'Switch theme', kw: 'dark light mode', icon: 'theme', hint: 'T', run: function () { clickEl('#themeBtn'); } },
    { g: 'Actions', label: 'Replay journey', kw: 'plane route', icon: 'replay', hint: '↻', run: function () {
      goTo('journey');
      setTimeout(function () { clickEl('#replay'); }, reduce ? 0 : 700);
    } },
    { g: 'Actions', label: 'Open: Thesis', kw: 'portfolio management case study', icon: 'doc', hint: 'Case study', run: function () { window.__cs && window.__cs.open(0); } },
    { g: 'Actions', label: 'Open: Soccer Analysis', kw: 'yolo computer vision case study', icon: 'doc', hint: 'Case study', run: function () { window.__cs && window.__cs.open(1); } },
    { g: 'Actions', label: 'Open: AI Food Classification', kw: 'food-101 flutter case study', icon: 'doc', hint: 'Case study', run: function () { window.__cs && window.__cs.open(2); } },
    { g: 'Actions', label: 'Open: Arrhythmia', kw: 'neural network ecg case study', icon: 'doc', hint: 'Case study', run: function () { window.__cs && window.__cs.open(3); } },
    { g: 'Actions', label: 'Play keepy-uppy', kw: 'football soccer ball juggle game easter egg', icon: 'ball', hint: '', run: function () { window.__kup && window.__kup.open(); } },
    { g: 'Actions', label: 'Tip out all pebbles', kw: 'skills toolkit', icon: 'pebble', hint: '', run: function () {
      goTo('skills');
      setTimeout(function () { clickEl('.tip-all'); }, reduce ? 0 : 700);
    } }
  ];

  /* subsequence match: returns {score, idx[]} or null */
  function match(q, text) {
    var t = text.toLowerCase(), idx = [], ti = 0, score = 0, prev = -2;
    for (var i = 0; i < q.length; i++) {
      var c = q.charAt(i);
      if (c === ' ') continue;
      var f = t.indexOf(c, ti);
      if (f < 0) return null;
      score += (f === prev + 1 ? 6 : 0) + (f === 0 || /[\s.\-:]/.test(t.charAt(f - 1)) ? 5 : 0) - (f - ti) * 0.2;
      idx.push(f); prev = f; ti = f + 1;
    }
    return { score: score, idx: idx };
  }
  function esc(s) { return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function highlight(text, idx) {
    if (!idx || !idx.length) return esc(text);
    var out = '', set = {};
    idx.forEach(function (i) { set[i] = 1; });
    for (var i = 0; i < text.length; i++) out += set[i] ? '<mark>' + esc(text[i]) + '</mark>' : esc(text[i]);
    return out;
  }

  var shown = [], sel = 0, openState = false, opener = null, closeT;

  function render() {
    var q = input.value.trim().toLowerCase();
    var res = [];
    ITEMS.forEach(function (it, n) {
      if (!q) { res.push({ it: it, n: n, m: null, s: 0 }); return; }
      var m = match(q, it.label);
      if (m) { res.push({ it: it, n: n, m: m, s: m.score + 100 }); return; }
      var k = match(q, it.kw || '');
      if (k) res.push({ it: it, n: n, m: null, s: k.score });
    });
    var groups = [], byG = {};
    res.forEach(function (r) {
      if (!byG[r.it.g]) { byG[r.it.g] = []; groups.push(r.it.g); }
      byG[r.it.g].push(r);
    });
    shown = [];
    var html = '';
    groups.forEach(function (g, gi) {
      var arr = byG[g];
      if (q) arr.sort(function (a, b) { return b.s - a.s || a.n - b.n; });
      html += '<div class="cmdk-group" role="group" aria-labelledby="cmdkG' + gi + '"><div class="cmdk-gh" id="cmdkG' + gi + '" role="presentation">' + g + '</div>';
      arr.forEach(function (r) {
        var id = 'cmdkO' + shown.length;
        shown.push(r.it);
        html += '<div class="cmdk-item" role="option" id="' + id + '" data-i="' + (shown.length - 1) + '" aria-selected="false">' +
          '<svg class="cmdk-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + ICON[r.it.icon] + '</svg>' +
          '<span class="cmdk-lab">' + highlight(r.it.label, r.m && r.m.idx) + '</span>' +
          '<span class="cmdk-key" aria-hidden="true">' + (r.it.hint ? '<kbd>' + r.it.hint + '</kbd>' : '') + '</span></div>';
      });
      html += '</div>';
    });
    if (!shown.length) html = '<div class="cmdk-empty" role="presentation">No results for “' + esc(input.value.trim()) + '”</div>';
    list.innerHTML = html;
    select(0, false);
  }
  function select(i, scroll) {
    if (!shown.length) { input.setAttribute('aria-activedescendant', ''); return; }
    sel = (i + shown.length) % shown.length;
    var opts = list.querySelectorAll('.cmdk-item');
    for (var k = 0; k < opts.length; k++) opts[k].setAttribute('aria-selected', k === sel ? 'true' : 'false');
    var cur = opts[sel];
    input.setAttribute('aria-activedescendant', cur.id);
    if (scroll !== false) {
      var top = cur.offsetTop, bot = top + cur.offsetHeight;
      if (sel === 0) list.scrollTop = 0;
      else if (top < list.scrollTop + 30) list.scrollTop = top - 34;
      else if (bot > list.scrollTop + list.clientHeight) list.scrollTop = bot - list.clientHeight + 8;
    }
  }

  function open(from) {
    if (openState || (window.__cs && window.__cs.isOpen())) return;
    openState = true;
    opener = from || document.activeElement;
    clearTimeout(closeT);
    input.value = '';
    box.hidden = false;
    render();
    void box.offsetWidth;
    box.classList.add('open');
    input.focus();
  }
  function close(restore) {
    if (!openState) return;
    openState = false;
    box.classList.remove('open');
    closeT = setTimeout(function () { box.hidden = true; }, reduce ? 0 : 190);
    if (restore !== false && opener && opener.focus) opener.focus({ preventScroll: true });
  }
  function run(i) {
    var it = shown[i];
    if (!it) return;
    close(true);
    if (it.sync) it.run();
    else setTimeout(it.run, reduce ? 0 : 200);
  }

  input.addEventListener('input', render);
  list.addEventListener('mousemove', function (e) {
    var o = e.target.closest('.cmdk-item');
    if (o && +o.dataset.i !== sel) select(+o.dataset.i, false);
  });
  list.addEventListener('click', function (e) {
    var o = e.target.closest('.cmdk-item');
    if (o) run(+o.dataset.i);
  });
  box.addEventListener('mousedown', function (e) { if (e.target.hasAttribute('data-close')) e.preventDefault(); });
  box.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) close(true); });

  box.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowDown') { e.preventDefault(); select(sel + 1); }
    else if (k === 'ArrowUp') { e.preventDefault(); select(sel - 1); }
    else if (k === 'Home' && !input.value) { e.preventDefault(); select(0); }
    else if (k === 'End' && !input.value) { e.preventDefault(); select(shown.length - 1); }
    else if (k === 'Enter') { e.preventDefault(); run(sel); }
    else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (k === 'Tab') { e.preventDefault(); input.focus(); } // focus trap: the input is the only tab stop
  });
  document.addEventListener('focusin', function (e) {
    if (openState && !box.contains(e.target)) input.focus();
  });

  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if ((k === 'k' || k === 'K') && (e.metaKey || e.ctrlKey) && !e.altKey) {
      e.preventDefault();
      if (openState) close(true); else open();
      return;
    }
    if (k === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !openState) {
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      e.preventDefault();
      open();
    }
  });
  ['cmdHint', 'cmdIcon'].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.addEventListener('click', function () { open(b); });
  });
  window.__cmdk = { open: open, close: close };
})();

/* ---- Experience: pinned scroll story ---- */
(function () {
  var story = document.getElementById('story');
  if (!story) return;
  var stage = story.querySelector('.stage');
  var steps = Array.prototype.slice.call(story.querySelectorAll('.step'));
  var vizs = Array.prototype.slice.call(story.querySelectorAll('.viz'));
  var stepsBox = story.querySelector('.steps');
  var rail = story.querySelector('.rail');
  var mqWide = window.matchMedia('(min-width:735px)');
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pinned = false, active = -1, ticking = false, io = null, offIo = null, timers = [];

  function layoutRail() {
    if (!pinned || !rail) return;
    var first = steps[0].offsetTop + 14, last = steps[steps.length - 1].offsetTop + 14;
    rail.style.top = first + 'px';
    rail.style.height = (last - first) + 'px';
    var cur = active < 0 ? 0 : active;
    rail.style.setProperty('--fill', (steps[cur].offsetTop + 14 - first) + 'px');
  }
  function setActive(n) {
    if (n === active) return;
    var prev = active;
    active = n;
    steps.forEach(function (s, i) {
      s.classList.toggle('active', i === n);
      if (i === n) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current');
    });
    vizs.forEach(function (v, i) {
      v.classList.toggle('active', i === n);
      v.setAttribute('aria-hidden', i === n ? 'false' : 'true');
      if (i === n) { clearTimeout(timers[i]); v.classList.add('on'); }
      else if (i === prev) { timers[i] = setTimeout(function () { v.classList.remove('on'); }, 650); }
    });
    layoutRail();
  }
  function update() {
    ticking = false;
    if (!pinned) return;
    var r = story.getBoundingClientRect();
    var stick = parseFloat(getComputedStyle(stage).top) || 0;
    var total = r.height - stage.offsetHeight;
    var p = total > 0 ? Math.min(1, Math.max(0, (stick - r.top) / total)) : 0;
    setActive(Math.min(steps.length - 1, Math.floor(p * steps.length)));
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  function teardown() {
    if (io) { io.disconnect(); io = null; }
    timers.forEach(clearTimeout);
    steps.concat(vizs).forEach(function (e) { e.classList.remove('active', 'in', 'on'); e.removeAttribute('aria-hidden'); e.removeAttribute('aria-current'); });
    story.classList.remove('armed');
    active = -1;
  }
  function setup() {
    teardown();
    pinned = mqWide.matches && !mqReduce.matches && 'IntersectionObserver' in window;
    story.classList.toggle('pinned', pinned);
    if (pinned) {
      update();
      if (active < 0) setActive(0);
      layoutRail();
    } else if (mqReduce.matches || !('IntersectionObserver' in window)) {
      steps.concat(vizs).forEach(function (e) { e.classList.add('in', 'on'); });
    } else {
      story.classList.add('armed');
      io = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          if (e.target.classList.contains('viz')) e.target.classList.add('on');
          io.unobserve(e.target);
        });
      }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
      steps.concat(vizs).forEach(function (e) { io.observe(e); });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { onScroll(); layoutRail(); }, { passive: true });
  [mqWide, mqReduce].forEach(function (m) {
    if (m.addEventListener) m.addEventListener('change', setup); else if (m.addListener) m.addListener(setup);
  });
  // pause looping diagram animations while the story is offscreen
  if ('IntersectionObserver' in window) {
    offIo = new IntersectionObserver(function (en) { story.classList.toggle('off', !en[0].isIntersecting); }, { rootMargin: '80px' });
    offIo.observe(story);
  }
  setup();
  window.addEventListener('load', function () { layoutRail(); update(); });
})();

/* ---- Project case-study sheets ---- */
(function () {
  var cs = document.getElementById('cs');
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile[data-case]'));
  if (!cs || !tiles.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobileMq = window.matchMedia('(max-width:734px)');
  var sheet = document.getElementById('csSheet'), scroller = document.getElementById('csScroll');
  var prevB = document.getElementById('csPrev'), nextB = document.getElementById('csNext'), closeB = document.getElementById('csClose');
  var grab = document.getElementById('csGrab'), backdrop = cs.querySelector('.cs-backdrop');
  var EASE = 'cubic-bezier(.2,.8,.2,1)';

  function ecg() {
    var d = 'M0 110', x;
    function normal(x) {
      return ' L' + (x + 12) + ' 110 Q' + (x + 18) + ' 98 ' + (x + 24) + ' 110 L' + (x + 34) + ' 110 L' + (x + 38) + ' 118 L' + (x + 44) + ' 40 L' + (x + 50) + ' 134 L' + (x + 54) + ' 110 L' + (x + 66) + ' 110 Q' + (x + 76) + ' 92 ' + (x + 86) + ' 110 L' + (x + 100) + ' 110';
    }
    d += normal(0) + normal(100) + normal(200);
    var irr = ' L310 110 L316 96 L330 150 L346 22 L366 128 L384 110 Q410 70 430 110 L440 110';
    d += irr + normal(440) + normal(540);
    return { all: d, irr: 'M300 110' + irr };
  }
  var E = ecg();

  var ART = {
    thesis: '<svg viewBox="0 0 640 200" preserveAspectRatio="xMidYMid meet" focusable="false"><path class="a-grid" d="M40 50H600M40 100H600M40 150H600"/>' +
      '<path class="a-area" d="M60 150C120 140 150 100 210 110S290 140 340 90S420 60 460 40V180H60Z"/>' +
      '<path class="a-line dr" pathLength="1" d="M60 150C120 140 150 100 210 110S290 140 340 90S420 60 460 40"/>' +
      '<circle class="a-dot" cx="460" cy="40" r="6"/>' +
      '<g transform="translate(484 76)"><g class="a-bub-g"><path class="a-bub" d="M0 16A16 16 0 0 1 16 0h88a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H44L24 82V64H16A16 16 0 0 1 0 48Z"/><circle class="a-bd" cx="34" cy="32" r="5"/><circle class="a-bd" cx="60" cy="32" r="5"/><circle class="a-bd" cx="86" cy="32" r="5"/></g></g></svg>',
    soccer: (function () {
      var A = [[200, 70], [250, 120], [300, 60], [360, 110], [420, 80]], B = [[230, 150], [330, 140], [400, 150], [450, 120]];
      var g = '';
      A.forEach(function (p, i) {
        g += '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><g class="plr" style="--i:' + i + ';--dx:' + (i % 2 ? -10 : 12) + 'px;--dy:' + (i % 3 ? 8 : -8) + 'px"><circle class="p-a" r="5"/>' + (i < 4 ? '<rect class="p-box" style="--i:' + i + '" x="-13" y="-17" width="26" height="34" rx="2"/>' : '') + '</g></g>';
      });
      B.forEach(function (p, i) {
        g += '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><g class="plr" style="--i:' + (i + 5) + ';--dx:' + (i % 2 ? 10 : -12) + 'px;--dy:' + (i % 2 ? -8 : 8) + 'px"><circle class="p-b" r="5"/>' + (i < 2 ? '<rect class="p-box b" style="--i:' + (i + 4) + '" x="-13" y="-17" width="26" height="34" rx="2"/>' : '') + '</g></g>';
      });
      return '<svg viewBox="0 0 640 200" preserveAspectRatio="xMidYMid meet" focusable="false"><g class="a-thin"><rect x="120" y="20" width="400" height="160" rx="6"/><path d="M320 20V180"/><circle cx="320" cy="100" r="26"/><rect x="120" y="60" width="52" height="80"/><rect x="468" y="60" width="52" height="80"/><rect x="120" y="82" width="20" height="36"/><rect x="500" y="82" width="20" height="36"/></g>' + g + '</svg>';
    })(),
    food: '<svg viewBox="0 0 640 200" preserveAspectRatio="xMidYMid meet" focusable="false"><circle class="plate" cx="320" cy="100" r="72"/><circle class="plate2" cx="320" cy="100" r="52"/>' +
      '<g class="food-g"><ellipse class="f1" cx="300" cy="90" rx="20" ry="11" transform="rotate(-25 300 90)"/><circle class="f4" cx="338" cy="84" r="13"/><rect class="f2" x="316" y="108" width="34" height="22" rx="8" transform="rotate(12 333 119)"/><circle class="f3" cx="296" cy="122" r="8"/></g>' +
      '<path class="scan-frame" d="M232 52V30a8 8 0 0 1 8-8h22M378 22h22a8 8 0 0 1 8 8v22M408 148v22a8 8 0 0 1-8 8h-22M262 178h-22a8 8 0 0 1-8-8v-22"/>' +
      '<path class="scan-line" d="M246 38H394"/></svg>',
    arrhythmia: '<svg viewBox="0 0 640 200" preserveAspectRatio="xMidYMid meet" focusable="false"><path class="a-grid" d="M0 50H640M0 110H640M0 170H640"/><rect class="irr" x="296" y="12" width="150" height="176" rx="14"/>' +
      '<path class="ecg" pathLength="1" d="' + E.all + '"/><path class="ecg-warn" pathLength="1" d="' + E.irr + '"/></svg>'
  };

  var CASES = [
    { id: 'thesis', title: 'Thesis: AI-enhanced Portfolio Management Application', dates: 'Aug 2024 – May 2025',
      sum: 'An AI-powered app that brings financial theory together with LLM personalization.',
      does: 'Real-time portfolio analysis, personalized investment guidance, and intelligent monitoring of market-moving events, in a clean, modern UI.',
      built: ['Architected an AI-powered app integrating financial theory with LLM personalization to democratize tailored investment advice', 'Real-time portfolio analysis, personalized investment guidance, and intelligent monitoring of market-moving events, in a clean, modern UI'],
      stack: ['LLM', 'LLM personalization', 'Financial theory'], pop: 'Thesis' },
    { id: 'soccer', title: 'Soccer Analysis — Machine Learning', dates: 'Nov 2024 – Dec 2024',
      sum: 'A computer vision pipeline that reads players and referees from match footage.',
      does: 'Detects players and referees in match footage, assigns them to teams, tracks players across frames, and analyzes in-match movement to derive training-optimization insights.',
      built: ['Computer vision pipeline using YOLO to detect players and referees from match footage', 'Team assignment using jersey features and multi-frame player tracking', 'Analyzed in-match player movement to derive training-optimization insights'],
      stack: ['YOLO', 'Computer vision', 'Jersey features', 'Multi-frame player tracking'], pop: 'Soccer Analysis' },
    { id: 'food', title: 'AI Food Classification & Nutritional Information', dates: 'Jan 2025 – May 2025',
      sum: 'A food classification model deployed in a clean mobile app.',
      does: 'Classifies food from the Food-101 dataset and delivers it through a mobile app with a clean user experience.',
      built: ['Trained a food classification model on the Food-101 dataset', 'Flask backend and Flutter mobile app to deploy the model with a clean user experience'],
      stack: ['Food-101', 'Flask', 'Flutter'], pop: 'AI Food Classification' },
    { id: 'arrhythmia', title: 'Arrhythmia Classification Neural Network', dates: 'Aug 2024 – Dec 2024',
      sum: 'A comparison of neural network architectures for classifying arrhythmia.',
      does: 'Classifies arrhythmia with RNNs, DNNs, and hybrid models, comparing how each architecture performs.',
      built: ['Researched and implemented RNNs, DNNs, and hybrid models for arrhythmia classification', 'Trained and evaluated on the MIT Arrhythmia dataset to compare architecture performance'],
      stack: ['RNNs', 'DNNs', 'Hybrid models', 'MIT Arrhythmia dataset'], pop: 'Arrhythmia Classification' }
  ];

  function esc(t) { return String(t).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function lis(a) { return a.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join(''); }

  var idx = -1, isOpen = false, opener = null, anim = null, hideT;

  function fill(i) {
    var c = CASES[i];
    $('csArt').innerHTML = ART[c.id];
    $('csDates').textContent = c.dates;
    $('csTitle').textContent = c.title;
    $('csSum').textContent = c.sum;
    $('csDoes').textContent = c.does;
    $('csBuilt').innerHTML = lis(c.built);
    $('csStack').innerHTML = lis(c.stack);
    scroller.scrollTop = 0;
    var n = CASES.length;
    prevB.setAttribute('aria-label', 'Previous project: ' + CASES[(i + n - 1) % n].pop);
    nextB.setAttribute('aria-label', 'Next project: ' + CASES[(i + 1) % n].pop);
    tiles.forEach(function (t, k) { t.classList.toggle('cs-hide', k === i); });
  }

  function lock() {
    var sbw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = sbw > 0 ? sbw + 'px' : '';
    document.body.classList.add('cs-lock');
  }
  function unlock() {
    document.body.classList.remove('cs-lock');
    document.body.style.paddingRight = '';
  }
  function stop() { if (anim) { anim.cancel(); anim = null; } sheet.getAnimations({ subtree: true }).forEach(function (x) { if (x.effect && x.effect.target !== sheet && x.effect.target !== scroller && x.effect.target !== sheet.querySelector('.cs-bar')) return; x.cancel(); }); }
  function inView(r) { return r.bottom > 40 && r.top < window.innerHeight - 40 && r.right > 0 && r.left < window.innerWidth; }
  function contentFx(from, to, delay, dur) {
    [scroller, sheet.querySelector('.cs-bar')].forEach(function (el) {
      el.animate([{ opacity: from }, { opacity: to }], { duration: dur, delay: delay, easing: 'ease', fill: 'both' });
    });
  }

  function open(i, from, scrollFirst) {
    if (isOpen) return;
    var tile = tiles[i];
    if (scrollFirst && tile) tile.scrollIntoView({ block: 'center', behavior: 'instant' });
    idx = i; isOpen = true;
    opener = from || (tile && tile.querySelector('.tile-open')) || document.activeElement;
    var tr = tile.getBoundingClientRect();
    clearTimeout(hideT);
    fill(i);
    lock();
    cs.hidden = false;
    void cs.offsetWidth;
    cs.classList.add('open');
    stop();
    var sr = sheet.getBoundingClientRect();
    if (reduce) {
      anim = sheet.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease' });
    } else if (mobileMq.matches) {
      anim = sheet.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 460, easing: EASE });
    } else if (inView(tr)) {
      var dx = tr.left - sr.left, dy = tr.top - sr.top, sx = tr.width / sr.width, sy = tr.height / sr.height;
      sheet.style.transformOrigin = '0 0';
      anim = sheet.animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')', borderRadius: '24px' },
        { transform: 'none', borderRadius: '28px' }
      ], { duration: 540, easing: EASE });
      contentFx(0, 1, 230, 300);
    } else {
      sheet.style.transformOrigin = '50% 50%';
      anim = sheet.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: EASE });
    }
    sheet.focus({ preventScroll: true });
  }

  function finishClose() {
    cs.hidden = true;
    cs.classList.remove('open');
    unlock();
    tiles.forEach(function (t) { t.classList.remove('cs-hide'); });
    stop();
    sheet.style.transformOrigin = '';
    isOpen = false;
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }
  function close(fromDy) {
    if (!isOpen) return;
    isOpen = false; // guard against re-entry; finishClose restores state
    cs.classList.remove('open');
    stop();
    var tile = tiles[idx], tr = tile.getBoundingClientRect(), sr = sheet.getBoundingClientRect();
    var a;
    if (reduce) {
      a = sheet.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease', fill: 'forwards' });
    } else if (mobileMq.matches) {
      var start = fromDy || 0;
      a = sheet.animate([{ transform: 'translateY(' + start + 'px)' }, { transform: 'translateY(100%)' }], { duration: 320, easing: 'cubic-bezier(.4,0,.8,.4)', fill: 'forwards' });
    } else if (inView(tr)) {
      var dx = tr.left - sr.left, dy = tr.top - sr.top, sx = tr.width / sr.width, sy = tr.height / sr.height;
      sheet.style.transformOrigin = '0 0';
      contentFx(1, 0, 0, 160);
      a = sheet.animate([
        { transform: 'none', borderRadius: '28px' },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')', borderRadius: '24px' }
      ], { duration: 440, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    } else {
      a = sheet.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: 220, easing: 'ease', fill: 'forwards' });
    }
    anim = a;
    var done = function () { sheet.getAnimations({ subtree: true }).forEach(function (x) { x.cancel(); }); isOpen = true; finishClose(); };
    a.onfinish = done;
  }

  function go(step) {
    var n = CASES.length, next = (idx + step + n) % n;
    var fx = reduce ? 0 : 1;
    [scroller].forEach(function (el) {
      var o = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fx ? 130 : 1, easing: 'ease', fill: 'forwards' });
      o.onfinish = function () {
        idx = next; fill(next);
        o.cancel();
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: fx ? 260 : 1, easing: 'ease' });
       
      };
    });
  }

  tiles.forEach(function (t, i) {
    var b = t.querySelector('.tile-open');
    b.addEventListener('click', function () { open(i, b); });
  });
  prevB.addEventListener('click', function () { go(-1); });
  nextB.addEventListener('click', function () { go(1); });
  closeB.addEventListener('click', function () { close(); });
  cs.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) close(); });

  function paletteOpen() { var p = document.getElementById('cmdk'); return p && !p.hidden; }
  document.addEventListener('keydown', function (e) {
    if (!isOpen || paletteOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft' && e.target === sheet) { go(-1); }
    else if (e.key === 'ArrowRight' && e.target === sheet) { go(1); }
    else if (e.key === 'Tab') {
      var f = [prevB, nextB, closeB, scroller];
      var i = f.indexOf(document.activeElement);
      if (i < 0) { e.preventDefault(); (e.shiftKey ? scroller : prevB).focus(); return; }
      if (e.shiftKey && i === 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  document.addEventListener('focusin', function (e) {
    if (isOpen && !paletteOpen() && !sheet.contains(e.target)) sheet.focus({ preventScroll: true });
  });

  // swipe down on the drag handle (bottom-sheet mode)
  var drag = null;
  grab.addEventListener('pointerdown', function (e) {
    drag = { y: e.clientY, dy: 0, t: performance.now() };
    grab.setPointerCapture(e.pointerId);
    stop();
  });
  grab.addEventListener('pointermove', function (e) {
    if (!drag) return;
    drag.dy = Math.max(0, e.clientY - drag.y);
    sheet.style.transform = 'translateY(' + drag.dy + 'px)';
  });
  function endDrag() {
    if (!drag) return;
    var d = drag; drag = null;
    var fast = d.dy / Math.max(1, performance.now() - d.t) > 0.5;
    sheet.style.transform = '';
    if (d.dy > 110 || (fast && d.dy > 40)) close(d.dy);
    else if (d.dy > 0) sheet.animate([{ transform: 'translateY(' + d.dy + 'px)' }, { transform: 'none' }], { duration: 260, easing: EASE });
  }
  grab.addEventListener('pointerup', endDrag);
  grab.addEventListener('pointercancel', endDrag);

  window.__cs = {
    isOpen: function () { return isOpen; },
    cases: CASES.map(function (c) { return c.pop; }),
    open: function (i) { open(i, null, true); }
  };
})();

/* ---- DoF pipeline: travelling data packets, node tooltips (v13) ---- */
(function () {
  var pipe = document.getElementById('pipe');
  if (!pipe) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var svg = pipe.querySelector('.pipe-svg');
  var tip = document.getElementById('pipeTip');
  var nodes = {};
  Array.prototype.forEach.call(pipe.querySelectorAll('.pn'), function (n) { nodes[n.getAttribute('data-node')] = n; });

  /* tooltips */
  var cur = null;
  function showTip(n) {
    cur = n; n.classList.add('is-hot');
    tip.textContent = n.getAttribute('data-tip');
    tip.hidden = false;
    var pr = pipe.getBoundingClientRect(), r = n.getBoundingClientRect();
    var half = Math.min(130, tip.offsetWidth / 2);
    var x = Math.max(half, Math.min(pr.width - half, r.left - pr.left + r.width / 2));
    tip.style.left = x + 'px';
    tip.style.top = (r.top - pr.top - 8) + 'px';
    requestAnimationFrame(function () { tip.classList.add('show'); });
  }
  function hideTip(n) {
    n.classList.remove('is-hot');
    if (cur === n) { cur = null; tip.classList.remove('show'); setTimeout(function () { if (!cur) tip.hidden = true; }, 200); }
  }
  Object.keys(nodes).forEach(function (k) {
    var n = nodes[k];
    n.addEventListener('mouseenter', function () { showTip(n); });
    n.addEventListener('mouseleave', function () { hideTip(n); });
    n.addEventListener('focus', function () { showTip(n); });
    n.addEventListener('blur', function () { hideTip(n); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cur) hideTip(cur); });

  if (reduce) return;

  /* packets: one dot, driven by a looping timeline */
  var CYCLE = 8.4;
  function P(id) { var p = svg.querySelector('#' + id); return { el: p, len: p.getTotalLength() }; }
  var SEGS = [
    { p: P('pe-a'), t0: .3, d: 1.2, lab: 'raw club data', c: '--pipe-raw', pos: 'up', to: 'norm' },
    { p: P('pe-b'), t0: 1.9, d: 1.2, lab: 'normalized', c: '--pipe-norm', pos: 'up', to: 'rec' },
    { p: P('pe-c'), t0: 3.5, d: 1.2, lab: 'record + source', c: '--pipe-rec', pos: 'up', to: 'db' },
    { p: P('pe-d'), t0: 3.5, d: 1.2, lab: 'record + source', c: '--pipe-rec', pos: 'right', to: 'ai' },
    { p: P('pe-e'), t0: 5.1, d: 1.2, lab: 'narrative', c: '--pipe-ai', pos: 'up', to: 'game' },
    { p: P('pe-f'), t0: 5.1, d: 2.0, lab: 'refresh', c: '--pipe-raw', pos: 'down', to: 'prov' }
  ];
  var grp = document.getElementById('pipePkts');
  var tpl = { halo: grp.querySelector('.pkt-halo'), dot: grp.querySelector('.pkt-dot'), lab: grp.querySelector('.pkt-lab') };
  var items = SEGS.map(function () {
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.appendChild(tpl.halo.cloneNode()); g.appendChild(tpl.dot.cloneNode()); g.appendChild(tpl.lab.cloneNode());
    g.style.opacity = 0; grp.appendChild(g); return g;
  });
  grp.removeChild(tpl.halo); grp.removeChild(tpl.dot); grp.removeChild(tpl.lab);
  var colors = {}, cs;
  function readColors() {
    cs = getComputedStyle(pipe);
    ['--pipe-raw', '--pipe-norm', '--pipe-rec', '--pipe-ai'].forEach(function (k) { colors[k] = cs.getPropertyValue(k).trim(); });
    SEGS.forEach(function (s, i) {
      var g = items[i];
      g.children[0].style.fill = colors[s.c]; g.children[0].style.opacity = .18;
      g.children[1].style.fill = colors[s.c];
      g.children[2].textContent = s.lab; g.children[2].style.fill = colors[s.c];
    });
  }
  readColors();
  document.addEventListener('themechange', readColors);
  function ease(x) { return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

  var ARR = { norm: [1.5], rec: [3.1], db: [4.7], ai: [4.7], game: [6.3], prov: [.3, 7.1] };
  var litState = {};
  function frame(t) {
    SEGS.forEach(function (s, i) {
      var g = items[i], p = (t - s.t0) / s.d;
      if (p < 0 || p > 1) { g.style.opacity = 0; return; }
      var pt = s.p.el.getPointAtLength(ease(p) * s.p.len);
      var o = Math.min(1, p / .14, (1 - p) / .14);
      g.style.opacity = o;
      g.children[0].setAttribute('cx', pt.x); g.children[0].setAttribute('cy', pt.y);
      g.children[1].setAttribute('cx', pt.x); g.children[1].setAttribute('cy', pt.y);
      var l = g.children[2];
      l.setAttribute('text-anchor', s.pos === 'right' ? 'start' : 'middle');
      l.setAttribute('x', pt.x + (s.pos === 'right' ? 14 : 0));
      l.setAttribute('y', pt.y + (s.pos === 'up' ? -14 : s.pos === 'down' ? 22 : 4));
    });
    Object.keys(ARR).forEach(function (k) {
      var on = ARR[k].some(function (a) { var d = (t - a + CYCLE) % CYCLE; return d < .8; });
      if (litState[k] !== on) { litState[k] = on; nodes[k].classList.toggle('lit', on); }
    });
  }

  var raf = 0, last = 0, clock = 0, visible = false;
  function tick(now) {
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    clock = (clock + dt) % CYCLE;
    frame(clock);
    raf = requestAnimationFrame(tick);
  }
  function play() { if (raf || !visible || document.hidden) return; pipe.classList.add('run'); last = performance.now(); raf = requestAnimationFrame(tick); }
  function pause() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      visible ? play() : pause();
    }, { threshold: .25 }).observe(pipe);
  } else { visible = true; play(); }
  document.addEventListener('visibilitychange', function () { document.hidden ? pause() : play(); });
})();

/* ---- 30-second view overlay (v14); the content itself lives in the HTML so print works without JS ---- */
(function () {
  var box = document.getElementById('tldr');
  if (!box) return;
  var card = document.getElementById('tlCard');
  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bg = [document.getElementById('main'), document.getElementById('nav'), document.querySelector('.footer')].filter(Boolean);
  var isOpen = false, opener = null, t1;
  var FOCUS = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function paletteOpen() { var p = document.getElementById('cmdk'); return p && !p.hidden; }
  function open() {
    if (isOpen) return;
    isOpen = true; opener = document.activeElement;
    clearTimeout(t1);
    var main = bg[0];
    if (main) main.style.transformOrigin = '50% ' + Math.round(window.scrollY + window.innerHeight / 2 - main.offsetTop) + 'px';
    var f = bg[2]; if (f) f.style.transformOrigin = '50% ' + Math.round(window.scrollY + window.innerHeight / 2 - f.offsetTop) + 'px';
    box.classList.add('open'); box.scrollTop = 0;
    bg.forEach(function (e) { e.setAttribute('inert', ''); });
    card.offsetWidth;
    html.classList.add('tldr-open'); box.classList.add('shown');
    card.focus({ preventScroll: true });
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    box.classList.remove('shown'); html.classList.remove('tldr-open');
    bg.forEach(function (e) { e.removeAttribute('inert'); });
    t1 = setTimeout(function () { box.classList.remove('open'); }, reduce ? 0 : 450);
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }
  window.__tldr = { open: open, close: close };
  var hero = document.getElementById('tldrOpen');
  if (hero) hero.addEventListener('click', open);
  document.getElementById('tlClose').addEventListener('click', close);
  box.addEventListener('click', function (e) { if (e.target.closest('[data-tl-close]')) close(); });
  document.getElementById('tlPrint').addEventListener('click', function () { window.print(); });
  document.addEventListener('keydown', function (e) {
    if (!isOpen || paletteOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var els = Array.prototype.filter.call(box.querySelectorAll(FOCUS), function (n) { return n.offsetParent !== null; });
    if (!els.length) return;
    var first = els[0], last = els[els.length - 1], a = document.activeElement;
    if (!box.contains(a) || a === card) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  });
})();

/* ---- Microinteractions (v15): scroll progress, active nav, magnetic buttons, tilt, cursor spotlight ---- */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* section-aware nav (static state, kept under reduced motion) */
  (function () {
    var links = {};
    Array.prototype.forEach.call(document.querySelectorAll('#navLinks a'), function (a) { links[a.getAttribute('href').slice(1)] = a; });
    if (!('IntersectionObserver' in window)) return;
    var cur = null;
    function set(a) {
      if (a === cur) return;
      if (cur) { cur.classList.remove('active'); cur.removeAttribute('aria-current'); }
      cur = a;
      if (a) { a.classList.add('active'); a.setAttribute('aria-current', 'true'); }
    }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        var key = e.target.id || (e.target.classList.contains('tiles-section') ? 'projects' : '');
        set(links[key] || null);
      });
    }, { rootMargin: '-48% 0px -48% 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('main > section'), function (s) { io.observe(s); });
  })();

  if (reduce) return;

  /* scroll progress */
  (function () {
    var bar = document.getElementById('scrollProg');
    if (!bar) return;
    var queued = false;
    function upd() {
      queued = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? clamp(window.scrollY / max, 0, 1) : 0) + ')';
    }
    function q() { if (!queued) { queued = true; requestAnimationFrame(upd); } }
    window.addEventListener('scroll', q, { passive: true });
    window.addEventListener('resize', q);
    upd();
  })();

  if (!fine) return;

  /* cursor spotlight (dark theme only; CSS hides it in light) */
  (function () {
    var el = document.createElement('div');
    el.className = 'spot'; el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0, seen = false;
    function loop() {
      x += (tx - x) * .14; y += (ty - y) * .14;
      el.style.transform = 'translate3d(' + (x - 250).toFixed(1) + 'px,' + (y - 250).toFixed(1) + 'px,0)';
      raf = (Math.abs(tx - x) + Math.abs(ty - y) > .5) ? requestAnimationFrame(loop) : 0;
    }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      if (!seen) { seen = true; x = tx; y = ty; el.classList.add('on'); }
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { el.classList.remove('on'); seen = false; });
  })();

  /* magnetic buttons: pull toward the cursor within 60px, via the independent `translate` property so hover scale composes */
  (function () {
    var els = Array.prototype.slice.call(document.querySelectorAll('.cta-row .btn, #tldrOpen, .dof-cta .link'));
    if (!els.length) return;
    var R = 60, MAX = 6;
    var st = els.map(function (el) { el.setAttribute('data-magnet', ''); return { el: el, x: 0, y: 0, cx: 0, cy: 0, w: 0, h: 0, tx: 0, ty: 0 }; });
    var dirty = true, px = -999, py = -999, raf = 0;
    function measure() {
      st.forEach(function (s) {
        var r = s.el.getBoundingClientRect();
        s.w = r.width; s.h = r.height;
        s.cx = r.left + r.width / 2 - s.x; s.cy = r.top + r.height / 2 - s.y;
      });
      dirty = false;
    }
    function frame() {
      if (dirty) measure();
      var moving = false;
      st.forEach(function (s) {
        var dx = px - s.cx, dy = py - s.cy;
        var ex = Math.max(Math.abs(dx) - s.w / 2, 0), ey = Math.max(Math.abs(dy) - s.h / 2, 0);
        var d = Math.sqrt(ex * ex + ey * ey);
        if (d < R) {
          var k = 1 - d / R * .6;
          s.tx = clamp(dx * .14, -MAX, MAX) * k; s.ty = clamp(dy * .2, -MAX, MAX) * k;
        } else { s.tx = 0; s.ty = 0; }
        s.x += (s.tx - s.x) * .18; s.y += (s.ty - s.y) * .18;
        if (Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) > .02) moving = true;
        else { s.x = s.tx; s.y = s.ty; }
        s.el.style.translate = (s.x || s.y) ? s.x.toFixed(2) + 'px ' + s.y.toFixed(2) + 'px' : '';
      });
      raf = moving ? requestAnimationFrame(frame) : 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      px = e.clientX; py = e.clientY; kick();
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { px = py = -999; kick(); });
    window.addEventListener('scroll', function () { dirty = true; }, { passive: true });
    window.addEventListener('resize', function () { dirty = true; });
  })();

  /* 3D tilt + specular glare on project tiles and education cards */
  (function () {
    var els = Array.prototype.slice.call(document.querySelectorAll('.tile, .edu-card'));
    var MAXD = 5;
    var active = [];
    var raf = 0;
    els.forEach(function (el) {
      var g = document.createElement('span');
      g.className = 'tilt-glare'; g.setAttribute('aria-hidden', 'true');
      el.appendChild(g);
      var s = { el: el, rx: 0, ry: 0, trx: 0, try_: 0, rect: null, hover: false, gx: 50, gy: 50 };
      function setTarget(e) {
        if (!s.rect) s.rect = el.getBoundingClientRect();
        var r = s.rect;
        var nx = clamp((e.clientX - r.left) / r.width, 0, 1), ny = clamp((e.clientY - r.top) / r.height, 0, 1);
        s.try_ = (nx - .5) * 2 * MAXD; s.trx = -(ny - .5) * 2 * MAXD;
        s.gx = nx * 100; s.gy = ny * 100;
        kick();
      }
      el.addEventListener('pointerenter', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        if (!el.classList.contains('in')) return;
        s.hover = true; s.rect = el.getBoundingClientRect(); el.classList.add('tilt-live', 'tilt-hover'); setTarget(e);
      });
      el.addEventListener('pointermove', function (e) { if (s.hover) setTarget(e); }, { passive: true });
      el.addEventListener('pointerleave', function () { s.hover = false; s.trx = 0; s.try_ = 0; el.classList.remove('tilt-hover'); kick(); });
      window.addEventListener('scroll', function () { s.rect = null; }, { passive: true });
      active.push(s);
    });
    function frame() {
      var moving = false;
      active.forEach(function (s) {
        s.rx += (s.trx - s.rx) * .12; s.ry += (s.try_ - s.ry) * .12;
        var done = !s.hover && Math.abs(s.rx) + Math.abs(s.ry) < .01;
        if (done) {
          if (s.el.style.transform) s.el.style.transform = '';
          s.el.classList.remove('tilt-live');
        } else {
          moving = true;
          s.el.style.transform = 'perspective(900px) rotateX(' + s.rx.toFixed(3) + 'deg) rotateY(' + s.ry.toFixed(3) + 'deg)';
          s.el.style.setProperty('--gx', s.gx.toFixed(1) + '%'); s.el.style.setProperty('--gy', s.gy.toFixed(1) + '%');
        }
      });
      raf = moving ? requestAnimationFrame(frame) : 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  })();
})();

/* ---- Polaroid hobby wall (v16) ---- */
(function () {
  var wall = document.getElementById('wall');
  if (!wall) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tidyBtn = document.getElementById('tidyBtn');
  var hint = document.getElementById('wallHint');
  var pols = Array.prototype.slice.call(wall.querySelectorAll('.pol'));
  // deterministic scatter: normalised position (0..1 of free space) and rotation
  var SCATTER = [
    { x: 0.02, y: 0.10, r: -6 }, { x: 0.19, y: 0.82, r: 5 }, { x: 0.37, y: 0.04, r: -3 },
    { x: 0.55, y: 0.78, r: 7 }, { x: 0.74, y: 0.10, r: -8 }, { x: 0.97, y: 0.58, r: 3 }
  ];
  var PW = 190, PH = 226;
  var st = pols.map(function (el, i) {
    return { el: el, nx: SCATTER[i].x, ny: SCATTER[i].y, r: SCATTER[i].r, z: i + 1, flipped: false };
  });
  var zTop = pols.length + 1, tidy = false, dragging = null;
  var W = 0, H = 0;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function measure() { W = wall.clientWidth; H = wall.clientHeight; }
  function place(s, animate) {
    var x = s.nx * (W - PW), y = s.ny * (H - PH);
    s.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + s.r.toFixed(2) + 'deg)';
    s.el.style.zIndex = s.z;
  }
  function placeAll() { st.forEach(function (s) { place(s); }); }

  function tidyPositions() {
    var cols = W >= 720 ? 3 : 2, rows = Math.ceil(st.length / cols), gx = 28, gy = 22;
    var bw = cols * PW + (cols - 1) * gx, bh = rows * PH + (rows - 1) * gy;
    var ox = (W - bw) / 2, oy = (H - bh) / 2;
    return st.map(function (s, i) {
      var c = i % cols, r = Math.floor(i / cols);
      var x = ox + c * (PW + gx), y = oy + r * (PH + gy);
      return { x: x / (W - PW), y: y / (H - PH) };
    });
  }
  function setTidy(on) {
    tidy = on;
    if (on) {
      var t = tidyPositions();
      st.forEach(function (s, i) { s.nx = clamp(t[i].x, 0, 1); s.ny = clamp(t[i].y, 0, 1); s.r = 0; s.z = i + 1; });
    } else {
      st.forEach(function (s, i) { s.nx = SCATTER[i].x; s.ny = SCATTER[i].y; s.r = SCATTER[i].r; s.z = i + 1; });
    }
    zTop = st.length + 1;
    placeAll();
    tidyBtn.textContent = on ? 'Scatter' : 'Tidy up';
    tidyBtn.setAttribute('aria-label', on ? 'Scatter the polaroids' : 'Tidy up the polaroids into a grid');
  }

  function flip(s) {
    s.flipped = !s.flipped;
    s.el.classList.toggle('flipped', s.flipped);
    s.el.querySelector('.pol-back').setAttribute('aria-hidden', 'true');
  }
  function front(s) { s.z = ++zTop; s.el.style.zIndex = s.z; }
  function find(el) { for (var i = 0; i < st.length; i++) if (st[i].el === el) return st[i]; return null; }

  // ---- pointer drag ----
  var start = null;
  wall.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    var el = e.target.closest('.pol');
    if (!el) return;
    var s = find(el);
    start = { s: s, px: e.clientX, py: e.clientY, nx: s.nx, ny: s.ny, moved: false, lx: e.clientX, vx: 0, id: e.pointerId };
    front(s);
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
  });
  wall.addEventListener('pointermove', function (e) {
    if (!start || e.pointerId !== start.id) return;
    var s = start.s, dx = e.clientX - start.px, dy = e.clientY - start.py;
    if (!start.moved) {
      if (Math.abs(dx) + Math.abs(dy) < 5) return;
      start.moved = true; dragging = s;
      s.el.classList.add('drag', 'dragging');
      if (tidy) { tidy = false; tidyBtn.textContent = 'Tidy up'; tidyBtn.setAttribute('aria-label', 'Tidy up the polaroids into a grid'); }
    }
    var fx = W - PW, fy = H - PH;
    var x = clamp(start.nx * fx + dx, 0, fx), y = clamp(start.ny * fy + dy, 0, fy);
    s.nx = fx > 0 ? x / fx : 0; s.ny = fy > 0 ? y / fy : 0;
    start.vx = start.vx * 0.7 + (e.clientX - start.lx) * 0.3; start.lx = e.clientX;
    var lean = reduce ? 0 : clamp(start.vx * 0.9, -9, 9);
    var rot = (tidy ? 0 : s.r) + lean;
    s.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg)';
  });
  function endDrag(e) {
    if (!start || (e && e.pointerId !== start.id)) return;
    var s = start.s;
    if (start.moved) {
      s.el.classList.remove('drag', 'dragging');
      s.el.style.transition = '';
      place(s);                       // settles back to its resting rotation
      s.suppress = true;
      setTimeout(function () { s.suppress = false; }, 0);
    }
    dragging = null; start = null;
  }
  wall.addEventListener('pointerup', endDrag);
  wall.addEventListener('pointercancel', endDrag);
  wall.addEventListener('click', function (e) {
    var el = e.target.closest('.pol');
    var s = el && find(el);
    if (s && s.suppress) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  wall.addEventListener('dblclick', function (e) {
    var el = e.target.closest('.pol');
    if (el) { var s = find(el); front(s); flip(s); }
  });

  // ---- keyboard ----
  wall.addEventListener('keydown', function (e) {
    var el = e.target.closest && e.target.closest('.pol');
    if (!el) return;
    var s = find(el), k = e.key;
    if (k === 'Enter') { e.preventDefault(); front(s); flip(s); return; }
    var step = e.shiftKey ? 48 : 16, dx = 0, dy = 0;
    if (k === 'ArrowLeft') dx = -step; else if (k === 'ArrowRight') dx = step;
    else if (k === 'ArrowUp') dy = -step; else if (k === 'ArrowDown') dy = step;
    else return;
    e.preventDefault();
    var fx = W - PW, fy = H - PH;
    s.nx = clamp((s.nx * fx + dx) / fx, 0, 1); s.ny = clamp((s.ny * fy + dy) / fy, 0, 1);
    if (tidy) { tidy = false; tidyBtn.textContent = 'Tidy up'; }
    place(s);
  });
  // Space would "click" the button; let it flip too
  wall.addEventListener('keyup', function (e) {
    var el = e.target.closest && e.target.closest('.pol');
    if (el && e.key === ' ') { e.preventDefault(); var s = find(el); front(s); flip(s); }
  });
  wall.addEventListener('keydown', function (e) { if (e.key === ' ' && e.target.closest('.pol')) e.preventDefault(); });

  tidyBtn.addEventListener('click', function () { setTidy(!tidy); });

  // ---- init ----
  measure(); placeAll();
  tidyBtn.hidden = false; hint.hidden = false;
  if ('ResizeObserver' in window) {
    var lastW = W, lastH = H;
    new ResizeObserver(function () {
      measure();
      if (W === lastW && H === lastH) return;
      lastW = W; lastH = H;
      if (tidy) setTidy(true); else placeAll();
    }).observe(wall);
  } else window.addEventListener('resize', function () { measure(); placeAll(); });

  // drop in one by one when the wall enters view
  var dropped = false;
  function dropAll() {
    if (dropped) return; dropped = true;
    st.forEach(function (s, i) {
      if (reduce) { s.el.classList.add('in'); return; }
      setTimeout(function () { s.el.classList.add('in'); }, 160 + i * 170);
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { dropAll(); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(wall);
  } else dropAll();
})();


/* ---- Multilingual hello (v17) ---- */
(function () {
  var btn = document.getElementById('hello');
  if (!btn) return;
  var stage = btn.querySelector('.hello-stage');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var L = [
    { w: 'Hello', l: 'English', c: 'en' }, { w: 'नमस्ते', l: 'Hindi', c: 'hi' },
    { w: '你好', l: 'Mandarin', c: 'zh-Hans' }, { w: 'Hola', l: 'Spanish', c: 'es' },
    { w: 'Bonjour', l: 'French', c: 'fr' }
  ];
  var HOLD = reduce ? 3000 : 2200;
  var idx = 0, cur = stage.querySelector('.hello-item'), timer = 0, paused = false, visible = true, hovering = false;

  function make(d) {
    var it = document.createElement('span'); it.className = 'hello-item';
    var w = document.createElement('span'); w.className = 'hello-word'; w.lang = d.c; w.textContent = d.w;
    var l = document.createElement('span'); l.className = 'hello-lang'; l.textContent = d.l;
    it.appendChild(w); it.appendChild(l);
    return it;
  }
  // split into characters (Hindi stays whole: splitting would break its conjunct shaping)
  function chars(item, d) {
    var w = item.querySelector('.hello-word');
    if (reduce || d.c === 'hi' || w.querySelector('.hello-ch')) return w.querySelectorAll('.hello-ch');
    var arr = Array.from(d.w);
    w.textContent = '';
    arr.forEach(function (ch) { var s = document.createElement('span'); s.className = 'hello-ch'; s.textContent = ch; w.appendChild(s); });
    return w.querySelectorAll('.hello-ch');
  }
  function go(n) {
    var from = L[idx], to = L[n], old = cur;
    idx = n;
    var nu = make(to); stage.appendChild(nu); cur = nu;
    if (reduce) {
      nu.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'both' });
      old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'both' }).onfinish = function () { old.remove(); };
      return;
    }
    var oc = chars(old, from), ease = 'cubic-bezier(.2,.7,.2,1)';
    var parts = oc.length ? Array.prototype.slice.call(oc) : [old.querySelector('.hello-word')];
    var last;
    parts.forEach(function (p, i) {
      last = p.animate([{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }, { opacity: 0, transform: 'translateY(-16px)', filter: 'blur(9px)' }],
        { duration: 520, delay: i * 38, easing: ease, fill: 'both' });
    });
    old.querySelector('.hello-lang').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'both' });
    setTimeout(function () { old.remove(); }, 520 + parts.length * 38 + 60);
    var nc = chars(nu, to);
    var np = nc.length ? Array.prototype.slice.call(nc) : [nu.querySelector('.hello-word')];
    np.forEach(function (p, i) {
      p.animate([{ opacity: 0, transform: 'translateY(16px)', filter: 'blur(9px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }],
        { duration: 640, delay: 180 + i * 48, easing: ease, fill: 'both' });
    });
    nu.querySelector('.hello-lang').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 320, fill: 'both' });
  }
  function next() { go((idx + 1) % L.length); }
  function stop() { clearTimeout(timer); timer = 0; }
  function arm() {
    stop();
    if (paused || !visible || document.hidden || hovering) return;
    timer = setTimeout(function () { next(); arm(); }, HOLD);
  }
  btn.addEventListener('mouseenter', function () { hovering = true; stop(); });
  btn.addEventListener('mouseleave', function () { hovering = false; arm(); });
  btn.addEventListener('focus', function () { if (btn.matches(':focus-visible')) { paused = true; stop(); } });
  btn.addEventListener('blur', function () { paused = false; arm(); });
  btn.addEventListener('click', function () { next(); arm(); });
  document.addEventListener('visibilitychange', arm);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; arm(); }, { threshold: 0.2 }).observe(btn);
  }
  arm();
})();

/* ---- Keepy-uppy easter egg (v18): Konami code, palette action, or tossing one pebble up three times ---- */
(function () {
  var box = document.getElementById('kup');
  if (!box) return;
  var dlg = document.getElementById('kupDialog'), cv = document.getElementById('kupCanvas'), ctx = cv.getContext('2d');
  var countEl = document.getElementById('kupCount'), bestEl = document.getElementById('kupBest'), oleEl = document.getElementById('kupOle');
  var hintEl = document.getElementById('kupHint'), card = document.getElementById('kupCard'), msgEl = document.getElementById('kupMsg'), subEl = document.getElementById('kupSub');
  var liveEl = document.getElementById('kupLive'), closeBtn = document.getElementById('kupClose'), againBtn = document.getElementById('kupAgain'), backBtn = document.getElementById('kupBack');
  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bg = [document.getElementById('main'), document.getElementById('nav'), document.querySelector('.footer')].filter(Boolean);

  var best = 0;                       // this session only, kept in memory: no storage
  var isOpen = false, opener = null, raf = 0, last = 0, tClose = 0;
  var W = 0, H = 0, dpr = 1, gh = 110, floorY = 0, R = 40, G = 0, KICK = 0;
  var ball, count, state, pts, mouse = { x: -999, y: -999 }, confetti = [], col = {}, bob = 0, shake = 0;

  function readColors() {
    var cs = getComputedStyle(box);
    function v(n) { return cs.getPropertyValue(n).trim(); }
    col = { s1: v('--kup-sky-1'), s2: v('--kup-sky-2'), g1: v('--kup-gr-1'), g2: v('--kup-gr-2'), line: v('--kup-line'),
      conf: [v('--accent'), v('--together-1'), v('--together-2'), v('--together-3'), v('--human-1')] };
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    gh = Math.max(84, Math.round(H * 0.16));
    floorY = H - gh + Math.round(gh * 0.32);
    R = Math.max(30, Math.min(46, Math.round(Math.min(W, H) * 0.05)));
    G = H * 2.0;                      // px/s^2: tuned for a floaty-but-urgent feel
    KICK = H * 1.18;                  // px/s: apex roughly a third of the screen
    box.style.setProperty('--kup-gh', gh + 'px');
    if (ball) { ball.x = Math.max(R, Math.min(W - R, ball.x)); ball.y = Math.min(ball.y, floorY - R); }
  }
  function reset() {
    ball = { x: W / 2, y: H * 0.3, vx: 0, vy: 0, a: 0, w: 0 };
    count = 0; state = 'ready'; confetti = []; bob = 0;
    countEl.textContent = '0'; updBest();
    card.hidden = true; hintEl.classList.remove('off');
  }
  function updBest() { bestEl.textContent = best > 0 ? 'Best this session: ' + Math.max(best, count || 0) : ''; }

  function kick(px, py) {
    if (state === 'over') return;
    var hx = Math.max(-1, Math.min(1, (ball.x - px) / R));    // hit the left side and it goes right
    var hy = Math.max(-1, Math.min(1, (ball.y - py) / R));    // hit it low for a cleaner lift
    ball.vy = -KICK * (0.88 + 0.12 * Math.max(0, -hy)) * (1 - 0.18 * Math.abs(hx));
    ball.vx = hx * KICK * 0.42 + ball.vx * 0.15;
    ball.w = (ball.vx / R) * 0.9 - hx * 5;
    if (state === 'ready') { state = 'play'; hintEl.classList.add('off'); }
    count++;
    countEl.textContent = count; updBest();
    if (!reduce) countEl.animate([{ transform: 'scale(1.14)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)' });
    liveEl.textContent = '';
    if (count % 10 === 0) ole();
    if (count >= 25 && count % 5 === 0 && !reduce) burst(ball.x, ball.y, count % 10 === 0 ? 70 : 40);
  }
  function ole() {
    oleEl.textContent = count >= 50 ? 'Olé! Olé! Olé!' : 'Olé!';
    oleEl.style.marginLeft = (Math.random() * 40 - 20) + 'vw';
    oleEl.getAnimations().forEach(function (a) { a.cancel(); });
    oleEl.animate(reduce ? [{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 0 }] :
      [{ opacity: 0, transform: 'translateX(-50%) translateY(18px) scale(.8)' }, { opacity: 1, transform: 'translateX(-50%) translateY(-6px) scale(1.05)', offset: .25 }, { opacity: 1, transform: 'translateX(-50%) translateY(-18px) scale(1)', offset: .7 }, { opacity: 0, transform: 'translateX(-50%) translateY(-40px) scale(1)' }],
      { duration: 1100, easing: 'cubic-bezier(.2,.7,.2,1)' });
  }
  function burst(x, y, n) {
    for (var i = 0; i < n; i++) {
      var an = Math.random() * Math.PI * 2, sp = 200 + Math.random() * 560;
      confetti.push({ x: x, y: y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 320, r: Math.random() * 6, vr: (Math.random() - .5) * 14,
        w: 6 + Math.random() * 6, h: 3 + Math.random() * 4, c: col.conf[i % col.conf.length], life: 1.8 + Math.random() * 1.2 });
    }
  }
  function over() {
    state = 'over';
    var newBest = count > best;
    if (newBest) best = count;
    updBest();
    msgEl.textContent = 'You kept it up ' + count + (count === 1 ? ' time.' : ' times.');
    subEl.textContent = newBest && count > 0 ? 'New best this session.' : 'Best this session: ' + best;
    liveEl.textContent = msgEl.textContent + ' ' + subEl.textContent;
    card.hidden = false;
    if (!reduce) { card.classList.remove('pop'); card.offsetWidth; card.classList.add('pop'); shake = 0.25; }
    againBtn.focus({ preventScroll: true });
  }

  /* ---- simulation + drawing ---- */
  function step(dt) {
    if (state === 'ready') { bob += dt; ball.y = H * 0.3 + Math.sin(bob * 2.4) * 8; ball.w = Math.sin(bob * 1.2) * 0.6; ball.a += ball.w * dt; return; }
    ball.vy += G * dt;
    ball.vx *= 1 - 0.12 * dt;
    ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.a += ball.w * dt;
    if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx) * 0.82; ball.w = ball.vx / R * 0.9; }
    else if (ball.x > W - R) { ball.x = W - R; ball.vx = -Math.abs(ball.vx) * 0.82; ball.w = ball.vx / R * 0.9; }
    if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy) * 0.4; }
    if (ball.y + R >= floorY) {
      ball.y = floorY - R;
      if (state === 'play') { over(); ball.vy = -Math.abs(ball.vy) * 0.38; }
      else { ball.vy = Math.abs(ball.vy) > 90 ? -Math.abs(ball.vy) * 0.42 : 0; ball.vx *= 0.9; ball.w = ball.vx / R * 0.9; }
    }
  }
  function pent(cx, cy, r, rot) {
    ctx.beginPath();
    for (var i = 0; i < 5; i++) { var a = rot - Math.PI / 2 + i * Math.PI * 2 / 5; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    ctx.closePath();
  }
  function drawBall() {
    var x = ball.x, y = ball.y;
    // ground shadow scales with height
    var hgt = Math.max(0, floorY - (y + R)), k = Math.max(0, 1 - hgt / (H * 0.7));
    ctx.save(); ctx.translate(x, floorY); ctx.scale(1, 0.26);
    var sg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * (0.7 + 0.5 * k));
    sg.addColorStop(0, 'rgba(0,0,0,' + (0.1 + 0.4 * k).toFixed(3) + ')'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, R * (0.7 + 0.5 * k), 0, 7); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.clip();
    ctx.fillStyle = '#f6f4ee'; ctx.fillRect(-R, -R, R * 2, R * 2);
    ctx.rotate(ball.a);
    ctx.fillStyle = '#23242a'; ctx.strokeStyle = '#23242a'; ctx.lineJoin = 'round'; ctx.lineWidth = R * 0.05;
    pent(0, 0, R * 0.36, 0); ctx.fill(); ctx.stroke();
    for (var i = 0; i < 5; i++) {
      var a = -Math.PI / 2 + i * Math.PI * 2 / 5, c = Math.cos(a), s = Math.sin(a);
      ctx.beginPath(); ctx.moveTo(c * R * 0.36, s * R * 0.36); ctx.lineTo(c * R * 0.68, s * R * 0.68); ctx.lineWidth = R * 0.045; ctx.stroke();
      pent(c * R * 1.04, s * R * 1.04, R * 0.34, a + Math.PI / 2 + Math.PI / 5 * 0 + Math.PI / 5); ctx.fill(); ctx.stroke();
    }
    ctx.rotate(-ball.a);
    var g = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R * 1.05);
    g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(10,10,30,.38)');
    ctx.fillStyle = g; ctx.fillRect(-R, -R, R * 2, R * 2);
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1; ctx.stroke();
  }
  function draw(dt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (shake > 0) { ctx.translate((Math.random() - .5) * shake * 20, (Math.random() - .5) * shake * 20); shake = Math.max(0, shake - dt); }
    var sk = ctx.createLinearGradient(0, 0, 0, H - gh);
    sk.addColorStop(0, col.s1); sk.addColorStop(1, col.s2);
    ctx.globalAlpha = 0.92; ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H - gh + 1); ctx.globalAlpha = 1;
    // pitch strip
    var gt = H - gh, gg = ctx.createLinearGradient(0, gt, 0, H);
    gg.addColorStop(0, col.g1); gg.addColorStop(1, col.g2);
    ctx.fillStyle = gg; ctx.fillRect(0, gt, W, gh);
    ctx.fillStyle = 'rgba(255,255,255,.07)';
    for (var i = -1; i < W / 120 + 1; i += 2) { ctx.beginPath(); ctx.moveTo(i * 120 + 40, gt); ctx.lineTo(i * 120 + 120 + 40, gt); ctx.lineTo(i * 120 + 120 + 90, H); ctx.lineTo(i * 120 + 90, H); ctx.fill(); }
    ctx.fillStyle = col.line; ctx.fillRect(0, gt, W, 2);
    drawBall();
    for (var j = confetti.length - 1; j >= 0; j--) {
      var p = confetti[j]; p.vy += G * 0.35 * dt; p.vx *= 1 - 0.8 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life -= dt;
      if (p.life <= 0 || p.y > H + 20) { confetti.splice(j, 1); continue; }
      ctx.save(); ctx.globalAlpha = Math.min(1, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.cos(p.r * 1.7)); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
  }
  function frame(now) {
    raf = 0;
    if (!isOpen) return;
    var dt = Math.min((now - last) / 1000, 1 / 30); last = now;
    // two substeps keep the bounce stable on slow frames
    step(dt / 2); step(dt / 2);
    draw(dt);
    raf = requestAnimationFrame(frame);
  }
  function startLoop() { if (!raf && isOpen && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stopLoop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  /* ---- open / close ---- */
  function open() {
    if (isOpen) return;
    isOpen = true; opener = document.activeElement; clearTimeout(tClose);
    readColors(); resize(); reset();
    bg.forEach(function (e) { e.setAttribute('inert', ''); });
    box.hidden = false; box.offsetWidth; box.classList.add('shown');
    html.classList.add('kup-open');
    dlg.focus({ preventScroll: true });
    startLoop();
  }
  function close() {
    if (!isOpen) return;
    isOpen = false; stopLoop();
    box.classList.remove('shown'); html.classList.remove('kup-open');
    bg.forEach(function (e) { e.removeAttribute('inert'); });
    tClose = setTimeout(function () { box.hidden = true; }, reduce ? 0 : 300);
    if (opener && opener.focus && document.contains(opener)) opener.focus({ preventScroll: true });
  }
  window.__kup = { open: open, close: close };

  /* ---- input ---- */
  cv.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
  cv.addEventListener('pointerdown', function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (state === 'over' || !ball) return;
    var dx = e.clientX - ball.x, dy = e.clientY - ball.y;
    if (dx * dx + dy * dy <= R * R * 2.1) kick(e.clientX, e.clientY);
  });
  closeBtn.addEventListener('click', close);
  backBtn.addEventListener('click', close);
  againBtn.addEventListener('click', function () { reset(); dlg.focus({ preventScroll: true }); });
  window.addEventListener('resize', function () { if (isOpen) resize(); });
  document.addEventListener('themechange', function () { readColors(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopLoop(); else startLoop(); });
  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === ' ' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      if (!e.repeat && state !== 'over') {
        var dx = mouse.x - ball.x, dy = mouse.y - ball.y;
        if (dx * dx + dy * dy <= R * R * 9) kick(mouse.x, mouse.y);    // only when the cursor is near the ball
      }
      return;
    }
    if (e.key === 'Tab') {   // focus trap
      var els = [closeBtn].concat(card.hidden ? [] : [againBtn, backBtn]);
      var i = els.indexOf(document.activeElement);
      e.preventDefault();
      if (e.shiftKey) els[(i <= 0 ? els.length : i) - 1].focus(); else els[(i + 1) % els.length].focus();
    }
  }, true);
  document.addEventListener('focusin', function (e) { if (isOpen && !box.contains(e.target)) dlg.focus({ preventScroll: true }); });

  /* ---- Konami code ---- */
  var SEQ = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'], pos = 0;
  document.addEventListener('keydown', function (e) {
    if (isOpen || e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) { pos = 0; return; }
    var k = e.key.toLowerCase();
    if (k === SEQ[pos]) pos++; else pos = (k === SEQ[0]) ? 1 : 0;
    if (pos === SEQ.length) {
      pos = 0;
      var busy = document.querySelector('#cmdk:not([hidden]), #cs:not([hidden])') || html.classList.contains('tldr-open');
      if (!busy) open();
    }
  });
})();


/* ---- Scroll-scrubbed sequence (v19): progress from scroll, lerped in rAF, every visual a pure function of progress ---- */
(function () {
  var sec = document.getElementById('scrub');
  if (!sec) return;
  var mqR = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mqR.matches || !('IntersectionObserver' in window)) return;   // stacked list stays
  var root = document.documentElement;
  var frames = Array.prototype.slice.call(sec.querySelectorAll('.sc-frame'));
  var words = frames.map(function (f) { return f.querySelector('.sc-word'); });
  var caps = frames.map(function (f) { return f.querySelector('.sc-cap'); });
  var bg = document.getElementById('scBg'), line = document.getElementById('scLine'), num = document.getElementById('scNum');
  var N = frames.length, NS = 'http://www.w3.org/2000/svg';
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function el(tag, attrs, cls, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (cls) e.setAttribute('class', cls);
    if (parent) parent.appendChild(e);
    return e;
  }
  function div(cls, parent) { var d = document.createElement('div'); d.className = cls; parent.appendChild(d); return d; }

  /* ---- motifs ---- */
  var motifs = [], nodes = [], phones = [], layers = [], rings = [];
  // 0 AI: neural lattice
  (function () {
    var m = div('sc-m', bg), svg = el('svg', { viewBox: '0 0 400 400' }, '', m);
    var cols = [3, 4, 5, 4, 3], pts = [];
    cols.forEach(function (n, c) {
      var col = [];
      for (var i = 0; i < n; i++) col.push({ x: 40 + c * 80, y: 200 + (i - (n - 1) / 2) * 62, c: c, i: i });
      pts.push(col);
    });
    var eg = el('g', {}, '', svg), ng = el('g', {}, '', svg);
    for (var c = 0; c < pts.length - 1; c++) pts[c].forEach(function (a) { pts[c + 1].forEach(function (b) {
      el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y }, 'st', eg).style.opacity = '.35';
    }); });
    pts.forEach(function (col) { col.forEach(function (p) {
      var n = el('circle', { cx: p.x, cy: p.y, r: 7 }, (p.c + p.i) % 3 === 0 ? 'ac' : 'nd', ng);
      n.style.transformBox = 'fill-box'; n.style.transformOrigin = 'center';
      nodes.push({ e: n, p: p });
    }); });
    motifs.push(m);
  })();
  // 1 Mobile: phones in perspective
  (function () {
    var m = div('sc-m sc-m3d', bg), st = div('sc-st', m);
    st.style.transform = 'rotateX(10deg) rotateY(-26deg)';
    for (var i = 0; i < 3; i++) phones.push(div('sc-ph', st));
    motifs.push(m);
  })();
  // 2 Full-stack: stacked layers
  (function () {
    var m = div('sc-m sc-m3d', bg), st = div('sc-st', m);
    st.style.transform = 'rotateX(62deg) rotateZ(-34deg)';
    for (var i = 0; i < 5; i++) layers.push(div('sc-ly', st));
    motifs.push(m);
  })();
  // 3 Security: concentric rings + shield
  (function () {
    var m = div('sc-m', bg), svg = el('svg', { viewBox: '0 0 400 400' }, '', m);
    [190, 160, 130, 100, 70].forEach(function (r, i) {
      var c = el('circle', { cx: 200, cy: 200, r: r }, 'st', svg);
      var circ = 2 * Math.PI * r;
      if (i % 2) c.setAttribute('stroke-dasharray', (circ / 28).toFixed(1) + ' ' + (circ / 28).toFixed(1));
      c.style.transformBox = 'fill-box'; c.style.transformOrigin = 'center';
      rings.push({ e: c, i: i });
    });
    el('path', { d: 'M200 148l44 16v34c0 26-18 42-44 54-26-12-44-28-44-54v-34z' }, 'st', svg);
    el('rect', { x: 188, y: 192, width: 24, height: 20, rx: 4 }, 'ac', svg);
    el('path', { d: 'M192 192v-7a8 8 0 0 1 16 0v7' }, 'st', svg);
    motifs.push(m);
  })();

  /* ---- render: every value is a function of f (0..N-1) ---- */
  var lastFrame = -1;
  function ease(t) { return t * t * (3 - 2 * t); }
  function render(p) {
    var f = p * (N - 1);
    for (var i = 0; i < N; i++) {
      var d = f - i, ad = Math.abs(d);
      var e = d === 0 ? 0 : (d > 0 ? 1 : -1) * Math.max(0, ad - 0.22) / 0.78;   // plateau of +-0.22 where the word is crisp
      var w = words[i].style, c = caps[i].style, fs = frames[i].style, vis = clamp(1 - Math.abs(e), 0, 1), k = ease(vis);
      if (vis <= 0) { fs.opacity = '0'; fs.visibility = 'hidden'; motifs[i].style.opacity = '0'; continue; }
      fs.visibility = 'visible';
      if (e <= 0) {   // incoming: sharpens from a smaller scale
        fs.opacity = String(clamp(k * 1.15, 0, 1));
        w.transform = 'scale(' + (0.7 + 0.3 * k).toFixed(4) + ')';
        w.filter = 'blur(' + ((1 - k) * 16).toFixed(2) + 'px)';
        w.letterSpacing = (-0.05 - (1 - k) * 0.05).toFixed(4) + 'em';
        c.transform = 'translateY(' + ((1 - k) * 24).toFixed(2) + 'px)';
        c.opacity = String(clamp((k - 0.35) / 0.65, 0, 1));
      } else {        // outgoing: scales up and blurs away
        fs.opacity = String(clamp(1 - e * 1.7, 0, 1));
        w.transform = 'scale(' + (1 + e * 1.5).toFixed(4) + ')';
        w.filter = 'blur(' + (e * 20).toFixed(2) + 'px)';
        w.letterSpacing = (-0.05 + e * 0.035).toFixed(4) + 'em';
        c.transform = 'translateY(' + (-e * 18).toFixed(2) + 'px)';
        c.opacity = String(clamp(1 - e * 1.6, 0, 1));
      }
      motifs[i].style.opacity = (0.2 * k).toFixed(3);
    }
    // motif motion, driven by progress
    var a = f - 0, vA = 1 - clamp(Math.abs(f - 0) * 1.2, 0, 1);
    nodes.forEach(function (n) {
      var s = 1 + 0.32 * Math.sin(f * 7 + n.p.c * 1.3 + n.p.i * 0.9);
      n.e.style.transform = 'scale(' + s.toFixed(3) + ')';
    });
    var fm = f - 1;
    phones.forEach(function (ph, j) {
      var o = (j - 1);
      ph.style.transform = 'translate3d(' + (o * (70 + 40 * fm)).toFixed(1) + 'px,' + (-fm * 18 * o).toFixed(1) + 'px,' + (o * -60 - fm * 40).toFixed(1) + 'px)';
    });
    var fl = clamp(f - 2 + 1, 0, 1.6);
    layers.forEach(function (l, j) {
      var o = j - 2;
      l.style.transform = 'translateZ(' + (o * (14 + 54 * ease(clamp(fl, 0, 1)))).toFixed(1) + 'px)';
    });
    rings.forEach(function (r) {
      var dir = r.i % 2 ? -1 : 1;
      r.e.style.transform = 'rotate(' + (dir * f * 40 * (r.i + 1) * 0.35).toFixed(2) + 'deg) scale(' + (1 + 0.04 * Math.sin(f * 5 + r.i)).toFixed(3) + ')';
    });
    line.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    var cur = clamp(Math.round(f), 0, N - 1);
    if (cur !== lastFrame) { lastFrame = cur; num.textContent = '0' + (cur + 1); }
  }

  /* ---- scroll -> progress -> lerp ---- */
  var cur = 0, target = 0, raf = 0, near = true, active = false;
  function readTarget() {
    var r = sec.getBoundingClientRect(), nav = 48;
    var travel = sec.offsetHeight - (window.innerHeight - nav);
    target = travel > 0 ? clamp((nav - r.top) / travel, 0, 1) : 0;
  }
  function tick() {
    raf = 0;
    if (!near || document.hidden) return;
    readTarget();
    cur += (target - cur) * 0.14;
    if (Math.abs(target - cur) < 0.0004) cur = target;
    render(cur);
    if (cur !== target) raf = requestAnimationFrame(tick);
  }
  function kick() { if (!raf && near && !document.hidden) raf = requestAnimationFrame(tick); }
  function enable() {
    if (active) return;
    active = true; root.classList.add('sc-on');
    readTarget(); cur = target; render(cur);
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
  }
  function disable() {
    if (!active) return;
    active = false; root.classList.remove('sc-on');
    window.removeEventListener('scroll', kick); window.removeEventListener('resize', kick);
    frames.forEach(function (f) { f.removeAttribute('style'); });
    words.concat(caps).forEach(function (n) { n.removeAttribute('style'); });
  }
  new IntersectionObserver(function (en) { near = en[0].isIntersecting; if (near) { readTarget(); kick(); } }, { rootMargin: '200px 0px' }).observe(sec);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
  var onRM = function () { mqR.matches ? disable() : enable(); };
  if (mqR.addEventListener) mqR.addEventListener('change', onRM);
  enable();
})();
