# Threat Intelligence Career Launch: Research Report
**Query**: Entry-level CTI resources, GitHub portfolio strategy, and Claude Code as a spec-driven partner
**Date**: March 23, 2026 | **Depth**: Standard
**Author**: Claude Code (sc:research)

---

## Executive Summary

A career transition from advertising strategy into cyber threat intelligence (CTI) is structurally sound, not a stretch. The cognitive skills that define strong advertising strategists — audience profiling, pattern recognition, behavioral modeling, narrative construction, and briefing stakeholders — map directly onto the core competencies of a CTI analyst. With GFACT + one additional SANS foundational cert, the recommended path is: build a six-project GitHub portfolio over 90 days using spec-driven development with Claude Code, pursue FOR578/GCTI as the next certification, and leverage written communication as a primary differentiator in a field dominated by technically strong but analytically under-trained practitioners.

---

## 1. Your Unfair Advantage Is Real — and Underappreciated

The advertising-to-threat-intelligence crossover is structurally sound. Here is the direct skill mapping:

| Advertising Strategist Skill | CTI Equivalent |
|---|---|
| Audience segmentation | Threat actor profiling / TTP clustering |
| Campaign analysis | Attack campaign attribution |
| Behavioral targeting | Adversary intent modeling |
| Narrative construction | Intelligence reporting for stakeholders |
| Data pattern recognition | IOC correlation and anomaly detection |
| Creative hypothesis testing | Threat hunting hypothesis design |

SANS/GIAC describe the CTI analyst role as: profiling adversaries, analyzing TTPs, and producing intelligence reports for stakeholders — a sentence that maps almost verbatim to "profiling audiences, analyzing behavior patterns, and producing briefs for clients."

The field is increasingly open to non-traditional entrants who can write, communicate complexity, and think in narratives. Most technical people cannot write a clear brief. That asymmetry is your entry point.

**Cover letter anchor statement:**
> *"Advertising strategy is adversarial by design — you are modeling the target's behavior, anticipating competitor moves, and synthesizing data into decisions under uncertainty. Threat intelligence is the same discipline applied to a higher-stakes environment. The data types changed. The cognitive model didn't."*

---

## 2. Certification Progression Map

Current state: GFACT + one foundational cert (GSEC or equivalent)

```
Now:        GFACT / GSEC       ← foundational (completed)
            Demonstrates: networking, Linux, Windows, basic security concepts

Next:       FOR578 / GCTI      ← SANS dedicated CTI course + cert
            Covers: intelligence lifecycle, STIX/TAXII, adversary profiling,
                    ATT&CK mapping, reporting for stakeholders

Later:      GCFE / GREM        ← digital forensics / malware RE
            (optional depth for CTI specialization)
```

**FOR578: Cyber Threat Intelligence** is the canonical SANS course for this role. It covers intelligence production cycles, adversary behavior analysis, and stakeholder briefing. It is the most strategist-compatible technical course in the SANS catalog.

---

## 3. The Core Tools Ecosystem

Build familiarity in three tiers, matched to portfolio layer progression.

