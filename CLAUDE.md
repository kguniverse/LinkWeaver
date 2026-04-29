# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

LinkWeaver is a graph-visualization app built on top of Dgraph. The repo is split into three runtime pieces that must all be up for the app to work:

- **Dgraph cluster** (`docker-compose.yml`) — `zero` + `alpha` + `ratel` UI. Alpha exposes HTTP at `localhost:8080` and gRPC at `9080`. Ratel UI at `localhost:8000`.
- **Backend** (`backend/`) — FastAPI app on `localhost:5001`. Talks to Dgraph's HTTP `/mutate` and `/query` endpoints (see `backend/services/dgraph_client.py` and `backend/main.py`). Hardcoded URLs — there is no config layer.
- **Frontend** (`frontend/`) — Next.js 15 (App Router, React 19, Turbopack) on `localhost:3000`.

## Common commands

```bash
# Dgraph (from repo root)
docker compose up -d

# Backend (from backend/)
pip install -r requirement.txt
python main.py                   # runs uvicorn on :5001 with reload (5000 collides with macOS AirPlay)

# Frontend (from frontend/)
npm install
npm run dev                      # next dev --turbopack
npm run build
npm run lint
```

Node version pinned via `frontend/.tool-versions` to `23.11.0`. There is no test suite yet — `backend/test/` contains sample schema and data, not test code.

## Architecture

### Domain model

Three entity types live in both backend (Pydantic) and Dgraph schema:

- `Person` — `name`, `owns` (→ Entity), `address`, `bankAccounts` (→ BankAccount), `attachmentFiles`
- `Entity` — `name`, `ownedBy` (→ Person), `bankAccounts`, `address`, `attachmentFiles`
- `BankAccount` — `account_numbers`, `held_by` (→ Person | Entity), `attachmentFiles`

Models in `backend/models/` follow a `Base / Read / Create / Update` split. New types must be registered in `backend/models/__init__.py:model_registry` for `/add-data` to accept them. Reference Dgraph schema: `backend/test/test_schemas.schema`.

**Naming inconsistency to watch:** backend uses the type name `Entity`, but the frontend's mock data and `AddNodePopover` use `Organization`. Backend `BankAccount` model has `account_numbers` (string), while the schema file uses `accountNumber`. When wiring real data, reconcile these — don't assume they already match.

### Backend

`backend/main.py` mounts `backend/api/data.py` and exposes:
- `POST /add-data` — body `{ type, data }`; validates `data` against the registered Pydantic model and inserts via `services.dgraph_client.insert_node` (generates a uuid-based uid).
- `POST /add-relationship` — body `{ subject_uid, predicate, object_uid }`.
- `GET /query-by-field?field=...` — DQL `has(field)` grouped by `dgraph.type`.
- `POST /upload-schema` is marked deprecated.

All Dgraph calls go through `httpx.AsyncClient` against the hardcoded `localhost:8080` URLs.

### Frontend

App Router layout: `app/layout.tsx` wraps everything in `app/provider.tsx` (a TanStack Query `QueryClientProvider`). The real UI lives at `/dashboard` (`app/dashboard/page.tsx`); `/` is a placeholder.

Three-pane dashboard built with `react-resizable-panels` and shadcn/ui (`components/ui/`, style `new-york`, alias `@/*` → repo-relative):

1. **SearchPanel** (left) — `cmdk` command palette over `useAllNodes()`. Selecting a node calls `graphStore.clear()` then `graphStore.initGraph(id)`.
2. **GraphViewer** (center) — Cytoscape.js, dynamically imported with `ssr: false`. Owns the `cytoscape.Core` instance and registers it with `graphStore` via `setCyInstance`. Node/edge styles are keyed by the `type` data attribute (`Person`, `Organization`, `BankAccount` for nodes; `Controls`, `Owns` for edges) — see `nodeStyleMap` / `edgeStyleMap` in `GraphViewer.tsx`.
3. **DisplayPanel + AddNodePopover** (right) — details for the currently selected node and a form for adding nodes (the form's submit handler is a TODO).

State is split between two stores:

- **`lib/graph-store.tsx`** — a plain-class singleton (`graphStore`) that holds `nodeMap`, `edgeMap`, `adjacencyMap`, and a reference to the Cytoscape instance. **All graph mutations should go through this store**, not directly through `cy.add(...)`, so the in-memory maps and the Cytoscape view stay in sync. `initGraph` / `expandNode` both call `FirstSubgraph` from `services/node-service.tsx`.
- **`hooks/use-dashboardUI.tsx`** — Zustand store for cross-panel UI state (`searchSelectedNodeId`, `displayNodeId`).

### Data layer status (important)

The frontend is **not yet wired to the backend**. `frontend/lib/api.tsx` and `frontend/services/node-service.tsx` both return the same hardcoded mock dataset (Elon Musk graph). When implementing real fetching, replace `fetchAllNodes`, `FirstSubgraph`, and `fetchNodeInfo` in `services/node-service.tsx` — those are the three functions the UI currently goes through. `lib/api.tsx` is unused leftover scaffolding (also imports `node:test`'s `mock`, which is a bug if it ever runs in the browser).
