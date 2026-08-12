import { useState, useCallback, useRef } from 'react'
import { matchFAQ } from '../data/faqData.js'

// In production this is the deployed backend (see .env.production).
// In development it must fall back to an empty string so requests go to the
// same-origin path `/api/chat`, which vite.config.js proxies to localhost:4000.
// Without the fallback the URL becomes the literal string "undefined/api/chat",
// which Vite answers with an empty 404 body — and that empty body is what makes
// res.json() throw "Unexpected end of JSON input".
const API_URL = import.meta.env.VITE_API_URL || ''

export function useChat() {
  const [messages, setMessages] = useState([
    {
      id: '0',
      role: 'assistant',
      content:
        'Namaste! I\'m ArthVruksh Dost — an educational financial knowledge assistant for Indian investors.\n\nI can explain SIP, STP, SWP, NAV, CAGR, XIRR, expense ratio, taxation, risk, and other mutual fund concepts in simple language, grounded in NISM/SEBI/AMFI sources.\n\nI\'m built to educate, not to advise — I won\'t recommend specific funds, SIP amounts, or portfolios. For personalised guidance, I\'ll point you to a registered advisor.\n\nWhat would you like to learn today?',
      source: 'system',
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), timestamp: new Date(), ...msg }])
  }, [])

  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim() || isLoading) return
      setError(null)

      // Add user message
      addMessage({ role: 'user', content: content.trim(), source: 'user' })

      // FAQ match (if any) is NISM-sourced and takes priority: if found, the
      // backend returns it directly without calling the AI. Only when there's
      // no match does the backend fall back to Gemini.
      const faqMatch = matchFAQ(content)

      // Call backend AI
      setIsLoading(true)
      try {
        // Build conversation history for context (last 8 messages)
        const history = messages
          .filter((m) => m.role !== 'system' || m.source !== 'system')
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.content }))
        history.push({ role: 'user', content: content.trim() })

        const controller = new AbortController()
        abortRef.current = controller

        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history,
            faqMatch: faqMatch
              ? { id: faqMatch.id, question: faqMatch.question, answer: faqMatch.answer }
              : null,
          }),
          signal: controller.signal,
        })

        // Read as text first: an unreachable/misrouted backend replies with an
        // empty body or an HTML error page, and calling res.json() on either
        // throws a parser error that tells the user nothing useful.
        const raw = await res.text()
        let data
        try {
          data = raw ? JSON.parse(raw) : {}
        } catch {
          throw new Error(
            `The server replied with a non-JSON response (HTTP ${res.status}). ` +
            'Check that the backend is running on port 4000.'
          )
        }

        if (!res.ok) throw new Error(data.error || `Server error (HTTP ${res.status})`)
        if (!data.reply) throw new Error('The server returned an empty reply.')

        addMessage({
          role: 'assistant',
          content: data.reply,
          source: data.source || data.provider || 'ai',
          intent: data.intent,
          faqId: faqMatch?.id,
        })
      } catch (err) {
        if (err.name === 'AbortError') return
        const msg = err.message.includes('Failed to fetch')
          ? 'Cannot reach the server. Make sure the backend is running on port 4000.'
          : err.message
        setError(msg)
        addMessage({
          role: 'assistant',
          content: `Sorry, I encountered an issue: ${msg}\n\nPlease check that the backend server is running.`,
          source: 'error',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading, addMessage]
  )

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: 'Chat cleared! Ask me anything about mutual fund concepts — I\'m here to educate, not to advise.',
        source: 'system',
        timestamp: new Date(),
      },
    ])
    setError(null)
  }, [])

  return { messages, isLoading, error, sendMessage, clearChat }
}
