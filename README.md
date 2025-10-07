# Object Tracker & QR Code Detector

An in-browser application that uses your camera to track user-selected objects in real time, scan QR codes, and let you associate QR codes with tracked objects. All processing happens client-side in the browser.

## Features

- Real-time camera preview with overlay canvas
- Click-to-track objects by color similarity (simple color-based tracker)
- QR code scanning powered by `html5-qrcode`
- Create/remove associations between tracked objects and scanned QR codes
- Session stats (counts, FPS, duration)
- Export session data as JSON
- Responsive UI with status indicators, modals, and notifications

## Quickstart

Prerequisites:

- A modern desktop or mobile browser (Chrome, Edge, Safari). Camera access requires HTTPS or `http://localhost`.
- A device with a webcam/camera.

Run locally:

1. From the repo root, start a local server (localhost is permitted for camera access):
   - Python 3: `python3 -m http.server 8000`
   - Node (serve): `npx serve .`
2. Open `http://localhost:8000/index.html` (or the URL printed by your server).
3. Grant camera permission when prompted.
4. Click Start Camera, then Start Tracking to enable object tracking. Click on the video to add tracked objects. Start QR Scan to scan codes.

Exporting data:

- Use the “Export Data” button to download a JSON file with session data: objects, QR codes, associations, and basic stats.

## Project Structure

- `index.html` — Primary, refined implementation with inline `ObjectTracker` class and modernized UI/logic.
- `app.js` — Earlier implementation (Perplexity build) of `ObjectTracker`; retains similar features but diverges from `index.html`.
- `style.css` — Styles (Perplexity design system + app-specific styles) used by `index_old.html`.
- `index_old.html` — Older page using external `app.js` and `style.css`.

Recommendation: treat `index.html` as the source of truth going forward; `app.js`/`index_old.html` are useful references but duplicated.

## How It Works (High Level)

- Camera: `getUserMedia` streams to a `<video>` element.
- Rendering: an `<canvas>` overlays graphics (boxes, labels, association lines) on top of the video.
- Tracking: a lightweight color-based tracker searches pixels around last known position to update bounding boxes.
- QR codes: `Html5Qrcode` scans the camera feed and returns decoded text and bounding box when available.
- Associations: a modal lets you link a QR code to a tracked object. Associations are drawn as dashed lines.

## Limitations

- Object tracking is color-similarity based; it can drift with lighting changes and similar colors.
- No persistent storage; data lives in-memory until exported.
- The refined implementation lives inline in `index.html`; extracting to modules would improve maintainability.

## Documentation

- Architecture: `ARCHITECTURE.md`
- Implementation Notes: `IMPLEMENTATION_NOTES.md`
- Roadmap: `ROADMAP.md`
- Testing Guide: `TESTING.md`
- Deployment Guide: `DEPLOYMENT.md`
- Privacy & Security: `PRIVACY_SECURITY.md`


