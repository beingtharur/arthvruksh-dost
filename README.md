# ArthVruksh Dost — Educational Mutual Fund Knowledge Assistant

A full-stack React + Node.js chatbot that educates Indian investors about mutual funds —
it teaches concepts, it never recommends funds, SIP amounts, or portfolios.
Uses **Google Gemini** as its primary AI provider (Groq can be configured as an alternative).

---

## Folder Structure

```
arthvruksh-dost/
├── index.html
├── package.json          ← Frontend dependencies
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env                  ← Frontend env (safe, no secrets)
├── .gitignore
│
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── components/
│   │   ├── Layout.jsx          ← Sidebar + nav
│   │   ├── ChatMessage.jsx     ← Message bubbles + source badges
│   │   ├── ChatInput.jsx       ← Text input + send button
│   │   ├── TypingIndicator.jsx ← Animated dots
│   │   └── SuggestionChips.jsx ← Quick question buttons
│   ├── hooks/
│   │   └── useChat.js          ← Chat logic + API calls
│   ├── data/
│   │   └── faqData.js          ← NISM-sourced FAQ database + matcher
│   └── pages/
│       ├── ChatPage.jsx        ← Main chat UI
│       ├── LearnPage.jsx       ← Educational concept cards
│       └── FaqPage.jsx         ← Searchable FAQ list
│
└── server/
    ├── package.json            ← Backend dependencies
    ├── index.js                ← Express API server (compliance-first request pipeline)
    ├── intentClassifier.js     ← Deterministic intent classifier (15 categories)
    ├── complianceGuard.js      ← Fixed disclaimer text + banned-phrase scanner
    ├── complianceTestCases.js  ← Offline regression fixtures
    ├── runComplianceTests.js   ← Offline test runner (no API key needed)
    └── .env                    ← API keys (NEVER commit this)
```

---

## Quick Start (5 minutes)

### Step 1 — Get a FREE Gemini API Key

1. Go to https://aistudio.google.com/apikey
2. Sign in with Google
3. Click Create API Key
4. Copy the key (starts with `AIza...`)

*(Groq is also supported as an alternative provider — see Step 2 — but Gemini is the default.)*

---

### Step 2 — Configure the server

Create `server/.env`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza_your_actual_key_here

# Optional — only needed if you want to switch to Groq instead:
# AI_PROVIDER=groq
# GROQ_API_KEY=gsk_your_actual_key_here

FRONTEND_URL=http://localhost:5173
```

---

### Step 3 — Install & Run

Open **two terminals**:

**Terminal 1 — Backend server:**
```bash
cd arthvruksh-dost/server
npm install
npm run dev
# ✓ Server running on http://localhost:4000
```

**Terminal 2 — Frontend:**
```bash
cd arthvruksh-dost
npm install
npm run dev
# ✓ Frontend running on http://localhost:5173
```

Open http://localhost:5173 in your browser. Done!

---

### Step 4 — Verify the compliance layer (no API key needed)

```bash
cd server
node runComplianceTests.js
```
This runs 53 offline test cases against the intent classifier and banned-phrase guard — no network call, no cost. Should print `53 passed, 0 failed`.

---

## How answers are sourced (priority order)

1. **NISM FAQ database** (`src/data/faqData.js`) — if the question matches a NISM-sourced FAQ, that answer is returned directly. No AI call, no cost, guaranteed-accurate wording.
2. **Gemini** — only when there's no NISM/FAQ match, the question is sent to Gemini with a system prompt that grounds it in NISM/SEBI/AMFI/RBI/Income Tax sources and enforces the educational-only rules below.

This is a strict priority, not a blend — the AI is never asked to "improve on" or override NISM-sourced content.

---

## Compliance layer

Every message is classified (`server/intentClassifier.js`) into one of 15 intents before anything else happens:

- **Advice-seeking intents** (recommend a fund, "which is better," portfolio review, risk profiling, "should I invest," etc.) → intercepted **before** any AI call. The user gets a fixed, code-owned disclaimer (`server/complianceGuard.js`) redirecting them to a registered advisor, plus a best-effort neutral explanation of the underlying concept (NISM-first, Gemini as fallback) — never a fund name, never a "you should."
- **Out-of-scope questions** (insurance, real estate, crypto, weather, etc.) → a fixed redirect, no AI call.
- **Genuine educational questions** → answered normally (NISM first, Gemini fallback), but every AI-generated reply is still scanned afterward for advice-like language (`scanForBannedLanguage`) as a second, independent safety net before it reaches the user.

See `MutualMind-Compliance-Transformation.md` (historical filename — this is the compliance architecture doc, still accurate for the current app) for the full design writeup, prompt text, test cases, and release checklist.

---

## Features

- **3-page app**: Chat, Learn, FAQ
- **NISM-first, Gemini-fallback answer system**: NISM FAQ database checked first (instant, free, guaranteed-accurate), Gemini only for questions the FAQ database doesn't cover
- **Deterministic compliance guardrails**: advice-seeking questions are blocked in code, not just by asking the model nicely — see "Compliance layer" above
- **India-focused**: Rupees, SEBI, AMFI, Indian tax laws baked into the AI prompt
- **Rate limiting**: 30 requests/minute per IP (protect your free API quota)
- **Conversation history**: Sends last 8 messages for context
- **Source badges**: Shows whether an answer came from the NISM database, Gemini, or was intercepted by the compliance layer

---

## Adding More FAQs

Edit `src/data/faqData.js` — add a new object to the `FAQ_DATA` array:

```js
{
  id: 'your-id',
  category: 'Basics',          // Basics | Tax | Returns | Market | Risk
  question: 'Your question?',
  keywords: ['keyword1', 'keyword2'],   // words that trigger this FAQ
  answer: 'Your detailed answer...',
  tag: 'FAQ',
}
```

If you add a new `category` value, also add a matching entry to `CATEGORY_COLORS` in `src/pages/FaqPage.jsx`, or it will render with a default gray style.

---

## Production Deployment

This app deploys as **two separate services** — pushing to GitHub does not redeploy both automatically unless each service's own auto-deploy is configured.

Frontend → **Vercel** (free):
```bash
npm run build   # creates dist/ folder
# Then connect your GitHub repo to Vercel
```

Backend → **Render** or **Railway** (free tier), with Root Directory set to `server`:
- Set `AI_PROVIDER`, `GEMINI_API_KEY` (or `GROQ_API_KEY`), and `FRONTEND_URL` in the platform's dashboard
- Update `VITE_API_URL` in the frontend's `.env.production` to your deployed server URL
- After changing either service, confirm both have redeployed the latest commit before testing live

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Backend | Node.js + Express |
| AI | Google Gemini Flash (default) — Groq (Llama 3.3) supported as an alternative |
| Compliance | Deterministic intent classifier + banned-phrase guard (`server/intentClassifier.js`, `server/complianceGuard.js`) |
| Rate Limiting | express-rate-limit |
