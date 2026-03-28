import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { api } from '../api/client'
import ThreatMap from '../components/ThreatMap'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COUNTRY_COLORS = {
  RU: { bg: '#EF444422', text: '#FCA5A5', border: '#EF444440' },
  CN: { bg: '#EF444422', text: '#FCA5A5', border: '#EF444440' },
  KP: { bg: '#8B5CF622', text: '#C4B5FD', border: '#8B5CF640' },
  IR: { bg: '#10B98122', text: '#6EE7B7', border: '#10B98140' },
  VN: { bg: '#3B82F622', text: '#93C5FD', border: '#3B82F640' },
  US: { bg: '#6366F122', text: '#A5B4FC', border: '#6366F140' },
}
const COUNTRY_DEFAULT = { bg: '#6B728022', text: '#9CA3AF', border: '#6B728040' }

const SECTOR_LABELS = {
  'government':         'Government',
  'financial-services': 'Financial',
  'defense':            'Defense',
  'technology':         'Technology',
  'healthcare':         'Healthcare',
  'energy':             'Energy',
  'telecommunications': 'Telecoms',
  'education':          'Education',
  'aerospace':          'Aerospace',
  'manufacturing':      'Manufacturing',
}

const CATEGORY_META = {
  ransomware:     { label: 'Ransomware',         color: '#EF4444' },
  'nation-state': { label: 'Nation-State',        color: '#8B5CF6' },
  vulnerabilities:{ label: 'Vulnerabilities',     color: '#F59E0B' },
  'data-breach':  { label: 'Data Breaches',       color: '#EC4899' },
  government:     { label: 'Gov / Policy',        color: '#3B82F6' },
  incident:       { label: 'Incidents',           color: '#10B981' },
}

const SOURCE_META = {
  hackernews:       { label: 'Hacker News',       color: '#FB923C' },
  cyberscoop:       { label: 'CyberScoop',         color: '#60A5FA' },
  krebs:            { label: 'Krebs',              color: '#F87171' },
  bleepingcomputer: { label: 'BleepingComputer',  color: '#34D399' },
  cisa:             { label: 'CISA',               color: '#A78BFA' },
  thehackernews:    { label: 'THN',                color: '#FBBF24' },
}

const REGIONS = [
  { value: '', label: 'All regions' },
  { value: 'RU', label: 'Russia (RU)' },
  { value: 'CN', label: 'China (CN)' },
  { value: 'KP', label: 'North Korea (KP)' },
  { value: 'IR', label: 'Iran (IR)' },
  { value: 'VN', label: 'Vietnam (VN)' },
  { value: 'US', label: 'United States (US)' },
]

const SECTORS = [
  { value: '', label: 'All sectors' },
  { value: 'government', label: 'Government' },
  { value: 'financial-services', label: 'Financial Services' },
  { value: 'defense', label: 'Defense' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'energy', label: 'Energy' },
  { value: 'telecommunications', label: 'Telecommunications' },
]

const DAYS_OPTIONS = [
  { value: '1', label: 'Last 24h' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '0', label: 'All time' },
]

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

function CountryBadge({ country }) {
  if (!country) return null
  const c = COUNTRY_COLORS[country] || COUNTRY_DEFAULT
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[10px] font-mono font-bold flex-shrink-0"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {country}
    </span>
  )
}

