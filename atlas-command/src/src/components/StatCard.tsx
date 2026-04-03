interface StatCardProps {
  value: number | string
  label: string
  color?: string
}

export default function StatCard({ value, label, color }: StatCardProps) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-center">
      <div className="text-2xl font-bold" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="text-[11px] text-[var(--color-text-muted)] mt-1 uppercase tracking-wide">
        {label}
      </div>
    </div>
  )
}
