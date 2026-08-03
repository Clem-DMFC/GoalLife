import { useState } from 'react'
import { Auth } from './components/Auth'
import { BottomNav } from './components/BottomNav'
import { ConfigError } from './components/ConfigError'
import { HistoryScreen } from './components/HistoryScreen'
import { IosInstallBanner } from './components/IosInstallBanner'
import { SettingsScreen } from './components/SettingsScreen'
import { TodayScreen } from './components/TodayScreen'
import { WeightScreen } from './components/WeightScreen'
import { useSession } from './hooks/useSession'
import { useTargets } from './hooks/useTargets'
import { missingEnv } from './lib/supabase'
import { today } from './lib/date'
import { TAB_TITLES, type Tab } from './lib/tabs'

export default function App() {
  const { session, loading } = useSession()
  const userId = session?.user.id
  const { targets, save: saveTargets } = useTargets(userId)
  const [tab, setTab] = useState<Tab>('today')
  const [day, setDay] = useState(today())
  // La feuille d'ajout est pilotée depuis la barre du bas : elle doit pouvoir
  // s'ouvrir depuis n'importe quel onglet, en ramenant sur l'écran du jour.
  const [addOpen, setAddOpen] = useState(false)

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
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight">{TAB_TITLES[tab]}</h1>
        </div>
      </header>

      {/* pb-28 : la barre de navigation est fixe et inclut la safe area de la
          barre home ; le contenu doit défiler jusqu'au bout sans finir dessous. */}
      <main className="flex-1 space-y-3 px-4 pb-28 pt-1">
        <IosInstallBanner />
        {tab === 'today' && (
          <TodayScreen
            userId={userId}
            day={day}
            onDayChange={setDay}
            targets={targets}
            addOpen={addOpen}
            onAddOpenChange={setAddOpen}
          />
        )}
        {tab === 'history' && (
          <HistoryScreen
            userId={userId}
            targetKcal={targets.kcal}
            onPickDay={(d) => {
              setDay(d)
              setTab('today')
            }}
          />
        )}
        {tab === 'weight' && <WeightScreen userId={userId} />}
        {tab === 'settings' && (
          <SettingsScreen email={session.user.email} targets={targets} onSave={saveTargets} />
        )}
      </main>

      <BottomNav
        tab={tab}
        onTabChange={setTab}
        onAdd={() => {
          setTab('today')
          setAddOpen(true)
        }}
      />
    </div>
  )
}
