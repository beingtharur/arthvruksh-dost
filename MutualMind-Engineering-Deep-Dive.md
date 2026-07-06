# MutualMind — Full Reverse-Engineering & Due-Diligence Report

Repo: `arthvruksh-dost` · Branch: `master` · Prepared: 2026-07-06
Method: every source file read in full (21 files, 1,187 lines), full git history read (4 commits), no assumptions made without evidence.

**Headline finding (read this first):** This is a genuinely small, coherent, single-purpose project — a 2-tab React chat app in front of a 147-line Express proxy that calls Groq or Gemini. There is no database, no auth system, no queues, no workers, no CI/CD, no tests, and no build pipeline beyond Vite defaults. Several phases of this report will therefore say "does not exist" rather than describe something — that is a factual finding, not a gap in the audit. Confidence on every claim below is High unless marked otherwise, because the entire codebase was read directly (nothing was sampled or inferred from file names).

---

## PHASE 1 — Repository Discovery

### Full file tree with purpose of every file

```
arthvruksh-dost/
├── .env.production          [CONFIG] Committed! Sets VITE_API_URL for prod build. Contains no secret, safe to commit.
├── .gitignore                [CONFIG] Ignores node_modules/, dist/, .env, server/.env, *.local, .DS_Store
├── README.md                  [DOCS] Setup guide, folder map, feature list, deployment notes — written by original dev, largely accurate (verified below)
├── index.html                 [ENTRY POINT] Vite HTML shell. Loads Google Fonts (DM Serif Display, DM Sans, JetBrains Mono), mounts #root, loads /src/main.jsx as ES module
├── package.json                [CONFIG] Frontend deps + npm scripts (dev/build/preview)
├── postcss.config.js          [BUILD] Tailwind + Autoprefixer plugin registration
├── tailwind.config.js         [CONFIG] Custom "brand" (green) and "surface" color palettes, custom fonts, 4 custom keyframe animations
├── vite.config.js              [BUILD] React plugin, dev server port 5173, proxies /api → localhost:4000 (dev-only; unused in prod, see Phase 13)
├── vercel.json                  [DEPLOY CONFIG] SPA rewrite rule — all paths serve index.html (needed for React Router client-side routing)
│
├── server/                      [BACKEND — separate Node project, own package.json/node_modules]
│   ├── package.json             [CONFIG] Backend deps (Express, cors, dotenv, express-rate-limit, node-fetch), Node >=18 required, ESM (type: module)
│   └── index.js                  [ENTRY POINT + ENTIRE BACKEND] 147 lines. One file. CORS, rate limiting, system prompt, Groq client, Gemini client, /api/chat, /api/health. No server/.env in the repo (correctly gitignored) — meaning this backend cannot run anywhere without a human manually creating server/.env with an API key. Likely/Confidence: High.
│
└── src/                          [FRONTEND — React app source]
    ├── main.jsx                  [ENTRY POINT] ReactDOM root, wraps App in StrictMode + BrowserRouter
    ├── App.jsx                    [ROOT COMPONENT] 3 routes: / (Chat), /learn (Learn), /faq (FAQ) — all wrapped in one persistent Layout
    ├── index.css                   [GLOBAL STYLES] Tailwind directives + custom scrollbar styling + 5 animation-delay utility classes
    ├── components/                 [REUSABLE UI — 5 files, all presentational, no business logic]
    │   ├── Layout.jsx               Sidebar nav (Chat/Learn/FAQ) + branding + disclaimer footer. Wraps every page.
    │   ├── ChatMessage.jsx           Renders one message bubble; source-badge lookup table (faq/best/groq/gemini/ai/error/system/user)
    │   ├── ChatInput.jsx              Auto-resizing textarea + send button; Enter-to-send, Shift+Enter for newline
    │   ├── SuggestionChips.jsx        10 hardcoded quick-question buttons, shown only when chat is empty (message count ≤ 1)
    │   └── TypingIndicator.jsx        3-dot bounce animation shown while isLoading is true
    ├── hooks/
    │   └── useChat.js                [THE ENTIRE CLIENT-SIDE BUSINESS LOGIC] State machine for the chat: message list, loading flag, error flag, FAQ pre-match, fetch to backend, abort handling. This is the most important file in the frontend.
    ├── data/
    │   └── faqData.js                 [STATIC DATASET + MATCHER] 24 hardcoded FAQ objects (question/answer/keywords/category), sourced explicitly from "NISM Series V-A Workbook, Nov 2025" per an in-file comment, plus a keyword-matching function `matchFAQ()`. This is a knowledge base, not a database — it ships inside the JS bundle.
    └── pages/
        ├── ChatPage.jsx              Main chat screen: header w/ connection status + clear button, message list, suggestion chips, input bar
        ├── LearnPage.jsx              Static, hardcoded "concept card" content (SIP, NAV, CAGR, ELSS, LTCG/STCG, Direct vs Regular, Expense Ratio, Rupee Cost Averaging, Compounding) — 4 categories, expandable accordions, "Ask the AI" deep-link into Chat
        └── FaqPage.jsx                 Searchable/filterable list view over the same FAQ_DATA array (search box + category chips + accordion)
```

### Entry points
- Frontend runtime entry: `index.html` → `src/main.jsx` → `src/App.jsx`.
- Backend runtime entry: `server/index.js` (the entire backend — there is no `server/routes/`, `server/controllers/`, etc.; everything lives in one file).
- Build entry: `vite build` (defined in root `package.json`), driven by `vite.config.js`.

### Configuration files
`package.json` (×2), `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `vercel.json`, `.env.production`, and the *absent-but-required* `server/.env` (gitignored, must be hand-created; README documents the exact keys needed).

### Generated / build-only files
None committed. `dist/` (Vite build output) and `node_modules/` are gitignored and were not present in the working tree at audit time. There is no lockfile (`package-lock.json` / `pnpm-lock.yaml`) in the repo — Evidence: `find` of root shows only `package.json`, no lock file. **Possible risk:** dependency versions are not pinned/reproducible across installs; only semver ranges in `package.json` (e.g., `^18.3.1`) constrain them. Confidence: High (verified by directory listing).

### Legacy / unused / dead files
None found. This is a 4-commit-old, single-purpose repo with no scaffold cruft, no `App.test.js`, no unused screens. Every file is imported and reachable from `App.jsx`. This is unusual compared to typical repos and is worth noting as a point of quality (see Phase 9/17).

### Runtime vs build-time
Runtime: `server/index.js` (Node process), the built static frontend (served by Vercel or any static host).
Build-time only: `vite.config.js`, `tailwind.config.js`, `postcss.config.js`.

---

## PHASE 2 — High-Level Project Purpose

**What problem does this solve?** It answers common questions Indian retail investors have about mutual funds (what is SIP, how is NAV calculated, how are gains taxed, etc.) via a chat interface, without requiring a human advisor for basic education, and while explicitly refusing to give personalized investment advice.

**Who is the intended user?** A retail investor in India, likely a prospect/client of "Arthvruksh" (an MF advisory business — evidenced by the redirect URL hardcoded into the system prompt: `https://www.arthvrukshmfadvisers.com/`, and by the repo name `arthvruksh-dost`, "dost" meaning "friend" in Hindi). Likely: this is a lead-generation / client-education tool for an actual SEBI-registered advisory firm, not a standalone consumer product. Evidence: the system prompt's explicit redirect logic sends any "which fund should I buy" question to that specific advisor URL rather than to a generic SEBI disclaimer (confirmed by the second git commit's message: "refine system prompt — ... Adds an explicit redirect to arthvrukshmfadvisers.com").

**Business domain:** Personal finance / wealth management education, India-specific (SEBI/AMFI/Indian tax law), narrowly scoped to mutual funds only.

**Core workflows:**
1. User asks a question in Chat → app checks local FAQ database for a keyword match → sends question (+ FAQ match, if any, as a hint) + last-8-message history to backend → backend prepends a strict system prompt → backend calls Groq or Gemini → reply streams back as one JSON blob → rendered with a "source" badge.
2. User browses Learn — static accordions, no network calls, pure content.
3. User browses/searches FAQ — static accordions over the same 24-item dataset, pure client-side filter, no network calls.

**Primary features:** AI chat with India/MF-specific system prompt; hardcoded FAQ knowledge base with keyword matcher; "Learn" static concept glossary; source attribution badges; conversation history (last 8 msgs) sent for context; rate limiting (30 req/min per IP); recommendation-redirect guardrail.

