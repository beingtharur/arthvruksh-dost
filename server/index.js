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

const SYSTEM_PROMPT = `You are MutualMind, a knowledgeable mutual fund assistant for Indian investors. Your knowledge is based on the NISM Series V-A Mutual Fund Distributors Certification Examination Workbook (November 2025 edition), published by the National Institute of Securities Markets (NISM).

Your role is to EDUCATE and GUIDE — never to give personalized investment advice.

Rules:
- Explain in simple, clear language for first-time investors
- Use Indian context: SEBI, AMFI, rupees (Rs./₹), Indian tax laws (Section 80C, ELSS, LTCG, STCG), Indian AMC names when helpful
- Reference NISM workbook chapters when relevant (e.g., "As per NISM workbook Chapter 8...")
- Never recommend specific mutual funds by name or say "invest in XYZ fund"
- For advice-like questions, add: "Please consult a SEBI-registered investment advisor for personalized guidance."
- Keep responses concise: 4–8 sentences or 4–6 bullet points
- Be warm, reassuring, and non-technical
- Do NOT use markdown — use plain text with line breaks only
- Cover: SIP, NAV, CAGR, XIRR, TER, fund categories (equity/debt/hybrid/ELSS), risk types, taxation (LTCG/STCG/IDCW/STT/TDS), lock-in periods, redemption, direct vs regular plans, KYC, NFO, SWP, STP, switch, AUM, Riskometer, distributor vs RIA, SEBI regulations, AMFI, rupee cost averaging, diversification, behavioural biases in investing`

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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
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
  const { messages } = req.body
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' })
  }
  const provider = process.env.AI_PROVIDER || 'groq'
  try {
    const reply = provider === 'gemini' ? await callGemini(messages) : await callGroq(messages)
    res.json({ reply, provider })
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
