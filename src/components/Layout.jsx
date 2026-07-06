import { NavLink } from 'react-router-dom'
import { MessageCircle, BookOpen, HelpCircle, TrendingUp } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { to: '/',       label: 'Chat',    icon: MessageCircle, desc: 'Ask anything' },
  { to: '/learn',  label: 'Learn',   icon: BookOpen,      desc: 'Concepts' },
  { to: '/faq',    label: 'FAQ',     icon: HelpCircle,    desc: 'Quick answers' },
]

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex bg-surface">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-surface-border bg-white flex flex-col">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
              <TrendingUp size={18} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-display text-lg leading-tight text-gray-900">ArthVruksh Dost</h1>
              <p className="text-xs text-gray-400 font-body">Educational Fund Assistant · India</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon, desc }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}
                  />
                  <div>
                    <p className="text-sm font-medium leading-tight">{label}</p>
                    <p className={clsx('text-xs leading-tight', isActive ? 'text-brand-500' : 'text-gray-400')}>
                      {desc}
                    </p>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer disclaimer */}
        <div className="px-4 py-4 border-t border-surface-border">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Educational content only — not investment advice. ArthVruksh Dost does not recommend funds, schemes, or SIP amounts. Consult a SEBI/AMFI-registered advisor for personalized guidance.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
