import { useState } from 'react'
import { Search, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import clsx from 'clsx'
import { FAQ_DATA, SOURCE_INFO } from '../data/faqData.js'

const CATEGORIES = ['All', ...Array.from(new Set(FAQ_DATA.map((f) => f.category)))]

const CATEGORY_COLORS = {
  Basics:     'bg-brand-50 text-brand-700 border-brand-200',
  Tax:        'bg-blue-50 text-blue-700 border-blue-200',
  Returns:    'bg-amber-50 text-amber-700 border-amber-200',
  Market:     'bg-red-50 text-red-600 border-red-200',
  Risk:       'bg-purple-50 text-purple-700 border-purple-200',
  'Fund Types': 'bg-teal-50 text-teal-700 border-teal-200',
  Costs:      'bg-orange-50 text-orange-700 border-orange-200',
  Regulation: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Process:    'bg-green-50 text-green-700 border-green-200',
}

function FaqItem({ item }) {
  const [open, setOpen] = useState(false)
  const colorClass = CATEGORY_COLORS[item.category] || 'bg-gray-50 text-gray-600 border-gray-200'

  return (
    <div className="bg-white border border-surface-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left px-5 py-4 flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full border', colorClass)}>
              {item.category}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-800 leading-snug font-body">{item.question}</h3>
        </div>
        <div className="shrink-0 mt-1">
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-surface-border">
          <div className="pt-3 text-sm text-gray-600 leading-relaxed font-body whitespace-pre-line">
            {item.answer}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = FAQ_DATA.filter((item) => {
    const matchSearch =
      !search ||
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase())
    const matchCategory = activeCategory === 'All' || item.category === activeCategory
    return matchSearch && matchCategory
  })

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="px-6 py-4 border-b border-surface-border bg-white shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl text-gray-900">FAQ — Quick Answers</h2>
            <p className="text-xs text-gray-400 mt-0.5">Common mutual fund questions · {FAQ_DATA.length} answers</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-brand-600 bg-brand-50 border border-brand-200 rounded-lg px-3 py-1.5">
            <BookOpen size={12} />
            <span>Source: NISM Workbook Nov 2025</span>
          </div>
        </div>

        <div className="mt-3 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search FAQs... (e.g. SIP, NAV, LTCG, exit load)"
            className="w-full pl-9 pr-4 py-2 text-sm border border-surface-border rounded-lg bg-surface focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 font-body"
          />
        </div>

        <div className="mt-3 flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                'text-xs px-3 py-1 rounded-full border transition-all duration-150 font-body',
                activeCategory === cat
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-gray-500 border-surface-border hover:border-brand-300 hover:text-brand-600'
              )}
            >
              {cat} {cat === 'All' ? `(${FAQ_DATA.length})` : `(${FAQ_DATA.filter(f => f.category === cat).length})`}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto chat-scrollbar px-6 py-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Search size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No FAQs match your search.</p>
            <p className="text-xs mt-1">Try asking the AI in the Chat tab!</p>
          </div>
        ) : (
          filtered.map((item) => <FaqItem key={item.id} item={item} />)
        )}
        <div className="pb-4 pt-2 text-center">
          <p className="text-[10px] text-gray-400">
            All answers sourced from: {SOURCE_INFO.title} ({SOURCE_INFO.version}) · {SOURCE_INFO.publisher}
          </p>
        </div>
      </div>
    </div>
  )
}
