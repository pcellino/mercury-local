import { useState, useEffect } from 'react'
import { Rocket } from 'lucide-react'

const LAUNCH_DATE = new Date('2026-06-01T00:00:00-04:00') // June 1, 2026 ET

function getTimeLeft() {
  const now = new Date()
  const diff = LAUNCH_DATE.getTime() - now.getTime()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, launched: true }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return { days, hours, minutes, launched: false }
}

export default function GNTCountdown() {
  const [time, setTime] = useState(getTimeLeft)

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeLeft()), 60_000) // update every minute
    return () => clearInterval(interval)
  }, [])

  if (time.launched) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
        <Rocket size={20} className="text-green-400" />
        <div>
          <p className="text-sm font-semibold text-green-400">Grand National Today is LIVE!</p>
          <p className="text-[11px] text-[var(--color-text-muted)]">grandnationaltoday.com launched June 1, 2026</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/25 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
          <Rocket size={18} className="text-orange-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-orange-300">Grand National Today — Launch Countdown</p>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            Target: June 1, 2026 · 11 seed articles in draft · 31 structural pages live
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-orange-400 tabular-nums">{time.days}</div>
          <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">Days</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-400/70 tabular-nums">{time.hours}</div>
          <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">Hours</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-400/50 tabular-nums">{time.minutes}</div>
          <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">Min</div>
        </div>
      </div>
    </div>
  )
}
