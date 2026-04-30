# MutualMind — AI Mutual Fund Assistant

A full-stack React + Node.js chatbot that educates Indian investors about mutual funds.
Uses **free AI** (Groq or Google Gemini) — no paid API required.

---

## Folder Structure

```
mutualmind/
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
│   │   ├── ChatMessage.jsx     ← Message bubbles
│   │   ├── ChatInput.jsx       ← Text input + send button
│   │   ├── TypingIndicator.jsx ← Animated dots
│   │   └── SuggestionChips.jsx ← Quick question buttons
│   ├── hooks/
│   │   └── useChat.js          ← Chat logic + API calls
│   ├── data/
│   │   └── faqData.js          ← FAQ database + matcher
│   └── pages/
│       ├── ChatPage.jsx        ← Main chat UI
│       ├── LearnPage.jsx       ← Educational concept cards
│       └── FaqPage.jsx         ← Searchable FAQ list
│
└── server/
    ├── package.json      ← Backend dependencies
    ├── index.js          ← Express API server
    └── .env              ← API keys (NEVER commit this)
```

---

## Quick Start (5 minutes)

### Step 1 — Get a FREE API Key

**Option A: Groq (recommended — fastest)**
1. Go to https://console.groq.com
2. Sign up (no credit card needed)
3. Click API Keys → Create API Key
4. Copy the key (starts with `gsk_...`)

**Option B: Google Gemini Flash (most free quota)**
1. Go to https://aistudio.google.com/apikey
2. Sign in with Google
3. Click Create API Key
4. Copy the key (starts with `AIza...`)

---

### Step 2 — Configure the server

Open `server/.env` and fill in your key:

```env
# For Groq:
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_actual_key_here

# For Gemini (comment out Groq lines, uncomment these):
# AI_PROVIDER=gemini
# GEMINI_API_KEY=AIza_your_actual_key_here
```

---

### Step 3 — Install & Run

Open **two terminals**:

**Terminal 1 — Backend server:**
```bash
cd mutualmind/server
npm install
npm run dev
# ✓ Server running on http://localhost:4000
```

**Terminal 2 — Frontend:**
```bash
cd mutualmind
npm install
npm run dev
# ✓ Frontend running on http://localhost:5173
```

Open http://localhost:5173 in your browser. Done!

---

## Features

- **3-page app**: Chat, Learn, FAQ
- **Two-layer answer system**: FAQ database first (instant, free), AI fallback for unknown questions
- **SEBI-compliant**: System prompt prevents investment advice, only education
- **India-focused**: Rupees, SEBI, AMFI, Indian tax laws baked into the AI prompt
- **Rate limiting**: 30 requests/minute per IP (protect your free API quota)
- **Conversation history**: Sends last 8 messages for context
- **Source badges**: Shows whether answer came from FAQ or AI

---

## Free API Limits

| Provider | Model | Free Requests | Notes |
|---|---|---|---|
| Groq | Llama 3.3 70B | 14,400/day | Fastest responses |
| Gemini | Flash 2.0 | 1,500/day | Best quality free |

With the FAQ layer catching ~60% of common questions, your free quota stretches much further.

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

---

## Production Deployment

Frontend → Deploy to **Vercel** (free):
```bash
npm run build   # creates dist/ folder
# Then connect your GitHub repo to Vercel
```

Backend → Deploy to **Railway** or **Render** (free tier):
- Set environment variables in their dashboard
- Update `VITE_API_URL` in frontend `.env` to your deployed server URL
- Update `FRONTEND_URL` in server `.env` to your Vercel URL

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Backend | Node.js + Express |
| AI (free) | Groq (Llama 3.3) or Google Gemini Flash |
| Rate Limiting | express-rate-limit |
