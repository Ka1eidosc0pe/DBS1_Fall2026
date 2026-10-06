// The only thing to edit when adding a version: append an entry here.
const VERSIONS = [
  { id: 'v01', title: 'Apple-inspired foundation', note: 'First iteration. Clean, product-page elegance inspired by Apple: translucent sticky nav, oversized tight headlines, spec-style stats, a dark featured-project section, rounded tiles, and subtle scroll reveals. (GPA later redacted, with a wink.)' },
  { id: 'v02', title: 'A more human headline', note: 'New hero line where "artificial" is struck through and replaced by "human". GPA removed; the stats now lead with five cities called home. LinkedIn and GitHub added to the contact section and footer.' },
  { id: 'v03', title: 'Five cities, one journey', note: 'New animated flight path from Mumbai to Singapore, Boston, Houston and Chicago. Each city card shows its live local time over a sky that matches the hour. Stats are now uniform, and the closing line adds a warm, letter-by-letter "Together."' },
  { id: 'v04', title: 'Skylines and a long-haul joke', note: 'Each city card gets a translucent landmark silhouette: Sea Link, Marina Bay Sands, Boston steeples, a Houston rocket, Willis Tower and the Bean. Fixed the route turning blue ahead of the plane. Added a wink on the long Singapore to Boston leg. Cleaner cards with the sun and moon in a fixed spot.' },
  { id: 'v05', title: 'Phoenix and lion', note: 'Education cards get original animated emblems. UChicago has a phoenix rising from flickering flames; on hover the flames flare, embers drift up and the wings beat. NTU has a regal lion whose mane blooms in, and it roars on first view and on every hover.' },
  { id: 'v06', title: 'School-colored cards', note: 'The education cards are now full maroon (UChicago) and navy (NTU), with the phoenix and lion as large background illustrations that stay clear of the text. The animations are unchanged. Also fixed the "g" in "Together." being clipped at the bottom.' },
  { id: 'v07', title: 'Pouch and pebbles', note: 'The skills list becomes a tactile toolkit: a stitched canvas pouch with four labelled pockets. Tap one and its skill pebbles tip into a tray, bouncing and settling with real physics. Pebbles can be dragged and tossed, and the fluent languages are bigger stones.' },
];

(function () {
  'use strict';

  var TOTAL = 25;
  var VIEW_W = 1440;
  var VIEW_H = 900;

  var grid = document.getElementById('grid');
  var empty = document.getElementById('empty');
  var countEl = document.getElementById('count');
  var btnAsc = document.getElementById('sort-asc');
  var btnDesc = document.getElementById('sort-desc');
  var toggle = btnAsc.parentNode;

  var order = 'asc';

  // One observer for all frames; scale each iframe to its frame's width.
  var ro = 'ResizeObserver' in window
    ? new ResizeObserver(function (entries) {
        entries.forEach(function (e) { applyScale(e.target, e.contentRect.width); });
      })
    : null;

  function applyScale(frame, width) {
    var iframe = frame.querySelector('iframe');
    if (iframe && width) iframe.style.transform = 'scale(' + (width / VIEW_W) + ')';
  }

  function label(id) { return id.toUpperCase(); }

  function sorted() {
    var list = VERSIONS.slice().sort(function (a, b) {
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });
    return order === 'desc' ? list.reverse() : list;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function buildCard(v) {
    var li = el('li');
    var a = el('a', 'card');
    a.href = 'versions/' + v.id + '/index.html';
    a.setAttribute('aria-label', label(v.id) + ': ' + v.title);

    var frame = el('div', 'frame');
    frame.appendChild(el('div', 'skeleton'));
    var zoom = el('div', 'zoom');

    var iframe = document.createElement('iframe');
    iframe.src = 'versions/' + v.id + '/index.html';
    iframe.title = 'Preview of ' + label(v.id) + ': ' + v.title;
    iframe.loading = 'lazy';
    iframe.tabIndex = -1;
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('scrolling', 'no');
    iframe.style.pointerEvents = 'none';
    iframe.addEventListener('load', function () { frame.classList.add('loaded'); });
    zoom.appendChild(iframe);
    frame.appendChild(zoom);

    var meta = el('div', 'meta');
    meta.appendChild(el('p', 'label', label(v.id)));
    meta.appendChild(el('h2', 'title', v.title));
    meta.appendChild(el('p', 'note', v.note));

    a.appendChild(frame);
    a.appendChild(meta);
    li.appendChild(a);

    if (ro) ro.observe(frame);
    else applyScale(frame, frame.clientWidth);
    return li;
  }

  function render() {
    if (ro) ro.disconnect();
    grid.textContent = '';

    var hasItems = VERSIONS.length > 0;
    empty.hidden = hasItems;
    grid.hidden = !hasItems;
    toggle.hidden = !hasItems;

    countEl.textContent = VERSIONS.length + ' of ' + TOTAL + ' versions';
    btnAsc.setAttribute('aria-pressed', String(order === 'asc'));
    btnDesc.setAttribute('aria-pressed', String(order === 'desc'));

    var frag = document.createDocumentFragment();
    sorted().forEach(function (v) { frag.appendChild(buildCard(v)); });
    grid.appendChild(frag);
  }

  btnAsc.addEventListener('click', function () { order = 'asc'; render(); });
  btnDesc.addEventListener('click', function () { order = 'desc'; render(); });

  render();
})();
