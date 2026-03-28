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

  '/api/news': {
    articles: [
      {
        article_id: 'hackernews:abc123',
        title: 'New ransomware group exploiting unpatched Fortinet VPNs in targeted attacks',
        url: 'https://news.ycombinator.com/item?id=99999',
        source: 'hackernews',
        published_at: '2026-03-27T06:30:00Z',
        summary: '',
        score: 312,
        author: 'secresearcher',
      },
      {
        article_id: 'krebs:def456',
        title: 'Hackers drain $45M from crypto exchange via compromised hot wallet',
        url: 'https://krebsonsecurity.com',
        source: 'krebs',
        published_at: '2026-03-26T18:00:00Z',
        summary: 'Attackers gained access to the exchange\'s hot wallet through a supply-chain compromise of a third-party signing library, draining approximately $45 million in mixed cryptocurrency assets.',
        score: 0,
        author: 'Brian Krebs',
      },
      {
        article_id: 'cisa:ghi789',
        title: 'CISA Adds CVE-2026-1234 to Known Exploited Vulnerabilities Catalog',
        url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
        source: 'cisa',
        published_at: '2026-03-26T14:00:00Z',
        summary: 'CISA has added a critical Ivanti Connect Secure vulnerability to its KEV catalog. Federal agencies are required to remediate by April 14.',
        score: 0,
        author: 'CISA',
      },
      {
        article_id: 'bleepingcomputer:jkl012',
        title: 'BlackLock ransomware claims attack on European logistics firm, leaks 4TB of data',
        url: 'https://www.bleepingcomputer.com',
        source: 'bleepingcomputer',
        published_at: '2026-03-26T10:30:00Z',
        summary: 'The BlackLock ransomware group added a major European logistics provider to their data leak site, claiming to have exfiltrated over 4TB of files including contracts and employee records.',
        score: 0,
        author: 'BleepingComputer',
      },
      {
        article_id: 'cyberscoop:mno345',
        title: 'White House cybersecurity directive targets critical infrastructure operators',
        url: 'https://cyberscoop.com',
        source: 'cyberscoop',
        published_at: '2026-03-25T16:00:00Z',
        summary: 'A new executive order mandates minimum cybersecurity baselines for operators of critical infrastructure across 16 sectors, with compliance deadlines ranging from 90 to 180 days.',
        score: 0,
        author: 'CyberScoop Staff',
      },
      {
        article_id: 'thehackernews:pqr678',
        title: 'Researchers uncover novel rootkit hiding in UEFI firmware of enterprise laptops',
        url: 'https://thehackernews.com',
        source: 'thehackernews',
        published_at: '2026-03-25T09:00:00Z',
        summary: 'Security researchers disclosed a new UEFI bootkit affecting multiple enterprise laptop manufacturers. The implant survives OS reinstalls and is attributed to a nation-state actor.',
        score: 0,
        author: 'THN',
      },
    ],
    total: 6,
    source_labels: {
      hackernews: 'Hacker News',
      cyberscoop: 'CyberScoop',
      krebs: 'Krebs on Security',
      bleepingcomputer: 'BleepingComputer',
      cisa: 'CISA',
      thehackernews: 'The Hacker News',
    },
  },

  '/api/news/stats': {
    by_source: {
      hackernews:       { count: 40, last_fetch: '2026-03-27T09:00:00Z' },
      cyberscoop:       { count: 30, last_fetch: '2026-03-27T09:00:00Z' },
      krebs:            { count: 10, last_fetch: '2026-03-27T09:00:00Z' },
      bleepingcomputer: { count: 30, last_fetch: '2026-03-27T09:00:00Z' },
      cisa:             { count: 20, last_fetch: '2026-03-27T09:00:00Z' },
      thehackernews:    { count: 30, last_fetch: '2026-03-27T09:00:00Z' },
    },
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
