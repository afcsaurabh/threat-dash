import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import ActorProfile from '../components/ActorProfile'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

function fmt(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return isNaN(d) ? ts : d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
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
        <span className="text-sm text-text-secondary">What is MITRE ATT&CK?</span>
        <span className="text-text-muted text-xs">{open ? 'Less ▲' : 'More ▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-bg-border pt-3 grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold text-text-primary mb-1">The Framework</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              MITRE ATT&CK is a free, globally-recognised knowledge base of how real hacking groups actually operate —
              what they do to break in, move around, steal data, and stay hidden. Think of it as a playbook written by defenders
              who studied thousands of real attacks.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-primary mb-1">Groups & Techniques</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Each <strong className="text-text-primary">Group</strong> (e.g. APT28, Lazarus) is a documented hacking organisation.
              Each <strong className="text-text-primary">Technique</strong> (e.g. T1566 Phishing) describes a specific method.
              ATT&CK maps which groups use which techniques based on public threat intelligence reports.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-primary mb-1">Navigator Export</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              The Navigator button exports a layer file you can load into{' '}
              <span className="text-text-primary">ATT&CK Navigator</span> — a free tool that visualises technique
              coverage as a coloured heatmap. Useful for gap analysis and reporting to non-technical stakeholders.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------

function StatsBar({ stats, refreshing, onRefresh }) {
  return (
    <div className="card flex items-center gap-6 mb-4 py-3 px-5">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent-400" />
        <span className="text-text-secondary text-xs">Groups</span>
        <span className="text-text-primary text-sm font-mono font-semibold">
          {stats?.groups != null ? stats.groups.toLocaleString() : '—'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        <span className="text-text-secondary text-xs">Techniques</span>
        <span className="text-text-primary text-sm font-mono font-semibold">
          {stats?.techniques != null ? stats.techniques.toLocaleString() : '—'}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        {stats?.last_updated && (
          <span className="text-text-muted text-xs">Updated {fmt(stats.last_updated)}</span>
        )}
        <button className="btn-ghost text-xs" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Fetching from MITRE…' : '↺ Refresh ATT&CK'}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Actor card
// ---------------------------------------------------------------------------

function ActorCard({ actor, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 cursor-pointer transition-all ${
        selected
          ? 'border-accent-500/50 bg-accent-500/5'
          : 'border-bg-border bg-bg-surface hover:border-bg-hover hover:bg-bg-elevated/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm font-semibold text-text-primary leading-snug">{actor.name}</span>
        <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono text-accent-400 bg-accent-500/10 border border-accent-500/20">
          {actor.external_id}
        </span>
      </div>

      {actor.aliases.length > 0 && (
        <p className="text-[11px] text-text-muted mb-2 truncate">
          {actor.aliases.slice(0, 3).join(' · ')}
          {actor.aliases.length > 3 && ` +${actor.aliases.length - 3}`}
        </p>
      )}

      {actor.description && (
        <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2 mb-2">
          {actor.description}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {actor.country && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-text-secondary bg-bg-elevated border border-bg-border">
            {actor.country}
          </span>
        )}
        {actor.technique_count > 0 && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-text-muted bg-bg-elevated border border-bg-border">
            {actor.technique_count} techniques
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onRefresh, refreshing }) {
  return (
    <div className="card flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-text-muted text-sm text-center max-w-xs">
        No ATT&CK data loaded yet. Click below to download the MITRE ATT&CK
        enterprise dataset — about 25 MB, takes 10–20 seconds.
      </p>
      <button className="btn-ghost text-xs" onClick={onRefresh} disabled={refreshing}>
        {refreshing ? 'Downloading from MITRE…' : '↓ Load ATT&CK data'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Actors() {
  const [stats, setStats] = useState(null)
  const [actors, setActors] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const loadStats = useCallback(async () => {
    try { setStats(await api.getActorStats()) } catch (_) {}
  }, [])

  const loadActors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (search) params.search = search
      const data = await api.getActors(params)
      setActors(data.actors || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message || 'Failed to load actors')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadActors() }, [loadActors])

  async function handleRefresh() {
    setRefreshing(true)
    setError(null)
    try {
      await api.refreshActors()
      await loadStats()
      await loadActors()
    } catch (err) {
      setError(err.message || 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  function handleSelect(id) {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Threat Actor Explorer</h1>
        {total > 0 && (
          <span className="text-text-muted text-sm">{total.toLocaleString()} groups</span>
        )}
      </div>

      <Explainer />

      {DEMO && (
        <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-300">
          Demo mode — showing 3 sample threat actors. Deploy locally to load the full MITRE ATT&CK dataset (~160 groups, 600+ techniques).
        </div>
      )}

      <StatsBar stats={stats} refreshing={refreshing} onRefresh={handleRefresh} />

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          className="input w-full max-w-sm text-sm"
          placeholder="Search by name or alias…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-32 text-text-muted text-sm">Loading…</div>
      )}

      {!loading && actors.length === 0 && !DEMO && (
        <EmptyState onRefresh={handleRefresh} refreshing={refreshing} />
      )}

      {!loading && actors.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {actors.map((actor) => (
            <div key={actor.id}>
              <ActorCard
                actor={actor}
                selected={selectedId === actor.id}
                onClick={() => handleSelect(actor.id)}
              />
              {selectedId === actor.id && (
                <div className="mt-2">
                  <ActorProfile
                    actorId={actor.id}
                    onClose={() => setSelectedId(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {total > actors.length && (
        <p className="text-text-muted text-xs mt-3 text-center">
          Showing first {actors.length} of {total.toLocaleString()} — use search to narrow results
        </p>
      )}
    </div>
  )
}