### Tier 1: Start Immediately
- **python-stix2** — Python library for STIX2 object creation and manipulation (industry standard data format)
- **MITRE ATT&CK Navigator** — browser-based TTP mapping and annotation tool ([live app](https://mitre-attack.github.io/attack-navigator/))
- **VirusTotal API** — IOC reputation lookup (500 free queries/day)
- **AbuseIPDB API** — IP threat reputation (1,000 free queries/day)
- **GreyNoise API** — internet noise vs. targeted scan classification
- **TheHarvester** — email/domain/subdomain OSINT
- **Shodan** — internet-exposed device intelligence

### Tier 2: Months 2–3
- **OpenCTI** — modern threat intelligence platform with STIX2 backend, better UX than MISP for beginners ([GitHub](https://github.com/OpenCTI-Platform/opencti))
- **MISP** — older, more widely deployed TIP; understand both platforms ([misp-project.org](https://misp-project.org/))
- **InQuest ThreatIngestor** — IOC feed ingestion and aggregation ([GitHub](https://github.com/InQuest/ThreatIngestor))
- **Awesome Threat Intelligence** — master curated reference list ([GitHub](https://github.com/hslatman/awesome-threat-intelligence))
- **abuse.ch feeds** — ThreatFox, URLhaus, Feodo Tracker (free, live IOC feeds)

### Tier 3: Months 4+
- **Maltego** — visual link analysis for adversary and infrastructure mapping
- **Sigma rules** — detection engineering notation; bridges CTI to SOC
- **YARA** — malware signature rules (useful context, not required for pure CTI)
- **SpiderFoot** — automated OSINT reconnaissance platform

---

## 4. The GitHub Portfolio Strategy

Build in three layers. The goal is not volume — it is demonstrable reasoning progression. Each project should include a `SPEC.md` (design intent), clean commit history, and a written `README` that explains the *why*, not just the *what*.

---

### Layer 1: Foundations (Months 1–2)
*Proves you understand the data layer*

#### Project 1: IOC Enrichment CLI Tool
**What**: Python CLI that takes a list of IPs/domains/hashes, queries VirusTotal, AbuseIPDB, and GreyNoise APIs, and outputs structured JSON/CSV with confidence scores and risk ratings.

**Why it matters**: Every CTI job involves this workflow. Automating it shows tool fluency and API literacy.

**Reference to study first**: [IP-Enrichment-Python](https://github.com/sadiq-95/IP-Enrichment-Python) — study the pattern, then build your own variant with improvements.

**Spec-driven approach**:
```
SPEC.md — define inputs, outputs, API schema, error handling
DECISIONS.md — explain why you chose JSON over CSV as default, why confidence scoring works as it does
README.md — frame as an analyst use case, not a code tutorial
```

#### Project 2: MITRE ATT&CK Actor Profile
**What**: Use the `stix2` Python library to query the MITRE ATT&CK TAXII server, extract TTPs for a real threat actor (e.g., APT28 or Lazarus Group), generate an ATT&CK Navigator layer (JSON export), and publish a written threat actor profile as a Markdown document.

**Why it matters**: Shows adversary profiling using the industry-standard framework. This is where your advertising audience profiling directly translates.

**Data source**: [mitre/cti TAXII server](https://github.com/mitre/cti) — queryable via Python

---

### Layer 2: Intelligence Production (Months 3–4)
*Proves you can turn raw data into finished intelligence*

#### Project 3: Threat Feed Aggregator
**What**: Python tool that ingests free live IOC feeds (ThreatFox, URLhaus, Feodo Tracker), normalizes them to STIX2 format, deduplicates entries, stores locally (SQLite or flat JSON), and provides a CLI query interface (search by type, date, confidence).

**Why it matters**: Understanding the STIX/TAXII data model is table stakes at mid-level CTI roles. Building the normalization pipeline shows architectural thinking.

#### Project 4: Finished Intelligence Report Series
**What**: Pick a real threat actor or campaign from public sources (CISA advisories, Mandiant blog, Recorded Future free tier). Write a 1–2 page structured intelligence report in the standard format:
- Executive Summary (2–3 sentences for non-technical leadership)
- Threat Actor Profile (attribution confidence, motivation, capability)
- TTPs mapped to MITRE ATT&CK
- IOCs (sanitized)
- Recommended Mitigations (mapped to NIST CSF or CIS Controls)

Publish as structured Markdown in a dedicated `reports/` folder. Aim for 3–5 reports in the series.

**Why it matters**: This is your advertising background expressed in cybersecurity language. It is your highest-signal portfolio artifact. Hiring managers at CTI teams — especially those who present to C-suite — will notice polished written intelligence immediately.

**Writing style references**:
- [CISA Advisories](https://www.cisa.gov/news-events/cybersecurity-advisories)
- [Mandiant Threat Research Blog](https://www.mandiant.com/resources/blog)
- [Recorded Future Blog](https://www.recordedfuture.com/blog)

---

### Layer 3: Platform Work (Months 5–6)
*Proves operational readiness*

#### Project 5: OpenCTI Lab Deployment
**What**: Stand up a local OpenCTI instance using Docker Compose. Configure connectors: MITRE ATT&CK, AlienVault OTX, abuse.ch feeds. Ingest data, build a sample intelligence graph, document the setup walkthrough with screenshots and annotated configuration.

**Why it matters**: OpenCTI is increasingly standard in enterprise CTI teams. Operational platform knowledge at entry level is rare. The setup documentation itself demonstrates technical communication skill.

**Reference**: [OpenCTI Documentation](https://docs.opencti.io/latest/deployment/connectors/)

#### Project 6: OSINT Investigation Writeup
**What**: Conduct a full OSINT investigation on a suspicious entity from a public CTF or HackTheBox Sherlock scenario. Document: collection methodology, tools used (Maltego, SpiderFoot, Shodan, WHOIS, Certificate Transparency logs), pivot chain, findings, confidence assessment, and recommendations.

**Why it matters**: Demonstrates the full intelligence cycle — collection, processing, analysis, and production — in a single documented artifact.

**Source for realistic scenarios**: [HackTheBox Sherlocks](https://app.hackthebox.com/sherlocks) — forensics and CTI-focused, based on real incident artifacts.

---

## 5. Spec-Driven Development with Claude Code

This is the workflow differentiator. Peers building from tutorials produce repos that look like tutorials. Spec-driven development produces repos that look like professional engineering artifacts — because they are.

### The Methodology (GitHub Spec Kit)

GitHub has open-sourced [spec-kit](https://github.com/github/spec-kit), a toolkit built explicitly for this workflow with Claude Code, GitHub Copilot, and Gemini CLI.

```
/specify  →  Generate full spec from a plain-English prompt
/plan     →  Create technical implementation plan
/tasks    →  Break spec into actionable implementation steps
```

### Applied Workflow for Each CTI Project

**Step 1: Write the spec in plain English**
Example: *"I want a Python CLI tool that takes a list of IP addresses from a file, queries the VirusTotal v3 API and AbuseIPDB API concurrently, and outputs a structured JSON report with a per-IP risk score (Low/Medium/High/Critical) based on detection ratios and abuse confidence scores."*

**Step 2: Generate SPEC.md with Claude Code**
This becomes a permanent artifact in your repo. It signals intentional design thinking — rare in entry-level portfolios.

**Step 3: Execute iteratively against the spec**
Each function, test, and documentation section is generated through explicit prompting against the spec. Claude Code maintains context and catches drift from spec intent.

**Step 4: Document reasoning in DECISIONS.md**
Why was this data structure chosen? Why this API over an alternative? Why this confidence scoring model? This is your strategist brain on paper. It is what separates a thoughtful practitioner from a tutorial-copier.

### Why This Matters for Hiring

CTI roles — especially those at organizations that brief executives or regulators — weight documentation and written communication heavily. A GitHub repo with:
- `SPEC.md` (design intent)
- `DECISIONS.md` (reasoning trail)
- Structured `README.md` with analyst use-case framing
- Clean commit history that follows the spec progression

...reads as engineering maturity. Hiring managers in CTI will read your documentation as much as your code. That is your arena.

---

## 6. Recommended First 90 Days

| Week | Action | Output |
|---|---|---|
| 1–2 | Create GitHub. Read Awesome Threat Intelligence. Register free API accounts: VirusTotal, AbuseIPDB, GreyNoise, Shodan. | Accounts + bookmarks |
| 3–4 | Build Project 1 (IOC Enrichment CLI) using spec-driven workflow. Push with SPEC.md and DECISIONS.md. | Repo 1 live |
| 5–6 | Study MITRE ATT&CK framework. Build Project 2 (Actor Profile + Navigator Layer). Write threat actor writeup as README. | Repo 2 live |
| 7–8 | Set up OpenCTI locally via Docker. Ingest ATT&CK + OTX connectors. Begin documentation. | Platform running |
| 9–10 | Build Project 3 (Threat Feed Aggregator). Study STIX2 data model. | Repo 3 live |
| 11–12 | Write first finished intelligence report (Project 4). Publish as structured Markdown. | Report 1 published |
| 13+ | Continue report series. Build Project 5 (OpenCTI Lab writeup). Add Project 6 (OSINT investigation). | Full portfolio |

---

## 7. Community and Continuous Learning

**Reading (weekly)**
- CISA Cybersecurity Advisories — [cisa.gov/advisories](https://www.cisa.gov/news-events/cybersecurity-advisories)
- Mandiant Threat Research — [mandiant.com/resources/blog](https://www.mandiant.com/resources/blog)
- Recorded Future Blog — free-tier threat intelligence reporting
- Krebs on Security — narrative-driven incident coverage

**Training and Challenges**
- **HackTheBox Sherlocks** — CTI/forensics challenges with real incident artifacts
- **SANS Cyber Threat Intelligence Summit** — annual conference; past recordings available free
- **CTI League** — volunteer CTI analyst community for early career practitioners

**Community**
- LinkedIn CTI community: Katie Nickels (MITRE ATT&CK), Juan Andres Guerrero-Saade (SentinelLabs), Costin Raiu — follow and engage with public methodology discussions
- Reddit: r/cybersecurity, r/threatintelligence
- Discord: TryHackMe, HackTheBox communities

---

## 8. Strategic Positioning Summary

**The narrative**: You are not a career changer with a gap to explain. You are a practitioner who spent years doing adversarial analysis (advertising), is now applying that cognitive framework to a higher-stakes domain (cybersecurity), and has the technical credentials (SANS) and hands-on portfolio (GitHub) to demonstrate it.

**Your differentiators at entry level**:
1. Written communication — you can produce finished intelligence, not just raw data dumps
2. Stakeholder briefing instinct — you know how to calibrate technical detail to audience
3. Adversary-as-audience thinking — you have spent years modeling human decision-making under competitive pressure
4. Spec-driven portfolio — your repos document *why*, not just *what*

**The job family to target first**: Threat Intelligence Analyst (Tier 1–2), Intelligence Analyst at an MSSP, or CTI Analyst at a company with a small but dedicated CTI function. Avoid pure SOC analyst roles where writing is deprioritized — your advantage will not register there.

---

## Sources

- [12 Relevant CTI Projects for Portfolio in 2025 — RONIN OWL CTI / Medium](https://medium.com/@scottbolen/12-relevant-cti-projects-for-portfolio-in-2025-2041f22a714f)
- [Awesome Threat Intelligence — GitHub](https://github.com/hslatman/awesome-threat-intelligence)
- [OpenCTI Platform — GitHub](https://github.com/OpenCTI-Platform/opencti)
- [FOR578: Cyber Threat Intelligence — SANS Institute](https://www.sans.org/cyber-security-courses/cyber-threat-intelligence)
- [Cyber Intelligence Analyst Career Guide — SANS](https://www.sans.org/job-roles/cyber-threat-intelligence-specialist)
- [GIAC GCTI Certification Guide — FlashGenius](https://flashgenius.net/blog-article/level-up-your-cyber-skills-the-ultimate-guide-to-giac-cyber-threat-intelligence-gcti-certification)
- [MITRE ATT&CK Navigator — GitHub](https://github.com/mitre-attack/attack-navigator)
- [MITRE CTI STIX Repository — GitHub](https://github.com/mitre/cti)
- [IP Enrichment Python — GitHub](https://github.com/sadiq-95/IP-Enrichment-Python)
- [OSINT Toolkit — GitHub](https://github.com/dev-lu/osint_toolkit)
- [Awesome OSINT — GitHub](https://github.com/jivoi/awesome-osint)
- [Spec-Driven Development with AI — GitHub Blog](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- [GitHub Spec Kit — GitHub](https://github.com/github/spec-kit)
- [Five Must-Have CTI Analyst Skills — Flashpoint](https://flashpoint.io/blog/five-must-have-skills-cyber-threat-intel-analyst/)
- [MISP vs OpenCTI 2025 — Cosive](https://www.cosive.com/misp-vs-opencti)
- [OpenCTI Connectors Documentation](https://docs.opencti.io/latest/deployment/connectors/)
- [ThreatIngestor — InQuest GitHub](https://github.com/InQuest/ThreatIngestor)
- [Cybersecurity Projects Portfolio (60 projects) — GitHub](https://github.com/CarterPerez-dev/Cybersecurity-Projects)
