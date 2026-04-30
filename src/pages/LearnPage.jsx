import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react'
import clsx from 'clsx'

const CONCEPTS = [
  {
    category: 'Core Concepts',
    color: 'bg-brand-50 border-brand-200',
    accent: 'text-brand-700',
    items: [
      {
        term: 'SIP — Systematic Investment Plan',
        simple: 'Invest a fixed amount every month automatically',
        detail:
          'SIP is the most disciplined way to invest in mutual funds. You set a fixed amount (₹500, ₹1,000, ₹5,000...) and it gets auto-debited from your bank account every month. You buy units at whatever NAV the market offers that day. Over time, this "rupee cost averaging" means you buy more units when prices are low and fewer when high — which is exactly the right behavior.',
        example: '₹5,000/month SIP for 20 years at 12% CAGR = ₹49.9 lakhs (invested ₹12 lakhs)',
      },
      {
        term: 'NAV — Net Asset Value',
        simple: 'The price of one unit of a mutual fund',
        detail:
          "NAV is calculated every business day after market close. The fund manager adds up the market value of all stocks/bonds the fund holds, subtracts expenses, and divides by the number of units outstanding. A ₹500 NAV doesn't mean the fund is expensive — what matters is how much the NAV has grown over time, not the absolute number.",
        example: 'NAV = (Total Assets − Expenses) ÷ Total Units',
      },
      {
        term: 'CAGR — Compound Annual Growth Rate',
        simple: 'The average yearly return of your investment',
        detail:
          "CAGR smooths out year-by-year volatility to give you one clean number: 'This fund grew at X% per year.' It assumes all returns are reinvested. Use it to compare two funds over the same time period. Don't compare a 1-year CAGR with a 10-year CAGR — they're not the same thing.",
        example: '₹1 lakh → ₹2.5 lakh in 7 years = CAGR of 13.9%/year',
      },
    ],
  },
  {
    category: 'Tax & Savings',
    color: 'bg-blue-50 border-blue-200',
    accent: 'text-blue-700',
    items: [
      {
        term: 'ELSS — Equity Linked Savings Scheme',
        simple: 'Tax-saving mutual fund with only 3-year lock-in',
        detail:
          "ELSS is the smartest 80C investment for most people. You get up to ₹1.5 lakh/year in tax deduction, the shortest lock-in (3 years vs PPF's 15 years), and equity-level return potential. The trade-off: it's market-linked, so it can fall in the short term. Over 5+ years, ELSS has historically beaten FDs and PPF on returns.",
        example: 'Invest ₹1.5 lakh in ELSS → save ₹46,800 in tax (30% slab)',
      },
      {
        term: 'LTCG & STCG',
        simple: 'Two types of capital gains tax on mutual funds',
        detail:
          'Short-Term Capital Gain (STCG): Equity funds held less than 12 months — taxed at 20%. Long-Term Capital Gain (LTCG): Equity funds held more than 12 months — 12.5% tax on gains above ₹1.25 lakh per year. Debt funds (bought after April 2023) are taxed as per your income slab — no LTCG benefit.',
        example: 'Gain of ₹2 lakh in equity fund after 1 year → tax on ₹75,000 (₹2L - ₹1.25L) at 12.5% = ₹9,375',
      },
    ],
  },
  {
    category: 'Fund Structure',
    color: 'bg-amber-50 border-amber-200',
    accent: 'text-amber-700',
    items: [
      {
        term: 'Direct vs Regular Plan',
        simple: 'Direct is cheaper; Regular has a middleman',
        detail:
          "In a Direct Plan, you invest straight with the AMC. No distributor, no commission — so the expense ratio is lower. In a Regular Plan, a broker/bank/distributor is involved and gets a commission, which is baked into your expense ratio. The difference of 0.5–1% per year seems small but compounds massively. Over 20 years, a ₹10,000/month SIP can generate ₹8–12 lakh more in Direct vs Regular.",
        example: 'Regular: 1.5% expense ratio | Direct: 0.7% expense ratio → 0.8% difference compounds over decades',
      },
      {
        term: 'Expense Ratio',
        simple: 'Annual fee the fund house charges to manage your money',
        detail:
          "The expense ratio is deducted from the fund's assets daily (you don't pay it separately — it's already reflected in the NAV). SEBI caps expense ratios: equity funds max 2.25%, debt funds max 2%. Lower is better. Index funds typically have expense ratios of 0.1–0.2%, making them very cost-efficient for long-term investors.",
        example: 'Expense ratio 1% on ₹5 lakh = ₹5,000/year deducted from your corpus',
      },
    ],
  },
  {
    category: 'Investing Behavior',
    color: 'bg-emerald-50 border-emerald-200',
    accent: 'text-emerald-700',
    items: [
      {
        term: 'Rupee Cost Averaging',
        simple: 'SIP automatically buys cheaper when markets fall',
        detail:
          "When you invest ₹5,000/month via SIP: In a good month (NAV ₹50) → you get 100 units. In a bad month (NAV ₹25) → you get 200 units. You automatically bought more when it was cheap! Over time this averaging lowers your average cost per unit and improves returns. This is why stopping SIP during market crashes is a mistake — that's exactly when you should be buying more.",
        example: 'SIP automatically does what smart investors do: buy more when cheap, less when expensive',
      },
      {
        term: 'Power of Compounding',
        simple: 'Your returns earn returns — exponential wealth creation',
        detail:
          "Compounding means your profits get reinvested and start earning their own profits. ₹1 lakh at 12% CAGR becomes ₹3.1 lakh in 10 years, ₹9.6 lakh in 20 years, and ₹29.9 lakh in 30 years. The growth is exponential, not linear. The two rules of compounding: start early, and never interrupt it. Even a 5-year delay can cost you 40–50% of your final corpus.",
        example: '₹1 lakh for 10 years at 12% = ₹3.1 lakh | For 20 years = ₹9.6 lakh | For 30 years = ₹29.9 lakh',
      },
    ],
  },
]

