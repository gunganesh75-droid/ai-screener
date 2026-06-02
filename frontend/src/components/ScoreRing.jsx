export default function ScoreRing({ score, size = 100 }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 70 ? '#10b981' :
    score >= 50 ? '#f59e0b' :
    '#ef4444'

  const bgColor =
    score >= 70 ? '#10b98120' :
    score >= 50 ? '#f59e0b20' :
    '#ef444420'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#1e293b" strokeWidth="8"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{score}%</span>
        <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wide">Match</span>
      </div>
    </div>
  )
}
