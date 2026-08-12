import clsx from 'clsx'
import { TrendingUp, Database, Cpu, AlertCircle, ShieldAlert, Ban, History } from 'lucide-react'

const SOURCE_CONFIG = {
  faq:                 { label: 'NISM database',      bg: 'bg-emerald-50',  text: 'text-emerald-700',  Icon: Database },
  gemini:              { label: 'Gemini · AI',        bg: 'bg-blue-50',     text: 'text-blue-700',     Icon: Cpu },
  groq:                { label: 'Groq · AI',          bg: 'bg-amber-50',    text: 'text-amber-700',    Icon: Cpu },
  ai:                  { label: 'AI answer',          bg: 'bg-blue-50',     text: 'text-blue-700',     Icon: Cpu },
  'compliance-redirect': { label: 'Educational only', bg: 'bg-teal-50',     text: 'text-teal-700',     Icon: ShieldAlert },
  'compliance-guard':  { label: 'Rephrased for compliance', bg: 'bg-teal-50', text: 'text-teal-700',   Icon: ShieldAlert },
  'out-of-scope':      { label: 'Out of scope',       bg: 'bg-gray-100',    text: 'text-gray-500',     Icon: Ban },
  error:               { label: 'Error',              bg: 'bg-red-50',      text: 'text-red-600',      Icon: AlertCircle },
  system:              { label: null, bg: '', text: '', Icon: null },
  user:                { label: null, bg: '', text: '', Icon: null },
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
  const isHistoricalData = message.intent === 'FundHistoricalData'
  const src = isHistoricalData
    ? { label: 'Historical data', bg: 'bg-amber-50', text: 'text-amber-700', Icon: History }
    : SOURCE_CONFIG[message.source] || SOURCE_CONFIG.ai

  return (
    <div
      className={clsx(
        'flex gap-2 sm:gap-3 max-w-[92%] sm:max-w-[85%] min-w-0 animate-fade-up',
        isUser ? 'self-end flex-row-reverse' : 'self-start'
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-500 flex items-center justify-center shrink-0 mt-0.5">
          <TrendingUp size={14} className="text-white" strokeWidth={2} />
        </div>
      )}

      <div className={clsx('flex flex-col min-w-0', isUser ? 'items-end' : 'items-start')}>
        {/* Bubble */}
        <div
          className={clsx(
            'px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-[13.5px] sm:text-sm leading-relaxed font-body',
            'max-w-full break-words [overflow-wrap:anywhere]',
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

        {/* Fixed, code-owned caption — not reliant on the model remembering
            to include this every time it states a historical figure. */}
        {!isUser && isHistoricalData && (
          <p className="text-[10px] text-amber-700/70 mt-1 px-1 italic">
            Past performance is not indicative of future returns.
          </p>
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-gray-300 mt-1 px-1">
          {message.timestamp?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
