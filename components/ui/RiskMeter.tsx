type RiskLevel = 'low' | 'medium' | 'high'

interface RiskMeterProps {
  level: RiskLevel
  score: number   // 0-100
  showLabel?: boolean
}

const config: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  low:    { label: 'Бага эрсдэлтэй',   color: '#16A34A', bg: '#DCFCE7', border: '#bbf7d0' },
  medium: { label: 'Дунд эрсдэлтэй',   color: '#D97706', bg: '#FEF9C3', border: '#fef08a' },
  high:   { label: 'Өндөр эрсдэлтэй',  color: '#E8323F', bg: '#FEE9EB', border: '#fcd0d2' },
}

export default function RiskMeter({ level, score, showLabel = true }: RiskMeterProps) {
  const cfg = config[level]
  return (
    <div className="flex flex-col gap-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border"
            style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: cfg.color }}
            />
            {cfg.label}
          </span>
          <span className="text-2xl font-black" style={{ color: cfg.color }}>
            {Math.round(score)}%
          </span>
        </div>
      )}
      <div className="h-3 rounded-full bg-[#F3F4F6] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(score, 100)}%`, background: cfg.color }}
        />
      </div>
    </div>
  )
}
