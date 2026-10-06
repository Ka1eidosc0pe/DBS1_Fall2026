# Aditya Selvam — Landing Page Iterations

25 iterations of a personal landing page for recruiters and employers, plus a gallery to browse them.

- `index.html` — the gallery. Each card is a live, scaled preview of a version with a note on what changed.
- `versions/vNN/index.html` — each iteration, self-contained (HTML/CSS/JS only).
- `assets/back-to-gallery.js` — shared "← Gallery" pill included by every version.
- `docs/content.md` — content source of truth, drawn from the resume.

Plain HTML, CSS, and JavaScript. No frameworks, no build step, no external APIs, no storage.

## Run locally
Open `index.html` directly, or serve the folder:

```
python3 -m http.server 8000
```

## Deploy
Import the repo into Vercel as a static site (Framework preset: **Other**, no build command, output directory = root).

## Adding a version
1. Create `versions/vNN/index.html` and include `<script src="../../assets/back-to-gallery.js" defer></script>`.
2. Add an entry to the `VERSIONS` array in `gallery.js`.
3. Bump the `?v=` cache-buster on the `gallery.js`/`gallery.css` links in `index.html` so browsers don't show a stale list.
