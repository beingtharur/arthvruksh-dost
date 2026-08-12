import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { MessageCircle, BookOpen, HelpCircle, TrendingUp, Menu, X } from 'lucide-react'
import clsx from 'clsx'
import { useAppHeight } from '../hooks/useAppHeight.js'

const NAV = [
  { to: '/',       label: 'Chat',    icon: MessageCircle, desc: 'Ask anything' },
  { to: '/learn',  label: 'Learn',   icon: BookOpen,      desc: 'Concepts' },
  { to: '/faq',    label: 'FAQ',     icon: HelpCircle,    desc: 'Quick answers' },
]

const DISCLAIMER =
  'Educational content only — not investment advice. ArthVruksh Dost does not recommend funds, schemes, or SIP amounts. Consult a SEBI/AMFI-registered advisor for personalized guidance.'

function SidebarContent({ onNavigate }) {
  return (
    <>
      {/* Brand */}
      <div className="px-5 py-5 lg:px-6 lg:py-6 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-lg leading-tight text-gray-900 truncate">ArthVruksh Dost</h1>
            <p className="text-xs text-gray-400 font-body">Educational Fund Assistant · India</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto chat-scrollbar px-3 py-4 space-y-1">
        {NAV.map(({ to, label, icon: Icon, desc }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-3 lg:py-2.5 rounded-lg transition-all duration-150 group tap-clean',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 active:bg-gray-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  className={clsx('shrink-0', isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600')}
                />
                <div className="min-w-0">
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
      <div className="px-4 py-4 border-t border-surface-border pb-safe">
        <p className="text-[11px] text-gray-400 leading-relaxed">{DISCLAIMER}</p>
      </div>
    </>
  )
}

export default function Layout({ children }) {
  useAppHeight()

  const [open, setOpen] = useState(false)
  const location = useLocation()
  const closeButtonRef = useRef(null)

  // Close the drawer whenever the route changes.
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Escape to close + focus management while the drawer is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    closeButtonRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const activeItem = NAV.find((n) => n.to === location.pathname) ?? NAV[0]

  return (
    <div className="h-app flex flex-col lg:flex-row bg-surface overflow-hidden">
      {/* ---------- Mobile / tablet top bar ---------- */}
      <header className="lg:hidden shrink-0 bg-white border-b border-surface-border pt-safe">
        <div className="flex items-center gap-3 px-3 h-14">
          <button
            onClick={() => setOpen(true)}
            className="w-10 h-10 -ml-1 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors shrink-0 tap-clean"
            aria-label="Open navigation menu"
            aria-expanded={open}
          >
            <Menu size={20} strokeWidth={1.9} />
          </button>

          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
              <TrendingUp size={16} className="text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-base leading-tight text-gray-900 truncate">
                ArthVruksh Dost
              </h1>
              <p className="text-[10px] text-gray-400 leading-tight truncate">
                {activeItem.label} · {activeItem.desc}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ---------- Drawer (mobile / tablet) ---------- */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className="absolute inset-0 bg-gray-900/40 animate-fade-in"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-[min(19rem,85vw)] max-w-full h-full bg-white flex flex-col shadow-xl animate-slide-in-left pt-safe pl-safe">
            <button
              ref={closeButtonRef}
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors z-10 tap-clean"
              aria-label="Close navigation menu"
            >
              <X size={18} strokeWidth={1.9} />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* ---------- Static sidebar (desktop, unchanged) ---------- */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-surface-border bg-white flex-col">
        <SidebarContent />
      </aside>

      {/* ---------- Main content ---------- */}
      <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
