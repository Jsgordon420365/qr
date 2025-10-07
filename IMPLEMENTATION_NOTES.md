# Implementation Notes

This file documents the current code structure, key implementation choices, duplication, and recommended refactors. The repository contains two variants of the same app:

- Primary: `index.html` (refined, inline `ObjectTracker`)
- Earlier: `index_old.html` + `style.css` + `app.js`

## Source of Truth

Use `index.html` as the canonical implementation. It consolidates UI and logic, improves event handling (delegation for dynamic lists), and includes a clearer main loop and status updates.

## ObjectTracker (index.html)

- Lifecycle
  - Camera device discovery → Start camera → Setup canvas → Start main loop.
  - Toggles for Tracking and QR Scanning.
  - Session stats: FPS, duration, totals.
- Rendering
  - Canvas sized to video intrinsic dimensions; overlays drawn each frame.
  - Scale factors convert model-space (video) to CSS space for drawing.
- Tracking (color-based)
  - On canvas click, read the pixel color and store as `targetColor`.
  - Each frame, scan a search window around last position and aggregate pixels within tolerance to compute a bounding box.
  - Adjustable constant: `colorTolerance` (default 30).
- QR Scanning
  - `Html5Qrcode` started/stopped via toggle.
  - On decode, add QR with content, bounding box (`result.box`), and timestamp.
- Associations
  - Modal to associate `qr_code_id` ↔ `object_id`.
  - Draw dashed line between centers of bounding boxes.
- UI/UX
  - Status pills (Camera/QR/Tracking), notifications with transitions, confirm modal for destructive actions, responsive layout.

## Earlier Variant (app.js + index_old.html)

- Similar feature set, but different wiring:
  - Click handling is registered on the `<video>` instead of the `<canvas>`.
  - QR bounding box uses `decodedResult.result.location?.topLeftCorner` with a fixed 100×100 fallback.
  - Notification system and status updates differ.
- Data structures and exported JSON shape are broadly compatible but not identical (naming/timestamps vary slightly).

## Duplication and Divergence

- Two `ObjectTracker` implementations exist: inline (`index.html`) and external (`app.js`).
- UI markup/styles differ (`index.html` embeds styles; `index_old.html` uses `style.css`).
- Behavior differences:
  - QR bounding box source (`result.box` vs `result.location` with fallback).
  - List rendering (event delegation in `index.html` vs inline `onclick` in `app.js`).
  - Clearing behavior on stop events.

Recommendation: migrate remaining needed behavior from `app.js` into `index.html`, then archive or remove the older variant to avoid drift.

## Known Gaps / Improvements

- Tracking robustness
  - Color-based tracking is sensitive to lighting and similar colors. Consider a detector+tracker (YOLOv8/RT-DETR + Deep SORT/Kalman) for robustness.
  - Add UI controls for `colorTolerance`, search window size, and min-pixel threshold.
- Performance
  - Use `{ willReadFrequently: true }` on 2D context to optimize `getImageData` usage.
  - Restrict search window and early-exit when thresholds are met.
  - Consider WebGL/WebGPU or WebAssembly accelerated pipelines for ML models.
- QR scanning
  - Debounce duplicate QR additions better (e.g., time window per content, per-id).
  - Handle rotated/partial codes more gracefully (library settings).
- State management
  - Extract class into ES modules and split responsibilities (camera, tracking, qr, ui).
  - Introduce a small store abstraction to centralize updates and derived state.
- Persistence
  - Add IndexedDB to persist sessions locally; optionally sync to server.
- Accessibility & UX
  - Keyboard access for modals and controls, focus management.
  - Clear empty states and error recovery steps.

## Browser Considerations

- Autoplay policies require `muted` and `playsinline` (already set).
- Camera access needs HTTPS (except `http://localhost`).
- Safari/iOS may require user gesture for starting streams.

## Testing Hints

- Validate coordinate mapping after window resizes; ensure canvas is re-sized to video intrinsic dims.
- Verify overlay scaling by comparing known QR sizes/positions.
- Test multiple objects/QRs/associations and removal edge cases.

## Refactor Plan (Incremental)

1. Adopt `index.html` as main; mark `index_old.html` and `app.js` as legacy.
2. Extract `ObjectTracker` into modules: `camera.ts`, `tracker.ts`, `qr.ts`, `ui.ts` (or JS ESM equivalents).
3. Add controls for tolerance and search window; centralize config.
4. Implement IndexedDB persistence for sessions.
5. Replace color-based tracker with ML-based detection+tracking (behind a feature flag).