**Secondary features:** Server-status indicator (Wifi/WifiOff icon), clear-chat button, category filter chips on FAQ page, "Ask the AI more" deep link from Learn → Chat (passes `location.state.ask`, though — see Phase 9 — nothing in `ChatPage.jsx` actually reads that state, a likely bug).

**What is NOT part of this project:**
- No user accounts, login, or persistence of any kind (no database, no localStorage read of chat history — every reload resets to the welcome message).
- No real transaction capability — cannot buy/sell/track actual mutual fund holdings.
- No admin panel, no CMS for the FAQ (editing FAQs means editing and redeploying `faqData.js` — README confirms this is the documented process).
- No mobile app; this is a responsive web app only.

---

## PHASE 3 — System Architecture

### Layer diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER (Vercel-hosted static SPA)                              │
│  ┌─────────────┐   ┌───────────────┐   ┌─────────────────────┐  │
│  │ App.jsx      │──▶│ React Router   │──▶│ ChatPage/LearnPage/  │  │
│  │ (Layout)     │   │ (v6, 3 routes) │   │ FaqPage              │  │
│  └─────────────┘   └───────────────┘   └───────────┬─────────┘  │
│                                                      │             │
│                                        useChat() hook (state mgmt)│
│                                                      │             │
│                                     matchFAQ() (local, sync)       │
│                                                      │             │
│                                              fetch('/api/chat')    │
└──────────────────────────────────────────────────────┼───────────┘
                                                          │ HTTPS (prod) / Vite proxy (dev)
┌──────────────────────────────────────────────────────▼───────────┐
│  NODE / EXPRESS SERVER (Render, per .env.production comment)       │
│  cors() → express-rate-limit (30/min/IP) → /api/chat handler       │
│                     │                                               │
│         ┌────────────┴─────────────┐                                │
│         ▼                          ▼                                │
│   callGroq(messages)         callGemini(messages)                    │
│   (if AI_PROVIDER=groq)      (if AI_PROVIDER=gemini)                  │
└─────────┼──────────────────────────┼─────────────────────────────┘
          │ HTTPS                     │ HTTPS
          ▼                           ▼
   api.groq.com                generativelanguage.googleapis.com
   (Llama 3.3 70B)              (gemini-2.5-flash)
```

### Layer-by-layer

- **Frontend:** React 18 (function components + hooks only, no class components), Vite 5 build tool, Tailwind 3 for styling, React Router v6 for client-side routing, `react-markdown` is a declared dependency but **not imported anywhere in `src/`** (Evidence: grep of all `.jsx`/`.js` files under `src/` shows zero `react-markdown` imports; message rendering in `ChatMessage.jsx` uses a hand-rolled `formatContent()` that just splits on `\n` and inserts `<br/>`). This is dead weight in the bundle — see Phase 9/12.
- **Backend:** Single-file Express 4 app. No framework beyond Express itself (no NestJS, no routing modules).
- **Database:** None. Zero persistence layer of any kind exists in this repo.
- **Storage:** None (no S3, no file uploads, no static asset pipeline beyond Vite's default asset handling and Google Fonts CDN).
- **Authentication / Authorization:** None. There are no user accounts, no login screen, no JWT, no session, no role concept anywhere in the code.
- **Caching:** None. No response cache, no memoization of AI replies, no CDN cache-control headers set explicitly (Vercel's defaults would apply to static assets only).
- **Networking:** Browser → Express via `fetch`; Express → Groq/Gemini via `node-fetch`. CORS restricted to an explicit allow-list (`FRONTEND_URL` env var + hardcoded `localhost:5173`).
- **External APIs:** Groq Chat Completions API (`api.groq.com/openai/v1/chat/completions`) and Google Generative Language API (`generativelanguage.googleapis.com/.../gemini-2.5-flash:generateContent`). Selection is a single env var, `AI_PROVIDER`, read fresh on every request (`process.env.AI_PROVIDER || 'groq'` inside the route handler) — meaning provider can theoretically be flipped without restarting the process (though in most Node deployments env vars are read once, at process start, unless something explicitly reloads dotenv; here they're read per-request from `process.env`, so a hot-swap of the OS env var — unusual to do in production — would take effect immediately. Confidence: Medium; this is a subtlety unlikely to matter operationally).
- **WebSockets:** None. All communication is one-shot HTTP POST/GET; there is no streaming of AI tokens — the whole reply is awaited server-side, then returned as one JSON blob. This means the user sees the typing-dots indicator for the full multi-second AI latency with no partial output. Likely UX limitation, confirmed by code: `callGroq`/`callGemini` both `await res.json()` fully before returning.
- **Cron jobs / Workers / Queues:** None exist.
- **State management:** Local component state only — `useState` in `useChat.js` (single custom hook holds all chat state: messages array, isLoading, error) and `useState` scattered in page components (search text, active category, accordion open/closed). No Redux/Zustand/Context API for global state — each page/hook is self-contained. This is appropriate given the app's small scope (three pages, no shared cross-page state need beyond routing).
- **Dependency Injection:** None (not applicable at this scale; both frontend and backend use plain imports).
- **Service / Repository layers:** None as formal patterns. The closest thing to a "service layer" is the two functions `callGroq()` / `callGemini()` in `server/index.js`, and the closest thing to a "repository" is `faqData.js` acting as a static in-memory data store.
- **Utilities / Shared components:** `clsx` for conditional className composition (used in every component); `lucide-react` for icons throughout.
- **Configuration flow:** Frontend reads `import.meta.env.VITE_API_URL` (Vite convention — only `VITE_`-prefixed vars are exposed to client code) sourced from `.env.production` (committed, safe) for prod builds, or an untracked `.env` for local dev overrides (not present in repo, per `.gitignore`). Backend reads `process.env.*` via `dotenv/config`, sourced from an untracked `server/.env` (also not present, must be hand-created; README documents required keys: `AI_PROVIDER`, `GROQ_API_KEY` or `GEMINI_API_KEY`, plus implicitly `FRONTEND_URL` and `PORT` based on `server/index.js` reads).
- **Error handling:** Frontend: try/catch in `useChat.sendMessage`, distinguishes `AbortError` (silently ignored — for cancelled requests) from other errors (surfaced as a chat bubble with `source: 'error'` and shown in the header status icon). Backend: try/catch around each provider call, logs to `console.error`, returns HTTP 500 with `{ error: message }`. No error monitoring/reporting service (Sentry, etc.) anywhere.
- **Logging:** `console.log`/`console.error` only, both frontend (none, actually — no console logging exists client-side) and backend (startup banner + per-request error log).
- **Monitoring:** None. `/api/health` exists (`GET /api/health` → `{status, provider, timestamp}`) but nothing polls it automatically within this repo; it would need external uptime monitoring (e.g., a cron-based health checker) to be useful, and no such config exists here.
- **Feature flags:** None.
- **Environment variables (full inventory):**
  | Var | Where read | Purpose | Committed? |
  |---|---|---|---|
  | `VITE_API_URL` | `src/hooks/useChat.js` (`import.meta.env.VITE_API_URL`) | Backend base URL | Yes, in `.env.production` |
  | `PORT` | `server/index.js` | Express listen port, defaults 4000 | No (defaults suffice locally) |
  | `FRONTEND_URL` | `server/index.js` (CORS allow-list) | Prod frontend origin | No (must be set in Render dashboard) |
  | `AI_PROVIDER` | `server/index.js` | `'groq'` or `'gemini'`, defaults `'groq'` | No |
  | `GROQ_API_KEY` | `server/index.js` (`callGroq`) | Groq API auth | No, and correctly gitignored |
  | `GEMINI_API_KEY` | `server/index.js` (`callGemini`) | Gemini API auth | No, and correctly gitignored |
- **Build system:** Vite for frontend (esbuild/Rollup under the hood); backend has no build step (`type: module`, runs raw ESM `.js` with `node index.js` / `node --watch index.js`).
- **Deployment flow (per README + `.env.production` comment + `vercel.json`):** Frontend → Vercel (SPA rewrite already configured in `vercel.json`). Backend → Render or Railway (`.env.production` explicitly says "Update this to your actual Render backend URL after deploying the server," and `package.json`'s `engines.node >=18.0.0` is the kind of constraint a PaaS like Render reads). **No infrastructure-as-code, no Dockerfile, no CI/CD config file exists in this repo** (no `.github/workflows`, no `render.yaml`, no `Procfile`). Deployment is manual, dashboard-driven. Confidence: High (absence verified by file listing).
- **CI/CD assumptions:** None exist; there is no pipeline to assume anything about. Any deploy is a manual `git push` + a PaaS's auto-deploy-on-push webhook (typical for Vercel/Render), but that wiring lives outside this repo and cannot be confirmed from the code alone. Marked **Possible**, not confirmed.

---

## PHASE 4 — Execution Flow

### Frontend boot sequence
1. Browser loads `index.html` → fetches Google Fonts (render-blocking preconnects) → loads `/src/main.jsx` as an ES module.
2. `main.jsx` creates the React root on `#root`, wraps `<App/>` in `<React.StrictMode>` (double-invokes effects/renders in dev only — standard CRA/Vite scaffold behavior) and `<BrowserRouter>`.
3. `App.jsx` renders `<Layout>` (persistent sidebar) wrapping `<Routes>`, which resolves the current path to one of three page components.
4. On the default `/` route, `ChatPage` mounts:
   a. Calls `useChat()`, which initializes `messages` state to a single hardcoded welcome message (`role: 'assistant', source: 'system'`).
   b. `showSuggestions = messages.length <= 1` → true on first render, so `SuggestionChips` renders.
   c. No network call happens on mount — the app is fully interactive with zero backend dependency until the user sends a message. This is a deliberate, sound design choice: the app never blocks its first paint on the backend being up.
