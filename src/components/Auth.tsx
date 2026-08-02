import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Step = 'email' | 'code'

/**
 * Connexion par code à 6 chiffres (OTP) reçu par email.
 * Pas de magic link : un lien ouvrirait Safari au lieu de la PWA installée.
 */
export function Auth() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setStep('code')
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    // Selon que le compte vient d'être créé ou existait déjà, Supabase émet un
    // token de type "signup" ou "email". On essaie les deux plutôt que de
    // renvoyer un "Token has expired or is invalid" trompeur.
    const attempt = (type: 'email' | 'signup' | 'magiclink') =>
      supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type })

    let { error } = await attempt('email')
    if (error) ({ error } = await attempt('signup'))
    if (error) ({ error } = await attempt('magiclink'))

    setBusy(false)
    // En cas de succès, onAuthStateChange bascule l'app : rien à faire ici.
    if (error) setError(error.message)
  }

  return (
    <div className="safe-top safe-bottom safe-x flex min-h-[100dvh] flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">GoalLife</h1>
        <p className="mt-1 text-sm text-black/50">Calories, macros et poids. Rien d'autre.</p>

        {step === 'email' ? (
          <form className="mt-8 space-y-3" onSubmit={sendCode}>
            <div>
              <label className="label" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                className="field font-sans"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                enterKeyHint="send"
                placeholder="toi@exemple.com"
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full py-3.5"
              disabled={busy || !email.trim()}
            >
              {busy ? 'Envoi…' : 'Recevoir un code'}
            </button>
            <p className="text-center text-xs text-black/40">
              Un code à 6 chiffres arrive par email. Pas de mot de passe.
            </p>
          </form>
        ) : (
          <form className="mt-8 space-y-3" onSubmit={verify}>
            <div>
              <label className="label" htmlFor="auth-code">
                Code reçu à {email}
              </label>
              <input
                id="auth-code"
                className="field text-center text-2xl tracking-[0.4em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                enterKeyHint="go"
                placeholder="000000"
                autoFocus
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full py-3.5"
              disabled={busy || code.length !== 6}
            >
              {busy ? 'Vérification…' : 'Se connecter'}
            </button>
            <button
              type="button"
              className="btn-ghost w-full py-3"
              onClick={() => {
                setStep('email')
                setCode('')
                setError(null)
              }}
            >
              Changer d'email
            </button>
          </form>
        )}

        {error && <p className="mt-4 text-center text-sm text-protein">{error}</p>}
      </div>
    </div>
  )
}
