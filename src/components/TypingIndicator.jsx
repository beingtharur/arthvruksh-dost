import { TrendingUp } from 'lucide-react'

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 self-start animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
        <TrendingUp size={14} className="text-white" strokeWidth={2} />
      </div>
      <div className="bg-white border border-surface-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-4">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce-dot" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce-dot" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce-dot" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
