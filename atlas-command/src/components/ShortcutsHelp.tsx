import { useState, useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'

const SHORTCUTS = [
  { key: 'H', label: "Publisher's Desk" },
  { key: 'E', label: 'Editorial' },
  { key: 'C', label: 'Content' },
  { key: 'I', label: 'Intel' },
  { key: 'N', label: 'New Post' },
  { key: '?', label: 'Show this help' },
]

export default function ShortcutsHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handler() {
      setOpen((prev) => !prev)
    }
    window.addEventListener('toggle-shortcuts-help', handler)
    return () => window.removeEventListener('toggle-shortcuts-help', handler)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-72 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-semibold flex items-center gap-2">
            <Keyboard size={15} className="text-[var(--color-accent-hover)]" />
            Shortcuts
          </h2>
          <button onClick={() => setOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-1.5">
          {SHORTCUTS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-[12px] text-[var(--color-text-muted)]">{label}</span>
              <kbd className="px-2 py-0.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-[11px] font-mono font-medium text-[var(--color-text)]">
                {key}
              </kbd>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between py-1">
            <span className="text-[12px] text-[var(--color-text-muted)]">Command palette</span>
            <kbd className="px-2 py-0.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded text-[11px] font-mono font-medium text-[var(--color-text)]">
              {'\u2318'}K
            </kbd>
          </div>
        </div>
      </div>
    </div>
  )
}
