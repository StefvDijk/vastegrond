import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutGrid,
  UtensilsCrossed,
  BookOpenText,
  ShoppingBasket,
  MoreHorizontal,
  Users,
  Wallet,
  Sprout,
  StickyNote,
  Sparkles,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../lib/cn'
import { useAuth } from '../lib/auth'

const navItems = [
  { to: '/overview', label: 'Overzicht' },
  { to: '/menu', label: 'Menu' },
  { to: '/dishes', label: 'Recepten' },
  { to: '/shopping', label: 'Boodschappen' },
  { to: '/ingredients', label: 'Ingrediënten' },
  { to: '/guests', label: 'Gasten' },
  { to: '/finance', label: 'Geld' },
  { to: '/notes', label: 'Notities' },
  { to: '/inspiration', label: 'Inspiratie' },
  { to: '/settings', label: 'Team' },
] as const

const primaryMobileTabs = [
  { to: '/overview', label: 'Overzicht', icon: LayoutGrid },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/dishes', label: 'Recepten', icon: BookOpenText },
  { to: '/shopping', label: 'Bood.', icon: ShoppingBasket },
] as const

const moreItems = [
  { to: '/ingredients', label: 'Ingrediënten', icon: Sprout },
  { to: '/guests', label: 'Gasten', icon: Users },
  { to: '/finance', label: 'Geld', icon: Wallet },
  { to: '/notes', label: 'Notities', icon: StickyNote },
  { to: '/inspiration', label: 'Inspiratie', icon: Sparkles },
  { to: '/settings', label: 'Team', icon: SettingsIcon },
] as const

export function AppShell() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Uitgelogd')
    } catch (error) {
      console.error('Sign out failed:', error)
      toast.error('Uitloggen mislukt')
    }
  }

  const moreActive = moreItems.some((item) => location.pathname.startsWith(item.to))

  return (
    <div className="min-h-full flex flex-col">
      {/* Desktop top nav */}
      <header className="vg-topnav hidden md:block">
        <div className="vg-topnav__inner">
          <NavLink to="/overview" className="vg-topnav__brand">
            <span className="vg-topnav__mark" aria-hidden />
            <span>Vaste Grond</span>
          </NavLink>
          <nav className="vg-topnav__items" aria-label="Hoofdnavigatie">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn('vg-topnav__item', isActive && 'vg-topnav__item--on')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-body-s t-soft">
            <span className="hidden lg:inline">{user?.email}</span>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Uitloggen"
              title="Uitloggen"
              className="vg-sheet__close"
            >
              <LogOut size={18} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main key={location.pathname} className="flex-1 animate-rise pb-32 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom tabs */}
      <nav className="vg-bottomtabs md:hidden" aria-label="Hoofdnavigatie">
        {primaryMobileTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn('vg-bottomtabs__item', isActive && 'vg-bottomtabs__item--on')
              }
            >
              <Icon size={22} aria-hidden />
              <span>{tab.label}</span>
            </NavLink>
          )
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn('vg-bottomtabs__item', moreActive && 'vg-bottomtabs__item--on')}
        >
          <MoreHorizontal size={22} aria-hidden />
          <span>Meer</span>
        </button>
      </nav>

      {/* Mobile "Meer" sheet */}
      {moreOpen ? (
        <>
          <div
            className="vg-overlay md:hidden"
            onClick={() => setMoreOpen(false)}
            aria-hidden
          />
          <div
            className="fixed inset-x-0 bottom-0 z-[60] vg-card animate-rise md:hidden"
            style={{ borderRadius: '20px 20px 0 0', paddingBottom: 'calc(40px + env(safe-area-inset-bottom))' }}
            role="dialog"
            aria-modal="true"
          >
            <span className="t-caption t-faded">Meer</span>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {moreItems.map((item) => {
                const Icon = item.icon
                const active = location.pathname.startsWith(item.to)
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-m border border-line p-4 text-body-m',
                      active && 'bg-paper-deep',
                    )}
                  >
                    <Icon size={18} className="text-ink-soft" aria-hidden />
                    {item.label}
                  </NavLink>
                )
              })}
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false)
                  void handleSignOut()
                }}
                className="col-span-2 flex items-center gap-3 rounded-m border border-line p-4 text-body-m text-negative"
              >
                <LogOut size={18} aria-hidden />
                Uitloggen
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
