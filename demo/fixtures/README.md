# Demo Fixtures

Cached API responses used when `DEMO_MODE=true`.

Files in this directory replace live API calls so the deployed portfolio URL works without API keys.

| File | Replaces |
|---|---|
| `vt_sample.json` | VirusTotal v3 response (Phase 1) |
| `abuseipdb_sample.json` | AbuseIPDB check response (Phase 1) |
| `greynoise_sample.json` | GreyNoise context response (Phase 1) |
| `threatfox_sample.json` | ThreatFox feed dump (Phase 2) |
| `urlhaus_sample.json` | URLhaus payload feed (Phase 2) |
| `feodo_sample.json` | Feodo Tracker botnet IPs (Phase 2) |
| `attck_groups.json` | ATT&CK Groups list (Phase 3) |

Fixtures are populated when each phase is implemented.
