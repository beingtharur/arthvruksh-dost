import { useState, useRef, useEffect, useCallback } from 'react'
import { Send } from 'lucide-react'
import clsx from 'clsx'

const MIN_H = 44
const MAX_H = 140

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  const autosize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(MIN_H, Math.min(el.scrollHeight, MAX_H))}px`
    // Once the box hits its ceiling it needs its own scrollbar, otherwise the
    // caret can run off the bottom on a phone.
    el.style.overflowY = el.scrollHeight > MAX_H ? 'auto' : 'hidden'
  }, [])

  useEffect(() => { autosize() }, [value, autosize])

  // The composer must stay visible when the software keyboard animates in.
  // The shell is already sized to the visual viewport, but iOS needs one nudge
  // after the animation settles.
  const handleFocus = () => {
    window.setTimeout(() => {
      textareaRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }, 300)
  }

  const handleSend = () => {
    const msg = value.trim()
    if (!msg || disabled) return
    onSend(msg)
    setValue('')
    const el = textareaRef.current
    if (el) {
      el.style.height = `${MIN_H}px`
      el.style.overflowY = 'hidden'
      // Keep the keyboard up on mobile so the next question can be typed
      // straight away instead of re-tapping the field.
      el.focus()
    }
  }

  const handleKey = (e) => {
    // Enter-to-send only makes sense with a hardware keyboard. On touch
    // devices Enter must insert a newline, since the on-screen return key is
    // the only way to break a line.
    const isTouch = typeof window !== 'undefined'
      && window.matchMedia('(hover: none) and (pointer: coarse)').matches

    if (e.key === 'Enter' && !e.shiftKey && !isTouch) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = Boolean(value.trim()) && !disabled

  return (
    <div className="shrink-0 border-t border-surface-border bg-white px-3 py-2.5 sm:px-4 sm:py-3 pb-safe">
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder="Ask about SIP, NAV, tax rules, risk..."
          rows={1}
          enterKeyHint="enter"
          autoComplete="off"
          autoCorrect="on"
          autoCapitalize="sentences"
          spellCheck="true"
          className={clsx(
            'flex-1 min-w-0 resize-none rounded-xl border border-surface-border px-3.5 py-2.5 sm:px-4',
            // 16px on mobile prevents iOS Safari from zooming the page on focus;
            // desktop keeps the original 14px scale.
            'text-base sm:text-sm font-body text-gray-800 placeholder:text-gray-400',
            'bg-surface focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
            'transition-colors duration-150 min-h-[44px] max-h-[140px] leading-relaxed',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={clsx(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 tap-clean',
            canSend
              ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow active:scale-95'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          )}
          aria-label="Send message"
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </div>
      <p className="hidden xs:block text-[10px] text-gray-300 mt-2 text-center leading-snug">
        Educational only · No fund/SIP recommendations · Consult a SEBI/AMFI-registered advisor for personalised guidance
      </p>
      <p className="xs:hidden text-[10px] text-gray-300 mt-1.5 text-center leading-snug">
        Educational only · Not investment advice
      </p>
    </div>
  )
}
