import clsx from 'clsx'
import { TrendingUp, Database, Cpu, AlertCircle } from 'lucide-react'

const SOURCE_CONFIG = {
  faq:    { label: 'FAQ database',   bg: 'bg-emerald-50',  text: 'text-emerald-700',  Icon: Database },
  best:   { label: 'NISM + AI',      bg: 'bg-violet-50',   text: 'text-violet-700',   Icon: Database },
  groq:   { label: 'Groq · Free',    bg: 'bg-amber-50',    text: 'text-amber-700',    Icon: Cpu },
  gemini: { label: 'Gemini · Free',  bg: 'bg-blue-50',     text: 'text-blue-700',     Icon: Cpu },
  ai:     { label: 'AI answer',      bg: 'bg-blue-50',     text: 'text-blue-700',     Icon: Cpu },
  error:  { label: 'Error',          bg: 'bg-red-50',      text: 'text-red-600',      Icon: AlertCircle },
  system: { label: null, bg: '', text: '', Icon: null },
  user:   { label: null, bg: '', text: '', Icon: null },
}

function formatContent(text) {
  return text.split('\n').map((line, i) => (
    <span key={i}>
      {line}
      {i < text.split('\n').length - 1 && <br />}
    </span>
  ))
}

export default function ChatMessage({ message, isLatest }) {
  const isUser = message.role === 'user'
  const src = SOURCE_CONFIG[message.source] || SOURCE_CONFIG.ai

  return (
    <div
      className={clsx(
        'flex gap-2 sm:gap-3 max-w-[92%] sm:max-w-[85%] animate-fade-up',
        isUser ? 'self-end flex-row-reverse' : 'self-start'
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shrink-0 mt-0.5">
          <TrendingUp size={14} className="text-white" strokeWidth={2} />
        </div>
      )}

      <div className={clsx('flex flex-col', isUser ? 'items-end' : 'items-start')}>
        {/* Bubble */}
        <div
          className={clsx(
            'px-4 py-3 rounded-2xl text-sm leading-relaxed font-body',
            isUser
              ? 'bg-brand-500 text-white rounded-br-sm'
              : 'bg-white border border-surface-border text-gray-800 rounded-bl-sm shadow-sm'
          )}
        >
          {formatContent(message.content)}
        </div>

        {/* Source badge */}
        {!isUser && src.label && (
          <div className={clsx('flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium', src.bg, src.text)}>
            {src.Icon && <src.Icon size={10} strokeWidth={2} />}
            {src.label}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-gray-300 mt-1 px-1">
          {message.timestamp?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
