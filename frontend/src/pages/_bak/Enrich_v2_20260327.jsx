import { useState, useEffect } from 'react'
import { api } from '../api/client'
import RiskBadge from '../components/RiskBadge'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

// ---------------------------------------------------------------------------
// Source indicator pills
// ---------------------------------------------------------------------------

function SourcePill({ name, active }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-mono font-medium border"
      style={{
        backgroundColor: active ? 'rgba(99,102,241,0.12)' : 'rgba(107,114,128,0.06)',
        color: active ? '#818CF8' : '#4B5563',
        borderColor: active ? 'rgba(99,102,241,0.25)' : 'rgba(107,114,128,0.15)',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: active ? '#818CF8' : '#374151' }}
      />
      {name}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Per-IOC result row (expandable)
// ---------------------------------------------------------------------------

function ResultRow({ result, onTag }) {
  const [open, setOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tagging, setTagging] = useState(false)
  const [tagSent, setTagSent] = useState(false)

  const { ioc, type, risk, sources } = result
  const vt = sources?.virustotal
  const ab = sources?.abuseipdb
  const gn = sources?.greynoise

  async function submitTag() {
    if (!tagInput.trim()) return
    setTagging(true)
    try {
      await api.tagIoc(ioc, tagInput.trim())
      setTagSent(true)
      setTagInput('')
      onTag?.()
    } finally {
      setTagging(false)
    }
  }

  return (
    <div className="border border-bg-border rounded-xl overflow-hidden mb-3">
      {/* Summary row */}
      <button
        className="w-full flex items-center gap-4 px-5 py-3.5 text-left table-row-hover"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-mono text-sm text-text-primary flex-1 truncate">{ioc}</span>

        <span
          className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase border"
          style={{
            color: '#64748B',
            borderColor: 'rgba(100,116,139,0.2)',
            backgroundColor: 'rgba(100,116,139,0.06)',
          }}
        >
          {type}
        </span>

        <div className="flex gap-1.5">
          <SourcePill name="VT" active={!!(vt && !vt.error && !vt.not_found)} />
          <SourcePill name="ABUSEIPDB" active={!!(ab && !ab.error)} />
          <SourcePill name="GREYNOISE" active={!!(gn && !gn.error && gn.classification !== 'not_seen')} />
        </div>

        <RiskBadge risk={risk} />

        <span className="text-text-muted text-xs ml-2">{open ? '▲' : '▼'}</span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-bg-border px-5 py-4 grid grid-cols-1 gap-4 bg-bg-elevated/40">
          <div className="grid grid-cols-3 gap-4">
            {/* VirusTotal */}
            <div className="rounded-lg border border-bg-border p-4">
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">VirusTotal</p>
              {!vt && <p className="text-text-muted text-xs">No API key configured</p>}
              {vt?.error && <p className="text-red-400 text-xs">{vt.error}</p>}
              {vt?.not_found && <p className="text-text-muted text-xs">Not found in VT database</p>}
              {vt && !vt.error && !vt.not_found && (
                <>
                  <p className="text-sm font-semibold text-text-primary mb-1">
                    {vt.detections}
                    <span className="text-text-muted font-normal"> / {vt.total} engines</span>
                  </p>
                  {vt.categories?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {vt.categories.map((c) => (
                        <span key={c} className="text-[10px] bg-bg-surface border border-bg-border rounded px-1.5 py-0.5 text-text-secondary">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  {vt.permalink && (
                    <a
                      href={vt.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-400 text-xs mt-2 inline-block hover:underline"
                    >
                      View on VT →
                    </a>
                  )}
                </>
              )}
            </div>

            {/* AbuseIPDB */}
            <div className="rounded-lg border border-bg-border p-4">
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">AbuseIPDB</p>
              {ab === null && <p className="text-text-muted text-xs">Not applicable for {type}s</p>}
              {ab === undefined && <p className="text-text-muted text-xs">No API key configured</p>}
              {ab?.error && <p className="text-red-400 text-xs">{ab.error}</p>}
              {ab && !ab.error && (
                <>
                  <p className="text-sm font-semibold text-text-primary mb-1">
                    {ab.confidence}%
                    <span className="text-text-muted font-normal"> abuse confidence</span>
                  </p>
                  {ab.country && <p className="text-xs text-text-secondary">Country: {ab.country}</p>}
                  {ab.isp && <p className="text-xs text-text-secondary truncate">ISP: {ab.isp}</p>}
                  {ab.total_reports != null && (
                    <p className="text-xs text-text-secondary">{ab.total_reports} reports (90d)</p>
                  )}
                </>
              )}
            </div>

            {/* GreyNoise */}
            <div className="rounded-lg border border-bg-border p-4">
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">GreyNoise</p>
              {gn === null && <p className="text-text-muted text-xs">Not applicable for {type}s</p>}
              {gn === undefined && <p className="text-text-muted text-xs">No API key configured</p>}
              {gn?.error && <p className="text-red-400 text-xs">{gn.error}</p>}
              {gn?.classification === 'not_seen' && (
                <p className="text-text-muted text-xs">Not observed by GreyNoise</p>
              )}
              {gn && !gn.error && gn.classification !== 'not_seen' && (
                <>
                  <p className="text-sm font-semibold text-text-primary mb-1 capitalize">
                    {gn.classification}
                  </p>
                  {gn.name && <p className="text-xs text-text-secondary">{gn.name}</p>}
                  {gn.last_seen && <p className="text-xs text-text-secondary">Last seen: {gn.last_seen}</p>}
                  <div className="flex gap-2 mt-2">
                    {gn.noise && (
                      <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded px-1.5 py-0.5">NOISE</span>
                    )}
                    {gn.riot && (
                      <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 rounded px-1.5 py-0.5">RIOT</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tag input */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-text-muted text-xs">Tag:</span>
            <input
              className="input text-xs py-1.5 px-2.5 w-48"
              placeholder="investigating / confirmed / fp"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitTag()}
              disabled={DEMO}
            />
            <button
              className="btn-ghost text-xs py-1.5"
              onClick={submitTag}
              disabled={tagging || DEMO}
            >
              {tagging ? 'Saving…' : 'Save tag'}
            </button>
            {tagSent && <span className="text-green-400 text-xs">Saved</span>}
            {DEMO && <span className="text-text-muted text-xs">— tagging disabled in demo mode</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// API Key panel (local dev only, hidden in demo mode)
// ---------------------------------------------------------------------------

function KeyPanel() {
  const [open, setOpen] = useState(false)
  const [keys, setKeys] = useState({ virustotal_api_key: '', abuseipdb_api_key: '', greynoise_api_key: '' })
  const [status, setStatus] = useState(null)   // { virustotal, abuseipdb, greynoise } booleans
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getKeys().then(setStatus).catch(() => {})
  }, [])

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      const updated = await api.setKeys(keys)
      setStatus(updated)
      setKeys({ virustotal_api_key: '', abuseipdb_api_key: '', greynoise_api_key: '' })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const allConfigured = status && status.virustotal && status.abuseipdb && status.greynoise

  return (
    <div className="card mb-4">
      <button
        className="w-full flex items-center justify-between"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-primary">API Keys</span>
          <div className="flex gap-1.5">
            {[['VT', status?.virustotal], ['ABUSEIPDB', status?.abuseipdb], ['GREYNOISE', status?.greynoise]].map(([name, active]) => (
              <SourcePill key={name} name={name} active={!!active} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allConfigured
            ? <span className="text-green-400 text-xs">All keys active</span>
            : <span className="text-yellow-400 text-xs">Keys needed to query live APIs</span>
          }
          <span className="text-text-muted text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="mt-4 border-t border-bg-border pt-4">
          <p className="text-text-muted text-xs mb-4 leading-relaxed">
            Keys are injected into the running server and last until you restart it — nothing is written to disk.
            To persist keys across restarts, add them to <code className="bg-bg-elevated px-1.5 py-0.5 rounded text-[11px]">.env</code> using the names below.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1.5">
                VirusTotal <span className="text-text-muted normal-case font-sans">(VIRUSTOTAL_API_KEY)</span>
              </label>
              <input
                type="password"
                className="input w-full text-xs"
                placeholder={status?.virustotal ? '●●●● already set ●●●●' : 'Paste VT API key…'}
                value={keys.virustotal_api_key}
                onChange={(e) => setKeys((k) => ({ ...k, virustotal_api_key: e.target.value }))}
              />
              <p className="text-[10px] text-text-muted mt-1">
                Free tier: 4 req/min · <a className="text-accent-400 hover:underline" href="https://www.virustotal.com/gui/my-apikey" target="_blank" rel="noopener noreferrer">Get key →</a>
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1.5">
                AbuseIPDB <span className="text-text-muted normal-case font-sans">(ABUSEIPDB_API_KEY)</span>
              </label>
              <input
                type="password"
                className="input w-full text-xs"
                placeholder={status?.abuseipdb ? '●●●● already set ●●●●' : 'Paste AbuseIPDB key…'}
                value={keys.abuseipdb_api_key}
                onChange={(e) => setKeys((k) => ({ ...k, abuseipdb_api_key: e.target.value }))}
              />
              <p className="text-[10px] text-text-muted mt-1">
                Free: 1,000 req/day · <a className="text-accent-400 hover:underline" href="https://www.abuseipdb.com/account/api" target="_blank" rel="noopener noreferrer">Get key →</a>
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1.5">
                GreyNoise <span className="text-text-muted normal-case font-sans">(GREYNOISE_API_KEY)</span>
              </label>
              <input
                type="password"
                className="input w-full text-xs"
                placeholder={status?.greynoise ? '●●●● already set ●●●●' : 'Paste GreyNoise key…'}
                value={keys.greynoise_api_key}
                onChange={(e) => setKeys((k) => ({ ...k, greynoise_api_key: e.target.value }))}
              />
              <p className="text-[10px] text-text-muted mt-1">
                Community tier free · <a className="text-accent-400 hover:underline" href="https://viz.greynoise.io/account/api-key" target="_blank" rel="noopener noreferrer">Get key →</a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="btn-primary text-xs py-1.5" onClick={save} disabled={saving}>
              {saving ? 'Activating…' : 'Activate keys'}
            </button>
            {saved && <span className="text-green-400 text-xs">Keys active — run a scan to test</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Enrich() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)

  async function handleScan() {
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    try {
      const iocs = input.trim().split('\n').map((s) => s.trim()).filter(Boolean)
      const data = await api.enrich(iocs)
      setResults(data.results || [])
    } catch (err) {
      setError(err.message || 'Scan failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">IOC Enrichment</h1>
      </div>

      {/* API key panel — hidden in demo mode */}
      {!DEMO && <KeyPanel />}

      {/* Demo mode notice */}
      {DEMO && (
        <div className="mb-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-300">
          Demo mode — showing cached sample data. Deploy locally with your own API keys for live enrichment.
        </div>
      )}

      {/* Search input */}
      <div className="card mb-4">
        <textarea
          className="input w-full resize-none h-24 mb-3"
          placeholder="Enter IPs, domains, or file hashes — one per line"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleScan()
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-xs">Ctrl+Enter to scan · one IOC per line</span>
          <button
            className="btn-primary min-w-[80px]"
            onClick={handleScan}
            disabled={loading}
          >
            {loading ? 'Scanning…' : 'Scan'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-widest mb-3">
            {results.length} result{results.length !== 1 ? 's' : ''} — click a row to expand source detail
          </p>
          {results.map((r) => (
            <ResultRow key={r.ioc} result={r} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 && !loading && !error && (
        <div className="card flex flex-col items-center justify-center h-40 gap-2">
          <p className="text-text-muted text-sm">Paste one or more IOCs above and click Scan.</p>
          <p className="text-text-muted text-xs">Supports IPv4, domains, MD5 / SHA1 / SHA256 hashes.</p>
        </div>
      )}
    </div>
  )
}
