# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a parent directory containing two independent, self-contained Flask + vanilla-JS demo apps that each wrap the Anthropic SDK. They do not share code; treat each subfolder as its own project.

- `01-chatbot/` — Mathewes Coffee & Deli Hamburg chatbot. SQLite-backed, German, port **5000**.
- `02-textgenerator/` — "LehrerBrief" letter generator for German teachers. Stateless, German, port **5001**.

Both apps are in German (UI strings, prompts, domain terms like `empfänger`, `öffnungszeiten`). Preserve German in user-facing text; mixing English in prompts/UI will look out of place.

## Running

Both apps require `ANTHROPIC_API_KEY` in the environment (`anthropic.Anthropic()` is called with no args and reads it from env). Dependencies are `flask` and `anthropic`.

```bash
# 01-chatbot (requires mathewes.db — regenerate if schema changes)
cd 01-chatbot && python setup_db.py && python app.py      # http://localhost:5000

# 02-textgenerator
cd 02-textgenerator && python app.py                       # http://localhost:5001
```

There is no test suite, linter config, or package manifest. `mathewes.db` is committed; `setup_db.py` drops and recreates all tables, so rerun it after any schema change in that file.

## Architecture — pattern shared by both apps

Both apps follow the same shape; understanding it once covers both:

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
