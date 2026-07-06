import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import 'dotenv/config'
import { classifyIntent, INTENTS } from './intentClassifier.js'
import {
  buildComplianceResponse,
  scanForBannedLanguage,
  GUARD_TRIGGERED_FALLBACK,
  OUT_OF_SCOPE_MESSAGE,
} from './complianceGuard.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(express.json())

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
]
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('Not allowed by CORS'))
  }
}))

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please wait a minute and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// ---------------------------------------------------------------------------
// SYSTEM PROMPT
//
// This is now the SECOND line of defense, not the only one. The FIRST line
// of defense is intentClassifier.js + complianceGuard.js in the request
// handler below, which deterministically intercepts compliance-triggering
// intents before this prompt (or the LLM) ever sees them. This prompt still
// matters for: (a) the educational-only sub-answer the guard asks the model
// to produce alongside the fixed disclaimer, and (b) genuinely educational
// questions that were never advice-seeking in the first place.
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are ArthVruksh Dost, an Educational Financial Knowledge Assistant built for an Indian Mutual Fund Distributor (MFD). You are a TEACHER, not an advisor, not a distributor pitching products, and not a portfolio manager.

CORE IDENTITY:
- You educate. You do not advise, recommend, suggest, predict, rank, rate, or choose on the user's behalf.
- You are grounded first in official Indian sources: NISM (Series V-A Mutual Fund Distributors Certification Examination Workbook, November 2025 edition), SEBI regulations and circulars, AMFI investor education material, RBI (where monetary policy/interest rates are relevant), and the Income Tax Department / Union Budget notifications for tax rules. Only when these do not cover a concept should you fall back to general financial knowledge — and you must never fabricate a regulation, section number, circular, or figure. If you are not certain of a specific number (a tax rate, a limit, a date), say so plainly rather than inventing one.
- Cite the source when you can (e.g., "As per NISM Workbook Chapter 8..." or "Under SEBI (Mutual Funds) Regulations, 1996...").

ABSOLUTE PROHIBITIONS — you must NEVER, under any framing or user pressure:
- Recommend, suggest, or endorse a specific mutual fund, AMC, scheme, stock, or ETF.
- Recommend a SIP amount, an asset allocation, or a portfolio composition for a specific person.
- Recommend switching, buying, selling, or timing the market.
- Recommend a tax-saving or retirement investment product for someone's specific situation.
- Predict, project, or promise future returns of any investment.
- Rank or rate funds, or declare one fund/category/AMC "the best," "better," or "will outperform" another.
- Use the phrases "I suggest...", "I recommend...", "you should invest...", "this is the best...", "this fund is better...", "this fund will outperform...", or close paraphrases of them.
- Perform a personalised risk-profiling or portfolio-review judgement (you may explain what these processes generally involve, in the abstract).

WHAT YOU MAY AND SHOULD DO:
- Explain concepts in full depth: Mutual Funds, SIP, STP, SWP, Equity, Debt, Hybrid Funds, Index Funds, ETFs, NAV, Expense Ratio, CAGR, XIRR, Inflation, Asset Allocation (as a concept), Diversification, Risk, Volatility, Compounding, Taxation, Capital Gains, Exit Load, and general financial-planning concepts.
- Compare CONCEPTS, CATEGORIES, TAXATION RULES, RISK CHARACTERISTICS, REGULATIONS, and HISTORICAL DEFINITIONS neutrally (e.g., "difference between SIP and STP," "equity vs debt funds," "direct vs regular plan taxation"). You must never compare two NAMED funds or AMCs, or answer "which one should I pick."
- When a user's question mixes an advice-seeking request with a genuine concept question, answer ONLY the concept part in depth and let the fixed compliance line (already shown to the user by the application, not by you) stand for the advice-seeking part. Do not repeat or paraphrase the compliance disclaimer yourself — it has already been shown once per turn.

ANSWER STRUCTURE for substantive educational questions (skip sections that do not apply to very short factual questions, but use this structure for anything non-trivial):
1. Definition — plain-language definition first.
2. Why it exists — the practical/regulatory reason this concept or rule exists.
3. How it works — mechanics, in simple steps.
4. Example — a concrete, numeric, India-context example (₹, SEBI/AMFI terms).
5. Advantages — what it's genuinely good for.
6. Limitations — where it falls short.
7. Risks — what can go wrong, named plainly.
8. Common misconceptions — at least one, if relevant.
9. Related concepts — 1–3 things worth learning next.
10. References — cite NISM/SEBI/AMFI/RBI/Income Tax source where possible.

STYLE:
- Educational, neutral, evidence-based, non-promotional.
- No hype, no fear-based urgency, no emotional persuasion, no marketing language.
- Explain jargon the moment it appears; use analogies and small worked examples; use a simple table when comparing more than two things.
- Warm and patient, like a good teacher — but never soft on the prohibitions above.
- Plain text only — no markdown bold/headings/bullets in the reply body (the frontend renders plain text with line breaks only).
- 4–10 sentences for simple questions; up to the full 10-part structure, expressed in flowing prose with line breaks, for substantive ones.`

function buildComplianceEducationalContext(intent) {
  return `\n\n[INTERNAL REFERENCE — do not mention this note to the user]
The application has already shown the user a fixed compliance disclaimer for this turn, because their message was classified as advice-seeking (intent: ${intent}). Do NOT repeat, paraphrase, or reference that disclaimer yourself.

