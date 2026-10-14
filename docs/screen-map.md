# ROI-Align — Screen Map

Every page currently in the app (`src/app/`), what it's for, and which role it's mainly for.

| Route | File | Purpose | Mainly for |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Portfolio: ranked table of all use cases, overall score, per-dimension scores, status, decision, filterable by strategic goal | Reviewer, Decision-Maker |
| `/submit` | `src/app/submit/page.tsx` | Submit a use case as free text or a document/Excel upload | Submitter (anyone) |
| `/use-cases/[id]` | `src/app/use-cases/[id]/page.tsx` | Use-case detail: extracted facts, open follow-up questions (answer here), current assessment with scores/rationale (editable by Reviewer), goal contribution, version history, decision form (Decision-Maker) | All roles, content adapts to role |
| `/company-knowledge` | `src/app/company-knowledge/page.tsx` | View and edit the company's strategy/ESG goals, tech stack, AI readiness, governance; saving creates a new version and triggers re-scoring of every assessed use case | Reviewer, Decision-Maker |

## Shared UI

- **Top nav** (`src/components/NavBar.tsx`): links to the four pages above, a notifications bell (per-role,
  polls every 15s), a role-switcher dropdown (Submitter / Reviewer / Decision-Maker), and a guardrail banner
  ("the AI supports; it does not decide").

## API routes behind these screens (`src/app/api/`)

| Route | Used by |
|---|---|
| `POST /api/use-cases` | Submit page — creates the use case and runs the AI assessment pipeline |
| `GET /api/use-cases` | Portfolio page |
| `GET /api/use-cases/[id]` | Use-case detail page |
| `POST /api/use-cases/[id]/answer` | Answering a follow-up question, re-triggers assessment |
| `PATCH /api/use-cases/[id]/scores` | Reviewer editing dimension scores |
| `POST /api/use-cases/[id]/decision` | Decision-Maker recording Start/Stop/Continue |
| `POST /api/use-cases/[id]/retry` | Retrying a failed AI assessment |
| `GET`/`POST /api/company-knowledge` | Company Knowledge page — read versions / save a new version + trigger re-scoring |
| `GET`/`PATCH /api/notifications` | Nav bar notification bell |

## Not yet built (per `docs/MoSCoW.md`)

- A dedicated history/status-lifecycle page (M18) — currently folded into the use-case detail page.
- Export formats beyond the on-screen table (one-pager, dashboard, PDF/CSV) — M11/Should-8.
- Any Should/Could screen (pitch step, what-if weighting, value-vs-effort matrix, etc.).
