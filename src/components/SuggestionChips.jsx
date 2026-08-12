const SUGGESTIONS = [
  'What is SIP?',
  'How does NAV work?',
  'What is CAGR?',
  'ELSS tax benefit under 80C?',
  'Direct vs Regular plan?',
  'Why is my portfolio down?',
  'What is exit load?',
  'Types of equity funds?',
  'How are debt funds taxed?',
  'What is Rupee Cost Averaging?',
]

export default function SuggestionChips({ onSelect, visible }) {
  if (!visible) return null
  return (
    <div className="shrink-0 border-t border-surface-border bg-surface py-2.5 sm:py-3">
      <p className="text-[10px] sm:text-[11px] text-gray-400 mb-2 px-3 sm:px-4 font-medium uppercase tracking-wide">
        <span className="sm:hidden">Quick questions</span>
        <span className="hidden sm:inline">Quick questions · sourced from NISM workbook</span>
      </p>

      {/* Phones: a single swipeable rail so the chips never eat the message
          area. Tablet and up: the original wrapping cloud.
          No scroll-snap here — with horizontal padding it forces an offset on
          load that reads as a gap before the first chip. */}
      <div
        className={[
          'flex gap-2 px-3 sm:px-4',
          'overflow-x-auto no-scrollbar',
          'sm:overflow-visible sm:flex-wrap',
        ].join(' ')}
      >
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className="shrink-0 sm:shrink text-xs px-3 py-2 sm:py-1.5 rounded-full border border-surface-border bg-white text-gray-600 whitespace-nowrap sm:whitespace-normal hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 active:bg-brand-100 transition-all duration-150 font-body tap-clean"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