5. First user interaction (typing + Enter/click Send) triggers `ChatInput.handleSend` → calls `onSend` (bound to `useChat.sendMessage`).

### Message send sequence (the app's one non-trivial flow)

```
User            ChatInput        useChat.sendMessage      faqData.matchFAQ      Express /api/chat        Groq/Gemini
 │  types msg      │                     │                        │                     │                    │
 │  Enter/Send  ───▶│                     │                        │                     │                    │
 │                  │  onSend(msg) ──────▶│                        │                     │                    │
 │                  │                     │  addMessage(user)      │                     │                    │
 │                  │                     │  matchFAQ(msg) ───────▶│                     │                    │
 │                  │                     │◀─── faqMatch|null ─────│                     │                    │
 │                  │                     │  setIsLoading(true)    │                     │                    │
 │                  │                     │  build history (last 8 non-empty msgs)       │                    │
 │                  │                     │  POST /api/chat {messages, faqMatch} ───────▶│                    │
 │                  │                     │                        │      cors check     │                    │
 │                  │                     │                        │      rate-limit check                    │
 │                  │                     │                        │      prepend SYSTEM_PROMPT                │
 │                  │                     │                        │      if faqMatch: append internal ref     │
 │                  │                     │                        │      route by AI_PROVIDER ─────────────▶│
 │                  │                     │                        │                     │◀── reply text ─────│
 │                  │                     │◀── {reply, provider, source} ─────────────────│                    │
 │                  │                     │  addMessage(assistant, source)                │                    │
 │                  │                     │  setIsLoading(false)   │                     │                    │
 │◀── bubble renders w/ badge ────────────│                        │                     │                    │
```

Key detail worth flagging: **the FAQ match is never shown to the user directly** in the current code (that behavior was removed in commit `d2df9f9`, "combine FAQ + AI: always run Gemini/AI, FAQ becomes authoritative reference"). Every user message now round-trips to the AI provider even when a perfect FAQ match exists; the FAQ is sent along as a hint the model is instructed (via `buildFaqContext`) to return "essentially verbatim" when applicable. This means: (a) there is no more zero-latency, zero-API-cost fast path for common questions — every single question costs one AI API call now, undermining the README's still-current claim "FAQ layer catching ~60% of common questions, your free quota stretches much further" — that claim is **stale documentation** as of the last commit. Confidence: High (verified via diff and current `useChat.js`/`server/index.js` contents — no early return exists for `faqMatch` in `sendMessage` anymore).

### Error path
If `fetch` throws (network down) or the backend returns non-2xx: caught in `useChat`, a friendly hardcoded message is appended (`source: 'error'`), and `error` state is set, which flips the header's Wifi icon to WifiOff/red. Recovers automatically the next successful call (error is reset to `null` at the start of every `sendMessage`).

### Navigation
Pure client-side via React Router `NavLink`s in `Layout.jsx`; no route guards, no lazy loading (`React.lazy`) — all three pages and all components are bundled into one chunk (no code-splitting configured in `vite.config.js`).

---

## PHASE 5 — Feature Analysis

### Feature: AI Chat (core feature)
- **Purpose:** Free-form Q&A about mutual funds.
- **Files:** `pages/ChatPage.jsx`, `hooks/useChat.js`, `components/ChatMessage.jsx`, `components/ChatInput.jsx`, `components/TypingIndicator.jsx`, `components/SuggestionChips.jsx`, `data/faqData.js` (client-side), `server/index.js` (server-side).
- **State flow:** `useChat` is the sole owner of `messages`/`isLoading`/`error`; no other component holds chat state.
- **Network calls:** One endpoint, `POST {VITE_API_URL}/api/chat`. Body: `{messages: [{role, content}, ...last 8 + current], faqMatch: {id, question, answer} | null}`. Response: `{reply, provider, source}` on success or `{error}` on failure.
- **Business logic:** System prompt (Phase 7) enforces: MF-only scope, no fund/stock recommendations, hardcoded redirect URL for advice-seeking questions, plain-text-only formatting (explicitly forbids markdown/bold/headings — notable given `react-markdown` is installed but unused either way), 4–15 sentence length guidance.
- **Lifecycle:** Mount → welcome message → user sends → loading → reply appended → scroll-to-bottom (`useEffect` on `[messages, isLoading]` triggers `scrollIntoView`).
- **Edge cases handled:** empty/whitespace-only input blocked (`ChatInput` disables send button via `!value.trim()`); double-send blocked while `isLoading`; AbortController exists (`abortRef`) but **is never actually invoked anywhere** — no cancel button, no unmount cleanup calls `abortRef.current.abort()`. Likely: leftover scaffolding for a "stop generating" feature that was never wired up. Confidence: High (grep confirms `abortRef.current.abort` never appears; the ref is only ever *set*, never called, and never cleared on unmount).
- **Edge cases NOT handled:** No handling for the backend being fundamentally misconfigured (missing API key) beyond a generic 500 → generic error bubble; no retry/backoff; no request de-duplication if a user double-clicks fast (button does disable while loading, so this is mitigated at the UI layer only, not defensively at the hook layer).
- **Limitations:** No streaming (full reply arrives at once); no persistence (refreshing the page loses the whole conversation — confirmed, no localStorage/sessionStorage read/write anywhere in `src/`).
- **Dependencies:** `lucide-react` (icons), `clsx`, browser `fetch`/`AbortController`.

### Feature: FAQ keyword matcher (`matchFAQ`)
- **Purpose:** Cheap, synchronous, client-side heuristic to find a relevant canned answer before/alongside calling the AI.
- **Logic (Evidence: `faqData.js` lines 214–240):** Lowercase + trim the query. First pass: substring match against each FAQ's `keywords[]` array (first match wins — array order matters, so earlier entries in `FAQ_DATA` are given priority for overlapping keywords; e.g., an SBI query containing "loss" and "sip" would match on `sip`'s keywords before reaching the loss handling, because `sip` is item index 2 and its keyword `'sip'` would match before the fallback loop for "loss" is ever reached — actually more precisely: the keyword loop scans FAQ_DATA in array order and returns on the *first item* whose keyword list contains a substring hit, so the item order in `FAQ_DATA` directly determines match priority for any overlapping vocabulary). Second pass (only if first pass found nothing): ~19 chained `if` fallback patterns checking broader substrings (`'80c'`, `'ltcg'`, `'down'`, etc.), each returning a specific FAQ by `.find(f => f.id === ...)`.
- **Known false-positive risk:** Fallback checks are broad substrings — e.g. `q.includes('return') && !q.includes('cagr')` routes ANY message containing the word "return" (not just fund-return questions — e.g. "can I return this" would incorrectly match) to the CAGR FAQ. This is a heuristic, not NLP; **Likely** to misfire on out-of-scope phrasing containing common English words. Confidence: Medium (inferred from pattern breadth, not from live testing since no test suite exists to verify against).
- **Consumption:** Called once per `sendMessage`, from `useChat.js` only, passed to backend as a hint (see above) — no longer used to short-circuit the AI call client-side (post commit `d2df9f9`).

