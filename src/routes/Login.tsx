import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Button, Card, Field, Input } from '../components/ui'

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Geldig e-mailadres vereist'),
  code: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Code is 4 cijfers'),
})

export function Login() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
    const parsed = schema.safeParse({ email, code })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Ongeldige invoer')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.code,
      })
      if (error) {
        toast.error('E-mail of code klopt niet.')
        return
      }
      // Session change triggert AuthGuard redirect
    } catch {
      toast.error('Er ging iets mis. Probeer het opnieuw.')
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
          <Field label="Code" htmlFor="login-code">
            <Input
              id="login-code"
              type="password"
              autoComplete="current-password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
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
