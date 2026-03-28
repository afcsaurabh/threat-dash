/**
 * Demo fixtures — returned by the API client when VITE_DEMO_MODE=true.
 * Populated incrementally as each phase is implemented.
 * Phase 0: structure only, no real data yet.
 */

export const fixtures = {
  '/api/health': {
    status: 'ok',
    demo_mode: true,
  },

  '/api/enrich': {
    results: [
      {
        ioc: '185.220.101.47',
        type: 'ip',
        risk: 'CRITICAL',
        sources: {
          virustotal: { detections: 45, total: 72, categories: ['malware', 'c2'] },
          abuseipdb: { confidence: 99, country: 'RU', isp: 'Frantech Solutions' },
          greynoise: { classification: 'malicious', name: 'TOR Exit Node', last_seen: '2026-03-27' },
        },
      },
      {
        ioc: 'malware-delivery[.]xyz',
        type: 'domain',
        risk: 'HIGH',
        sources: {
          virustotal: { detections: 12, total: 72, categories: ['phishing'] },
          abuseipdb: null,
          greynoise: null,
        },
      },
      {
        ioc: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
        type: 'hash',
        risk: 'LOW',
        sources: {
          virustotal: { detections: 1, total: 72, categories: [] },
          abuseipdb: null,
          greynoise: null,
        },
      },
    ],
  },

  '/api/enrich/history': {
    history: [],
  },

  '/api/feeds': {
    feed: [
      {
        ioc: 'hxxp://evil-payload[.]com/stage2',
        ioc_type: 'url',
        source: 'urlhaus',
        confidence: 92,
        first_seen: '2026-03-27T08:00:00Z',
      },
      {
        ioc: '185.220.101.47',
        ioc_type: 'ip',
        source: 'threatfox',
        confidence: 77,
        first_seen: '2026-03-26T22:14:00Z',
      },
    ],
    total: 2,
  },

  '/api/feeds/stats': {
    threatfox: 3241,
    urlhaus: 4102,
    feodo: 1089,
    last_refresh: '2026-03-27T09:00:00Z',
  },

  '/api/actors': {
    actors: [
      { id: 'G0007', name: 'APT28', aliases: ['Fancy Bear', 'Sofacy'], country: 'Russia' },
      { id: 'G0032', name: 'Lazarus Group', aliases: ['HIDDEN COBRA'], country: 'DPRK' },
      { id: 'G0096', name: 'APT41', aliases: ['BARIUM', 'Winnti'], country: 'China' },
    ],
    total: 3,
  },

  '/api/reports': {
    reports: [],
  },
}

/**
 * Resolve fixture for a given path.
 * Supports exact match and prefix match for parameterised routes.
 */
export function getFixture(path) {
  if (fixtures[path]) return fixtures[path]
  // Strip trailing path segments for parameterised routes
  const base = '/' + path.split('/').slice(1, 3).join('/')
  return fixtures[base] ?? { message: 'No fixture for this route in demo mode.' }
}
