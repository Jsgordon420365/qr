# Testing Guide

This guide outlines manual testing scenarios to verify stability, accuracy, and performance across common browsers and devices.

## Environments

- Desktop: Chrome, Edge, Safari (latest two versions)
- Mobile: Android Chrome, iOS Safari (device or simulator)
- Network: Online (CDN for `html5-qrcode`), optional offline for non-QR flows

## Setup

- Serve locally over `http://localhost` (camera allowed) or HTTPS.
- Ensure camera hardware is available and permitted.

## Scenarios

### 1. Camera Initialization
- Open app → Deny camera → Expect error notification, status `Camera: Failed` or `Disconnected`.
- Grant camera → Click Start Camera → Expect video visible, status `Connected`, controls enabled.
- Stop Camera → Expect video hidden, overlays cleared, status `Disconnected`.

### 2. Canvas Sizing & Resize
- With camera active, resize window.
- Expect overlays to align with video (no drift), canvas resizes to video intrinsic dims.

### 3. Object Tracking (Color-based)
- Start Tracking → Click a distinctively colored object.
- Move object slowly in frame → Expect bounding box to follow.
- Introduce similarly colored background → Observe potential drift (known limitation).
- Add multiple objects (2–3 clicks) → Verify independent boxes update.
- Stop Tracking → Objects cleared and stats updated.

### 4. QR Code Detection
- Start QR Scan → Present a QR code at various distances/angles.
- Expect quick detection, entry added to list with correct content preview.
- Move QR around → Verify bounding box roughly matches.
- Re-present same QR rapidly → Ensure duplicates are limited (basic debounce).
- Stop QR Scan → Scanner stops, status `Idle`.

### 5. Associations
- With at least one object and one QR, open Create Association modal.
- Select items and save → Expect association in list and dashed line on overlay.
- Remove object or QR → Expect related associations removed.

### 6. Session Controls & Export
- Click Export Data → Download JSON.
- Inspect contents: objects, qr_codes, associations, timestamps, counts.
- Clear Session → All lists empty, counters reset, status unchanged.

### 7. Error Handling
- Unplug/disable camera mid-session → Video should stop gracefully; status reflects change.
- Fail to start QR scanner (e.g., start without camera) → Proper error notification.

### 8. Performance
- Track multiple objects (3–5) and scan QR simultaneously.
- Observe FPS; verify UI remains responsive.
- Test at 720p vs 1080p if possible.

## Accessibility

- Keyboard navigate to buttons, open/close modals (Enter/Escape where applicable).
- Focus management: after modal actions, focus returns to logical control.
- Verify sufficient contrast in both light/dark modes.

## Regression Checklist

- Camera status indicators accurate.
- Overlay alignment correct after any resize.
- Lists update on add/remove for objects, QR, associations.
- Exported JSON remains back-compatible when fields evolve (version if needed).
