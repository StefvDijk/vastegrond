import { NavLink, Outlet } from 'react-router-dom'
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
      <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="font-semibold tracking-tight">Vaste Grond</div>
          <nav className="flex gap-1 overflow-x-auto -mb-px ml-auto">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-1.5 rounded-ios text-sm font-medium transition-colors whitespace-nowrap',
                    isActive
                      ? 'bg-accent text-accent-fg'
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
            className="rounded-ios p-2 text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
