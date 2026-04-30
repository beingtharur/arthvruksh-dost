import { useState, useCallback, useRef } from 'react'
import { matchFAQ } from '../data/faqData.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export function useChat() {
  const [messages, setMessages] = useState([
    {
      id: '0',
      role: 'assistant',
      content:
        'Namaste! I\'m MutualMind — your AI mutual fund assistant for Indian investors.\n\nI can explain SIP, NAV, CAGR, tax rules, risk types, and more in simple language. I\'m here to educate and guide — not to give personal investment advice.\n\nWhat would you like to learn today?',
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

      // Check FAQ first
      const faqMatch = matchFAQ(content)
      if (faqMatch) {
        await new Promise((r) => setTimeout(r, 400)) // small delay for natural feel
        addMessage({
          role: 'assistant',
          content: faqMatch.answer,
          source: 'faq',
          faqId: faqMatch.id,
        })
        return
      }

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
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Server error')

        addMessage({
          role: 'assistant',
          content: data.reply,
          source: data.provider || 'ai',
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
        content: 'Chat cleared! Ask me anything about mutual funds.',
        source: 'system',
        timestamp: new Date(),
      },
    ])
    setError(null)
  }, [])

  return { messages, isLoading, error, sendMessage, clearChat }
}
