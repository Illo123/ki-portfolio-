# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a parent directory containing three independent, self-contained demo apps that each wrap the Anthropic SDK. They do not share code; treat each subfolder as its own project.

- `01-chatbot/` — Mathewes Coffee & Deli Hamburg chatbot. Flask + vanilla JS, SQLite-backed, German, port **5000**.
- `02-textgenerator/` — "LehrerBrief" letter generator for German teachers. Flask + vanilla JS, stateless, German, port **5001**.
- `03-postblitz/` — "PostBlitz" LinkedIn-post generator (3 variants per request). **Next.js + React + TypeScript** (different stack from 01/02), stateless on the server, German, port **3000**.

All three apps are in German (UI strings, prompts, domain terms like `empfänger`, `öffnungszeiten`, `varianten`). Preserve German in user-facing text; mixing English in prompts/UI will look out of place.

## Running

All apps require `ANTHROPIC_API_KEY` in the environment (the SDK is constructed with no args and reads it from env).

01/02 use Python + Flask (`flask`, `anthropic`, `flask-limiter`). 03 uses Node + Next.js — install with `npm install` inside the folder.

```bash
# 01-chatbot (requires mathewes.db — regenerate if schema changes)
cd 01-chatbot && python setup_db.py && python app.py      # http://localhost:5000

# 02-textgenerator
cd 02-textgenerator && python app.py                       # http://localhost:5001

# 03-postblitz
cd 03-postblitz && npm run dev                             # http://localhost:3000
```

There is no test suite. 01/02 have no linter or package manifest. 03 has `tsconfig.json` (strict) and `next lint` available via `npm run lint`. `mathewes.db` is committed; `setup_db.py` drops and recreates all tables, so rerun it after any schema change in that file.

## Architecture — pattern shared by 01 and 02

01 and 02 follow the same shape; understanding it once covers both. **03 is intentionally different — see its own section below.**

1. **Single `app.py`** serves `index.html` / `script.js` / `style.css` as static files from the project root (`static_folder='.'`), and exposes one POST endpoint that streams a Claude response as Server-Sent Events.
2. **SSE protocol**: the backend yields `data: {"text": "..."}\n\n` chunks from `client.messages.stream(...).text_stream`, terminated by `data: [DONE]\n\n`. The frontend reads the response body with `TextDecoder`, splits on `\n`, and parses lines starting with `data: `. The `X-Accel-Buffering: no` header is required — without it, some proxies buffer and break streaming.
3. **Model**: both pin `claude-opus-4-7`. If you change the model, change it in `app.py` and update the "Claude Opus 4.7" label shown in the UI (`01-chatbot/index.html` sidebar; `02-textgenerator` header).
4. **Markdown**: `01-chatbot/script.js` has a tiny hand-rolled markdown renderer (`renderMarkdown`). It escapes HTML first, then applies regex replacements for code/bold/italic/headings/lists. It is intentionally minimal — do not pull in a library.

### 01-chatbot specifics

- `erstelle_system_prompt()` is called **per request**, so it re-queries SQLite every time. This is deliberate: it means DB edits are reflected immediately without restarting the server, at the cost of a query per message. Keep this behavior unless asked.
- The `messages` array sent from the frontend is the full conversation history; the backend does not persist it. Chat-session history in the sidebar lives only in the browser tab (`chatSessions` in memory, lost on reload).
- Tables use German identifiers including non-ASCII (`öffnungszeiten`). SQLite accepts this, but any new query must quote/spell it identically.

### 02-textgenerator specifics

- The dropdown options (`VORLAGEN`, `TON`, `EMPFAENGER_ANREDE`) are **duplicated** between `app.py` (backend validation + prompt phrasing) and `script.js` (UI labels). When adding a template, update both — the backend falls back silently to the first template if the key is unknown, which masks mismatches.
- The endpoint is `/generieren` (German spelling). Don't rename without updating the fetch in `script.js`.
- Stateless: each generation is a single-turn `user` message built from form fields. No conversation history.

## Architecture — 03-postblitz (different stack)

Generates exactly **three German LinkedIn-post variants** per request from a stored author profile + a daily topic.

- **Stack:** Next.js 16 App Router, React 19, TypeScript 6 strict, `@anthropic-ai/sdk` 0.91.1. No Flask, no SSE.
- **Model:** `claude-sonnet-4-6` (not Opus 4.7 like 01/02). Pinned in [03-postblitz/app/api/generate/route.ts](03-postblitz/app/api/generate/route.ts).
- **Non-streaming:** single `client.messages.create` call returns one text block; the route responds with JSON `{ varianten: string[] }`. Don't add SSE here unless asked — the UI is built around one round-trip.
- **Variant contract:** the system prompt asks Claude for three variants separated by a line `---`; `splitVariants` in [03-postblitz/lib/prompt.ts](03-postblitz/lib/prompt.ts) splits on `\n-{3,}\n`, trims, drops empties, slices to 3. If you change the separator, change both the prompt instruction and the regex together.
- **Profile persistence is client-side only:** `ProfileForm` reads/writes `localStorage` under key `postblitz.profile`. The server is fully stateless — every POST to `/api/generate` carries `{ profile, thema }` from the client.
- **Path alias:** `@/*` maps to the project root via `tsconfig.json` `paths`. Use it for imports (`@/lib/prompt`, `@/components/...`).
- **No persistence layer, no rate-limiter** in this app yet (unlike 01/02 which use `flask-limiter`). Keep that in mind before exposing it publicly.
