import { useState } from 'react'
import { Auth } from './components/Auth'
import { ToastProvider } from './components/Toaster'
import { BottomNav } from './components/BottomNav'
import { ConfigError } from './components/ConfigError'
import { HistoryScreen } from './components/HistoryScreen'
import { InstallTutorial } from './components/InstallTutorial'
import { Onboarding } from './components/Onboarding'
import { Logo } from './components/Logo'
import { SettingsScreen } from './components/SettingsScreen'
import { TodayScreen } from './components/TodayScreen'
import { WeightScreen } from './components/WeightScreen'
import { useProfile } from './hooks/useProfile'
import { useSession } from './hooks/useSession'
import { useTargets } from './hooks/useTargets'
import { missingEnv } from './lib/supabase'
import { today } from './lib/date'
import { clearDeepLink, readDeepLink } from './lib/deeplink'
import { getPlatform, isStandalone } from './lib/pwaInstall'
import { TAB_TITLES, type Tab } from './lib/tabs'

const INSTALL_SEEN_KEY = 'goallife.installTutorialSeen'

export default function App() {
  const { session, loading } = useSession()
  const userId = session?.user.id
  const { targets, save: saveTargets } = useTargets(userId)
  const {
    profile,
    identity,
    brief,
    loading: profileLoading,
    onboardingDone,
    save: saveProfile,
    saveIdentity,
    saveBrief,
  } = useProfile(userId)

  /*
   * Deep link d'une notification (`/?go=add&meal=diner`). Lu une seule fois,
   * à l'initialisation : le clic sur un rappel doit tomber sur l'écran visé.
   * L'URL est nettoyée dans la foulée pour qu'un rechargement ne rouvre pas
   * éternellement la même feuille.
   */
  const [link] = useState(() => {
    const parsed = readDeepLink(window.location.search)
    if (parsed) clearDeepLink()
    return parsed
  })

  const [tab, setTab] = useState<Tab>(link?.tab ?? 'today')
  const [day, setDay] = useState(today())
  // La feuille d'ajout est pilotée depuis la barre du bas : elle doit pouvoir
  // s'ouvrir depuis n'importe quel onglet, en ramenant sur l'écran du jour.
  const [addOpen, setAddOpen] = useState(link?.openAdd === true)

  // Proposé avant l'inscription, jamais à qui l'a déjà installée ou vue une
  // fois : forcer le tuto à chaque ouverture du navigateur découragerait.
  const [installTutorialSeen, setInstallTutorialSeen] = useState(
    () => localStorage.getItem(INSTALL_SEEN_KEY) === '1',
  )

  if (missingEnv.length > 0) return <ConfigError missing={missingEnv} />

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-sm text-ink/30">
        …
      </div>
    )
  }

  if (!session && !installTutorialSeen && !isStandalone() && getPlatform() !== 'other') {
    return (
      <InstallTutorial
        onContinue={() => {
          localStorage.setItem(INSTALL_SEEN_KEY, '1')
          setInstallTutorialSeen(true)
        }}
      />
    )
  }

  if (!session || !userId) return <Auth />

  // On attend de savoir si le profil existe avant de peindre l'app : sans
  // cela l'écran du jour apparaîtrait une fraction de seconde sous
  // l'onboarding, à chaque lancement.
  if (profileLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-sm text-ink/30">…</div>
    )
  }

  if (!onboardingDone) {
    return (
      <ToastProvider>
        <Onboarding
          onDone={async (next, computed, firstName, brief) => {
            // Les objectifs d'abord : si leur écriture échoue, l'onboarding
            // reste ouvert et le message s'affiche, plutôt que d'aboutir sur
            // un compte marqué configuré mais sans objectifs.
            await saveTargets(computed)
            await saveProfile(next, {
              first_name: firstName,
              // Approximation posée : l'onboarding est le seul point de
              // passage garanti après l'inscription, la case cochée à
              // l'écran de connexion ne l'est qu'une fois, en amont.
              consent_at: new Date().toISOString(),
              ...(brief
                ? { strategy_brief: brief, strategy_brief_generated_at: new Date().toISOString() }
                : {}),
            })
          }}
        />
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <div className="safe-x mx-auto flex min-h-[100dvh] max-w-md flex-col">
        <header className="safe-top sticky top-0 z-30 bg-canvas/90 backdrop-blur">
          {/* La marque n'accompagne que l'écran du jour : ailleurs, le titre
            indique où l'on se trouve, et un logo répété n'apporterait rien. */}
          <div className="flex items-center gap-2 px-4 py-3">
            {tab === 'today' && <Logo size={22} className="text-protein" />}
            <h1 className="text-lg font-bold tracking-tight">
              {tab === 'today' && identity.first_name
                ? `Salut ${identity.first_name}`
                : TAB_TITLES[tab]}
            </h1>
          </div>
        </header>

        {/* pb-28 : la barre de navigation est fixe et inclut la safe area de la
          barre home ; le contenu doit défiler jusqu'au bout sans finir dessous. */}
        <main className="flex-1 space-y-3 px-4 pb-28 pt-1">
          {tab === 'today' && (
            <TodayScreen
              userId={userId}
              day={day}
              onDayChange={setDay}
              targets={targets}
              addOpen={addOpen}
              onAddOpenChange={setAddOpen}
              addMeal={link?.meal}
              focusWater={link?.focusWater}
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
            <SettingsScreen
              email={session.user.email}
              targets={targets}
              onSave={saveTargets}
              userId={userId}
              identity={identity}
              onSaveIdentity={saveIdentity}
              profile={profile}
              onSaveProfile={async (next, nextTargets) => {
                if (nextTargets) await saveTargets(nextTargets)
                await saveProfile(next)
              }}
              brief={brief}
              onSaveBrief={saveBrief}
            />
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
    </ToastProvider>
  )
}