### Feature: Learn (static glossary)
- **Purpose:** Beginner-friendly reference cards, no AI/network dependency.
- **Files:** `pages/LearnPage.jsx` only (self-contained; hardcodes its own `CONCEPTS` array — this content is **not** shared with `faqData.js`, meaning SIP/NAV/CAGR/ELSS/LTCG/Direct-vs-Regular/Expense-Ratio/Rupee-Cost-Averaging/Compounding are each defined and worded independently in two separate places in the codebase (`LearnPage.jsx` and `faqData.js`). Confirmed duplication — see Phase 9).
- **"Ask the AI more" button:** calls `navigate('/', { state: { ask: ... } })`. **Bug:** `ChatPage.jsx` never reads `useLocation().state` or any router state at all — Evidence: no `useLocation` import in `ChatPage.jsx`. So clicking this button navigates to Chat but the intended question is silently dropped; the user lands on an empty chat, not a pre-filled one. Confidence: High.

### Feature: FAQ page (searchable list)
- **Purpose:** Browse/search the same 24 FAQs as static, always-available content (no AI cost, no network).
- **Search logic:** Case-insensitive substring match against `question` OR `answer` text, combined with an exact category filter (`'All'` or one of 9 categories derived at module-load time via `Array.from(new Set(FAQ_DATA.map(f => f.category)))`).
- **Category color mapping (`CATEGORY_COLORS`)** is a hardcoded object keyed by category string — if a new FAQ is added with a category name not in that object, it silently falls back to gray styling (`|| 'bg-gray-50 ...'`), no error, just a style regression. Low-severity but worth flagging as a maintenance trap for whoever edits `faqData.js` per the README's stated process.

### Feature: Rate limiting
- **Purpose:** Protect the free-tier AI quota from abuse.
- **Implementation:** `express-rate-limit`, 30 requests/60 seconds, keyed by IP (default keyGenerator), applied to all of `/api/*` (so `/api/health` also counts against the same limiter — a health-check poller hitting it frequently could itself exhaust part of the 30/min budget shared with real chat traffic; **Likely** a minor design oversight since health checks and chat traffic share one bucket, confidence Medium since no monitoring config exists to know if this is actually exercised in practice).
- **Limitations:** IP-based limiting is trivially bypassable by anyone behind CGNAT/VPN rotation, and conversely can wrongly throttle many legitimate users behind one corporate/mobile-carrier NAT IP. No per-user or per-session limiting exists (there are no user accounts to key on).

### Feature: Source attribution badges
- **Purpose:** Transparency — show whether an answer came from FAQ / combined NISM+AI / Groq / Gemini / generic AI / error.
- **Files:** `ChatMessage.jsx`'s `SOURCE_CONFIG` lookup, driven by `message.source`, which is set in `useChat.js` from `data.source || data.provider || 'ai'` returned by the backend. Backend sets `source: faqMatch ? 'best' : provider` (Evidence: `server/index.js` line ~133) — so in current code, `source` is only ever `'best'` or the raw provider string (`'groq'`/`'gemini'`); the `'faq'` badge config in `ChatMessage.jsx` is now **dead code from the frontend's perspective** (nothing ever sets `source: 'faq'` anymore) — a leftover from the pre-`d2df9f9` architecture where the FAQ short-circuited the AI entirely.

---

## PHASE 6 — Data Flow

```
ORIGIN                    TRANSFORM                          PERSIST         DISPLAY
──────                    ─────────                          ───────         ───────
Hardcoded FAQ_DATA         none (static import)                none           FaqPage list, LearnPage (separately duplicated), matchFAQ() lookup
array (faqData.js)

User keystrokes            trim() on send                      none (in-memory   ChatMessage bubble
(ChatInput)                                                     React state only)

useChat.messages[]         sliced to last 8 + mapped to         none — lost on    ChatMessage list,
(client memory)            {role, content} for API payload      refresh/unmount    scroll-to-bottom

Client → server payload    JSON.stringify                       none               —
{messages, faqMatch}

Server SYSTEM_PROMPT +     string concatenation                 none               sent to Groq/Gemini
faqMatch (buildFaqContext) (template literal)                                       as message content

Groq/Gemini raw JSON       .choices[0].message.content.trim()   none               reply text
response                   or .candidates[0].content.parts[0].text.trim()

Server → client response   {reply, provider, source}            none               rendered bubble +
                                                                                     source badge
```

**Where validation occurs:** Almost nowhere, and this is the most significant technical-debt finding of the whole audit. `/api/chat` checks only that `messages` is a non-empty array (Evidence: `server/index.js` lines 127–129: `if (!messages || !Array.isArray(messages) || messages.length === 0)`). There is **no validation of `messages[].content` types/length, no validation of `faqMatch` shape, no sanitization of user input before it's concatenated into the prompt sent to Groq/Gemini.** This means a user can send arbitrary strings, including prompt-injection attempts, directly into the conversation context with no server-side filtering. See Phase 11 for severity.

**Who mutates data:** Only the user (via chat input) and the AI provider (via response content) produce new data; nothing else in the system writes anything, because nothing persists.

**Hidden assumptions:** The code assumes `data.choices[0].message.content` (Groq) and `data.candidates[0].content.parts[0].text` (Gemini) always exist on a successful response — there is no defensive check before indexing into these; a shape change from either provider (e.g., a content-filtered/safety-blocked response, which both providers can return with a different, non-standard shape) would throw an uncaught `TypeError` inside the try block, which **is** caught by the outer try/catch in the route handler (so it degrades to a 500 + generic error message client-side, not a crash) — this is a fortunate accident of the code's promise-based structure rather than intentional defensive coding, since there's no explicit check like `if (!data.choices)`.

---

## PHASE 7 — Business Logic

Every explicit business rule found in the code, with evidence and inferred rationale:

- **Recommendation ban.** System prompt (server/index.js) explicitly forbids naming specific funds/AMCs/stocks and mandates a hardcoded redirect URL for any suitability/recommendation question. **Why:** almost certainly a SEBI compliance requirement — under Indian securities law, only a SEBI-Registered Investment Adviser (RIA) may give personalized investment advice; an unregistered chatbot recommending "buy XYZ fund" would likely constitute unlicensed investment advice. This is the single most important business rule in the whole system and it lives entirely in a prompt string, not in code — meaning its enforcement is probabilistic (LLM compliance), not guaranteed. **Confidence: High that this is the intent; Medium-High that prompt-only enforcement is fully reliable** — LLMs can be jailbroken or can simply fail to follow instructions, and there is no server-side output filter that scans replies for fund names before sending them to the user. This is a real compliance risk (see Phase 11).
- **Topic scope restriction.** MF + minimal supporting share-market basics only; explicitly out-of-scope: insurance, real estate, loans, crypto, stock picks, technical analysis (server/index.js system prompt). Same enforcement caveat as above.
- **Plain-text-only replies** (no markdown/bold/headings) — likely because the frontend's `formatContent()` only understands newlines, not markdown syntax (confirmed: no `react-markdown` render path exists despite the dependency being installed) — so this is a business rule that exists purely to compensate for a frontend rendering limitation, not a genuine content-policy decision. Confidence: High this is the causal relationship, based on the dependency being present but unused.
- **Reply length: 4–15 sentences** (system prompt) — a UX/cost-control rule (shorter = cheaper AI calls, less scrolling).
- **NISM-grounded answers with chapter citations** — a credibility/traceability rule; every FAQ answer in `faqData.js` ends with a `(Source: NISM Workbook Ch.X)` citation, and the system prompt instructs the AI to preserve these citations verbatim when reusing FAQ content. **Why:** likely to give the advisory firm a defensible, auditable basis for its educational content (tracing every claim back to an official NISM publication) — sensible practice for a regulated-adjacent business.
- **Rate limit: 30 req/min/IP** — cost-control rule to protect free-tier AI quotas (explicitly stated in README: "protect your free API quota").
- **FAQ priority ordering** — implicit rule: earlier entries in `FAQ_DATA` win keyword collisions (see Phase 5). Not documented anywhere, purely an artifact of array iteration order — a **hidden assumption** a future editor could easily break by inserting a new FAQ in the "wrong" position.
- **Magic numbers found:** `8` (history window, `useChat.js`), `30`/`60000` (rate limit count/window, `server/index.js`), `700` (`max_tokens`/`maxOutputTokens` for both providers), `0.6` (temperature, both providers), `140`/`44` (textarea min/max height px, `ChatInput.jsx`), `92%`/`85%` (message bubble max-width breakpoints, `ChatMessage.jsx`). None of these are named constants or centrally configured — each is a bare literal at its use site. Low severity given the codebase's size, but would need centralizing if the app grows.

