// The only thing to edit when adding a version: append an entry here.
const VERSIONS = [
  { id: 'v01', title: 'Apple-inspired foundation', note: 'First iteration. Clean, product-page elegance inspired by Apple: translucent sticky nav, oversized tight headlines, spec-style stats, a dark featured-project section, rounded tiles, and subtle scroll reveals. (GPA later redacted, with a wink.)' },
  { id: 'v02', title: 'A more human headline', note: 'New hero line where "artificial" is struck through and replaced by "human". GPA removed; the stats now lead with five cities called home. LinkedIn and GitHub added to the contact section and footer.' },
  { id: 'v03', title: 'Five cities, one journey', note: 'New animated flight path from Mumbai to Singapore, Boston, Houston and Chicago. Each city card shows its live local time over a sky that matches the hour. Stats are now uniform, and the closing line adds a warm, letter-by-letter "Together."' },
  { id: 'v04', title: 'Skylines and a long-haul joke', note: 'Each city card gets a translucent landmark silhouette: Sea Link, Marina Bay Sands, Boston steeples, a Houston rocket, Willis Tower and the Bean. Fixed the route turning blue ahead of the plane. Added a wink on the long Singapore to Boston leg. Cleaner cards with the sun and moon in a fixed spot.' },
  { id: 'v05', title: 'Phoenix and lion', note: 'Education cards get original animated emblems. UChicago has a phoenix rising from flickering flames; on hover the flames flare, embers drift up and the wings beat. NTU has a regal lion whose mane blooms in, and it roars on first view and on every hover.' },
  { id: 'v06', title: 'School-colored cards', note: 'The education cards are now full maroon (UChicago) and navy (NTU), with the phoenix and lion as large background illustrations that stay clear of the text. The animations are unchanged. Also fixed the "g" in "Together." being clipped at the bottom.' },
  { id: 'v07', title: 'Pouch and pebbles', note: 'The skills list becomes a tactile toolkit: a stitched canvas pouch with four labelled pockets. Tap one and its skill pebbles tip into a tray, bouncing and settling with real physics. Pebbles can be dragged and tossed, and the fluent languages are bigger stones.' },
  { id: 'v08', title: 'Lights out', note: 'Dark mode only, in the style of Apple\u2019s dark product pages: black and near-black sections, off-white type, a brighter link blue. Also a charcoal canvas pouch on dark felt, softened day-sky city cards, and a glow behind DoF.me. All colors now come from theme tokens, ready for a toggle.' },
  { id: 'v09', title: 'Sun and moon', note: 'Adds a light/dark toggle in the top-right nav, dark by default. Going to dark, a crescent moon rises from the toggle and night spreads across the page with twinkling stars. Going to light, a sun with turning rays floods the page with warm light. Press T to toggle too.' },
  { id: 'v10', title: 'Command palette', note: 'Press ⌘K, Ctrl+K or / to open a Spotlight-style palette: fuzzy-search to jump to any section, copy the email, open links, switch theme, replay the journey or tip out the pebbles.' },
  { id: 'v11', title: 'Pinned experience story', note: 'Allthenticate becomes an Apple-style pinned scroll story. The three highlights light up in turn beside animated diagrams for the testing framework, BLE device onboarding and the UI/UX overhaul.' },
  { id: 'v12', title: 'Case-study sheets', note: 'Each project tile now grows into a case-study sheet with an animated header illustration, what it does, how it was built and the stack, with prev/next arrows. Projects are searchable in the command palette too.' },
  { id: 'v13', title: 'DoF.me data flow', note: 'An animated architecture diagram in the DoF.me section: data packets travel from the provider layer through normalization to canonical records and persistence, then branch into the AI narrative and gameplay. Hover a node for details.' },
  { id: 'v14', title: '30-second view', note: 'A one-screen résumé overlay for busy recruiters, opened from the hero or the command palette. The same content prints as a clean one-page US Letter résumé via Download PDF or Cmd+P.' },
  { id: 'v15', title: 'Micro-interactions', note: 'Magnetic CTAs, 3D tilt with a glare highlight on cards, a subtle cursor spotlight in dark mode, a scroll-progress bar and a section-aware nav.' },
  { id: 'v16', title: 'Polaroid hobby wall', note: 'Beyond work becomes six illustrated polaroids scattered like photos on a table. Drag them around, double-click to flip one over, or tidy them into a grid.' },
  { id: 'v17', title: 'Multilingual hello', note: 'A greeting above the name morphs through the five languages Aditya speaks: Hello, नमस्ते, 你好, Hola, Bonjour. Hover pauses it and a click advances it.' },
  { id: 'v18', title: 'Keepy-uppy easter egg', note: 'Enter the Konami code, pick Play keepy-uppy in the command palette, or toss a pebble up three times to juggle a football. It has kick physics, spin, olé pops and confetti.' },
  { id: 'v19', title: 'Scroll-scrubbed hero', note: 'After the hero, an Apple-style pinned sequence scrubs through AI, Mobile, Full-stack and Security as you scroll. Each frame is a giant gradient word with its own subtle motif and a caption drawn from real work.' },
  { id: 'v20', title: 'Accessibility & performance', note: 'A polish pass with no redesign: skip link, labelled landmarks, a clean heading outline, consistent focus rings, high-contrast support and token contrast fixes. Animation loops now pause offscreen and in hidden tabs.' },
  { id: 'v21', title: 'The animated style', note: 'The big restyle: the page becomes an illustrated world. Firewatch-style layered landscapes with a lookout tower are the base. Spider-Verse halftone, misregistered lettering and ink-panel comics add energy, and Arcane-like hextech glows mark interactive parts. It comes in dusk-to-night and golden-afternoon themes.' },
  { id: 'v22', title: 'Open to work', note: 'A status pill above the greeting reads Open to SWE roles · Chicago, with a softly pulsing green dot, and clicking it opens an email. In the animated style it becomes a tilted comic caption sticker.' },
  { id: 'v23', title: 'Back to top', note: 'A back-to-top button fades in after you scroll, with a ring that fills as you read down the page. In the animated style it pops in as a comic UP! starburst.' },
  { id: 'v24', title: 'Ink-drawn underlines', note: 'Nav and text links get underlines that draw in on hover. In the Apple style it is a hairline sweeping in from the left. In the animated style it is a rough gold brush stroke painted on in steps, which also marks the section you are in.' },
  { id: 'v25', title: 'Favicon and a wink', note: 'A custom AS monogram favicon set against a Firewatch-style sunset ridge gives the page its own identity in the tab. Switch away and the tab title calls out Don’t be a stranger. 👋 until you return.' },
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
