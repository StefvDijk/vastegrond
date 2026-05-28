import { type FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuth } from '../lib/auth'
import { Button, Card, Field, Input } from '../components/ui'

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Geldig e-mailadres vereist'),
  pin: z.string().trim().regex(/^\d{4}$/, 'Code is 4 cijfers'),
})

export function Login() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="min-h-full grid place-items-center">
        <div className="t-body-m t-soft">Laden…</div>
      </div>
    )
  }

  if (user) return <Navigate to="/overview" replace />

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = schema.safeParse({ email, pin })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Ongeldige invoer')
      return
    }
    setSubmitting(true)
    try {
      await signIn(parsed.data.email, parsed.data.pin)
      navigate('/overview', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Er ging iets mis.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-full grid place-items-center p-s-5">
      <Card className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-s-3">
          <span className="vg-topnav__mark" aria-hidden />
          <span className="t-mono-s t-faded">Vaste Grond</span>
        </div>
        <h1
          style={{ fontSize: 32, lineHeight: 1.08, letterSpacing: '-0.028em', fontWeight: 600 }}
        >
          Inloggen
        </h1>
        <p className="t-body-m t-soft mt-s-3">
          Vul je e-mailadres in plus je 4-cijferige code.
        </p>
        <form onSubmit={onSubmit} className="mt-s-6 flex flex-col gap-s-4">
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
          <Field label="Code" htmlFor="login-pin">
            <Input
              id="login-pin"
              type="password"
              autoComplete="current-password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              style={{ letterSpacing: '0.4em', fontFamily: 'var(--font-mono)' }}
            />
          </Field>
          <Button type="submit" variant="accent" disabled={submitting}>
            {submitting ? 'Inloggen…' : 'Inloggen'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