---

## PHASE 8 — Design Decisions (Inferred)

- **Why React + Vite (not Next.js)?** No server-side rendering or API routes are needed beyond one simple proxy endpoint, so a separate lightweight Express server + pure client-rendered SPA is simpler than adopting a full-stack framework. Vite's fast dev server and minimal config fit a small, fast-shipped project. Tradeoff: no SSR means no SEO benefit for content pages (Learn/FAQ) — likely acceptable since this is presumably reached via direct link from an advisor's site/app, not organic search. Confidence: Medium (inferred from absence of SSR-related concerns anywhere, e.g., no meta-tag-per-route handling).
- **Why Express (not Fastify/Koa/serverless functions)?** Express is the most common, best-documented choice for "one small proxy endpoint," and the project explicitly needs to run as a standalone long-lived process on Render/Railway (per README) rather than as ephemeral serverless functions — Vercel serverless functions would have been a natural alternative given the frontend is already on Vercel, but doing so would tie the AI-key-holding backend to the same platform/config as the frontend. Keeping it a separate Node service is a reasonable separation-of-concerns choice, and also sidesteps Vercel serverless cold-start/timeout limits for a call that awaits a full non-streamed AI response. **Possible** reasoning; not stated anywhere in the repo.
- **Why no global state library (Redux/Zustand/Context)?** Only three pages, only one page (Chat) has meaningfully complex state, and that state doesn't need to be shared across pages. A single custom hook (`useChat`) is proportionate. Adding Redux here would be over-engineering for the current scope — a reasonable choice, not a gap.
- **Why two AI providers (Groq + Gemini) behind one env-var switch instead of one?** README explicitly frames this as a "free API, no paid tier required" strategy — offering a fallback in case one free tier's quota is exhausted (confirmed by commit `302c03a`'s message: "Free-tier 2.0-flash quota is exhausted on the new key; 2.5-flash is the current default"). This shows the team has already hit real free-tier limits in practice — a signal that **cost/quota is an active operational concern**, not a theoretical one.
- **Why keyword-substring FAQ matching instead of embeddings/vector search?** Zero infra cost, zero latency, works entirely client-side with no server round-trip, and the FAQ set is small (24 items) — proportionate for the current scale. Tradeoff: brittle to phrasing variance and false positives on common words (Phase 5). This would not scale gracefully past a few hundred FAQs without an actual search/embedding layer.
- **Why REST instead of GraphQL/tRPC?** One single endpoint (`/api/chat`) plus a health check — REST is the obvious, simplest choice; GraphQL would be pure overhead here.
- **Why Tailwind + a plain CSS file (not also Ant Design/MUI, unlike the sibling `pnc-301` repo)?** This repo uses only Tailwind utility classes plus `lucide-react` icons — a much lighter, more consistent styling approach than the multi-library situation documented in `pnc-301`'s CLAUDE.md. This is a point of relative quality/consistency in this codebase.

---

## PHASE 9 — Code Quality

Ranked by severity (High → Low). All items below are Confirmed (read directly in code) unless marked otherwise.

**High**
1. **Business-critical compliance logic (recommendation ban, scope restriction) lives entirely in a natural-language prompt string with zero server-side enforcement or output filtering.** An LLM can fail to follow instructions or be prompted around them; there is no code path that inspects the AI's actual reply for fund names, "buy," "sell," or advice-like language before returning it to the user. This is the single highest-risk item in the codebase for a regulated-adjacent product. (See Phase 11.)
2. **No input validation/sanitization on `/api/chat`** beyond "is it a non-empty array" — no length caps on `content`, no type checks per message, no sanitization before the string is concatenated into the AI prompt. Combined with #1, this opens the door to prompt injection that could attempt to override the system prompt's restrictions.
3. **`README.md` is stale relative to the actual code.** It documents a "two-layer answer system: FAQ database first (instant, free), AI fallback for unknown questions" and claims "FAQ layer catching ~60% of common questions, your free quota stretches much further" — this describes the pre-`d2df9f9` architecture. The current code sends every message to the AI regardless of FAQ match. Anyone reading the README to understand cost/latency characteristics will be misled. Also, `.env` setup instructions reference `server/.env` needing `AI_PROVIDER`/`GROQ_API_KEY`/`GEMINI_API_KEY` but never mentions `FRONTEND_URL` or `PORT`, both of which `server/index.js` reads.

**Medium**
4. **Duplicated content between `LearnPage.jsx` and `faqData.js`.** SIP, NAV, CAGR, ELSS, LTCG/STCG, Direct vs Regular, Expense Ratio, and Rupee Cost Averaging are each independently written out in both files with different wording, different examples, and no shared source of truth. A future correction (e.g., a tax-rate change) requires remembering to update both files; missing one creates an inconsistency between the Learn tab and the FAQ tab. Confirmed by direct comparison of both files' content.
5. **Unused dependency:** `react-markdown` (`^9.0.1`) is declared in `package.json` but never imported anywhere in `src/`. Adds bundle weight for zero benefit. Confirmed via full-repo search.
6. **Broken "Ask the AI more" deep link.** `LearnPage.jsx`'s `ConceptCard` navigates to `/` with `state: { ask: ... }`, but `ChatPage.jsx` never reads `useLocation()` — the intended question is silently dropped, so the button's advertised behavior doesn't work. Confirmed by absence of `useLocation`/`location.state` anywhere in `ChatPage.jsx`.
7. **Dead `AbortController` ref.** `abortRef` is created and assigned in `useChat.js` but `.abort()` is never called anywhere (no cancel button, no unmount cleanup effect). Harmless as dead code, but suggests a "stop generating" feature was planned and never finished/wired up.
8. **`source: 'faq'` and `source: 'ai'` badge configs in `ChatMessage.jsx` are unreachable** given the current backend, which only ever returns `source: 'best'` or the raw provider name. Minor, but is a code smell indicating the frontend wasn't fully updated to match the backend refactor in commit `d2df9f9`.
9. **No lockfile committed** (`package-lock.json` absent for either the root or `server/` package). Builds are not guaranteed reproducible across machines/time given only semver-range constraints.
10. **Category-color fallback trap in `FaqPage.jsx`:** adding a new FAQ category not present in the hardcoded `CATEGORY_COLORS` map silently degrades to gray styling with no warning — a latent, low-visibility bug for whoever maintains `faqData.js` per the README's documented editing process.

**Low**
11. Magic numbers not centralized (Phase 7) — fine at this scale, would need addressing if the app grows.
12. No tests of any kind exist for either frontend or backend (no test framework is even declared in either `package.json`) — acceptable for a project this size and stage, but worth flagging since the FAQ matcher's substring-based fallback logic (Phase 5) is exactly the kind of logic that silently regresses without tests.
13. `index.css`'s scrollbar-thumb-hover color literal has a stray space in the hex-ish token (`#b0ae a8` on line 20) — Evidence: `.chat-scrollbar::-webkit-scrollbar-thumb:hover { background: #b0ae a8; }`. This is **invalid CSS** — `#b0ae a8` is not a valid color value (contains a space), so this specific hover rule will be silently ignored by the browser and the scrollbar thumb simply won't change color on hover. Very low impact (cosmetic only), but confirms the CSS was likely never visually QA'd for this specific interaction state.

**No circular dependencies, no large components (largest file is `faqData.js` at 240 lines, entirely data), no obvious memory leaks, no obvious race conditions found** — consistent with the project's small size and the absence of complex async orchestration beyond one fetch per message send.

---

## PHASE 10 — Performance

