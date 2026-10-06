// Injects a fixed "back to gallery" pill on every version page.
// Usage: <script src="../../assets/back-to-gallery.js" defer></script>
(function () {
  // Hidden when rendered as a gallery thumbnail.
  if (window.self !== window.top) return;

  var style = document.createElement('style');
  style.textContent =
    '.btg{position:fixed;left:16px;bottom:16px;z-index:2147483647;display:inline-flex;align-items:center;gap:8px;' +
    'padding:10px 16px 10px 12px;border-radius:999px;font:500 14px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;' +
    'color:#fff;background:rgba(20,20,22,.78);-webkit-backdrop-filter:saturate(180%) blur(16px);backdrop-filter:saturate(180%) blur(16px);' +
    'text-decoration:none;box-shadow:0 4px 20px rgba(0,0,0,.18);transition:transform .2s ease,background .2s ease}' +
    '.btg:hover{transform:translateY(-1px);background:rgba(20,20,22,.92)}' +
    '.btg:focus-visible{outline:2px solid #0a84ff;outline-offset:3px}' +
    '.btg svg{width:14px;height:14px}' +
    '@media print{.btg{display:none}}';
  document.head.appendChild(style);

  var a = document.createElement('a');
  a.className = 'btg';
  a.href = '../../index.html';
  a.setAttribute('aria-label', 'Back to version gallery');
  a.innerHTML =
    '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>Gallery';
  document.body.appendChild(a);
})();