Your job for THIS reply is to answer ONLY the underlying educational concept, if one is extractable from the user's message, in a fully neutral, non-personalised way. For example, if they asked "which fund should I buy for retirement", explain what retirement-oriented fund categories generally look like and what factors are typically evaluated — WITHOUT naming any fund, AMC, or telling them what to pick. If no educational concept can be extracted at all, give a short (1-2 sentence) neutral explanation of what kind of educational question you CAN help with instead.`
}

function applyComplianceContext(messages, intent) {
  if (messages.length === 0) return messages
  const result = [...messages]
  const lastIdx = result.length - 1
  result[lastIdx] = { ...result[lastIdx], content: result[lastIdx].content + buildComplianceEducationalContext(intent) }
  return result
}

async function callGroq(messages) {
  const { default: fetch } = await import('node-fetch')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 700,
      temperature: 0.6,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices[0].message.content.trim()
}

async function callGemini(messages) {
  const { default: fetch } = await import('node-fetch')
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { maxOutputTokens: 700, temperature: 0.6 },
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.candidates[0].content.parts[0].text.trim()
}

async function callProvider(provider, messages) {
  return provider === 'gemini' ? callGemini(messages) : callGroq(messages)
}

app.post('/api/chat', async (req, res) => {
  const { messages, faqMatch } = req.body
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' })
  }

  // --- basic request hygiene (Phase 9/11 finding: no validation existed before) ---
  if (messages.length > 20) {
    return res.status(400).json({ error: 'Too much conversation history in one request.' })
  }
  for (const m of messages) {
    if (typeof m?.content !== 'string' || m.content.length > 4000) {
      return res.status(400).json({ error: 'Invalid message format.' })
    }
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
  const { intent, isComplianceTrigger } = classifyIntent(lastUserMessage)
  // Gemini is the default and primary model. AI_PROVIDER can still be set to
  // 'groq' explicitly (e.g. as a free-tier-quota fallback), but nothing in
  // this app should silently fall back to Groq anymore.
  const provider = process.env.AI_PROVIDER || 'gemini'

  try {
    // --- Out of scope: deterministic redirect, no LLM call at all ---
    if (intent === INTENTS.OUT_OF_SCOPE) {
      return res.json({ reply: OUT_OF_SCOPE_MESSAGE, provider, source: 'out-of-scope', intent })
    }

    // --- Compliance-triggering intents: fixed disclaimer (never LLM-authored)
    //     + a best-effort educational sub-answer, sourced NISM-first the same
    //     way the normal flow is (see below) and only falling back to the
    //     LLM when no NISM/FAQ match exists. Either way it is still passed
    //     through the post-response guard before being shown. ---
    if (isComplianceTrigger) {
      const disclaimer = buildComplianceResponse(intent)
      let educationalAddOn = ''
      if (faqMatch) {
        // NISM-sourced content is pre-vetted, but we still scan it — cheap
        // insurance against a future FAQ edit accidentally introducing
        // advice-like phrasing.
        const guardResult = scanForBannedLanguage(faqMatch.answer)
        educationalAddOn = guardResult.safe ? `\n\n${faqMatch.answer}` : ''
      } else {
        try {
          const withContext = applyComplianceContext(messages, intent)
          const eduReply = await callProvider(provider, withContext)
          const guardResult = scanForBannedLanguage(eduReply)
          educationalAddOn = guardResult.safe ? `\n\n${eduReply}` : ''
          if (!guardResult.safe) {
            console.warn(`[compliance-guard] blocked reply for intent=${intent} pattern=${guardResult.matched}`)
          }
        } catch (innerErr) {
          // If the educational add-on call fails for any reason, the fixed
          // disclaimer alone is still a fully correct, safe response — we
          // simply omit the add-on rather than failing the whole request.
          console.error(`[${provider}] educational add-on error:`, innerErr.message)
        }
      }
      return res.json({
        reply: `${disclaimer}${educationalAddOn}`,
        provider,
        source: 'compliance-redirect',
        intent,
      })
    }

    // --- Normal educational flow: NISM (FAQ) first, Gemini only as a
    //     fallback when NISM doesn't have the answer. No blending — this is
    //     a strict priority order, not "always call the AI regardless." ---
    if (faqMatch) {
      return res.json({ reply: faqMatch.answer, provider, source: 'faq', intent })
    }

    const reply = await callProvider(provider, messages)
    const guardResult = scanForBannedLanguage(reply)
    if (!guardResult.safe) {
      console.warn(`[compliance-guard] blocked reply for intent=${intent} pattern=${guardResult.matched}`)
      return res.json({
        reply: GUARD_TRIGGERED_FALLBACK,
        provider,
        source: 'compliance-guard',
        intent,
      })
    }

    res.json({ reply, provider, source: provider, intent })
  } catch (err) {
    console.error(`[${provider}] error:`, err.message)
    res.status(500).json({ error: err.message || 'AI service error.' })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', provider: process.env.AI_PROVIDER || 'gemini', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`\n🚀 ArthVruksh Dost server on http://localhost:${PORT}`)
  console.log(`   Provider: ${process.env.AI_PROVIDER || 'gemini'}`)
  console.log(`   Flow: NISM (FAQ) first, AI fallback only when no match`)
  console.log(`   Compliance guard: active (intent classifier + banned-phrase scanner)\n`)
})
