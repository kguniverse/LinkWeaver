# LinkWeaver

A self-hostable graph investigation platform for university research-security analysts.

LinkWeaver turns the typical 2-day manual collaboration-risk memo (PDF disclosure → Excel transcription → ad-hoc list checks) into a 30-minute drag-and-export workflow. It runs on the school's own servers against the school's own data, ships with free public datasets (OpenSanctions, OpenCorporates), and is priced per seat — not per record.

For the product positioning, JTBDs, MVP scope, and build plan, see [`BLUEPRINT.md`](./BLUEPRINT.md).
For code-level architecture and conventions, see [`CLAUDE.md`](./CLAUDE.md).

**Status:** Stage 3 Week 1 in progress (frontend ↔ backend wiring). Stage 2 (Yente recall validation) cleared at 86% recall / 0% false-positive rate.

---

## Architecture

Three runtime pieces, all required for the app to work end-to-end:

| Piece | Stack | Ports |
|---|---|---|
| **Dgraph cluster** | `dgraph/dgraph` (zero + alpha) + `ratel` UI | alpha HTTP `:8080`, gRPC `:9080`, ratel `:8000` |
| **Backend** | FastAPI (Python), `httpx` against Dgraph HTTP | `:5001` |
| **Frontend** | Next.js 15 (App Router, React 19, Turbopack) | `:3000` |

Plus the sanctions-matching sidecar added in Stage 2:

| Piece | Stack | Ports |
|---|---|---|
| **Yente** | OpenSanctions matching API (civic manifest, free) | `:8001` |
| **Elasticsearch** | Yente's index backend | `:9200` |

The frontend's three-pane dashboard (`SearchPanel` / `GraphViewer` / `DisplayPanel`) is built on `react-resizable-panels` + shadcn/ui, with Cytoscape.js for graph rendering and a singleton `graphStore` keeping the in-memory node/edge maps in sync with the Cytoscape instance.

---

## Quick start

Prerequisites: Docker, Python 3.10+, Node 23.11.0 (pinned via `frontend/.tool-versions`).

```bash
# 1. Dgraph + Yente + Elasticsearch (from repo root)
docker compose up -d

# First-time only: Yente will reindex ~16M OpenSanctions entities (~10 min on local ES).
# Watch progress: docker logs -f linkweaver-yente-indexer

# 2. Backend (from backend/)
pip install -r requirement.txt
python main.py
# → uvicorn on http://localhost:5001 (port 5000 collides with macOS AirPlay)

# 3. Frontend (from frontend/)
npm install
npm run dev
# → http://localhost:3000/dashboard
```

The placeholder home page is at `/`; the real UI lives at `/dashboard`.

---

## Project layout

```
LinkWeaver/
├── docker-compose.yml      # Dgraph + Yente + Elasticsearch
├── BLUEPRINT.md            # product/positioning/MVP scope
├── CLAUDE.md               # code-level guide for AI assistants
├── backend/
│   ├── main.py             # FastAPI entrypoint
│   ├── api/                # /add-data, /add-relationship, /query-by-field
│   ├── models/             # Pydantic models — Base/Read/Create/Update split
│   ├── services/           # dgraph_client, node service
│   └── test/               # sample schema + Yente recall harness (not unit tests)
└── frontend/
    ├── app/                # Next.js App Router (`/dashboard` is the real UI)
    ├── components/         # shadcn/ui + dashboard panels
    ├── lib/graph-store.tsx # singleton holding nodeMap/edgeMap + Cytoscape ref
    ├── hooks/              # Zustand UI store, TanStack Query hooks
    └── services/           # node-service.tsx (currently mock data)
```

---

## Domain model

Three entity types, defined in both `backend/models/` (Pydantic) and the Dgraph schema (`backend/test/test_schemas.schema`):

- **Person** — `name`, `owns` (→ Entity), `address`, `bankAccounts`, `attachmentFiles`
- **Entity** — `name`, `ownedBy` (→ Person), `bankAccounts`, `address`, `attachmentFiles`
- **BankAccount** — `account_numbers`, `held_by` (→ Person | Entity), `attachmentFiles`

To register a new type, add it to `backend/models/__init__.py:model_registry` so `/add-data` will accept it.

> **Naming inconsistencies to fix when wiring real data:** the backend uses `Entity` while the frontend uses `Organization`; the backend `BankAccount` model uses `account_numbers` (string) while the schema file uses `accountNumber`. Reconcile before relying on round-tripping.

---

## Backend API

All endpoints currently call Dgraph at hardcoded `localhost:8080` (no config layer yet):

- `POST /add-data` — `{ type, data }`; validates against the registered Pydantic model and inserts via `services.dgraph_client.insert_node`.
- `POST /add-relationship` — `{ subject_uid, predicate, object_uid }`.
- `GET /query-by-field?field=...` — DQL `has(field)` grouped by `dgraph.type`.
- `POST /upload-schema` — **deprecated**.

A `/match` endpoint that proxies to Yente is on the Stage 3 Week 2 list and is not yet implemented.

---

## Data layer status

The frontend is **not yet wired to the backend**. `frontend/services/node-service.tsx` returns a hardcoded mock dataset (the Elon Musk graph). The three call sites to replace when wiring real fetching:

- `fetchAllNodes`
- `FirstSubgraph`
- `fetchNodeInfo`

`frontend/lib/api.tsx` is unused leftover scaffolding (and imports `node:test`'s `mock`, which would break in the browser if it ever ran there) — delete or repurpose when wiring real calls.

---

## Tests

There is no test suite yet. `backend/test/` contains:

- `test_schemas.schema` — sample Dgraph schema
- `yente_match_test.py` — the Stage 2 30-case recall harness (not a pytest suite)

Frontend has Playwright installed but no test files; the `screenshot-*.js` scripts at the frontend root are ad-hoc Playwright harnesses for UX/regression checks, not CI tests.
