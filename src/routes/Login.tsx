import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Button, Card, Field, Input } from '../components/ui'

const emailSchema = z.string().trim().toLowerCase().email('Geldig e-mailadres vereist')

export function Login() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  if (loading) {
    return (
      <div className="min-h-full grid place-items-center">
        <div className="t-body-m t-soft">Laden…</div>
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
    <div className="min-h-full grid place-items-center p-s-5">
      <Card className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-2">
          <span className="vg-topnav__mark" aria-hidden />
          <span className="t-heading-m">Vaste Grond</span>
        </div>
        <h1 className="t-heading-l mt-4">Inloggen</h1>
        <p className="t-body-m t-soft mt-2">
          Vul je e-mailadres in. Je krijgt een magic link om in te loggen.
        </p>

        {sent ? (
          <div className="mt-6 rounded-m bg-paper-deep p-s-5 text-body-s">
            <p className="t-heading-m text-ink">Check je inbox.</p>
            <p className="mt-2 t-soft">
              We hebben een inloglink gestuurd naar <strong>{email}</strong>. Open de link op dit
              apparaat.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="vg-btn vg-btn--ghost mt-3"
            >
              Ander e-mailadres gebruiken
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-s-4">
            <Field label="E-mail" htmlFor="login-email">
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jij@voorbeeld.nl"
              />
            </Field>
            <Button type="submit" variant="accent" disabled={submitting}>
              {submitting ? 'Versturen…' : 'Stuur magic link'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
