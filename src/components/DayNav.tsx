import { addDays, labelDay, labelShort, today } from '../lib/date'

export function DayNav({
  day,
  onChange,
}: {
  day: string
  onChange: (day: string) => void
}) {
  const isToday = day === today()

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        aria-label="Jour précédent"
        className="tap flex w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm"
        onClick={() => onChange(addDays(day, -1))}
      >
        ‹
      </button>

      <button
        type="button"
        className="tap flex flex-1 flex-col items-center justify-center rounded-xl bg-white py-2 shadow-sm"
        onClick={() => onChange(today())}
        disabled={isToday}
      >
        <span className="text-sm font-semibold first-letter:uppercase">{labelDay(day)}</span>
        <span className="font-mono text-[11px] text-black/40">{labelShort(day)}</span>
      </button>

      <button
        type="button"
        aria-label="Jour suivant"
        className="tap flex w-12 items-center justify-center rounded-xl bg-white text-xl shadow-sm disabled:opacity-30"
        onClick={() => onChange(addDays(day, 1))}
        disabled={isToday}
      >
        ›
      </button>
    </div>
  )
}
