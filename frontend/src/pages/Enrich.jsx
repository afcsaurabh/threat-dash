import { useState } from 'react'
import RiskBadge from '../components/RiskBadge'

export default function Enrich() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])

  async function handleScan() {
    if (!input.trim()) return
    setLoading(true)
    try {
      const iocs = input.trim().split('\n').map((s) => s.trim()).filter(Boolean)
      const res = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iocs }),
      })
      const data = await res.json()
      setResults(data.results || [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">IOC Enrichment</h1>
        <button className="btn-ghost">Bulk Import</button>
      </div>

      {/* Search bar */}
      <div className="card mb-6">
        <textarea
          className="input w-full resize-none h-24 mb-3"
          placeholder="Enter IPs, domains, or file hashes — one per line"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex justify-end">
          <button
            className="btn-primary min-w-[80px]"
            onClick={handleScan}
            disabled={loading}
          >
            {loading ? 'Scanning…' : 'Scan'}
          </button>
        </div>
      </div>

      {/* Results placeholder */}
      {results.length === 0 && !loading && (
        <div className="card flex items-center justify-center h-40">
          <p className="text-text-muted text-sm">
            Results will appear here after scanning. Phase 1 implementation coming next.
          </p>
        </div>
      )}

      {/* Demo RiskBadge preview */}
      <div className="card mt-4">
        <p className="text-text-muted text-xs uppercase tracking-widest mb-3">Risk Badge Preview</p>
        <div className="flex gap-3 flex-wrap">
          <RiskBadge risk="CRITICAL" />
          <RiskBadge risk="HIGH" />
          <RiskBadge risk="MEDIUM" />
          <RiskBadge risk="LOW" />
          <RiskBadge risk="UNKNOWN" />
        </div>
      </div>
    </div>
  )
}