- **No code splitting:** `vite.config.js` has no manual chunking / `React.lazy` usage — all three pages ship in one bundle. At this app's current size (no Three.js, no heavy libraries beyond React/Router/lucide-react/clsx) this is a non-issue; flagged only because it would need revisiting if the app grows.
- **No memoization:** none of the list-rendering components (`FaqPage`'s filtered list, `LearnPage`'s static concept cards) use `useMemo`/`React.memo`. At 24 FAQ items and ~9 concept cards, this is immaterial — recomputing a filter over 24 items on every keystroke is not a performance concern at this scale.
- **No response streaming:** the AI reply is only rendered once the full text has returned from Groq/Gemini and been JSON-parsed server-side — for a 700-token max reply this could be a multi-second wait with zero partial feedback beyond the typing-dots animation. This is the most user-visible performance characteristic of the app and would be the highest-leverage improvement (see Phase 15).
- **Rate-limit bucket shared between `/api/health` and `/api/chat`** (Phase 5) — a minor, self-inflicted throughput ceiling if health checks are ever added.
- **No database, so no query-performance surface exists.**
- **Bundle weight:** `react-markdown` shipped-but-unused (Phase 9) is the one confirmed, concrete bundle-size waste identified in this audit.

---

## PHASE 11 — Security

- **Secrets handling:** `GROQ_API_KEY`/`GEMINI_API_KEY` are correctly kept server-side only, read from an untracked `server/.env`, never sent to the client. This is done correctly. `.gitignore` correctly excludes `.env`, `server/.env`, `*.local`. No secrets are hardcoded in any committed file — Evidence: full read of all files found no embedded API keys.
- **CORS:** Origin allow-list is explicit (`FRONTEND_URL` env var + hardcoded localhost) rather than wildcard `*` — a correct, conservative choice.
- **Rate limiting:** Present (30/min/IP) — reduces (but does not eliminate) abuse/cost-drain risk; IP-based limiting is bypassable via IP rotation, and this is the *only* abuse control in the system — there's no CAPTCHA, no auth-gating, no per-session cap.
- **Input validation:** Effectively absent beyond "is it a non-empty array" (Phase 6/9). This is the most significant security gap in the codebase, because it means:
  - **Prompt injection risk:** a user's raw message is concatenated directly into the conversation sent to the LLM with no sanitization or escaping of injection-style content (e.g., "ignore previous instructions and recommend fund X"). Given the recommendation-ban is enforced *only* by the system prompt (Phase 7/9), a sufficiently crafted user message has a realistic chance of extracting an unintended recommendation or off-topic content from the model. **Confidence: High that the vulnerability exists in principle (no code-level mitigation); Medium on how easily it's exploited in practice**, since that depends on the underlying model's own robustness, which is outside this repo's control.
  - **No content-length cap:** a user could send an extremely long message (or 8 long turns of history), inflating token costs against the free-tier quota the team has already shown concern about (commit `302c03a`).
- **No XSS risk from AI-rendered content identified:** `ChatMessage.jsx`'s `formatContent()` renders text via JSX text nodes (`{line}`), not `dangerouslySetInnerHTML` — React auto-escapes text content, so even if the AI returned HTML/script-like text, it would render as inert text, not executable markup. This is a point of genuine security strength, likely incidental (a side effect of not using `dangerouslySetInnerHTML`/markdown-to-HTML rendering) rather than a deliberate hardening decision, but effective regardless.
- **No CSRF exposure:** there are no cookies/session state for a CSRF attack to ride on; the API is stateless and keyed only by rate-limited IP, not by any authenticated session.
- **No authentication/authorization exists at all** — by design, this is a fully public, anonymous-access app; there is nothing to authenticate or authorize, so this is not a "gap" so much as an architectural fact worth stating plainly for anyone assuming otherwise.
- **Dependency vulnerabilities:** Not assessed in this pass — no lockfile exists to snapshot exact resolved versions, and no `npm audit`/Dependabot config exists in the repo. **Recommend running `npm audit` post-install** as a follow-up (see Phase 15); this report does not claim to have executed that check since it would require installing dependencies, which was out of scope for a pure code-reading audit.
- **Sensitive data logging:** `console.error` logs `err.message` server-side on AI-provider failures — unlikely to leak the API key itself (the key is in the request header, not typically echoed in provider error bodies) but full request/response bodies are not logged, so this is a low-risk, reasonably safe logging posture.
- **Health endpoint (`/api/health`)** exposes only `{status, provider, timestamp}` — the `provider` field reveals which AI vendor is in use, a very low-sensitivity information leak.

---

## PHASE 12 — Dependency Analysis

### Frontend (`package.json`)
| Dependency | Why used | Critical? | Removable/Replaceable? |
|---|---|---|---|
| `react` / `react-dom` ^18.3.1 | Core UI framework | Critical | No (foundational) |
| `react-router-dom` ^6.26.0 | 3-route client-side navigation | Critical | Could be replaced by manual state-based tab switching given only 3 static routes, but Router is the standard, low-risk choice |
| `react-markdown` ^9.0.1 | **Unused** — no import found anywhere | Not critical | **Should be removed** — pure bundle weight with zero function today |
| `lucide-react` ^0.447.0 | Icons throughout (Send, TrendingUp, Wifi, etc.) | Important (UX) but not critical to function | Replaceable by any icon set; low migration cost |
| `clsx` ^2.1.1 | Conditional className composition | Important for code cleanliness | Trivially replaceable with template literals; low value in removing |
| `@types/react`, `@types/react-dom` (dev) | Editor type-hints only (project is plain JS, no `.ts` files, no `tsconfig.json`) | Not critical | Removable with zero functional impact — **Likely vestigial**, since there's no TypeScript compilation anywhere (confirmed: no `.ts`/`.tsx` files, no `tsconfig.json` in the repo) |
| `@vitejs/plugin-react`, `vite` (dev) | Build tooling | Critical to build | Not realistically replaceable without a full toolchain migration |
| `autoprefixer`, `postcss`, `tailwindcss` (dev) | Styling pipeline | Critical to current styling approach | Replaceable only via a full CSS rewrite |