function SourceBadge({ source }) {
  const meta = SOURCE_META[source] || { label: source, color: '#64748B' }
  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold"
      style={{ backgroundColor: meta.color + '22', color: meta.color, border: `1px solid ${meta.color}44` }}
    >
      {meta.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

function FilterBar({ params, onChange }) {
  const country  = params.get('country')  || ''
  const sector   = params.get('sector')   || ''
  const days     = params.get('days')     || '7'
  const category = params.get('category') || ''

  const hasFilters = country || sector || days !== '7' || category

  function set(key, val) {
    onChange((prev) => {
      const next = new URLSearchParams(prev)
      if (val) next.set(key, val)
      else next.delete(key)
      return next
    })
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <FilterSelect
        value={country}
        options={REGIONS}
        onChange={(v) => set('country', v)}
        placeholder="Region"
      />
      <FilterSelect
        value={sector}
        options={SECTORS}
        onChange={(v) => set('sector', v)}
        placeholder="Sector"
      />
      <FilterSelect
        value={days}
        options={DAYS_OPTIONS}
        onChange={(v) => set('days', v)}
        placeholder="Time"
      />
      <FilterSelect
        value={category}
        options={[
          { value: '', label: 'All topics' },
          ...Object.entries(CATEGORY_META).map(([k, v]) => ({ value: k, label: v.label })),
        ]}
        onChange={(v) => set('category', v)}
        placeholder="Topic"
      />
      {hasFilters && (
        <button
          onClick={() => onChange(new URLSearchParams())}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors px-2 py-1"
        >
          ✕ Reset
        </button>
      )}
    </div>
  )
}

function FilterSelect({ value, options, onChange, placeholder }) {
  const active = value !== '' && value !== '7'
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs rounded-lg px-3 py-1.5 border transition-colors outline-none cursor-pointer"
      style={
        active
          ? { backgroundColor: '#6366F115', color: '#818CF8', borderColor: '#6366F155' }
          : { backgroundColor: 'transparent', color: '#9CA3AF', borderColor: '#374151' }
      }
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ backgroundColor: '#1F2937', color: '#F9FAFB' }}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// Left panel — APT list
// ---------------------------------------------------------------------------

function AptPanel({ actors, loading }) {
  const maxCount = actors.length > 0 ? actors[0].technique_count : 1

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-4 flex flex-col min-h-0">
      <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
        Top APT Threats
      </h2>

      {loading && (
        <div className="flex items-center justify-center flex-1 text-text-muted text-xs">
          Loading…
        </div>
      )}

      {!loading && actors.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-8">
          <p className="text-text-muted text-xs">No actor data loaded.</p>
          <Link to="/actors" className="text-accent-400 text-xs hover:underline">
            Load ATT&CK data →
          </Link>
        </div>
      )}

      {!loading && actors.map((actor, i) => (
        <Link
          key={actor.id}
          to={`/actors?id=${actor.id}`}
          className="flex items-center gap-2 py-2 border-b border-bg-border last:border-0 hover:bg-bg-elevated rounded px-1 transition-colors group"
        >
          <span className="text-[11px] text-text-muted font-mono w-4 flex-shrink-0">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-medium text-text-primary group-hover:text-accent-400 transition-colors truncate">
                {actor.name}
              </span>
              <CountryBadge country={actor.country} />
            </div>
            <div className="h-1 rounded-full bg-bg-elevated overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-500/70"
                style={{ width: `${Math.round((actor.technique_count / maxCount) * 100)}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-text-muted font-mono flex-shrink-0">
            {actor.technique_count}
          </span>
        </Link>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Center panel — Map placeholder (Phase 5c)
// ---------------------------------------------------------------------------

function MapPanel({ countryMap }) {
  const countryCount = Object.keys(countryMap).length
  const actorCount = Object.values(countryMap).reduce((s, a) => s + a.length, 0)

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-4 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center">
        <svg className="w-6 h-6 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-text-primary mb-1">Global Threat Map</p>
        <p className="text-xs text-text-secondary max-w-[200px] leading-relaxed">
          Interactive choropleth map coming in Phase 5c
        </p>
      </div>
      {actorCount > 0 && (
        <div className="flex gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-text-primary">{actorCount}</p>
            <p className="text-[11px] text-text-muted">tracked actors</p>
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">{countryCount}</p>
            <p className="text-[11px] text-text-muted">origin countries</p>
          </div>
        </div>
      )}
      {actorCount > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center max-w-[240px]">
          {Object.entries(countryMap).map(([cc, names]) => {
            const c = COUNTRY_COLORS[cc] || COUNTRY_DEFAULT
            return (
              <span
                key={cc}
                className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
              >
                {cc} {names.length}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Right panel — Targets
// ---------------------------------------------------------------------------

function TargetsPanel({ targets, loading }) {
  const sectors = targets?.sectors || []
  const orgs = targets?.named_orgs || []
  const maxCount = sectors.length > 0 ? sectors[0].count : 1

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-4 flex flex-col min-h-0">
      <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
        Top Targets
      </h2>

      {loading && (
        <div className="flex items-center justify-center flex-1 text-text-muted text-xs">Loading…</div>
      )}

      {!loading && sectors.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-8">
          <p className="text-text-muted text-xs">No target data available.</p>
          <Link to="/actors" className="text-accent-400 text-xs hover:underline">
            Load ATT&CK data →
          </Link>
        </div>
      )}

      {!loading && sectors.map((s) => (
        <div key={s.sector} className="mb-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs text-text-secondary truncate">
              {SECTOR_LABELS[s.sector] || s.sector}
            </span>
            <span className="text-[10px] text-text-muted font-mono ml-2 flex-shrink-0">{s.count}</span>
          </div>
          <div className="h-1 rounded-full bg-bg-elevated overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-500/50"
              style={{ width: `${Math.round((s.count / maxCount) * 100)}%` }}
            />
          </div>
        </div>
      ))}

      {orgs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-bg-border">
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Named orgs</p>
          {orgs.slice(0, 5).map((o, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <span className="text-xs text-text-secondary truncate">{o.name}</span>
              <span className="text-[10px] text-text-muted ml-auto flex-shrink-0">{o.actor}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bottom panel — Threat Feed
// ---------------------------------------------------------------------------

function FeedPanel({ news, loading, activeCategory, onCategory }) {
  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-4">
      {/* Header + category pills */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mr-1">
          Threat Feed
        </h2>
        <button
          onClick={() => onCategory('')}
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors"
          style={
            !activeCategory
              ? { backgroundColor: '#6366F125', color: '#818CF8', border: '1px solid #6366F155' }
              : { backgroundColor: 'transparent', color: '#6B7280', border: '1px solid #374151' }
          }
        >
          All
        </button>
        {Object.entries(CATEGORY_META).map(([k, v]) => (
          <button
            key={k}
            onClick={() => onCategory(activeCategory === k ? '' : k)}
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors"
            style={
              activeCategory === k
                ? { backgroundColor: v.color + '25', color: v.color, border: `1px solid ${v.color}55` }
                : { backgroundColor: 'transparent', color: '#6B7280', border: '1px solid #374151' }
            }
          >
            {v.label}
          </button>
        ))}
        <Link to="/news" className="ml-auto text-[11px] text-text-muted hover:text-accent-400 transition-colors">
          All news →
        </Link>
      </div>

      {loading && (
        <div className="text-text-muted text-xs text-center py-4">Loading…</div>
      )}

      {!loading && news.length === 0 && (
        <p className="text-text-muted text-xs text-center py-4">
          No articles cached yet — visit{' '}
          <Link to="/news" className="text-accent-400 hover:underline">Security News</Link> to fetch.
        </p>
      )}

      <div className="divide-y divide-bg-border">
        {!loading && news.map((a) => (
          <div key={a.article_id} className="flex items-start gap-3 py-2.5 group">
            <div className="flex-1 min-w-0">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-text-primary group-hover:text-accent-400 transition-colors leading-snug block mb-1.5"
              >
                {a.title}
              </a>
              <div className="flex items-center gap-2">
                <SourceBadge source={a.source} />
                {a.score > 0 && (
                  <span className="text-[10px] text-text-muted font-mono">▲ {a.score}</span>
                )}
                <span className="text-[10px] text-text-muted ml-auto">{timeAgo(a.published_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state — no ATT&CK data loaded
// ---------------------------------------------------------------------------

function DashboardEmpty({ onRefresh, refreshing }) {
  return (
    <div className="card flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-text-muted text-sm text-center max-w-xs">
        No ATT&CK data loaded yet. Load the MITRE dataset to populate the dashboard.
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

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()

  const country  = searchParams.get('country')  || ''
  const sector   = searchParams.get('sector')   || ''
  const days     = searchParams.get('days')     || '7'
  const category = searchParams.get('category') || ''

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.getDashboard({
        country: country || undefined,
        sector: sector || undefined,
        days: days !== '7' ? days : undefined,
        category: category || undefined,
      })
      setData(result)
    } catch (err) {
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [country, sector, days, category])

  useEffect(() => { load() }, [load])

  async function handleRefreshActors() {
    setRefreshing(true)
    try {
      await api.refreshActors()
      await load()
    } catch (err) {
      setError(err.message || 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  function setCategory(cat) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (cat) next.set('category', cat)
      else next.delete('category')
      return next
    })
  }

  const actors     = data?.actors || []
  const targets    = data?.targets || { sectors: [], named_orgs: [] }
  const news       = data?.news || []
  const countryMap = data?.country_actor_map || {}
  const isEmpty    = data?.empty === true && !loading

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-text-primary">Threat Intelligence Dashboard</h1>
        {error && (
          <span className="text-xs text-red-400">{error}</span>
        )}
      </div>

      {/* Filter bar */}
      <FilterBar params={searchParams} onChange={setSearchParams} />

      {/* Empty state */}
      {isEmpty && (
        <DashboardEmpty onRefresh={handleRefreshActors} refreshing={refreshing} />
      )}

      {/* 3-panel layout */}
      {!isEmpty && (
        <>
          <div className="grid grid-cols-[260px_1fr_240px] gap-4 mb-4" style={{ minHeight: '380px' }}>
            <AptPanel actors={actors} loading={loading} />
            <div className="bg-bg-surface border border-bg-border rounded-xl p-4 flex flex-col">
              <ThreatMap
                countryMap={countryMap}
                activeCountry={country}
                onCountryClick={(cc) => setSearchParams((prev) => {
                  const next = new URLSearchParams(prev)
                  if (cc) next.set('country', cc)
                  else next.delete('country')
                  return next
                })}
              />
            </div>
            <TargetsPanel targets={targets} loading={loading} />
          </div>

          <FeedPanel
            news={news}
            loading={loading}
            activeCategory={category}
            onCategory={setCategory}
          />
        </>
      )}
    </div>
  )
}
