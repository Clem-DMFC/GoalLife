import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'

type Tone = 'success' | 'error'

type Toast = { id: number; message: string; tone: Tone }

/** L'erreur reste plus longtemps : elle demande souvent de relire l'écran. */
const DELAY: Record<Tone, number> = { success: 2400, error: 4500 }

type ToastApi = {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

/**
 * Retour visuel léger, partagé par toute l'app : un ajout réussi ou raté ne
 * doit plus passer inaperçu. Les messages s'empilent en bas de l'écran, au
 * dessus des feuilles modales, et disparaissent seuls.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  // Les minuteries sont annulées au démontage : pas de setState sur un
  // composant disparu si l'app se ferme pendant l'affichage.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    },
    []
  )

  const push = useCallback((message: string, tone: Tone) => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, message, tone }])
    timers.current.push(
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), DELAY[tone])
    )
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* z-60 : au dessus des feuilles d'ajout (z-50), sinon le message
          resterait caché derrière au moment même où il est utile. */}
      <div
        className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-1.5 px-4 pb-24"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in flex max-w-sm items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium shadow-lg ${
              t.tone === 'success' ? 'bg-accent text-[#0E1300]' : 'bg-danger text-white'
            }`}
          >
            <span aria-hidden>{t.tone === 'success' ? '✓' : '!'}</span>
            <span className="min-w-0 flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/** Hors provider, les toasts sont muets : jamais de crash pour un message. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  return ctx ?? NOOP
}

const NOOP: ToastApi = { success: () => {}, error: () => {} }