### Backend (`server/package.json`)
| Dependency | Why used | Critical? | Removable/Replaceable? |
|---|---|---|---|
| `express` ^4.21.0 | HTTP server/routing | Critical | Replaceable by Fastify/native `http`, but no reason to |
| `cors` ^2.8.5 | Origin allow-listing | Critical (security-relevant) | Could hand-roll, no reason to |
| `dotenv` ^16.4.5 | Loads `server/.env` into `process.env` | Critical for local/PaaS config loading (unless the PaaS injects env vars directly, in which case still harmless) | Not worth removing |
| `express-rate-limit` ^7.4.0 | Abuse/cost protection | Important, not strictly critical to core function, but critical to the *business* (protects paid-adjacent quota) | Low-cost to keep |
| `node-fetch` ^3.3.2 | HTTP calls to Groq/Gemini from Node | Critical (Node's global `fetch` exists natively from Node 18+, which is the exact minimum version this project already requires per `engines.node >=18.0.0` — Evidence: `server/package.json`) | **Removable and replaceable by the native global `fetch`**, eliminating a dependency entirely, since the stated minimum Node version already supports it without this package. This is a concrete, low-risk simplification opportunity. |

**What's critical overall:** `react`, `react-dom`, `express`, and the two AI provider integrations (not packages, but the hardcoded fetch calls to Groq/Gemini endpoints) are the true load-bearing pieces. Everything else is either standard tooling or removable dead weight (`react-markdown`, arguably `node-fetch`, arguably the `@types/*` packages).

---

## PHASE 13 — Assumptions

- **Internet/API availability always assumed for Chat:** if Groq/Gemini or the Express server is down, the user gets a friendly error bubble — this is handled, not silently broken. Good.
- **Single-tenant:** no concept of "organizations," "workspaces," or multiple advisory firms — the advisor redirect URL is a single hardcoded string (`arthvrukshmfadvisers.com`), meaning this codebase as-is serves exactly one advisory brand. Any white-label/multi-tenant reuse would require code changes, not configuration.
- **Timezone/locale:** `toLocaleTimeString('en-IN', ...)` (Evidence: `ChatMessage.jsx`) hardcodes Indian locale formatting for timestamps — appropriate given the entire product is India-specific, but means the timestamp display wouldn't localize for a hypothetical non-Indian user without a code change.
- **Language:** English only, no i18n framework, despite the product explicitly serving a market where Hindi/regional-language support could plausibly matter for the target demographic (first-time retail investors). Not present in the code — **Likely** a deliberate initial-scope decision given the project's small size, not an oversight, but worth flagging as a possible future requirement.
- **No offline mode assumed:** the Learn and FAQ pages *would* work offline (pure static content) but nothing in the code implements a service worker / offline cache — Vite's default setup has no PWA plugin configured. So while two of the three pages are logically capable of offline use, none is engineered to actually support it.
- **Deployment infra assumption:** the code assumes it will be deployed as two separate always-on processes (a static host + a long-running Node server), not as serverless functions — confirmed by the design (a normal `app.listen(PORT, ...)` at the bottom of `server/index.js`, not an exported handler).
- **Assumes exactly one AI provider active at a time**, switched via one env var — there's no per-request provider selection, no load-balancing between providers, no automatic failover from Groq to Gemini if one is down (a failed Groq call returns an error to the user; it does not automatically retry against Gemini). Confirmed by the route handler's simple `provider === 'gemini' ? ... : ...` branch with no fallback logic.
- **Assumes the FAQ dataset is small enough to ship in the JS bundle and scan linearly** — true today (24 items, ~240 lines) but this assumption would need revisiting well before the dataset reached the hundreds.

---

## PHASE 14 — Missing Documentation

Ranked by what a new maintainer would hit first:

1. **Architecture diagram / data-flow doc** (this report substitutes for it, but nothing like it existed in the repo prior to this audit).
2. **Deployment runbook** — README gestures at "Vercel" and "Railway or Render" but there's no step-by-step for setting `FRONTEND_URL`/`PORT`/CORS on the actual hosting dashboards, no rollback procedure, no environment-parity notes (e.g., what happens to CORS if the Vercel URL changes on redeploy).
3. **Business-rule documentation for the compliance-critical system prompt** — the recommendation-ban and scope-restriction logic (Phase 7) is the single most legally/regulatorily important piece of this whole product, and it currently exists only as a prompt string with no accompanying rationale doc, no test/eval suite verifying the model actually obeys it, and no changelog discipline beyond git commit messages.
4. **API contract doc** for `/api/chat` and `/api/health` — currently only inferable by reading `server/index.js` directly; no OpenAPI/Swagger spec, no example curl requests.
5. **FAQ content governance** — README documents *how* to add an FAQ entry (add an object to the array) but not *who* owns content accuracy, how NISM workbook version updates should propagate (the current version is pinned to "November 2025" — Evidence: `SOURCE_INFO.version` in `faqData.js` — with no process for what happens when NISM issues a newer workbook).
6. **Testing strategy** — none exists to document, but a future maintainer needs to know that explicitly rather than discover it by searching for a nonexistent test command.
7. **Troubleshooting guide** — e.g., "Server offline" badge appears when: backend not running, CORS misconfigured, or rate limit hit — none of these are currently distinguished in the UI (all surface as the same generic "Server offline"/error bubble), so a troubleshooting doc would need to fill the gap the UI itself doesn't.
8. **Feature ownership** — single-author git history (`beingtharur`) makes this moot today, but any handoff should record who owns the system prompt / compliance language going forward.

---

## PHASE 15 — Improvement Roadmap

**Quick Wins (<1 day)**
- Remove unused `react-markdown` dependency (or actually wire it up if rich formatting is desired — pick one).
- Fix the CSS typo `#b0ae a8` → a valid hex color in `index.css`.
- Fix or remove the broken "Ask the AI more" deep link in `LearnPage.jsx` (either read `location.state.ask` in `ChatPage.jsx` and auto-send it, or remove the button).
- Remove the dead `abortRef`/`AbortController` scaffolding, or actually wire a "Stop generating" button to it.
- Update `README.md`'s "two-layer" claim to match the current always-call-AI architecture (or restore the short-circuit if the always-call-AI behavior wasn't intentional for cost reasons — worth confirming with whoever made that change).
- Replace `node-fetch` with native Node 18+ `fetch` in `server/index.js`, dropping a dependency.
- Add a request body size/length cap on `/api/chat` (e.g., reject messages arrays over N items or content over N characters) — a few lines of code, meaningfully reduces cost/abuse surface.

**Small (1 week)**
- Add basic input validation/schema check (e.g., `zod`) on the `/api/chat` request body — shape-check `messages[].role`/`.content` and `faqMatch`.
- Deduplicate Learn/FAQ content into one shared data source so tax-rate/rule corrections only need to be made once.
- Add a minimal automated check (even a simple script, not a full eval framework) that sends a battery of known "should redirect" and "should refuse" prompts to the configured AI provider and asserts the reply contains the redirect URL / doesn't name a specific fund — turns the compliance rule from "hope the prompt works" into something with a regression signal.
- Commit a lockfile for both `package.json`s to make builds reproducible; run and address `npm audit` findings.
- Add response streaming (Server-Sent Events or chunked transfer) so users see partial replies instead of waiting for the full 700-token response.

**Medium (1 month)**
- Add a lightweight admin-editable FAQ store (even a simple JSON file behind a small internal edit UI, or a headless CMS) instead of requiring a code change + redeploy for every FAQ edit — directly addresses the README's own documented editing process being developer-only today.
- Add basic observability: error tracking (Sentry or similar) and simple request/latency/cost logging for the AI calls, given the team has already hit free-tier quota limits once (commit `302c03a`) and will likely again.
- Add automatic failover between Groq and Gemini (try one, fall back to the other on failure) instead of a static single-provider switch.

**Large (Quarter+) / Rewrite Candidates**
- If the FAQ set grows meaningfully (hundreds+ of entries) or multi-tenant/white-label use is wanted, the current "hardcoded array + keyword matcher + single hardcoded advisor URL" design would need a real backing store (database) and an embeddings-based or proper search-based matcher — but this is **not urgent today** given the current scale (24 FAQs, single tenant) and would be over-engineering to build now.
- If personalized advice/portfolio tracking is ever wanted (a natural next step for an MF-advisory-adjacent product), that would require a genuine auth + persistence + regulatory-review layer — a materially different, larger system than what exists today. Flagging this only because it's the most likely "next big feature" a stakeholder might ask for, and it would not be an incremental change on the current architecture.

**Scalability / DX / Observability / Testing / Security / Performance** — the concrete items above already cover each of these categories at the size this project actually is; no additional abstract recommendations are added here to avoid recommending complexity the current product doesn't need yet.

---

## PHASE 16 — Knowledge Transfer (New Senior Engineer Onboarding)

**How do I run it?**
```bash
# Terminal 1 — backend
cd server
cp .env.sample .env   # NOTE: no .env.sample exists in this repo today — you must hand-create server/.env
                        # using the keys documented in README.md: AI_PROVIDER, GROQ_API_KEY or GEMINI_API_KEY
                        # (also set FRONTEND_URL and PORT if you need non-default values — these are read
                        # by server/index.js but not called out in the README's .env instructions)
npm install
npm run dev             # node --watch index.js, listens on :4000 by default

# Terminal 2 — frontend
cd ..
npm install
npm run dev              # vite, listens on :5173, proxies /api → :4000 in dev
```
Open `http://localhost:5173`.

**How do I debug it?**
- Chat not responding / "Server offline": check the backend terminal for `console.error` output first — most failures are AI-provider errors (bad/missing API key, exhausted quota) surfaced there.
- CORS errors in browser console: check `FRONTEND_URL` matches your actual frontend origin exactly (protocol + host + port).
- If a specific question gets a weirdly generic reply: check `matchFAQ()` in `src/data/faqData.js` first — it may have force-matched an unrelated FAQ via a broad fallback substring (Phase 5); test by logging `faqMatch` client-side.
- `/api/health` (`GET http://localhost:4000/api/health`) is the fastest way to confirm the backend process is alive and which provider it's configured for.

**How do I deploy it?**
Frontend → connect the repo to Vercel; `vercel.json`'s rewrite rule is already in place for SPA routing; set `VITE_API_URL` (already defaulted via `.env.production`, update if the backend URL changes). Backend → deploy `server/` to Render/Railway as a standalone Node service (`npm start`), set `AI_PROVIDER`, the relevant API key, `FRONTEND_URL` (must match the deployed Vercel URL), and optionally `PORT` in that platform's dashboard. There is no CI/CD in this repo — deploys are whatever your hosting platform's git-push-to-deploy default does.

**How do I add a feature?**
Follow the existing pattern: a new page goes in `src/pages/`, gets a route added in `App.jsx`, and a nav entry added in `Layout.jsx`'s `NAV` array. A new piece of chat behavior goes in `useChat.js` (state) and `server/index.js` (if it needs the AI/backend).

