export default function Reports() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Intelligence Reports</h1>
        <button className="btn-primary">+ New Report</button>
      </div>

      <div className="card flex items-center justify-center h-64">
        <p className="text-text-muted text-sm">
          Intelligence report generator with Claude API — Phase 4 implementation coming after Phase 3.
        </p>
      </div>
    </div>
  )
}
