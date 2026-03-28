import { useState, useEffect } from 'react'
import { api } from '../api/client'

// ---------------------------------------------------------------------------
// Tactic display config — MITRE ATT&CK enterprise tactics in kill-chain order
// ---------------------------------------------------------------------------

const TACTIC_ORDER = [
  'reconnaissance',
  'resource-development',
  'initial-access',
  'execution',
  'persistence',
  'privilege-escalation',
  'defense-evasion',
  'credential-access',
  'discovery',
  'lateral-movement',
  'collection',
  'command-and-control',
  'exfiltration',
  'impact',
]

const TACTIC_LABELS = {
  'reconnaissance':       'Recon',
  'resource-development': 'Resource Dev',
  'initial-access':       'Initial Access',
  'execution':            'Execution',
  'persistence':          'Persistence',
  'privilege-escalation': 'Priv Esc',
  'defense-evasion':      'Defense Evasion',
  'credential-access':    'Cred Access',
  'discovery':            'Discovery',
  'lateral-movement':     'Lateral Move',
  'collection':           'Collection',
  'command-and-control':  'C2',
  'exfiltration':         'Exfil',
  'impact':               'Impact',
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TacticPill({ tactic, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase tracking-wide transition-colors ${
        active
          ? 'bg-accent-500/20 text-accent-400 border border-accent-500/40'
          : 'bg-bg-elevated text-text-secondary border border-bg-border hover:border-accent-500/30 hover:text-text-primary'
      }`}
    >
      {TACTIC_LABELS[tactic] || tactic}
      <span className="ml-1.5 opacity-60">{count}</span>
    </button>
  )
}

function TechniqueRow({ t }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border-b border-bg-border last:border-0 cursor-pointer"
      onClick={() => setOpen((o) => !o)}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-elevated/40 transition-colors">
        <span className="font-mono text-[11px] text-accent-400 w-16 flex-shrink-0">{t.id}</span>
        <span className="text-sm text-text-primary flex-1">{t.name}</span>
        <div className="flex gap-1 flex-wrap justify-end">
          {t.tactics.slice(0, 2).map((tac) => (
            <span
              key={tac}
              className="px-1.5 py-0.5 rounded text-[9px] font-mono text-text-muted bg-bg-elevated border border-bg-border"
            >
              {TACTIC_LABELS[tac] || tac}
            </span>
          ))}
          {t.tactics.length > 2 && (
            <span className="text-[9px] text-text-muted">+{t.tactics.length - 2}</span>
          )}
        </div>
        <span className="text-text-muted text-xs ml-1">{open ? '▲' : '▼'}</span>
      </div>
      {open && t.description && (
        <div className="px-4 pb-3 pt-1">
          <p className="text-xs text-text-secondary leading-relaxed">{t.description}</p>
          {t.platforms.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {t.platforms.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded text-[10px] text-text-muted bg-bg-elevated border border-bg-border">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NotesPanel({ actorId, initialNotes }) {
  const [notes, setNotes] = useState(initialNotes || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await api.saveNotes(actorId, notes)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (_) {}
    finally { setSaving(false) }
  }

  return (
    <div>
      <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
        Analyst Notes
      </p>
      <textarea
        className="input w-full text-sm resize-none leading-relaxed"
        rows={4}
        placeholder="Add your analysis, context, or observations about this group…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex items-center gap-3 mt-2">
        <button className="btn-ghost text-xs" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save notes'}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ActorProfile({ actorId, onClose }) {
  const [actor, setActor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTactic, setActiveTactic] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setActiveTactic(null)
    api.getActor(actorId)
      .then(setActor)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [actorId])

  if (loading) {
    return (
      <div className="card flex items-center justify-center h-48">
        <span className="text-text-muted text-sm">Loading actor profile…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">{error}</div>
    )
  }

  if (!actor) return null

  // Group techniques by tactic
  const byTactic = {}
  for (const t of actor.techniques) {
    for (const tac of t.tactics) {
      if (!byTactic[tac]) byTactic[tac] = []
      byTactic[tac].push(t)
    }
  }
  const orderedTactics = TACTIC_ORDER.filter((t) => byTactic[t])

  const visibleTechniques = activeTactic
    ? (byTactic[activeTactic] || [])
    : actor.techniques

  function downloadNavigator() {
    api.getNavigator(actorId).then((layer) => {
      const blob = new Blob([JSON.stringify(layer, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${actor.name.replace(/\s+/g, '_')}_navigator.json`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-bg-border flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-base font-semibold text-text-primary">{actor.name}</h2>
            {actor.external_id && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-accent-400 bg-accent-500/10 border border-accent-500/20">
                {actor.external_id}
              </span>
            )}
            {actor.country && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono text-text-secondary bg-bg-elevated border border-bg-border">
                {actor.country}
              </span>
            )}
          </div>
          {actor.aliases.length > 0 && (
            <p className="text-xs text-text-muted">
              Also known as: {actor.aliases.join(' · ')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="btn-ghost text-xs" onClick={downloadNavigator} title="Download ATT&CK Navigator layer">
            ↓ Navigator
          </button>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Description */}
      {actor.description && (
        <div className="px-5 py-3 border-b border-bg-border">
          <p className="text-xs text-text-secondary leading-relaxed">{actor.description}</p>
        </div>
      )}

      {/* Tactic filter strip */}
      {orderedTactics.length > 0 && (
        <div className="px-5 py-3 border-b border-bg-border">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setActiveTactic(null)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase tracking-wide transition-colors ${
                !activeTactic
                  ? 'bg-accent-500/20 text-accent-400 border border-accent-500/40'
                  : 'bg-bg-elevated text-text-secondary border border-bg-border hover:border-accent-500/30 hover:text-text-primary'
              }`}
            >
              All
              <span className="ml-1.5 opacity-60">{actor.techniques.length}</span>
            </button>
            {orderedTactics.map((tac) => (
              <TacticPill
                key={tac}
                tactic={tac}
                count={byTactic[tac].length}
                active={activeTactic === tac}
                onClick={() => setActiveTactic(activeTactic === tac ? null : tac)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Technique list */}
      {actor.techniques.length === 0 ? (
        <div className="px-5 py-8 text-center text-text-muted text-sm">
          No techniques mapped — refresh ATT&CK data to populate.
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {visibleTechniques.map((t) => (
            <TechniqueRow key={t.id} t={t} />
          ))}
        </div>
      )}

      {/* Notes */}
      <div className="px-5 py-4 border-t border-bg-border">
        <NotesPanel actorId={actorId} initialNotes={actor.notes} />
      </div>
    </div>
  )
}