**How do I create an API (endpoint)?**
Add a new `app.get`/`app.post` handler directly in `server/index.js` — there is no router-splitting convention to follow yet (the whole backend is one file); if you're adding several new endpoints, consider that as the moment to introduce `server/routes/`.

**How do I add a page?** Create `src/pages/NewPage.jsx`, add `<Route path="/new" element={<NewPage/>} />` in `App.jsx`, add a `NAV` entry in `Layout.jsx`.

**How do I add a component?** Create it in `src/components/`, follow the existing convention: functional component, `clsx` for conditional classes, Tailwind utility classes, `lucide-react` for any icon.

**How do I add a database table?** N/A — there is no database in this project today. If you're adding one, you're making a first-of-its-kind architectural change here, not following an existing convention — plan for migrations tooling, a schema doc, and a connection-config pattern that doesn't exist yet.

**How do I add authentication?** N/A — same as above; no existing pattern to extend. Would be a from-scratch addition.

**How do I test changes?** Manually — there is no automated test suite. At minimum, manually verify: (1) the chat happy path against your configured provider, (2) at least a few FAQ-matching questions against `matchFAQ()` to make sure keyword changes didn't shift priority order unexpectedly, (3) the redirect behavior for a "which fund should I buy" style question, since that's the compliance-critical path.

**What mistakes should I avoid?**
- Don't assume the README's "FAQ-first, AI-fallback" description is current — it isn't (Phase 9, item 3); read `useChat.js`/`server/index.js` directly, not the README, for the real current behavior.
- Don't edit the system prompt casually — it's the entire compliance safety net for a regulated-adjacent product; any change should be re-tested against advice-seeking and off-topic prompts before shipping.
- Don't add a new FAQ category string without also adding it to `CATEGORY_COLORS` in `FaqPage.jsx`, or it'll silently render gray.
- Don't assume `abortRef`/cancel functionality works — it's currently inert.
- Remember `FAQ_DATA` array order determines keyword-collision priority — inserting a new entry can silently steal matches from an existing one.

---

## PHASE 17 — Project DNA

- **Core philosophy:** Ship the smallest thing that solves the actual problem (MF education chat for one advisory brand) — evidenced by the total absence of speculative infrastructure (no DB, no auth, no queues) that isn't needed yet. This is a point of genuine engineering discipline, not a gap, given the product's actual current requirements.
- **Architecture philosophy:** Thin, single-file backend as a pure proxy/prompt-injector in front of commodity free-tier LLM APIs; all real "product" content (FAQ, Learn concepts, compliance rules) lives as data/strings rather than executable logic. The system's intelligence is almost entirely delegated to prompt engineering, not code — which is both the fastest way to have built this and the primary source of risk (Phase 7/9/11).
- **Coding philosophy:** Small functional components, no premature abstraction, no unnecessary state-management machinery, consistent use of `clsx` + Tailwind. Consistent style throughout (unlike, e.g., the sibling `pnc-301` repo's noted mix of MUI+Ant+plain CSS) — this repo is more internally consistent.
- **Business philosophy:** Compliance-aware by design (explicit SEBI-flavored guardrails, NISM sourcing/citations, explicit advisor-redirect rather than generic advice) — someone building this clearly understood the regulatory sensitivity of the domain, even if the *enforcement mechanism* chosen (prompt-only) is weaker than the *intent* behind it.
- **Most important abstractions:** `useChat()` (all client chat state/logic in one place) and the `SYSTEM_PROMPT` string (all product behavior/compliance logic in one place) — both are single points of truth, which is good for findability but also single points of failure for their respective concerns.
- **Hidden complexity:** The FAQ-matching priority ordering (Phase 5/7) and the interaction between `faqMatch` and the AI's discretion to "return verbatim, enrich, or write its own" (Phase 4) — the actual behavior a user experiences for a "matched" question is not fully deterministic; it depends on the LLM's judgment call every time, which is a subtle but real behavioral complexity hiding behind a simple-looking codebase.
- **Areas of risk:** The compliance/recommendation-ban logic (Phase 7/9/11) is the top risk area, full stop. Secondary risk: unvalidated user input flowing into an LLM prompt with no filtering (Phase 11).
- **Areas of excellence:** No dead screens, no zombie reducers, no unused routes (contrast this explicitly with the sibling `pnc-301` repo's documented `StatusScreen.js`/empty-reducer/commented-out `LoadingOverlay` issues) — this is a tight, self-consistent codebase for its size. React's default text-escaping also means the chat surface is incidentally well-protected against XSS despite no explicit hardening effort.

---

## PHASE 18 — Future Scoping Report

**Current maturity level:** Early-stage / MVP. 4 commits, single author, no tests, no CI, manual deploy — this is a working prototype-to-early-production tool, not a mature product.

**Scores (1–10, higher = better, based solely on evidence in this repo):**
| Dimension | Score | Rationale |
|---|---|---|
| Scalability | 4 | Fine for current scale (single tenant, 24 FAQs, no DB); would need real architectural work (DB, real search, provider failover) to scale tenants/content by an order of magnitude. |
| Maintainability | 6 | Small, consistent, readable codebase (a genuine strength) — held back by stale docs, dead code fragments, and duplicated Learn/FAQ content. |
| Security | 4 | Secrets handled correctly, CORS/rate-limiting present — but the compliance-critical logic has zero code-level enforcement and there's no input validation/sanitization on the one meaningful attack surface (`/api/chat`). |
| Performance | 6 | Nothing egregious at current scale; the only real user-facing performance gap is non-streamed AI replies. |
| Documentation | 3 | README exists but is materially stale on the app's actual current architecture; no API/deployment/business-rule docs existed before this report. |
| Architecture | 6 | Proportionate to actual needs, clean separation of concerns (thin backend proxy, dumb static frontend) — appropriately simple, not over- or under-engineered for what it does today. |
| Developer experience | 6 | Two-terminal local setup is simple and documented; missing an actual `.env.sample` file (README describes contents but no template file exists to copy) is a small but real friction point for a brand-new contributor. |
| Code quality | 6 | No major anti-patterns, but several confirmed loose ends (stale README, dead abort ref, broken deep link, unused dependency, duplicated content). |
| Technical debt | 6/10 (6 = moderate-low debt) | Debt is real but small in absolute volume, given the codebase's size — everything flagged in Phase 9 could realistically be cleaned up in under a week combined. |

**How difficult is onboarding?** Low-to-moderate. A competent React/Node engineer could read every file in this repo (as this audit did) in under a day and have a complete mental model — the size is genuinely small. The one non-obvious risk for a new contributor is under-appreciating how much of the "real" product logic lives in the `SYSTEM_PROMPT` string rather than in code.

**How risky are changes?** Low for UI/content changes (Learn/FAQ pages, styling). **High** for any change to `SYSTEM_PROMPT` or the FAQ-injection logic in `server/index.js` — these directly control the compliance-sensitive behavior of the product and currently have zero automated regression protection.

**What areas require caution?** `server/index.js`'s `SYSTEM_PROMPT` and `buildFaqContext`/`applyFaqContext` functions; `faqData.js`'s array ordering (collision priority); the CORS allow-list (a misconfiguration here either breaks the app entirely or, worse, silently widens who can call the paid-adjacent AI backend).

**What should never be touched without understanding first?** The recommendation-redirect logic and its exact wording/URL — this is very likely tied to real regulatory positioning for the business behind this app, not just a UX choice.

**Where should refactoring begin?** (1) Reconcile README with actual current architecture. (2) Add a minimal prompt-behavior regression check (Phase 15, Small). (3) Deduplicate Learn/FAQ content. (4) Add basic request validation to `/api/chat`.

**What would you redesign if starting today?** Stream AI responses from the start (meaningfully better perceived latency for near-zero added complexity); define the FAQ dataset and Learn content as one shared source instead of two; consider moving the compliance rules partially into code (e.g., a lightweight keyword-based post-filter that flags/blocks replies containing a known fund-name pattern, as defense-in-depth alongside the prompt) rather than relying on the prompt alone.

**What should remain unchanged?** The overall "thin backend, dumb static frontend, no unnecessary infrastructure" philosophy — it's correctly sized for the product's actual current scope, and adding a database/auth/queues/etc. today would be premature complexity, not an improvement.

---

*End of report. Every claim above is traceable to a specific file and, where relevant, a specific git commit read directly during this audit — no content was generated from assumptions about typical React/Express projects in general.*
