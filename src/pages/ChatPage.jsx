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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading])

  return (
    // min-h-0 lets the message pane shrink instead of pushing the composer
    // off-screen when the mobile keyboard reduces the viewport.
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <header className="px-4 py-3 sm:px-6 sm:py-4 border-b border-surface-border bg-white flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h2 className="font-display text-lg sm:text-xl text-gray-900 truncate">Chat Assistant</h2>
          <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 truncate">
            Mutual fund education · India-focused · SEBI-safe
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Server status — icon-only on phones, labelled from sm up */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {error ? (
              <>
                <WifiOff size={14} className="text-red-400" />
                <span className="hidden sm:inline text-red-400">Server offline</span>
              </>
            ) : (
              <>
                <Wifi size={14} className="text-brand-500" />
                <span className="hidden sm:inline">Connected</span>
              </>
            )}
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 active:text-red-600 transition-colors w-9 h-9 sm:w-auto sm:h-auto justify-center sm:px-2 sm:py-1.5 rounded-lg hover:bg-red-50 tap-clean"
            title="Clear chat"
            aria-label="Clear chat"
          >
            <Trash2 size={15} strokeWidth={1.8} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain chat-scrollbar px-3 py-3 sm:px-6 sm:py-4 flex flex-col gap-3 sm:gap-4 bg-surface">
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
