# Build guide for version agents

Every iteration lives in `versions/vNN/` (index.html, style.css, script.js) and is
created by copying the previous version, then changing only what that iteration
is about. Earlier versions are a historical record. Never edit them.

## Hard rules
- Plain HTML, CSS, vanilla JS. No frameworks, libraries, CDNs, external fonts,
  external images, or external APIs. No build step.
- No storage: no localStorage, sessionStorage, cookies, or IndexedDB.
- Relative paths only; the page must work from `file://` and a static host.
- Keep `<script src="../../assets/back-to-gallery.js" defer></script>` before
  `</body>`. A fixed "Gallery" pill sits bottom-left, so keep that corner clear.
- Content comes only from `docs/content.md`. Never show the GPA or phone
  number. Don't invent metrics, employers, dates, links, or testimonials.
- Don't run git, and don't edit `assets/`, `docs/`, the gallery, or other versions.

## Quality bar
- Apple-level restraint and polish. Every effect earns its place.
- Theme: dark is default (`<html data-theme="dark">`), light via
  `[data-theme="light"]`. All theme colors are tokens in the `:root` blocks at
  the top of style.css. Add tokens for both themes for anything new.
  JS-driven colors listen for the `themechange` event on `document`.
- Respect `prefers-reduced-motion` everywhere. Content must be readable without
  JS (gate JS-only states behind the `.js` class on `<html>`).
- Keyboard accessible, visible focus rings, AA contrast in both themes.
- Responsive: verify at about 1024px and 375px in the browser preview, and
  check that nothing overflows horizontally.
- Pause offscreen animation loops (IntersectionObserver).
- No console errors.
