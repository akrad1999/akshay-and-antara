# Antara & Akshay Wedding Website

Every area is intentionally self-contained so it can be customized independently.

```text
/
├── index.html
├── styles.css
├── script.js
├── assets/
├── itinerary/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── venue/
├── travel/
├── registry/
└── rsvp/
```

Each page folder contains its own HTML, CSS, and JavaScript. Navigation is duplicated
inside each HTML file on purpose, so changing one page cannot unexpectedly alter another.

The landing page is the only page with the full-screen intro. Its navigation appears
after the visitor scrolls past the photograph.

## RSVP email delivery

The RSVP form sends a branded HTML email to both wedding hosts and a Thailand-inspired
confirmation email to the submitting guest through the server-side `/api/rsvp`
endpoint. The API key is never exposed in the browser.

1. Create a Resend account and verify a sending domain.
2. Copy `.env.example` to `.env.local`.
3. Set `RESEND_API_KEY` and use an address on the verified domain for
   `RSVP_FROM_EMAIL`.
4. Add the same environment variables to the Vercel project before deploying.

Email delivery cannot run from a `file://` URL because that bypasses the serverless API.

For a local end-to-end preview, run:

```bash
/Users/aradhakrishnan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node dev-server.js
```

Then open `http://127.0.0.1:4174`.
