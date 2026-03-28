const riskConfig = {
  CRITICAL: {
    bg: 'rgba(239,68,68,0.12)',
    text: '#EF4444',
    border: 'rgba(239,68,68,0.25)',
  },
  HIGH: {
    bg: 'rgba(249,115,22,0.12)',
    text: '#F97316',
    border: 'rgba(249,115,22,0.25)',
  },
  MEDIUM: {
    bg: 'rgba(234,179,8,0.12)',
    text: '#EAB308',
    border: 'rgba(234,179,8,0.25)',
  },
  LOW: {
    bg: 'rgba(34,197,94,0.12)',
    text: '#22C55E',
    border: 'rgba(34,197,94,0.25)',
  },
  UNKNOWN: {
    bg: 'rgba(107,114,128,0.12)',
    text: '#6B7280',
    border: 'rgba(107,114,128,0.25)',
  },
}

export default function RiskBadge({ risk }) {
  const level = (risk || 'UNKNOWN').toUpperCase()
  const config = riskConfig[level] || riskConfig.UNKNOWN

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium border"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.text }}
      />
      {level}
    </span>
  )
}
