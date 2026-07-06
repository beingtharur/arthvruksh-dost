import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import clsx from 'clsx'

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px'
    }
  }, [value])

  const handleSend = () => {
    const msg = value.trim()
    if (!msg || disabled) return
    onSend(msg)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = '44px'
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="px-4 py-3 border-t border-surface-border bg-white">
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
          placeholder="Ask about SIP, NAV, tax rules, risk..."
          rows={1}
          className={clsx(
            'flex-1 resize-none rounded-xl border border-surface-border px-4 py-2.5',
            'text-sm font-body text-gray-800 placeholder:text-gray-400',
            'bg-surface focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
            'transition-all duration-150 min-h-[44px] max-h-[140px]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={clsx(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150',
            value.trim() && !disabled
              ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow active:scale-95'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          )}
          aria-label="Send message"
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </div>
      <p className="text-[10px] text-gray-300 mt-2 text-center">
        Educational only · No fund/SIP recommendations · Consult a SEBI/AMFI-registered advisor for personalised guidance
      </p>
    </div>
  )
}
