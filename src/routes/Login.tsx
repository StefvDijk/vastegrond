import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const emailSchema = z.string().trim().toLowerCase().email('Geldig e-mailadres vereist')

export function Login() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  if (loading) {
    return (
      <div className="min-h-full grid place-items-center bg-bg">
        <div className="text-sm text-text-muted">Laden…</div>
      </div>
    )
  }

  if (session) {
    return <Navigate to="/overview" replace />
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Ongeldig e-mailadres')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data,
        options: {
          emailRedirectTo: `${window.location.origin}/overview`,
          shouldCreateUser: false,
        },
      })
      if (error) {
        console.error('Magic link error:', error)
        toast.error('Inloggen mislukt — vraag toegang aan bij de beheerder.')
        return
      }
      setSent(true)
      toast.success('Check je mail — de link is onderweg.')
    } catch (error) {
      console.error('Magic link exception:', error)
      toast.error('Er ging iets mis. Probeer het later opnieuw.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-full grid place-items-center bg-bg p-4">
      <div className="card w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold tracking-tight">Inloggen</h1>
        <p className="mt-2 text-sm text-text-muted">
          Vul je e-mailadres in. Je krijgt een magic link om in te loggen.
        </p>

        {sent ? (
          <div className="mt-5 rounded-ios bg-surface-2 p-4 text-sm">
            <p className="font-medium text-text">Check je inbox.</p>
            <p className="mt-1 text-text-muted">
              We hebben een inloglink gestuurd naar <strong>{email}</strong>. Open
              de link op dit apparaat.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-3 text-sm text-accent hover:underline"
            >
              Ander e-mailadres gebruiken
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <label className="block">
              <span className="block text-sm font-medium text-text">E-mail</span>
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jij@voorbeeld.nl"
                className="mt-1 w-full rounded-ios border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-ios bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Versturen…' : 'Stuur magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
