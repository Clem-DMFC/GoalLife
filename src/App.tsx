import { useState } from 'react'
import { Auth } from './components/Auth'
import { ConfigError } from './components/ConfigError'
import { IosInstallBanner } from './components/IosInstallBanner'
import { TodayScreen } from './components/TodayScreen'
import { WeightScreen } from './components/WeightScreen'
import { useSession } from './hooks/useSession'
import { useTargets } from './hooks/useTargets'
import { missingEnv, supabase } from './lib/supabase'
import { today } from './lib/date'

type Tab = 'today' | 'weight'

export default function App() {
  const { session, loading } = useSession()
  const userId = session?.user.id
  const { targets, save: saveTargets } = useTargets(userId)
  const [tab, setTab] = useState<Tab>('today')
  const [day, setDay] = useState(today())

  if (missingEnv.length > 0) return <ConfigError missing={missingEnv} />

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-sm text-ink/30">
        …
      </div>
    )
  }

  if (!session || !userId) return <Auth />

  return (
    <div className="safe-x mx-auto flex min-h-[100dvh] max-w-md flex-col">
      <header className="safe-top sticky top-0 z-30 bg-canvas/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight">GoalLife</h1>
          <button
            type="button"
            className="tap flex items-center rounded-lg px-2 text-xs text-ink/40"
            onClick={() => void supabase.auth.signOut()}
          >
            Déconnexion
          </button>
        </div>

        <nav className="flex gap-1 px-4 pb-2">
          {(
            [
              ['today', 'Aujourd’hui'],
              ['weight', 'Poids'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`tap flex-1 rounded-xl px-3 text-sm font-medium transition-colors ${
                tab === key ? 'bg-ink text-canvas' : 'bg-surface text-ink/60'
              }`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="safe-bottom flex-1 space-y-3 px-4 pb-10 pt-1">
        <IosInstallBanner />
        {tab === 'today' ? (
          <TodayScreen
            userId={userId}
            day={day}
            onDayChange={setDay}
            targets={targets}
            onSaveTargets={saveTargets}
          />
        ) : (
          <WeightScreen userId={userId} />
        )}
      </main>
    </div>
  )
}
