import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, setToken, loadStoredToken } from './api'

export type AuthUser = {
  id: string
  email: string
  displayName: string | null
}

type AuthState = {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, pin: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const token = loadStoredToken()
    if (!token) {
      setLoading(false)
      return
    }
    setToken(token)
    api
      .get<AuthUser>('/auth/me')
      .then((u) => {
        if (active) { setUser(u); setLoading(false) }
      })
      .catch(() => {
        if (active) { setToken(null); setLoading(false) }
      })
    return () => { active = false }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      signIn: async (email: string, pin: string) => {
        const { token, user: u } = await api.post<{ token: string; user: AuthUser }>(
          '/auth/login',
          { email, pin },
        )
        setToken(token)
        setUser(u)
      },
      signOut: () => {
        setToken(null)
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
