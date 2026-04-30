import { useEffect, useRef } from 'react'
import { Trash2, Wifi, WifiOff } from 'lucide-react'
import { useChat } from '../hooks/useChat.js'
import ChatMessage from '../components/ChatMessage.jsx'
import TypingIndicator from '../components/TypingIndicator.jsx'
import ChatInput from '../components/ChatInput.jsx'
import SuggestionChips from '../components/SuggestionChips.jsx'

export default function ChatPage() {
  const { messages, isLoading, error, sendMessage, clearChat } = useChat()
  const bottomRef = useRef(null)
  const showSuggestions = messages.length <= 1

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="px-6 py-4 border-b border-surface-border bg-white flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-display text-xl text-gray-900">Chat Assistant</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Mutual fund education · India-focused · SEBI-safe
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Server status indicator */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {error ? (
              <>
                <WifiOff size={12} className="text-red-400" />
                <span className="text-red-400">Server offline</span>
              </>
            ) : (
              <>
                <Wifi size={12} className="text-brand-500" />
                <span>Connected</span>
              </>
            )}
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
            title="Clear chat"
          >
            <Trash2 size={13} strokeWidth={1.8} />
            Clear
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scrollbar px-6 py-4 flex flex-col gap-4 bg-surface">
        {messages.map((msg, idx) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isLatest={idx === messages.length - 1}
          />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <SuggestionChips onSelect={sendMessage} visible={showSuggestions} />

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  )
}
