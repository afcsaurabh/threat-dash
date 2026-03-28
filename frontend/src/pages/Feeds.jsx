export default function Feeds() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Feed Monitor</h1>
        <div className="flex items-center gap-3">
          <span className="text-text-muted text-sm">Last refresh: —</span>
          <button className="btn-ghost">↺ Refresh</button>
        </div>
      </div>

      <div className="card flex items-center justify-center h-64">
        <p className="text-text-muted text-sm">
          Live feed ingestion — Phase 2 implementation coming after Phase 1 enrichment is complete.
        </p>
      </div>
    </div>
  )
}
