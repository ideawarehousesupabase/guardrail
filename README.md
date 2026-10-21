# Franklin — Guardrail Intelligence Engine (GIE) · Demonstration MVP

A frontend demonstration of the Year 1 GIE MVP for MSPs: per-client guardrail composition, drift monitoring, exception governance, an evidence-by-default ledger and a printable client security report.

## Run

```bash
bun install
bun run dev
```

## Firebase configuration

- Public identifiers (`VITE_FIREBASE_AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`) are in `.env` (see `.env.example`).
- The web API key and measurement ID are stored as project secrets `GOOGLE_API_KEY` and `GOOGLE_ANALYTICS_MEASUREMENT_ID`, read on the server and handed to the browser at runtime.
- Only Cloud Firestore is used. No Firebase Auth, Storage, Functions, Analytics or Realtime Database.

## What is stored in Firestore

Collection `users`: `fullName`, `organisationName`, `email` (lowercase), `demoPasscodeHash`, `demoSalt`, `createdAt`. No plaintext passcodes.

## What is simulated

All clients, Microsoft 365 configurations, guardrails, drift findings, exceptions and evidence are local mock data (`src/data/`) held in React state for the current browser session. Recommendations come from deterministic rules in `src/lib/engine.ts`. No real tenants or security tools are contacted.

## Why this is not production-ready

The account flow matches a client-side salted SHA-256 verifier read from Firestore. Anyone with the public Firebase config can read the `users` collection unless rules forbid it, and the browser-side check can be bypassed. Route guards are navigation convenience only. A real deployment needs a trusted authentication service (e.g. Firebase Authentication or another identity provider) and Firestore security rules scoped to the authenticated user. Do not store real customer data in this demo.
