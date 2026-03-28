import { NavLink } from 'react-router-dom'

const navItems = [
  {
    to: '/',
    label: 'IOC Enrichment',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    to: '/feeds',
    label: 'Feed Monitor',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    live: true,
  },
  {
    to: '/news',
    label: 'Security News',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    to: '/actors',
    label: 'Threat Actors',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  return (
    <aside className="w-[220px] flex-shrink-0 bg-bg-surface flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-bg-border">
        <div className="w-6 h-6 rounded bg-accent-500 flex items-center justify-center">
          <span className="text-white text-xs font-bold">T</span>
        </div>
        <span className="text-text-primary font-semibold text-sm tracking-wide">
          threat<span className="text-accent-400">-</span>dash
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-colors duration-100 ${
                isActive
                  ? 'bg-bg-hover text-white border-l-[3px] border-accent-500 pl-[calc(0.75rem-3px)]'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-white border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
            {item.live && <span className="ml-auto live-dot" />}
          </NavLink>
        ))}
      </nav>

      {/* API status */}
      <div className="px-5 py-4 border-t border-bg-border">
        <p className="text-text-muted text-xs uppercase tracking-widest mb-2.5">API Status</p>
        <div className="flex items-center gap-3">
          <ApiDot label="VT" />
          <ApiDot label="AIPDB" />
          <ApiDot label="GN" />
        </div>
      </div>
    </aside>
  )
}

function ApiDot({ label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-risk-unknown" />
      <span className="text-text-muted text-xs font-mono">{label}</span>
    </div>
  )
}
