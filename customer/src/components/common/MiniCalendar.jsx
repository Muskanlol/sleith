import { useMemo, useState } from 'react'

export const DAY_MAP = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function MiniCalendar({ availableDayNums, selectedDate, onSelect }) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const [view, setView] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })

  const year = view.getFullYear()
  const month = view.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1)
      const isPast = date < today
      const avail = !isPast && availableDayNums.includes(date.getDay())
      const sel = selectedDate && date.toDateString() === selectedDate.toDateString()
      return { d: i + 1, date, isPast, avail, sel }
    }),
  ]

  const canGoPrev = new Date(year, month, 1) > today

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setView(new Date(year, month - 1, 1))}
          disabled={!canGoPrev}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
        >
          ‹
        </button>
        <p className="text-white text-sm font-medium tracking-wide">
          {MONTH_NAMES[month]} {year}
        </p>
        <button
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-[10px] tracking-widest uppercase py-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) =>
          cell === null ? (
            <div key={`empty-${i}`} />
          ) : (
            <button
              key={cell.d}
              disabled={!cell.avail}
              onClick={() => cell.avail && onSelect(cell.date)}
              className="aspect-square w-full rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-200"
              style={{
                background: cell.sel
                  ? 'var(--gold)'
                  : cell.avail
                    ? 'rgba(201,169,110,0.06)'
                    : 'transparent',
                color: cell.sel
                  ? '#0a0a0a'
                  : cell.avail
                    ? 'rgba(255,255,255,0.85)'
                    : 'rgba(255,255,255,0.15)',
                cursor: cell.avail ? 'pointer' : 'not-allowed',
                boxShadow: cell.sel ? '0 0 16px rgba(201,169,110,0.4)' : undefined,
              }}
            >
              {cell.d}
            </button>
          )
        )}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.3)' }} />
          <span className="text-[10px] text-white/30">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm opacity-20" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span className="text-[10px] text-white/30">Unavailable</span>
        </div>
      </div>
    </div>
  )
}
