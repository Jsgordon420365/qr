# Privacy & Security

This application runs fully client-side. Camera frames are processed locally in the browser; no images or video frames are transmitted to a server by default. The QR library is loaded via CDN.

## Permissions

- Camera permission is requested when starting the camera.
- The app uses only `videoinput`; no microphone access is requested.
- Browsers require HTTPS (or `http://localhost`) for camera.

## Data Handling

- Runtime Data: tracked objects, QR codes, and associations are stored in-memory (JavaScript Maps) for the session.
- Export: users can export a JSON snapshot containing timestamps, positions, and decoded QR text.
- Persistence: no automatic persistent storage is used. If persistence is added later (e.g., IndexedDB), document retained fields and retention.

## QR Content

- Decoded QR text is displayed in the UI and appears in exports.
- Avoid scanning sensitive information unless you trust the environment.

## Security Considerations

- Supply chain: `html5-qrcode` from a CDN; pin versions and prefer SRI hashes when possible.
- Content Security Policy: restrict sources to reduce XSS risk (see `DEPLOYMENT.md`).
- Permissions-Policy: restrict camera usage to the site origin.
- Clickjacking: disallow framing via `frame-ancestors 'none'` header.

## Threats & Mitigations

- Unauthorized Camera Use
  - Mitigation: browsers enforce explicit permission; provide clear UI states and stop camera when requested.
- Data Leakage via Export
  - Mitigation: exports are user-initiated; warn users that exported JSON may contain sensitive QR contents.
- Overlay/Coordinate Spoofing
  - Mitigation: keep canvas sizing in sync; validate numeric bounds before drawing.

## Future Enhancements

- Add a privacy mode to avoid storing QR contents (store hash only) when needed.
- Provide an option to redact QR content in exports.
- Implement IndexedDB with explicit opt-in and data retention controls.
