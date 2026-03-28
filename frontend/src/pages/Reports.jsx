import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import ReportEditor from '../components/ReportEditor'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return isNaN(d) ? ts : d.toLocaleDateString(undefined, { dateStyle: 'medium' })
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
        <span className="text-sm text-text-secondary">What are Intelligence Reports?</span>
        <span className="text-text-muted text-xs">{open ? 'Less ▲' : 'More ▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-bg-border pt-3 grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold text-text-primary mb-1">What They Are</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Intelligence reports package everything you know about a threat actor — their profile, methods, and indicators —
              into a structured document you can share with colleagues or present to leadership.
              Unlike raw data, a report tells a story with context.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-primary mb-1">AI-Assisted Drafting</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              The <strong className="text-text-primary">Generate with Claude</strong> button sends the report's structured data
              to Claude (Anthropic's AI) which drafts a professional executive summary. You review, edit, and approve it.
              Requires your own Anthropic API key — your data never trains any model.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-text-primary mb-1">Markdown Export</p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Every report can be exported as a <strong className="text-text-primary">.md Markdown file</strong> — portable,
              version-control-friendly, and renderable in any wiki or documentation tool.
              Paste it into Confluence, Notion, GitHub, or your SIEM ticket system.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// New Report Modal
// ---------------------------------------------------------------------------

function NewReportModal({ actors, onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [actorId, setActorId] = useState('')
  const [iocText, setIocText] = useState('')
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Report title is required.')
      return
    }
    setCreating(true)
    setError('')
    try {
      const report = await api.createReport({
        title: title.trim(),
        actor_id: actorId || null,
        ioc_text: iocText,
        analyst_notes: notes,
      })
      onCreate(report)
    } catch (err) {
      setError(err.message || 'Failed to create report.')
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-surface border border-bg-border rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-bg-border">
          <h2 className="text-sm font-semibold text-text-primary">New Intelligence Report</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Report Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. APT28 Threat Assessment — March 2026"
              className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-500"
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">Threat Actor (optional)</label>
            {actors.length === 0 ? (
              <p className="text-xs text-text-muted bg-bg-elevated rounded-lg px-3 py-2 border border-bg-border">
                No actors loaded — go to <strong className="text-text-primary">Threat Actors</strong> and click Load ATT&CK Data first.
              </p>
            ) : (
              <select
                value={actorId}
                onChange={(e) => setActorId(e.target.value)}
                className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-500"
              >
                <option value="">— No actor (blank report) —</option>
                {actors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.id}){a.country ? ` · ${a.country}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">
              IOCs to include (optional — one per line)
            </label>
            <textarea
              value={iocText}
              onChange={(e) => setIocText(e.target.value)}
              rows={3}
              placeholder={'185.220.101.47\nmalware-delivery[.]xyz\na1b2c3d4e5f6…'}
              className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted font-mono resize-none focus:outline-none focus:border-accent-500"
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">Initial Analyst Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Context, assessment, or investigation background…"
              className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent-500"
            />
          </div>

          {error && <p className="text-xs text-risk-high">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={creating} className="btn-primary flex-1">
              {creating ? 'Creating…' : 'Create Report'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Report Card
// ---------------------------------------------------------------------------

function ReportCard({ report, onClick }) {
  const actor = report.actor_profile || {}
  return (
    <button
      onClick={onClick}
      className="card w-full text-left hover:border-accent-500/40 transition-colors duration-100 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary group-hover:text-accent-400 transition-colors truncate">
            {report.title}
          </p>
          {actor.name ? (
            <p className="text-xs text-text-secondary mt-0.5">
              {actor.name}
              {actor.country && <span className="text-text-muted"> · {actor.country}</span>}
            </p>
          ) : (
            <p className="text-xs text-text-muted mt-0.5">No actor linked</p>
          )}
          <p className="text-xs text-text-muted mt-1">Created {fmt(report.created_at)}</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          {report.has_summary ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-400 border border-accent-500/20 font-medium">
              Summary ready
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted border border-bg-border">
              No summary
            </span>
          )}
          <span className="text-text-muted text-xs">→</span>
        </div>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Reports() {
  const [reports, setReports] = useState([])
  const [actors, setActors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [activeReport, setActiveReport] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [rData, aData] = await Promise.all([
        api.getReports(),
        api.getActors({ limit: 500 }),
      ])
      // Hydrate actor_profile from the actors list for list-view cards
      const actorMap = {}
      for (const a of (aData.actors || [])) {
        actorMap[a.id] = a
      }
      const hydrated = (rData.reports || []).map((r) => ({
        ...r,
        actor_profile: r.actor_profile || (r.actor_id && actorMap[r.actor_id]) || {},
      }))
      setReports(hydrated)
      setActors(aData.actors || [])
    } catch (err) {
      setError(err.message || 'Failed to load reports.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleOpenReport(r) {
    // Fetch full report (with JSON fields parsed) if not already loaded
    try {
      const full = DEMO
        ? { ...r, actor_profile: r.actor_profile || {}, ttps_json: [], iocs_json: [] }
        : await api.getReport(r.id)
      setActiveReport(full)
    } catch {
      setActiveReport(r)
    }
  }

  function handleCreate(newReport) {
    setShowModal(false)
    // Open the new report immediately
    handleOpenReport(newReport)
    // Reload list in background
    load()
  }

  function handleSaved(updatedReport) {
    setActiveReport(updatedReport)
    setReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? { ...r, ...updatedReport } : r))
    )
  }

  // -------------------------------------------------------------------------
  // Active report detail view
  // -------------------------------------------------------------------------
  if (activeReport) {
    return (
      <div>
        <ReportEditor
          report={activeReport}
          onClose={() => { setActiveReport(null); load() }}
          onSaved={handleSaved}
        />
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // List view
  // -------------------------------------------------------------------------
  return (
    <div>
      {showModal && (
        <NewReportModal
          actors={actors}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-text-primary">Intelligence Reports</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + New Report
        </button>
      </div>

      <Explainer />

      {loading && (
        <div className="card flex items-center justify-center h-32">
          <p className="text-text-muted text-sm">Loading…</p>
        </div>
      )}

      {error && (
        <div className="card border-risk-high/30">
          <p className="text-sm text-risk-high">{error}</p>
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="card flex flex-col items-center justify-center h-48 text-center">
          <p className="text-text-primary text-sm font-medium mb-1">No reports yet</p>
          <p className="text-text-muted text-xs mb-4 max-w-sm">
            Create your first intelligence report to package actor profiles, TTPs, and IOCs into a
            shareable document with an AI-generated executive summary.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary text-xs">
            + Create First Report
          </button>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} onClick={() => handleOpenReport(r)} />
          ))}
        </div>
      )}
    </div>
  )
}
