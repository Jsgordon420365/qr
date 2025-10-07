# Architecture

This document explains the app’s high-level architecture, core components, and data flow. The repository contains two implementations: a refined inline implementation in `index.html` and an earlier implementation split across `index_old.html`, `style.css`, and `app.js`.

## Components

- Camera Subsystem
  - Uses `navigator.mediaDevices.getUserMedia` to acquire a video stream.
  - Streams into a `<video id="camera-feed">` element.
  - Canvas sizing mirrors the video’s intrinsic dimensions to keep coordinates aligned.

- Rendering Layer
  - `<canvas id="overlay-canvas">` draws boxes, labels, and association lines.
  - A main loop (`requestAnimationFrame`) updates FPS, optionally tracks objects, and redraws overlays.

- Object Tracking
  - Triggered by user clicks on the canvas to select a target color at that pixel.
  - Maintains state for each object: id, target color (r,g,b), position, timestamp.
  - Each frame, scans a search window around the last known position and updates a bounding box based on color matches within a tolerance.

- QR Code Scanning
  - Uses `Html5Qrcode` from `html5-qrcode` CDN.
  - When active, decoder callbacks register decoded content and detected bounding boxes.

- Associations
  - A modal allows linking a QR code id to an object id.
  - Rendered as dashed lines between the centers of the bounding boxes on the overlay.

- UI & State
  - Status indicators for Camera/QR/Tracking.
  - Lists of objects, QR codes, and associations with remove actions.
  - Notifications provide user feedback.
  - Session metrics (counts, FPS, duration).

## Data Model (in-memory)

- `detectedObjects: Map<string, ObjectState>`
  - `ObjectState = { id, type, targetColor, position: { x, y, width, height }, timestamp }`
- `detectedQRCodes: Map<string, QRState>`
  - `QRState = { id, content, position: { x, y, width, height }, timestamp, format }`
- `associations: Map<string, AssocState>`
  - `AssocState = { id, object_id, qr_code_id, timestamp, notes?, confidence? }`

All are ephemeral and reset on clear or page reload; export writes a JSON snapshot.

## Event Flow

1. User starts camera → stream attaches to `<video>` → canvas sized to video.
2. Main loop begins → frames are drawn and overlays rendered.
3. User toggles tracking → clicking canvas creates an object with a target color.
4. Each frame when tracking is on → search window scanned for color similarity → object bbox updated.
5. User toggles QR scanning → `Html5Qrcode` decodes frames → QR entries added with bounding boxes.
6. User opens association modal → selects QR and Object → association persisted in-memory and drawn.

## Coordinate System & Scaling

- Video intrinsic size: `video.videoWidth` × `video.videoHeight`.
- Canvas is set to the same intrinsic size. Visual display scales via CSS.
- Rendering computes scale factors to convert model-space (video) to CSS pixel positions.

## Error Handling & Notifications

- User-friendly notifications for common failures (no camera, permission denied, QR start failure).
- Non-fatal QR scan errors are ignored to avoid log spam.

## Two Implementations: Differences

- `index.html` (refined)
  - Inline class with modernized UI, event delegation for lists, consolidated update functions.
  - Tracking logic reads color from the canvas directly and processes a search region per frame.
  - Uses a confirm modal for destructive actions.

- `app.js` + `index_old.html` (earlier)
  - Similar responsibilities split across files; different naming and UI flows.
  - QR code bounding box fallback is less precise; status/notification handling differs.

Recommendation: proceed with `index.html` as the main implementation and de-duplicate over time by extracting modules.

## Extension Points

- Replace color-based tracking with proper detectors/trackers (e.g., YOLO + Deep SORT / Kalman filter).
- Persist data to storage (IndexedDB) or a backend API.
- Extract UI to components and split logic into modules (ESM).
- Add multi-camera selection and settings (resolution, tolerance slider).