function ConceptCard({ item, accent }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="bg-white border border-surface-border rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4"
      >
        <div>
          <h3 className="text-sm font-semibold text-gray-800 font-body">{item.term}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{item.simple}</p>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-gray-400 shrink-0 mt-0.5" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0 mt-0.5" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 animate-fade-in">
          <p className="text-sm text-gray-600 leading-relaxed font-body">{item.detail}</p>
          <div className="mt-3 p-3 bg-surface rounded-lg border border-surface-border">
            <p className="text-xs text-gray-500 font-mono">{item.example}</p>
          </div>
          <button
            onClick={() => navigate('/', { state: { ask: `Explain ${item.term.split('—')[0].trim()} in detail` } })}
            className="mt-3 flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            <MessageCircle size={12} />
            Ask the AI more about this
          </button>
        </div>
      )}
    </div>
  )
}

export default function LearnPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="px-6 py-4 border-b border-surface-border bg-white shrink-0">
        <h2 className="font-display text-xl text-gray-900">Learn Mutual Funds</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Beginner-friendly explanations · India-focused · Click any card to expand
        </p>
      </header>

      <div className="flex-1 overflow-y-auto chat-scrollbar px-6 py-5 space-y-6">
        {CONCEPTS.map((section) => (
          <div key={section.category}>
            <div className={clsx('inline-flex items-center px-3 py-1 rounded-full border text-xs font-medium mb-3', section.color, section.accent)}>
              {section.category}
            </div>
            <div className="space-y-2">
              {section.items.map((item) => (
                <ConceptCard key={item.term} item={item} accent={section.accent} />
              ))}
            </div>
          </div>
        ))}

        <div className="pb-6 text-center">
          <p className="text-xs text-gray-400">
            Want to learn something specific? Head to the Chat tab and ask anything.
          </p>
        </div>
      </div>
    </div>
  )
}
