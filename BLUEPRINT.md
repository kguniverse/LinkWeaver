# LinkWeaver Product Blueprint

> Product-side companion to `CLAUDE.md`. CLAUDE.md captures **how the code works**;
> this file captures **why we're building it and what counts as done**.

**Status (2026-04-28):** Stage 2 locked. Stage 3 Week 1 in progress.

---

## 1. Positioning

> **For** university research-security / pre-award compliance analysts (non-technical background) who currently use bundled-data SaaS tools costing tens of thousands per year, running on external clouds that can't pass campus IT security review, and still requiring manual Excel transcription from disclosure PDFs —
>
> **LinkWeaver is** a self-hostable graph investigation platform
>
> **that** turns a 2-day manual collaboration risk memo into a 30-minute drag-and-export workflow.
>
> **Unlike** LexisNexis / Visual Compliance / Palantir (data + platform bundled SaaS),
>
> **it** runs on the school's own servers, uses the school's own data, and is priced per seat — not per record.

**Differentiator pillars:**
1. **Decoupled** — ships with free public data (OpenSanctions, OpenCorporates), users add their own
2. **Self-hosted** — passes campus IT vendor review without 6-month back-and-forth
3. **AI-assisted investigation** (later phase) — extract from PDFs, reconcile against lists, draft narrative memos

The three pillars only stand together: "decoupled" is viable only if AI removes BYOD friction; "self-hosted" is viable only because the public-data ingest model avoids licensing complexity.

---

## 2. North Star Metric

**Weekly risk-assessment reports exported per active analyst.**

- Lagging — only moves after a full investigation completes
- Ungameable — no incentive to fake completed reports
- Maps directly to whether LinkWeaver replaced the old Excel workflow vs. sat unused

---

## 3. JTBDs (locked)

### End-user JTBDs (the analyst doing the work)

1. **Disclosure intake** — When I get a PI's Other Support disclosure PDF, I want to auto-extract every person/institution/funding source into a relationship graph, so I can skip the 3-hour manual Excel transcription and start judging undisclosed connections.
2. **Pre-meeting urgency** — When the committee asks for a risk memo on a foreign collaborator before this afternoon's meeting, I want to see ultimate beneficial owners, restricted-list hits, and prior collaboration history within 10 minutes of typing the name, so I can show up with an evidence-backed call.
3. **Triage under deadline pressure** *(MVP target — see §4)* — When I have 3 due diligences due next Tuesday, I want to quickly tell which one is likely clean (fast-pass) vs. which one needs deep digging, so I allocate effort where the real risk is.
4. **Defensible judgment** — When I submit a "pass" conclusion, I want to leave a complete evidence chain (which lists were checked, when, on what basis), so when audited 6 months later I can reconstruct my reasoning in 5 minutes.
5. **First-pass red-flag scan** *(MVP target — see §4)* — When I get a new collaborator due-diligence task, I want a 30-minute first-pass scan for obvious red flags (restricted lists, related sanctioned entities, shell-structure patterns), so I can spend my limited time on collaborators that actually look risky — not 3 days on clean ones.

### Buyer JTBD (research security office director)

- **New-hire ramp** — When I onboard a new analyst, I want them independently producing compliant risk memos within 1–2 weeks, so they shift from "shadowing" to "carrying load" and team throughput rises.

### Gatekeeper JTBD (campus IT security)

- **Vendor security review** — When I review LinkWeaver for campus deployment, I want a complete tech-stack inventory, network egress/ingress documentation, and an audit report mapped to standard frameworks (NIST 800-171, HECVAT), so I can clear it through vendor risk in days not months.

---

## 4. MVP scope (locked)

The MVP exists to validate **End-user JTBD #5 (first-pass red-flag scan)** and nothing else. Other JTBDs are deferred until #5 is validated with real users.

**Riskiest assumption to validate (Stage 4):**
> Analysts will trust an automated triage's "green light" enough to skip deep investigation on the cleared cases.
> If they re-verify everything manually instead, the time-savings promise collapses.

### In scope (v1)

- OpenSanctions integration via local Yente (covers ~250 sanctions / restricted-party lists including OFAC SDN, BIS Entity List, EU consolidated, UK HMT, etc.)
- OpenCorporates integration (1-hop ownership only)
- Entity name input + fuzzy match + candidate disambiguation
- Single-hop relationship graph display
- Direct + 1-hop transitive restricted-list hit display, with evidence links
- Free-text notes (per node + per investigation)
- One-click export of a 1-page triage memo (PDF or Markdown)
- `docker compose up` self-hosted deployment

### Out of scope (deferred to v2+)

