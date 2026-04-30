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
    <div className="px-4 py-3 border-t border-surface-border bg-surface">
      <p className="text-[11px] text-gray-400 mb-2 font-medium uppercase tracking-wide">Quick questions · sourced from NISM workbook</p>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className="text-xs px-3 py-1.5 rounded-full border border-surface-border bg-white text-gray-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 transition-all duration-150 font-body"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
