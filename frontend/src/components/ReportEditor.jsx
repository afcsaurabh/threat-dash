import { useState } from 'react'
import { api } from '../api/client'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return isNaN(d) ? ts : d.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function downloadMarkdown(filename, text) {
  const blob = new Blob([text], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionLabel({ children }) {
  return (
    <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
      {children}
    </h3>
  )
}

function TTPRow({ t }) {
  const tactics = Array.isArray(t.tactics) ? t.tactics : []
  return (
    <tr className="border-t border-bg-border hover:bg-bg-elevated/40">
      <td className="py-2 px-3 font-mono text-xs text-accent-400 whitespace-nowrap">
        {t.technique_id}
      </td>
      <td className="py-2 px-3 text-xs text-text-primary">{t.name}</td>
      <td className="py-2 px-3">
        <div className="flex flex-wrap gap-1">
          {tactics.map((tac) => (
            <span
              key={tac}
              className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-muted"
            >
              {tac}
            </span>
          ))}
        </div>
      </td>
    </tr>
  )
}

function IocRow({ ioc }) {
  const riskColor = {
    CRITICAL: 'text-risk-critical',
    HIGH: 'text-risk-high',
    MEDIUM: 'text-risk-medium',
    LOW: 'text-risk-low',
    unknown: 'text-text-muted',
  }[ioc.risk?.toUpperCase() || 'unknown'] || 'text-text-muted'

  return (
    <tr className="border-t border-bg-border hover:bg-bg-elevated/40">
      <td className="py-2 px-3 font-mono text-xs text-text-primary break-all">{ioc.ioc}</td>
      <td className="py-2 px-3 text-xs text-text-secondary">{ioc.type}</td>
      <td className={`py-2 px-3 text-xs font-semibold ${riskColor}`}>
        {ioc.risk?.toUpperCase() || '—'}
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Main editor
// ---------------------------------------------------------------------------

export default function ReportEditor({ report: initialReport, onClose, onSaved }) {
  const [report, setReport] = useState(initialReport)
  const [notes, setNotes] = useState(initialReport.analyst_notes || '')
  const [generating, setGenerating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [genError, setGenError] = useState('')

  const actor = report.actor_profile || {}
  const techniques = Array.isArray(report.ttps_json) ? report.ttps_json : []
  const iocs = Array.isArray(report.iocs_json) ? report.iocs_json : []
  const aliases = Array.isArray(actor.aliases) ? actor.aliases.join(', ') : ''

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  async function handleGenerate() {
    setGenerating(true)
    setGenError('')
    try {
      if (DEMO) {
        await new Promise((r) => setTimeout(r, 1400))
        const summary = `APT28 (also known as Fancy Bear and Sofacy) is a sophisticated threat actor attributed to Russia's General Staff Main Intelligence Directorate (GRU), specifically military unit 26165. The group has been active since at least 2004 and primarily targets government, military, and security organisations across NATO member states and Eastern Europe. Attribution is assessed with high confidence based on consistent tooling, infrastructure patterns, and targeting consistent with Russian strategic interests.

APT28's primary initial access vectors include spear-phishing campaigns (T1566) and exploitation of internet-facing services (T1190). Once inside a target network, the group leverages valid credentials (T1078) to maintain persistence and move laterally via Remote Services (T1021). The group's signature toolset includes X-Agent, Sofacy, and custom implants designed to evade endpoint detection.

Key indicators of compromise associated with APT28 include malicious infrastructure hosted across commercial VPN providers and compromised third-party hosting. The group routinely rotates C2 infrastructure to frustrate attribution and blocking efforts. Defenders should monitor for credential reuse, anomalous use of remote services, and scheduled tasks created outside normal change windows.

Defensive priorities include hardening phishing resilience through user training and email authentication controls (DMARC, DKIM, SPF), deploying multi-factor authentication across all remote access pathways, and monitoring for credential dumping activity (T1003) on domain controllers. Organisations in government, defence, and critical infrastructure sectors should treat APT28 as an active threat and review ATT&CK coverage gaps against their current security controls.`
        const updated = { ...report, exec_summary: summary }
        setReport(updated)
        onSaved?.(updated)
        return
      }
      const result = await api.generateSummary(report.id)
      const updated = { ...report, exec_summary: result.exec_summary }
      setReport(updated)
      onSaved?.(updated)
    } catch (err) {
      setGenError(err.message || 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveNotes() {
    setSaving(true)
    try {
      const updated = await api.updateReport(report.id, { analyst_notes: notes })
      setReport(updated)
      onSaved?.(updated)
    } catch {
      // silent — notes aren't critical
    } finally {
      setSaving(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      if (DEMO) {
        await new Promise((r) => setTimeout(r, 300))
        const md = [
          `# Intelligence Report: ${report.title}`,
          '',
          '## Executive Summary',
          '',
          report.exec_summary || '*(not yet generated)*',
          '',
          '## Threat Actor Profile',
          '',
          `**Name:** ${actor.name || '—'}`,
          `**Also Known As:** ${aliases || '—'}`,
          `**Attributed Origin:** ${actor.country || 'Unknown'}`,
          '',
          actor.description || '',
          '',
          '## TTPs',
          '',
          techniques.map((t) => `- ${t.technique_id} ${t.name}`).join('\n'),
          '',
          '## Analyst Notes',
          '',
          notes || '*(none)*',
        ].join('\n')
        downloadMarkdown(`${report.title.replace(/\s+/g, '-')}.md`, md)
        return
      }
      const result = await api.exportReport(report.id)
      downloadMarkdown(`${report.title.replace(/\s+/g, '-')}.md`, result.markdown)
    } finally {
      setExporting(false)
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={onClose}
            className="text-xs text-text-muted hover:text-text-secondary mb-2 flex items-center gap-1"
          >
            ← Back to reports
          </button>
          <h2 className="text-lg font-semibold text-text-primary">{report.title}</h2>
          {actor.name && (
            <p className="text-sm text-text-secondary mt-0.5">
              Actor: <span className="text-text-primary">{actor.name}</span>
              {actor.country && (
                <span className="text-text-muted"> · {actor.country}</span>
              )}
            </p>
          )}
          <p className="text-xs text-text-muted mt-1">
            Created {fmt(report.created_at)} · Updated {fmt(report.updated_at)}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary text-xs"
        >
          {exporting ? 'Exporting…' : '↓ Export Markdown'}
        </button>
      </div>

      {/* Executive Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Executive Summary</SectionLabel>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary text-xs"
          >
            {generating ? 'Generating…' : report.exec_summary ? 'Regenerate with Claude' : 'Generate with Claude'}
          </button>
        </div>

        {genError && (
          <p className="text-xs text-risk-high mb-3">{genError}</p>
        )}

        {report.exec_summary ? (
          <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap bg-bg-elevated rounded-lg p-4 border border-bg-border">
            {report.exec_summary}
          </div>
        ) : (
          <div className="text-sm text-text-muted bg-bg-elevated/50 rounded-lg p-4 border border-bg-border border-dashed">
            <p className="mb-1 font-medium text-text-secondary">No summary yet.</p>
            <p className="text-xs leading-relaxed">
              Click <strong className="text-text-primary">Generate with Claude</strong> to have Claude draft a professional executive summary
              from this actor's profile, TTPs, and your analyst notes. Requires an Anthropic API key (set it in the API Keys panel on any page).
            </p>
          </div>
        )}
      </div>

      {/* Actor Profile */}
      {actor.name && (
        <div className="card">
          <SectionLabel>Threat Actor Profile</SectionLabel>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-text-muted mb-0.5">Name</p>
              <p className="text-sm text-text-primary font-semibold">{actor.name}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Also Known As</p>
              <p className="text-sm text-text-secondary">{aliases || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-0.5">Attributed Origin</p>
              <p className="text-sm text-text-secondary">{actor.country || 'Unknown'}</p>
            </div>
          </div>
          {actor.description && (
            <p className="text-xs text-text-secondary leading-relaxed border-t border-bg-border pt-3">
              {actor.description}
            </p>
          )}
        </div>
      )}

      {/* TTPs */}
      {techniques.length > 0 && (
        <div className="card">
          <SectionLabel>Tactics, Techniques & Procedures — {techniques.length} techniques</SectionLabel>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-text-muted uppercase tracking-wide">
                  <th className="pb-2 px-3 font-medium">ID</th>
                  <th className="pb-2 px-3 font-medium">Technique</th>
                  <th className="pb-2 px-3 font-medium">Tactics</th>
                </tr>
              </thead>
              <tbody>
                {techniques.map((t, i) => (
                  <TTPRow key={t.technique_id || i} t={t} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* IOCs */}
      {iocs.length > 0 && (
        <div className="card">
          <SectionLabel>Indicators of Compromise — {iocs.length} IOCs</SectionLabel>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-text-muted uppercase tracking-wide">
                  <th className="pb-2 px-3 font-medium">IOC</th>
                  <th className="pb-2 px-3 font-medium">Type</th>
                  <th className="pb-2 px-3 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {iocs.map((ioc, i) => (
                  <IocRow key={i} ioc={ioc} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analyst Notes */}
      <div className="card">
        <SectionLabel>Analyst Notes</SectionLabel>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Add investigation notes, context, or assessment here…"
          className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent-500 mb-3"
        />
        <button
          onClick={handleSaveNotes}
          disabled={saving}
          className="btn-primary text-xs"
        >
          {saving ? 'Saving…' : 'Save Notes'}
        </button>
      </div>
    </div>
  )
}