- SEC EDGAR / Companies House integrations
- BYOD PDF upload (this is JTBD #1, not #5)
- AI extraction / narrative / reconciliation
- Multi-hop (>1) graph traversal
- Multi-user / permissions / team collaboration
- Full login / user management system
- Investigation history / cross-session persistence

### Cut/keep heuristic — the 5-step value loop

```
[input name] → [check lists] → [view graph] → [make judgment] → [carry result out]
```

Anything that closes the loop stays in. Anything that doesn't gets cut, even if it looks "professional." The most common apprentice mistake is the inverse: cutting workflow-completing actions (notes, export) while keeping completeness-signaling features (multiple sources, deep traversal, history). Don't.

### Success criteria

**Not** "code runs" or "user says it looks nice."

**Yes:** in Stage 4 user testing with 3 real research-security analysts, **at least 1 returns to LinkWeaver for her next real DD case without being prompted**. Repeat-use is the only valid MVP signal.

### Build budget

2–4 weeks of solo work. If still not shippable at 6 weeks, scope has crept — re-cut against this section.

---

## 5. Build plan

Each week ends with something demonstrable end-to-end (vertical slice), not a complete layer (horizontal slice).

### Week 1 — Validate the matching assumption *(PASSED — 2026-04-28)*

**Goal:** Confirm OpenSanctions, queried via local Yente, surfaces restricted-list hits on realistic university/research-collaborator names with **recall ≥ 70%**.

**Result: Recall 86% / False-positive rate 0%.** Gate cleared.

**Deliverables (complete):**
- [x] `docker-compose.yml` extended with `elasticsearch`, `yente`, `yente-indexer`; switched manifest to civic.yml (free, no token)
- [x] `backend/test/yente_match_test.py` — 30-case harness with refined restricted-dataset classifier
- [x] Indexed default OpenSanctions civic dataset (~16M entities, ~10 min on local ES)
- [x] Recall measured at 86%; false-positive rate 0%

**Findings:**
- 100% recall on full names (English & Chinese) and standard abbreviations (3+ chars)
- 0% recall on extreme abbreviations: 2–3 char Chinese (哈工大, 北航), abbreviated English with punctuation (Harbin Inst. of Tech.)
- Most surfacing comes from `us_trade_csl`, `jp_meti_eul`, `ca_named_research_orgs` — exactly the lists relevant to university research-security work; OpenSanctions civic covers them well
- `kp_rusi_reports` matches on clean entities (Cambridge, Tsinghua, Fudan) reveal a UX requirement: **distinguish actionable restricted-list hits (red) from informational research-literature mentions (grey)** in the MVP UI

**Carry-forward to v2 (not MVP):**
- Hand-curated alias table for extreme abbreviations
- Input preprocessor (strip punctuation, expand "Inst." → "Institute", etc.)

### Week 2 — Wire frontend to real backend

- Replace mock data in `frontend/services/node-service.tsx` with live calls
- Add `/match` endpoint in FastAPI that proxies to Yente
- `SearchPanel` → enter name → see candidate list + direct hits
- Cytoscape can stay empty this week — focus is on data flow

### Week 3 — 1-hop relationship graph

- OpenCorporates client in backend (free tier — 500 reqs/month is fine for MVP)
- Persist Person/Entity nodes in Dgraph (existing schema covers this)
- Cytoscape renders 1-hop graph; node click expands details

### Week 4 — Close the loop and package

- Free-text notes on nodes (Dgraph extension fields, no separate store)
- Server-side PDF export (WeasyPrint) of 1-page triage memo
- `docker-compose.yml` polish — `docker compose up` should work on a colleague's machine with zero hand-holding

---

## 6. Tech decisions log

| Decision | Choice | Why |
|---|---|---|
| Sanctions data source | OpenSanctions via local Yente | Free, ~250 lists, self-hosted matches positioning |
| Corporate ownership data | OpenCorporates free tier | Sufficient for MVP scale; revisit at Stage 5 |
| PDF export | Server-side (WeasyPrint) | Stable rendering, format under our control |
| Notes storage | Dgraph extension fields | One less moving part vs. separate SQLite |
| Auth | None / reverse-proxy in v1 | Single-tenant self-hosted; full user system is post-MVP |

---

## 7. Operating principles

- **Validate the riskiest assumption first.** Code is cheap; building the wrong thing for 4 weeks is not.
- **MVP = minimum viable experiment.** It exists to answer a question, not to be a small product.
- **Vertical slices, not horizontal layers.** Every week ends with end-to-end demo-able output.
- **JTBD #5 is the only ladder.** If a feature doesn't ladder up to it, it doesn't ship in v1.
- **Repeat-use is the only PMF signal.** "I love it" without coming back means nothing.

---

## 8. Open questions / parked items

- **Packaging hypothesis (Stage 5):** core product per analyst seat + optional one-time "HECVAT documentation pack" service to help campus IT pass internal review. May be the actual sales unlock. Defer concrete pricing until first user pilot.
- **Stage 0 (problem validation):** explicitly skipped at user's discretion. Must be revisited if Stage 4 user testing reveals that the chosen persona doesn't actually exist or doesn't behave as assumed.
- **Talent-program rosters / OSINT lists** beyond OpenSanctions — useful long-term, but not in MVP scope.
- **OpenSanctions data access (clarified Week 1):** Yente ships with two manifests — `commercial.yml` (default, requires paid `OPENSANCTIONS_DELIVERY_TOKEN`) and `civic.yml` (free public CDN at `data.opensanctions.org`, no token). For MVP we use civic. The "ships with free public data" positioning is intact, but config detail matters: any deployment guide must explicitly set `YENTE_MANIFEST=/app/manifests/civic.yml`. Stage 5 implication: if future commercial deployments need fresher data or commercial-only datasets, the paid plan becomes a cost line — but for MVP and likely first paid customers, civic is sufficient. Worth periodically verifying the civic URL still resolves freely.
