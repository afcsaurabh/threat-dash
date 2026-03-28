import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE_META = {
  hackernews:       { label: 'Hacker News',        color: '#FB923C' },
  cyberscoop:       { label: 'CyberScoop',          color: '#60A5FA' },
  krebs:            { label: 'Krebs on Security',   color: '#F87171' },
  bleepingcomputer: { label: 'BleepingComputer',    color: '#34D399' },
  cisa:             { label: 'CISA',                color: '#A78BFA' },
  thehackernews:    { label: 'The Hacker News',     color: '#FBBF24' },
}

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d)) return ts
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function SourcePill({ source, active, onClick }) {
  const meta = SOURCE_META[source]
  if (!meta) return null
  return (
    <button
      onClick={() => onClick(source)}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
      style={
        active
          ? { backgroundColor: meta.color + '25', color: meta.color, border: `1px solid ${meta.color}55` }
          : { backgroundColor: 'transparent', color: '#6B7280', border: '1px solid #374151' }
      }
    >
      {meta.label}
    </button>
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
// Article card
// ---------------------------------------------------------------------------

function ArticleCard({ article }) {
  const { title, url, source, published_at, summary, score, author } = article

  return (
    <div className="border border-bg-border rounded-xl p-4 mb-3 bg-bg-surface hover:border-accent-500/40 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-text-primary hover:text-accent-400 transition-colors leading-snug block mb-2"
          >
            {title}
          </a>

          {summary && (
            <p className="text-xs text-text-secondary leading-relaxed mb-2 line-clamp-2">{summary}</p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <SourceBadge source={source} />

            {score > 0 && (
              <span className="text-[11px] text-text-muted font-mono">▲ {score}</span>
            )}

            {author && (
              <span className="text-[11px] text-text-muted truncate max-w-[160px]">{author}</span>
            )}

            <span className="text-[11px] text-text-muted ml-auto">{timeAgo(published_at)}</span>
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-muted hover:text-accent-400 transition-colors flex-shrink-0 mt-0.5"
          title="Open article"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
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
        <span className="text-sm text-text-secondary">About these sources</span>
        <span className="text-text-muted text-xs">{open ? 'Less ▲' : 'More ▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-bg-border pt-3 grid grid-cols-3 gap-5">
          <div>
            <p className="text-xs font-semibold text-text-primary mb-1">Hacker News</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Security-relevant stories from the Y Combinator community, ranked by upvotes. Often surfaces
              disclosures, novel research, and tools before mainstream outlets pick them up.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-primary mb-1">Trade press</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              CyberScoop covers policy and enterprise security. Krebs on Security is a long-running
              investigative outlet specialising in cybercrime and fraud. BleepingComputer tracks
              active ransomware campaigns in near-real-time.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-primary mb-1">CISA + THN</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              CISA advisories are official US government alerts about active exploitation — if something
              is here, patch it immediately. The Hacker News aggregates broadly across the security beat.
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

export default function News() {
  const [articles, setArticles] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [activeSource, setActiveSource] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getNews({ source: activeSource || undefined })
      setArticles(data.articles || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message || 'Failed to load news')
    } finally {
      setLoading(false)
    }
  }, [activeSource])

  useEffect(() => { load() }, [load])

  async function handleRefresh() {
    setRefreshing(true)
    setError(null)
    try {
      await api.refreshNews()
      await load()
    } catch (err) {
      setError(err.message || 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  function toggleSource(source) {
    setActiveSource((s) => (s === source ? '' : source))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Security Intelligence</h1>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-text-muted text-sm">{total.toLocaleString()} articles</span>
          )}
          <button className="btn-ghost text-xs" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? 'Fetching…' : '↺ Refresh'}
          </button>
        </div>
      </div>

      <Explainer />

      {DEMO && (
        <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-300">
          Demo mode — showing sample articles. Deploy locally to pull live news feeds.
        </div>
      )}

      {/* Source filter pills */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <button
          onClick={() => setActiveSource('')}
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors"
          style={
            !activeSource
              ? { backgroundColor: '#6366F125', color: '#818CF8', border: '1px solid #6366F155' }
              : { backgroundColor: 'transparent', color: '#6B7280', border: '1px solid #374151' }
          }
        >
          All sources
        </button>
        {Object.keys(SOURCE_META).map((s) => (
          <SourcePill key={s} source={s} active={activeSource === s} onClick={toggleSource} />
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-32 text-text-muted text-sm">Loading…</div>
      )}

      {!loading && articles.length === 0 && (
        <div className="card flex flex-col items-center justify-center h-40 gap-2">
          <p className="text-text-muted text-sm">No articles cached yet.</p>
          <button className="btn-ghost text-xs" onClick={handleRefresh} disabled={refreshing}>
            ↺ Fetch from all sources now
          </button>
        </div>
      )}

      {!loading && articles.map((a) => (
        <ArticleCard key={a.article_id} article={a} />
      ))}

      {total > articles.length && !loading && (
        <p className="text-text-muted text-xs mt-3 text-center">
          Showing {articles.length} of {total.toLocaleString()} — filter by source to narrow results
        </p>
      )}
    </div>
  )
}
