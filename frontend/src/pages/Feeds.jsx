import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SOURCE_META = {
  threatfox:  { label: 'ThreatFox',  color: '#F87171' },
  urlhaus:    { label: 'URLhaus',    color: '#FBBF24' },
  feodo:      { label: 'Feodo',      color: '#A78BFA' },
}

const TYPE_LABELS = {
  ip: 'IP', url: 'URL', domain: 'Domain',
  md5_hash: 'MD5', sha256_hash: 'SHA256', unknown: '?',
}

function fmt(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return isNaN(d) ? ts : d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

function ConfidenceBar({ value }) {
  const pct = Math.min(100, Math.max(0, value || 0))
  const color = pct >= 80 ? '#F87171' : pct >= 50 ? '#FBBF24' : '#6EE7B7'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] font-mono text-text-muted w-6 text-right">{pct}</span>
    </div>
  )
}

function SourceBadge({ source }) {
  const meta = SOURCE_META[source] || { label: source, color: '#64748B' }
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase"
      style={{ backgroundColor: meta.color + '22', color: meta.color, border: `1px solid ${meta.color}44` }}
    >
      {meta.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------

function StatsBar({ stats, refreshing, onRefresh }) {
  return (
    <div className="card flex items-center gap-6 mb-4 py-3 px-5">
      {Object.entries(SOURCE_META).map(([key, meta]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
          <span className="text-text-secondary text-xs">{meta.label}</span>
          <span className="text-text-primary text-sm font-mono font-semibold">
            {stats?.[key] != null ? stats[key].toLocaleString() : '—'}
          </span>
        </div>
      ))}
      <div className="ml-auto flex items-center gap-3">
        {stats?.last_refresh && (
          <span className="text-text-muted text-xs">Refreshed {fmt(stats.last_refresh)}</span>
        )}
        <button className="btn-ghost text-xs" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : '↺ Refresh feeds'}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

function FilterBar({ filters, onChange }) {
  return (
    <div className="flex items-center gap-3 mb-4 flex-wrap">
      <select
        className="input py-1.5 text-xs"
        value={filters.source}
        onChange={(e) => onChange({ ...filters, source: e.target.value })}
      >
        <option value="">All sources</option>
        {Object.entries(SOURCE_META).map(([k, m]) => (
          <option key={k} value={k}>{m.label}</option>
        ))}
      </select>

      <select
        className="input py-1.5 text-xs"
        value={filters.type}
        onChange={(e) => onChange({ ...filters, type: e.target.value })}
      >
        <option value="">All types</option>
        {Object.entries(TYPE_LABELS).map(([k, l]) => (
          <option key={k} value={k}>{l}</option>
        ))}
      </select>

      <select
        className="input py-1.5 text-xs"
        value={filters.confidence}
        onChange={(e) => onChange({ ...filters, confidence: e.target.value })}
      >
        <option value="">Any confidence</option>
        <option value="90">90+ (high)</option>
        <option value="75">75+ (medium)</option>
        <option value="50">50+ (low)</option>
      </select>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Feed table row
// ---------------------------------------------------------------------------

function FeedRow({ item }) {
  const typeLabel = TYPE_LABELS[item.ioc_type] || item.ioc_type

  return (
    <div className="flex items-center gap-4 px-5 py-3 border-b border-bg-border table-row-hover text-sm">
      <span className="font-mono text-text-primary flex-1 truncate" title={item.ioc}>{item.ioc}</span>

      <span
        className="inline-block rounded px-1.5 py-0.5 text-[10px] font-mono text-text-secondary border border-bg-border bg-bg-elevated"
        style={{ minWidth: 40, textAlign: 'center' }}
      >
        {typeLabel}
      </span>

      <SourceBadge source={item.source} />

      <div className="w-28">
        <ConfidenceBar value={item.confidence} />
      </div>

      <span className="text-text-secondary text-xs w-28 truncate" title={item.malware_family || item.threat_type}>
        {item.malware_family || item.threat_type || '—'}
      </span>

      <span className="text-text-muted text-xs w-28 text-right">{fmt(item.first_seen)}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Explainer
// ---------------------------------------------------------------------------

function Explainer() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-4 rounded-xl border border-bg-border bg-bg-surface/50">
      <button
        className="w-full flex items-center justify-between px-5 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm text-text-secondary">What is a live threat feed?</span>
        <span className="text-text-muted text-xs">{open ? 'Less ▲' : 'More ▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-bg-border pt-3 grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold text-text-primary mb-1">ThreatFox</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Community-submitted IOCs (IPs, URLs, domains, file hashes) shared by researchers worldwide.
              Each entry includes the malware family and a confidence score — higher means more reporters corroborated it.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-primary mb-1">URLhaus</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              URLs actively distributing malware payloads — download links for ransomware droppers, banking trojans, and loaders.
              Run by abuse.ch, the same team behind many community blocklists.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-primary mb-1">Feodo Tracker</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              IP addresses running botnet command-and-control servers — machines criminal operators use to send instructions
              to infected computers. Covers Dridex, QakBot, Emotet, and similar families.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

export default function Feeds() {
  const [stats, setStats] = useState(null)
  const [feed, setFeed] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ source: '', type: '', confidence: '' })

  const loadStats = useCallback(async () => {
    try { setStats(await api.getFeedStats()) } catch (_) {}
  }, [])

  const loadFeed = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (filters.source)     params.source = filters.source
      if (filters.type)       params.type = filters.type
      if (filters.confidence) params.confidence = Number(filters.confidence)
      const data = await api.getFeeds(params)
      setFeed(data.feed || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message || 'Failed to load feeds')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { loadStats(); loadFeed() }, [loadStats, loadFeed])

  async function handleRefresh() {
    setRefreshing(true)
    setError(null)
    try {
      await api.refreshFeeds()
      await loadStats()
      await loadFeed()
    } catch (err) {
      setError(err.message || 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Feed Monitor</h1>
        {total > 0 && (
          <span className="text-text-muted text-sm">{total.toLocaleString()} indicators</span>
        )}
      </div>

      <Explainer />

      {DEMO && (
        <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-300">
          Demo mode — showing sample feed data. Deploy locally to ingest live abuse.ch feeds.
        </div>
      )}

      <StatsBar stats={stats} refreshing={refreshing} onRefresh={handleRefresh} />
      <FilterBar filters={filters} onChange={setFilters} />

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-b border-bg-border bg-bg-elevated/60">
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest flex-1">Indicator</span>
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest w-8">Type</span>
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest w-20">Source</span>
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest w-28">Confidence</span>
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest w-28">Malware</span>
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest w-28 text-right">First Seen</span>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-32 text-text-muted text-sm">Loading…</div>
        )}

        {!loading && feed.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <p className="text-text-muted text-sm">No feed data yet.</p>
            <button className="btn-ghost text-xs" onClick={handleRefresh} disabled={refreshing}>
              ↺ Pull from abuse.ch now
            </button>
          </div>
        )}

        {!loading && feed.map((item, i) => (
          <FeedRow key={`${item.source}:${item.ioc}:${i}`} item={item} />
        ))}
      </div>

      {total > feed.length && (
        <p className="text-text-muted text-xs mt-3 text-center">
          Showing first {feed.length} of {total.toLocaleString()} — use filters to narrow results
        </p>
      )}
    </div>
  )
}
