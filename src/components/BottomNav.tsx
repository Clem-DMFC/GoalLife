import type { Tab } from '../lib/tabs'

/*
 * Icônes écrites à la main (24×24, trait `currentColor`) : l'app n'embarque
 * aucune librairie d'icônes, et quatre pictogrammes ne justifient pas 300 ko
 * de dépendance.
 */
const ICONS: Record<Tab, JSX.Element> = {
  today: (
    <>
      <circle cx="12" cy="12" r="8.5" opacity="0.35" />
      <path d="M12 3.5a8.5 8.5 0 0 1 6 14.5" />
    </>
  ),
  history: <path d="M4 19v-7M9.5 19V5.5M15 19v-4.5M20.5 19V9" />,
  weight: (
    <>
      <path d="M4 15.5 9 10l4 3.5L20 6.5" />
      <path d="M4 19.5h16" opacity="0.35" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h4M12 7h8M4 12h10M18 12h2M4 17h6M14 17h6" />
      <circle cx="10" cy="7" r="2" />
      <circle cx="16" cy="12" r="2" />
      <circle cx="12" cy="17" r="2" />
    </>
  ),
}

const LABELS: Record<Tab, string> = {
  today: 'Jour',
  history: 'Historique',
  weight: 'Poids',
  settings: 'Réglages',
}

function TabButton({
  tab,
  active,
  onSelect,
}: {
  tab: Tab
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      className={`tap flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
        active ? 'text-protein' : 'text-ink/40'
      }`}
      onClick={onSelect}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ICONS[tab]}
      </svg>
      <span className={`text-[10px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}>
        {LABELS[tab]}
      </span>
    </button>
  )
}

/**
 * Navigation principale, au pouce : les quatre écrans et l'ajout sont
 * atteignables sans remonter en haut de l'écran, comme dans les apps mobiles
 * dont on a l'habitude. Le bouton d'ajout est au centre, là où le pouce tombe.
 */
export function BottomNav({
  tab,
  onTabChange,
  onAdd,
}: {
  tab: Tab
  onTabChange: (tab: Tab) => void
  onAdd: () => void
}) {
  return (
    <nav className="safe-bottom safe-x fixed inset-x-0 bottom-0 z-40 border-t border-ink/[0.07] bg-canvas/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center gap-1 px-2 py-1.5">
        <TabButton tab="today" active={tab === 'today'} onSelect={() => onTabChange('today')} />
        <TabButton
          tab="history"
          active={tab === 'history'}
          onSelect={() => onTabChange('history')}
        />

        <div className="flex justify-center">
          <button
            type="button"
            aria-label="Ajouter un aliment"
            className="tap flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-2xl font-medium text-[#0E1300] shadow-md"
            onClick={onAdd}
          >
            +
          </button>
        </div>

        <TabButton tab="weight" active={tab === 'weight'} onSelect={() => onTabChange('weight')} />
        <TabButton
          tab="settings"
          active={tab === 'settings'}
          onSelect={() => onTabChange('settings')}
        />
      </div>
    </nav>
  )
}
