interface StatBarProps {
  value: number
  max?: number
  colorClass: string
}

export default function StatBar({ value, max = 100, colorClass }: StatBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)))
  return (
    <div className="stat-bar">
      <div
        className={`stat-fill ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
