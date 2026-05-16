import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

// Defense-in-depth: alleen bypassen als de build dev is EN we op localhost
// draaien. Voorkomt dat een productie-build die per ongeluk dev-mode aan
// heeft (CI misconfig, env-leak) auth-loos serveert.
function shouldBypassAuth(): boolean {
  if (!import.meta.env.DEV) return false
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0'
}

export function AuthGuard() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (shouldBypassAuth()) {
    return <Outlet />
  }

  if (loading) {
    return (
      <div className="min-h-full grid place-items-center">
        <div className="t-body-m t-soft">Laden…</div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
