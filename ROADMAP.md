# Roadmap

This roadmap mirrors the original multi-step prompt and adapts it to the current state of the project. Phases are incremental and can be parallelized where feasible.

## Step 1: Application Design

- Define final scope for v1: color-based tracking + QR scan + associations + export.
- Confirm browser-only stack for v1; evaluate adding optional backend later.
- Refine UI flows: camera permission, tracking creation, QR scan, association modal, export.

## Step 2: Object Identification and Tracking

- Short-term (v1):
  - Expose tracking parameters in UI (color tolerance, search window size, min pixels).
  - Improve search-window logic and early exits for performance.
- Mid-term:
  - Integrate a real-time object detector (YOLOv8/RT-DETR via WebGPU/WebAssembly).
  - Add tracker (Kalman + Hungarian or Deep SORT) to maintain identities.
  - Abstract the tracking backend behind a strategy interface to switch between color-based and ML-based.

## Step 3: QR Code Detection and Parsing

- Tune `html5-qrcode` settings (fps, qrbox) for accuracy/performance tradeoffs.
- Improve de-duplication policy (per content, time-based window, confidence threshold).
- Add support for multiple formats if needed (library permitting).

## Step 4: Association and Data Management

- Data model
  - Formalize schemas and version exported JSON.
  - Add optional notes/metadata per object and QR.
- Persistence
  - Introduce IndexedDB for local session persistence and recent session recovery.
  - Optional sync to a backend API with authentication.

## Step 5: User Interface Development

- Extract UI into components and adopt a modular build (ES modules + bundler if needed).
- Add settings pane (tolerance, window size, QR scan params), tooltips, and keyboard shortcuts.
- Enhance accessibility: focus management for modals, ARIA labels, high-contrast mode.

## Step 6: Testing and Deployment

- Manual test plan across browsers/devices; add smoke tests with Playwright if feasible.
- Performance testing (FPS under different resolutions and number of objects).
- Deployment: GitHub Pages/Netlify/Vercel with HTTPS; add PWA manifest for installability.

## Stretch Goals

- Multi-camera selection and hot-swap.
- Region-of-interest selection for tracking.
- Server-side analytics and collaborative tagging.
- Export to CSV in addition to JSON.
