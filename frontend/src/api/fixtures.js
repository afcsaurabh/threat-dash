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
        categories: 'ransomware,vulnerabilities',
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
        categories: 'data-breach',
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
        categories: 'government,vulnerabilities',
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
        categories: 'ransomware,data-breach',
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
        categories: 'government',
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
        categories: 'nation-state,incident',
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

  '/api/dashboard': {
    actors: [
      { id: 'G0096', name: 'APT41',        country: 'CN', technique_count: 130, aliases: ['Double Dragon', 'Winnti'] },
      { id: 'G0007', name: 'APT28',        country: 'RU', technique_count: 72,  aliases: ['Fancy Bear'] },
      { id: 'G0010', name: 'Turla',        country: 'RU', technique_count: 70,  aliases: ['Venomous Bear', 'IRON HUNTER'] },
      { id: 'G0032', name: 'Lazarus Group',country: 'KP', technique_count: 61,  aliases: ['Hidden Cobra'] },
      { id: 'G0016', name: 'APT29',        country: 'RU', technique_count: 56,  aliases: ['Cozy Bear', 'The Dukes'] },
      { id: 'G0050', name: 'APT32',        country: 'VN', technique_count: 53,  aliases: ['OceanLotus'] },
      { id: 'G0065', name: 'Leviathan',    country: 'CN', technique_count: 40,  aliases: ['TEMP.Periscope'] },
      { id: 'G0064', name: 'APT33',        country: 'IR', technique_count: 38,  aliases: ['Elfin', 'Refined Kitten'] },
      { id: 'G0087', name: 'APT39',        country: 'IR', technique_count: 34,  aliases: ['Chafer', 'Remix Kitten'] },
      { id: 'G0006', name: 'APT1',         country: 'CN', technique_count: 30,  aliases: ['Comment Crew'] },
    ],
    targets: {
      sectors: [
        { sector: 'government',          count: 42 },
        { sector: 'financial-services',  count: 28 },
        { sector: 'defense',             count: 25 },
        { sector: 'technology',          count: 21 },
        { sector: 'healthcare',          count: 15 },
        { sector: 'energy',              count: 12 },
        { sector: 'telecommunications',  count: 9  },
        { sector: 'education',           count: 7  },
      ],
      named_orgs: [],
    },
    country_actor_map: {
      RU: ['APT28', 'APT29', 'Sandworm Team', 'Turla', 'Wizard Spider'],
      CN: ['APT1', 'APT10', 'APT40', 'APT41', 'Leviathan'],
      KP: ['Lazarus Group', 'Kimsuky', 'APT37', 'APT38'],
      IR: ['APT33', 'APT34', 'Charming Kitten', 'APT39'],
      VN: ['APT32'],
      US: ['Equation'],
    },
    news: [
      {
        article_id: 'hackernews:abc123',
        title: 'New ransomware group exploiting unpatched Fortinet VPNs in targeted attacks',
        url: 'https://news.ycombinator.com/item?id=99999',
        source: 'hackernews', published_at: '2026-03-27T06:30:00Z',
        summary: '', score: 312, author: 'secresearcher', categories: 'ransomware,vulnerabilities',
      },
      {
        article_id: 'cisa:ghi789',
        title: 'CISA Adds CVE-2026-1234 to Known Exploited Vulnerabilities Catalog',
        url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
        source: 'cisa', published_at: '2026-03-26T14:00:00Z',
        summary: 'CISA has added a critical Ivanti Connect Secure vulnerability to its KEV catalog.',
        score: 0, author: 'CISA', categories: 'government,vulnerabilities',
      },
      {
        article_id: 'bleepingcomputer:jkl012',
        title: 'BlackLock ransomware claims attack on European logistics firm, leaks 4TB of data',
        url: 'https://www.bleepingcomputer.com',
        source: 'bleepingcomputer', published_at: '2026-03-26T10:30:00Z',
        summary: 'The BlackLock ransomware group added a major European logistics provider to their data leak site.',
        score: 0, author: 'BleepingComputer', categories: 'ransomware,data-breach',
      },
      {
        article_id: 'thehackernews:pqr678',
        title: 'Researchers uncover novel rootkit hiding in UEFI firmware of enterprise laptops',
        url: 'https://thehackernews.com',
        source: 'thehackernews', published_at: '2026-03-25T09:00:00Z',
        summary: 'Security researchers disclosed a new UEFI bootkit attributed to a nation-state actor.',
        score: 0, author: 'THN', categories: 'nation-state,incident',
      },
      {
        article_id: 'cyberscoop:mno345',
        title: 'White House cybersecurity directive targets critical infrastructure operators',
        url: 'https://cyberscoop.com',
        source: 'cyberscoop', published_at: '2026-03-25T16:00:00Z',
        summary: 'A new executive order mandates minimum cybersecurity baselines for 16 critical sectors.',
        score: 0, author: 'CyberScoop Staff', categories: 'government',
      },
    ],
    empty: false,
  },

  '/api/actors/targets': {
    sectors: [
      { sector: 'government',          count: 42 },
      { sector: 'financial-services',  count: 28 },
      { sector: 'defense',             count: 25 },
      { sector: 'technology',          count: 21 },
      { sector: 'healthcare',          count: 15 },
      { sector: 'energy',              count: 12 },
    ],
    named_orgs: [],
  },

  '/api/actors/stats': {
    groups: 160,
    techniques: 641,
    last_updated: '2026-03-27T09:00:00Z',
  },

  '/api/actors': {
    actors: [
      {
        id: 'G0007', external_id: 'G0007', name: 'APT28',
        aliases: ['Fancy Bear', 'Sofacy', 'IRON TWILIGHT', 'Sednit'],
        country: 'Russia',
        description: 'APT28 is a threat group that has been attributed to Russia\'s General Staff Main Intelligence Directorate (GRU) 85th Main Special Service Center (GTsSS) military unit 26165. This group has been active since at least 2004.',
        technique_count: 68,
      },
      {
        id: 'G0032', external_id: 'G0032', name: 'Lazarus Group',
        aliases: ['HIDDEN COBRA', 'Zinc', 'Labyrinth Chollima'],
        country: 'DPRK',
        description: 'Lazarus Group is a threat group that has been attributed to the North Korean government. The group has been active since at least 2009 and was responsible for the November 2014 destructive wiper attack against Sony Pictures Entertainment.',
        technique_count: 57,
      },
      {
        id: 'G0096', external_id: 'G0096', name: 'APT41',
        aliases: ['BARIUM', 'Winnti', 'Double Dragon', 'Bronze Atlas'],
        country: 'China',
        description: 'APT41 is a threat group that researchers have assessed as Chinese state-sponsored espionage group that also conducts financially-motivated operations. The group has been active since at least 2012.',
        technique_count: 130,
      },
    ],
    total: 3,
  },

  '/api/actors/G0007': {
    id: 'G0007', external_id: 'G0007', name: 'APT28',
    aliases: ['Fancy Bear', 'Sofacy', 'IRON TWILIGHT', 'Sednit', 'Pawn Storm'],
    country: 'Russia',
    description: 'APT28 is a threat group attributed to Russia\'s GRU 85th Main Special Service Center (GTsSS), military unit 26165. Active since at least 2004, APT28 targets government, military, and security organizations primarily in Europe and NATO member states. Known for spear-phishing campaigns, credential harvesting, and custom implants including X-Agent and Sofacy.',
    notes: '',
    techniques: [
      { id: 'T1566', name: 'Phishing', tactics: ['initial-access'], platforms: ['Linux', 'macOS', 'Windows'], description: 'APT28 uses spear-phishing emails with malicious attachments or links to gain initial access.' },
      { id: 'T1078', name: 'Valid Accounts', tactics: ['defense-evasion', 'initial-access', 'persistence', 'privilege-escalation'], platforms: ['Windows', 'Linux', 'macOS'], description: 'APT28 uses credentials obtained through credential dumping or phishing to move laterally.' },
      { id: 'T1190', name: 'Exploit Public-Facing Application', tactics: ['initial-access'], platforms: ['Linux', 'Windows', 'macOS'], description: 'APT28 has exploited vulnerabilities in web servers and VPN appliances.' },
      { id: 'T1059', name: 'Command and Scripting Interpreter', tactics: ['execution'], platforms: ['Linux', 'macOS', 'Windows'], description: 'APT28 uses PowerShell, VBScript, and batch scripts to execute payloads.' },
      { id: 'T1053', name: 'Scheduled Task/Job', tactics: ['execution', 'persistence', 'privilege-escalation'], platforms: ['Windows', 'Linux', 'macOS'], description: 'APT28 establishes persistence using Windows scheduled tasks.' },
      { id: 'T1003', name: 'OS Credential Dumping', tactics: ['credential-access'], platforms: ['Windows', 'Linux', 'macOS'], description: 'APT28 uses Mimikatz and custom tools to dump credentials from LSASS.' },
      { id: 'T1071', name: 'Application Layer Protocol', tactics: ['command-and-control'], platforms: ['Linux', 'macOS', 'Windows'], description: 'APT28 uses HTTP, HTTPS, and DNS for C2 communications.' },
      { id: 'T1021', name: 'Remote Services', tactics: ['lateral-movement'], platforms: ['Linux', 'macOS', 'Windows'], description: 'APT28 uses RDP and SSH for lateral movement within victim networks.' },
      { id: 'T1083', name: 'File and Directory Discovery', tactics: ['discovery'], platforms: ['Linux', 'macOS', 'Windows'], description: 'APT28 enumerates file systems to identify target data.' },
      { id: 'T1041', name: 'Exfiltration Over C2 Channel', tactics: ['exfiltration'], platforms: ['Linux', 'macOS', 'Windows'], description: 'APT28 exfiltrates collected data over the same channel used for C2.' },
    ],
  },

  '/api/actors/G0032': {
    id: 'G0032', external_id: 'G0032', name: 'Lazarus Group',
    aliases: ['HIDDEN COBRA', 'Zinc', 'Labyrinth Chollima', 'Whois Hacking Team'],
    country: 'DPRK',
    description: 'Lazarus Group is attributed to North Korea\'s RGB (Reconnaissance General Bureau). Active since at least 2009, the group conducts both financially-motivated operations (notably the 2016 Bangladesh Bank heist and cryptocurrency thefts) and destructive cyber attacks. Responsible for WannaCry ransomware, the Sony Pictures breach, and multiple SWIFT banking attacks.',
    notes: '',
    techniques: [
      { id: 'T1189', name: 'Drive-by Compromise', tactics: ['initial-access'], platforms: ['Windows', 'Linux', 'macOS'], description: 'Lazarus has conducted watering hole attacks targeting financial sector and cryptocurrency platforms.' },
      { id: 'T1195', name: 'Supply Chain Compromise', tactics: ['initial-access'], platforms: ['Linux', 'macOS', 'Windows'], description: 'Lazarus compromised software supply chains including a financial software vendor update mechanism.' },
      { id: 'T1059', name: 'Command and Scripting Interpreter', tactics: ['execution'], platforms: ['Linux', 'macOS', 'Windows'], description: 'Lazarus uses PowerShell and custom shell scripts to execute payloads.' },
      { id: 'T1486', name: 'Data Encrypted for Impact', tactics: ['impact'], platforms: ['Linux', 'macOS', 'Windows'], description: 'Lazarus deployed WannaCry ransomware and custom wipers to disrupt target networks.' },
      { id: 'T1055', name: 'Process Injection', tactics: ['defense-evasion', 'privilege-escalation'], platforms: ['Linux', 'Windows', 'macOS'], description: 'Lazarus uses process injection to hide malicious code within legitimate processes.' },
      { id: 'T1048', name: 'Exfiltration Over Alternative Protocol', tactics: ['exfiltration'], platforms: ['Linux', 'macOS', 'Windows'], description: 'Lazarus uses custom protocols to blend exfiltration traffic with legitimate communications.' },
      { id: 'T1036', name: 'Masquerading', tactics: ['defense-evasion'], platforms: ['Linux', 'macOS', 'Windows'], description: 'Lazarus disguises malware as legitimate software and uses fake digital signatures.' },
      { id: 'T1070', name: 'Indicator Removal', tactics: ['defense-evasion'], platforms: ['Linux', 'macOS', 'Windows'], description: 'Lazarus clears Windows Event Logs and deletes tools after operations to impede forensics.' },
    ],
  },

  '/api/actors/G0096': {
    id: 'G0096', external_id: 'G0096', name: 'APT41',
    aliases: ['BARIUM', 'Winnti', 'Double Dragon', 'Bronze Atlas', 'Wicked Spider'],
    country: 'China',
    description: 'APT41 is a Chinese state-sponsored threat actor uniquely conducting both espionage and financially-motivated intrusions. Active since at least 2012, APT41 targets healthcare, telecommunications, technology, and video game companies. The group has exploited zero-days in Citrix, Cisco, and Zoho, and is known for supply chain attacks via compromised software vendors.',
    notes: '',
    techniques: [
      { id: 'T1190', name: 'Exploit Public-Facing Application', tactics: ['initial-access'], platforms: ['Linux', 'Windows', 'macOS'], description: 'APT41 has exploited zero-day vulnerabilities in Citrix NetScaler, Cisco routers, and Zoho ManageEngine.' },
      { id: 'T1133', name: 'External Remote Services', tactics: ['initial-access', 'persistence'], platforms: ['Windows', 'Linux'], description: 'APT41 leverages compromised VPN and RDP credentials to gain persistent access.' },
      { id: 'T1059', name: 'Command and Scripting Interpreter', tactics: ['execution'], platforms: ['Linux', 'macOS', 'Windows'], description: 'APT41 heavily uses PowerShell, Python, and cmd.exe for execution.' },
      { id: 'T1082', name: 'System Information Discovery', tactics: ['discovery'], platforms: ['Linux', 'macOS', 'Windows'], description: 'APT41 conducts extensive reconnaissance to understand victim network architecture.' },
      { id: 'T1078', name: 'Valid Accounts', tactics: ['defense-evasion', 'initial-access', 'persistence', 'privilege-escalation'], platforms: ['Windows', 'Linux', 'macOS'], description: 'APT41 uses stolen credentials to maintain persistent access and avoid detection.' },
      { id: 'T1005', name: 'Data from Local System', tactics: ['collection'], platforms: ['Linux', 'macOS', 'Windows'], description: 'APT41 collects intellectual property, source code, and PII from victim systems.' },
      { id: 'T1041', name: 'Exfiltration Over C2 Channel', tactics: ['exfiltration'], platforms: ['Linux', 'macOS', 'Windows'], description: 'APT41 stages and exfiltrates collected data through established C2 infrastructure.' },
      { id: 'T1195', name: 'Supply Chain Compromise', tactics: ['initial-access'], platforms: ['Linux', 'macOS', 'Windows'], description: 'APT41 has compromised software update mechanisms to deliver malware to downstream customers.' },
      { id: 'T1003', name: 'OS Credential Dumping', tactics: ['credential-access'], platforms: ['Windows', 'Linux', 'macOS'], description: 'APT41 uses credential dumping tools to escalate privileges and enable lateral movement.' },
      { id: 'T1027', name: 'Obfuscated Files or Information', tactics: ['defense-evasion'], platforms: ['Linux', 'macOS', 'Windows'], description: 'APT41 uses code packing and obfuscation to evade security tools.' },
    ],
  },

  '/api/reports': {
    reports: [
      {
        id: 1,
        title: 'APT28 Threat Assessment — Q1 2026',
        actor_id: 'G0007',
        actor_profile: {
          name: 'APT28',
          aliases: ['Fancy Bear', 'Sofacy', 'IRON TWILIGHT'],
          country: 'Russia',
          description: 'APT28 is a threat group attributed to Russia\'s GRU 85th Main Special Service Center (GTsSS), military unit 26165. Active since at least 2004.',
        },
        has_summary: 1,
        created_at: '2026-03-27T10:00:00Z',
        updated_at: '2026-03-27T10:15:00Z',
      },
      {
        id: 2,
        title: 'Lazarus Group — Cryptocurrency Campaign',
        actor_id: 'G0032',
        actor_profile: {
          name: 'Lazarus Group',
          aliases: ['HIDDEN COBRA', 'Zinc'],
          country: 'DPRK',
          description: 'Lazarus Group is attributed to North Korea\'s RGB. Known for financially-motivated operations and destructive attacks.',
        },
        has_summary: 0,
        created_at: '2026-03-26T14:30:00Z',
        updated_at: '2026-03-26T14:30:00Z',
      },
    ],
  },

  '/api/reports/1': {
    id: 1,
    title: 'APT28 Threat Assessment — Q1 2026',
    actor_id: 'G0007',
    actor_profile: {
      name: 'APT28',
      aliases: ['Fancy Bear', 'Sofacy', 'IRON TWILIGHT', 'Sednit'],
      country: 'Russia',
      description: 'APT28 is a threat group attributed to Russia\'s GRU 85th Main Special Service Center (GTsSS), military unit 26165. Active since at least 2004, APT28 targets government, military, and security organisations primarily in Europe and NATO member states.',
    },
    exec_summary: 'APT28 (also known as Fancy Bear and Sofacy) is a sophisticated threat actor attributed to Russia\'s General Staff Main Intelligence Directorate (GRU), specifically military unit 26165. The group has been active since at least 2004 and primarily targets government, military, and security organisations across NATO member states and Eastern Europe. Attribution is assessed with high confidence based on consistent tooling, infrastructure patterns, and targeting consistent with Russian strategic interests.\n\nAPT28\'s primary initial access vectors include spear-phishing campaigns (T1566) and exploitation of internet-facing services (T1190). Once inside a target network, the group leverages valid credentials (T1078) to maintain persistence and move laterally via Remote Services (T1021). The group\'s signature toolset includes X-Agent, Sofacy, and custom implants designed to evade endpoint detection.\n\nKey indicators of compromise associated with APT28 include malicious infrastructure hosted across commercial VPN providers and compromised third-party hosting. The group routinely rotates C2 infrastructure to frustrate attribution and blocking efforts. Defenders should monitor for credential reuse, anomalous use of remote services, and scheduled tasks created outside normal change windows.\n\nDefensive priorities include hardening phishing resilience through user training and email authentication controls (DMARC, DKIM, SPF), deploying multi-factor authentication across all remote access pathways, and monitoring for credential dumping activity (T1003) on domain controllers. Organisations in government, defence, and critical infrastructure sectors should treat APT28 as an active threat and review ATT&CK coverage gaps against their current security controls.',
    ttps_json: [
      { technique_id: 'T1566', name: 'Phishing', tactics: ['initial-access'] },
      { technique_id: 'T1078', name: 'Valid Accounts', tactics: ['defense-evasion', 'initial-access', 'persistence'] },
      { technique_id: 'T1190', name: 'Exploit Public-Facing Application', tactics: ['initial-access'] },
      { technique_id: 'T1059', name: 'Command and Scripting Interpreter', tactics: ['execution'] },
      { technique_id: 'T1003', name: 'OS Credential Dumping', tactics: ['credential-access'] },
      { technique_id: 'T1071', name: 'Application Layer Protocol', tactics: ['command-and-control'] },
      { technique_id: 'T1021', name: 'Remote Services', tactics: ['lateral-movement'] },
      { technique_id: 'T1041', name: 'Exfiltration Over C2 Channel', tactics: ['exfiltration'] },
    ],
    iocs_json: [
      { ioc: '185.220.101.47', type: 'ip', risk: 'CRITICAL' },
      { ioc: 'sofacy-update[.]com', type: 'domain', risk: 'HIGH' },
    ],
    mitigations: '',
    analyst_notes: 'Targeting pattern consistent with strategic intelligence gathering ahead of NATO summit. Priority: monitor for spear-phishing targeting defence ministry contacts.',
    created_at: '2026-03-27T10:00:00Z',
    updated_at: '2026-03-27T10:15:00Z',
  },

  '/api/reports/2': {
    id: 2,
    title: 'Lazarus Group — Cryptocurrency Campaign',
    actor_id: 'G0032',
    actor_profile: {
      name: 'Lazarus Group',
      aliases: ['HIDDEN COBRA', 'Zinc', 'Labyrinth Chollima'],
      country: 'DPRK',
      description: 'Lazarus Group is attributed to North Korea\'s RGB. Known for financially-motivated operations and destructive attacks.',
    },
    exec_summary: '',
    ttps_json: [
      { technique_id: 'T1189', name: 'Drive-by Compromise', tactics: ['initial-access'] },
      { technique_id: 'T1195', name: 'Supply Chain Compromise', tactics: ['initial-access'] },
      { technique_id: 'T1486', name: 'Data Encrypted for Impact', tactics: ['impact'] },
    ],
    iocs_json: [],
    mitigations: '',
    analyst_notes: '',
    created_at: '2026-03-26T14:30:00Z',
    updated_at: '2026-03-26T14:30:00Z',
  },
}

/**
 * Resolve fixture for a given path.
 * Supports exact match and prefix match for parameterised routes.
 */
export function getFixture(path) {
  // Strip query string before lookup
  const clean = path.split('?')[0]
  if (fixtures[clean]) return fixtures[clean]
  // Strip trailing path segments for parameterised routes
  const base = '/' + clean.split('/').slice(1, 3).join('/')
  return fixtures[base] ?? { message: 'No fixture for this route in demo mode.' }
}
