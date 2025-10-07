# Deployment Guide

This app is static (HTML/CSS/JS) and runs entirely in the browser. The only external dependency is the `html5-qrcode` CDN. Camera access requires HTTPS (or `http://localhost`).

## Local Development

- Python: `python3 -m http.server 8000` → open `http://localhost:8000/index.html`
- Node (serve): `npx serve .` → open printed URL

## Production Hosting Options

- GitHub Pages
  - Push to a public repo → Settings → Pages → Deploy from branch (e.g., `master` root).
  - Access via `https://<user>.github.io/<repo>/index.html`.
- Netlify
  - Drag-and-drop folder in Netlify UI or connect repo.
  - Build command: none. Publish directory: repo root.
- Vercel
  - Import project → Framework preset: “Other”.
  - Output directory: repo root.

All of these provide HTTPS by default, satisfying camera requirements.

## Pathing Notes

- The app references `index.html` directly; root serving is recommended.
- If served from a subpath, ensure links and assets use relative paths (they do in this repo).

## Security Headers (Recommended)

- `Permissions-Policy: camera=(self)`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp` (only if you later adopt WebAssembly modules that need COEP/COOP)
- `Content-Security-Policy` (tighten as needed; allow the `html5-qrcode` CDN domain)

Example CSP (adjust as needed):

```
Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' https://unpkg.com; connect-src 'self'; media-src 'self' blob:; frame-ancestors 'none';
```

## PWA (Optional)

- Add `manifest.json` for name/icons.
- Register a Service Worker for caching (avoid caching camera responses).
- Ensure HTTPS and proper scope to support installable experience.

## Troubleshooting

- Camera not starting:
  - Check HTTPS and permissions; close other apps that may lock the camera.
  - Verify deviceId selection matches an available `videoinput`.
- QR scanning fails:
  - Ensure the camera is started first; check that the scanner target element exists and is visible.
- Overlay misalignment:
  - Confirm canvas is set to video intrinsic size after metadata loads; re-check on resize.
