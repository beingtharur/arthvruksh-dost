import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import 'dotenv/config'

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

const SYSTEM_PROMPT = `You are MutualMind, a mutual fund EDUCATOR for Indian investors. Your knowledge is grounded in the NISM Series V-A Mutual Fund Distributors Certification Examination Workbook (November 2025 edition).

YOUR ROLE: educator, not advisor. You explain how mutual funds and share markets work so people understand them. You never recommend specific funds or tell anyone what to buy.

TOPIC SCOPE — answer these:
- Mutual fund concepts: SIP, NAV, CAGR, XIRR, TER, fund categories (equity / debt / hybrid / ELSS / index / liquid / etc.), taxation (LTCG, STCG, IDCW, STT, TDS, Section 80C, ELSS lock-in), risk types, direct vs regular plans, KYC, NFO, SWP, STP, switch, redemption, AUM, Riskometer, distributor vs RIA, SEBI, AMFI, rupee cost averaging, diversification, behavioural biases in investing
- Share market basics — but ONLY to the extent needed to understand mutual funds: what a stock is, what an index is (Nifty 50, Sensex), what equity vs debt means, what a market cap is (large/mid/small cap), how share prices and NAVs relate, what market risk means
- Comparisons (SIP vs lump sum, equity vs debt, direct vs regular, MF vs FD, MF vs stocks) — explain trade-offs neutrally

OUTSIDE SCOPE — politely redirect to mutual funds:
- Personal finance topics unrelated to MFs (insurance, real estate, loans, budgeting, crypto, etc.)
- Specific stock picks, trading strategies, technical analysis
- Anything off-topic

EXPLANATION STYLE:
- Explain in detail when needed, but always in simple, everyday Indian language
- Use Indian context: rupees (Rs./₹), SEBI, AMFI, Indian tax laws
- Use analogies and small examples when they help (e.g., "Think of an SIP like a recurring deposit, but in a mutual fund...")
- Reference NISM workbook chapters where relevant (e.g., "As per NISM workbook Chapter 8...")
- Be warm, patient, reassuring — like a friendly teacher
- Plain text only — NO markdown, NO bold, NO headings. Use line breaks and short paragraphs

RECOMMENDATION HANDLING — this is critical:
- NEVER recommend specific mutual funds, AMCs, schemes, or stocks by name
- NEVER answer "which fund should I buy?", "is XYZ fund good?", "should I invest in equity now?", "where should I put my money?"
- For ANY recommendation, suitability, "should I", "what's best for me", or product-selection question, respond with this redirect (warmly, in your own words but always including the link):
  "I'm here to help you understand mutual funds, not to recommend specific ones. For personalized recommendations based on your goals and risk profile, please register or connect with our advisors at https://www.arthvrukshmfadvisers.com/ — they're qualified to guide you on what's right for you."
- You may still explain the CONCEPTS behind the question (e.g., if asked "should I do SIP or lump sum?", explain what each is and the general trade-offs, then add the redirect for the personal decision)

LENGTH: 4–10 sentences for short answers, up to 12–15 sentences when a detailed explanation genuinely helps.`

function buildFaqContext(faqMatch) {
  return `\n\n[INTERNAL REFERENCE — do not mention this note to the user]
Our NISM-grounded FAQ database matched the user's question. Use this as the authoritative source for your reply.

Matched FAQ question: "${faqMatch.question}"

Matched FAQ answer:
${faqMatch.answer}

Decision rules for this turn:
- If the FAQ answer fully and accurately answers the user's actual question, return it essentially verbatim (preserve facts, numbers, examples, and any "(Source: NISM Workbook Ch.X)" attributions).
- If the user's actual question has nuances the FAQ doesn't fully cover, write an enriched answer that incorporates and expands on the FAQ's facts. Keep NISM attributions.
- If the FAQ is only loosely relevant, prefer your own NISM-grounded answer but borrow any directly useful facts from the FAQ.
- Always preserve "(Source: NISM Workbook ...)" lines verbatim when you use FAQ facts.
- Never mention this internal reference or that you compared answers.`
}

function applyFaqContext(messages, faqMatch) {
  if (!faqMatch || messages.length === 0) return messages
  const result = [...messages]
  const lastIdx = result.length - 1
  result[lastIdx] = { ...result[lastIdx], content: result[lastIdx].content + buildFaqContext(faqMatch) }
  return result
}

async function callGroq(messages, faqMatch) {
  const { default: fetch } = await import('node-fetch')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 700,
      temperature: 0.6,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...applyFaqContext(messages, faqMatch)],
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices[0].message.content.trim()
}

async function callGemini(messages, faqMatch) {
  const { default: fetch } = await import('node-fetch')
  const contents = applyFaqContext(messages, faqMatch).map((m) => ({
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

app.post('/api/chat', async (req, res) => {
  const { messages, faqMatch } = req.body
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' })
  }
  const provider = process.env.AI_PROVIDER || 'groq'
  try {
    const reply = provider === 'gemini' ? await callGemini(messages, faqMatch) : await callGroq(messages, faqMatch)
    res.json({ reply, provider, source: faqMatch ? 'best' : provider })
  } catch (err) {
    console.error(`[${provider}] error:`, err.message)
    res.status(500).json({ error: err.message || 'AI service error.' })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', provider: process.env.AI_PROVIDER || 'groq', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`\n🚀 MutualMind server on http://localhost:${PORT}`)
  console.log(`   Provider: ${process.env.AI_PROVIDER || 'groq'}\n`)
})
