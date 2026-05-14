import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../lib/cn'
import { useAuth } from '../lib/auth'

const tabs = [
  { to: '/overview', label: 'Overzicht' },
  { to: '/menu', label: 'Menu' },
  { to: '/dishes', label: 'Gerechten' },
  { to: '/ingredients', label: 'Ingrediënten' },
  { to: '/shopping', label: 'Boodschappen' },
  { to: '/guests', label: 'Gasten' },
  { to: '/finance', label: 'Financieel' },
  { to: '/settings', label: 'Instellingen' },
] as const

export function AppShell() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Uitgelogd')
    } catch (error) {
      console.error('Sign out failed:', error)
      toast.error('Uitloggen mislukt')
    }
  }

  return (
    <div className="min-h-full flex flex-col bg-bg">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-surface/75 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="font-semibold tracking-tight">Vaste Grond</div>
          <nav className="flex gap-0.5 overflow-x-auto -mx-2 px-2 ml-auto">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    'tap whitespace-nowrap rounded-ios px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-fg shadow-sm'
                      : 'text-text-muted hover:text-text hover:bg-surface-2',
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            onClick={handleSignOut}
            title={user?.email ?? 'Uitloggen'}
            aria-label="Uitloggen"
            className="tap rounded-ios p-2 text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </header>
      <main key={location.pathname} className="flex-1 animate-rise">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
