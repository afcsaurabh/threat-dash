import { useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Numeric ISO 3166-1 → alpha-2 for countries in our threat dataset + major nations
const NUM_TO_A2 = {
  '036': 'AU', '040': 'AT', '056': 'BE', '076': 'BR', '100': 'BG',
  '124': 'CA', '156': 'CN', '191': 'HR', '203': 'CZ', '208': 'DK',
  '246': 'FI', '250': 'FR', '276': 'DE', '275': 'PS', '356': 'IN',
  '364': 'IR', '368': 'IQ', '376': 'IL', '380': 'IT', '392': 'JP',
  '408': 'KP', '410': 'KR', '528': 'NL', '578': 'NO', '586': 'PK',
  '616': 'PL', '620': 'PT', '642': 'RO', '643': 'RU', '682': 'SA',
  '703': 'SK', '704': 'VN', '724': 'ES', '752': 'SE', '756': 'CH',
  '792': 'TR', '804': 'UA', '826': 'UK', '840': 'US', '862': 'VZ',
}

const NUM_TO_NAME = {
  '036': 'Australia',     '040': 'Austria',        '056': 'Belgium',
  '076': 'Brazil',        '100': 'Bulgaria',        '124': 'Canada',
  '156': 'China',         '191': 'Croatia',         '203': 'Czech Republic',
  '208': 'Denmark',       '246': 'Finland',         '250': 'France',
  '276': 'Germany',       '275': 'Palestine',       '356': 'India',
  '364': 'Iran',          '368': 'Iraq',            '376': 'Israel',
  '380': 'Italy',         '392': 'Japan',           '408': 'North Korea',
  '410': 'South Korea',   '528': 'Netherlands',     '578': 'Norway',
  '586': 'Pakistan',      '616': 'Poland',          '620': 'Portugal',
  '642': 'Romania',       '643': 'Russia',          '682': 'Saudi Arabia',
  '703': 'Slovakia',      '704': 'Vietnam',         '724': 'Spain',
  '752': 'Sweden',        '756': 'Switzerland',     '792': 'Turkey',
  '804': 'Ukraine',       '826': 'United Kingdom',  '840': 'United States',
  '862': 'Venezuela',
}

function padId(id) {
  return String(id).padStart(3, '0')
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

const FILL_EMPTY    = '#1a2535'
const FILL_DEFAULT  = '#252f42'
const STROKE        = '#2d3a52'

function threatFill(count, isActive, isHovered) {
  if (isActive)  return '#F59E0B'  // amber — selected country
  if (count === 0) return isHovered ? '#2d3a52' : FILL_DEFAULT
  // Colour scale: indigo → bright accent, scaled by actor count
  if (count === 1) return isHovered ? '#4338ca' : '#3730a3'
  if (count <= 3)  return isHovered ? '#5b50e8' : '#4f46e5'
  if (count <= 5)  return isHovered ? '#7c74f5' : '#6366f1'
  return isHovered ? '#a5b0ff' : '#818cf8'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ThreatMap({ countryMap = {}, activeCountry = '', onCountryClick }) {
  const [hovered, setHovered] = useState(null) // { name, code, actors }
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  function handleEnter(evt, geoId) {
    const id = padId(geoId)
    const cc = NUM_TO_A2[id] || ''
    setHovered({
      name: NUM_TO_NAME[id] || `Country ${geoId}`,
      code: cc,
      actors: countryMap[cc] || [],
    })
    setMousePos({ x: evt.clientX, y: evt.clientY })
  }

  function handleMove(evt) {
    setMousePos({ x: evt.clientX, y: evt.clientY })
  }

  function handleClick(geoId) {
    const cc = NUM_TO_A2[padId(geoId)]
    if (!cc || !onCountryClick) return
    // Toggle: clicking active country clears filter
    onCountryClick(activeCountry === cc ? '' : cc)
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest">
          Origin Map
        </h2>
        {activeCountry && (
          <button
            onClick={() => onCountryClick && onCountryClick('')}
            className="text-[10px] text-text-muted hover:text-text-secondary transition-colors"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 rounded-lg overflow-hidden bg-[#111827]">
        <ComposableMap
          projectionConfig={{ scale: 140, center: [10, 10] }}
          style={{ width: '100%', height: '100%' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const id = padId(geo.id)
                const cc = NUM_TO_A2[id] || ''
                const count = (countryMap[cc] || []).length
                const isActive = activeCountry !== '' && cc === activeCountry
                const isHovered = hovered?.code === cc && cc !== ''

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={threatFill(count, isActive, isHovered)}
                    stroke={STROKE}
                    strokeWidth={0.4}
                    style={{ outline: 'none' }}
                    onMouseEnter={(evt) => handleEnter(evt, geo.id)}
                    onMouseMove={handleMove}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleClick(geo.id)}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2 px-1 flex-wrap">
        <span className="text-[10px] text-text-muted">Actor count:</span>
        {[
          { color: '#3730a3', label: '1' },
          { color: '#4f46e5', label: '2–3' },
          { color: '#6366f1', label: '4–5' },
          { color: '#818cf8', label: '6+' },
          { color: '#F59E0B', label: 'selected' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-text-muted">{label}</span>
          </div>
        ))}
      </div>

      {/* Floating tooltip */}
      {hovered && (
        <div
          className="fixed z-50 pointer-events-none rounded-lg px-3 py-2 text-xs shadow-xl"
          style={{
            left: mousePos.x + 14,
            top: mousePos.y - 48,
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
          }}
        >
          <p className="font-semibold text-text-primary mb-0.5">{hovered.name}</p>
          {hovered.actors.length > 0 ? (
            <p className="text-text-secondary">
              {hovered.actors.slice(0, 3).join(', ')}
              {hovered.actors.length > 3 ? ` +${hovered.actors.length - 3} more` : ''}
            </p>
          ) : (
            <p className="text-text-muted">No tracked APTs</p>
          )}
          {hovered.code && hovered.actors.length > 0 && (
            <p className="text-accent-400 mt-0.5">
              {activeCountry === hovered.code ? 'Click to clear filter' : 'Click to filter'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
