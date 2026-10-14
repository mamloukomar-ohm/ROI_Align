# ROI-Align

AI use-case prioritization tool, built for the Tomorrow University Tech Fellowship. Scores submitted AI use
cases across five dimensions (Business Value, Strategic Fit, AI Readiness, Implementation Effort, Governance &
Risk) using Claude, and ranks them for a Portfolio Owner / Decision-Maker. Demo mock-up with fictional data only.

See `docs/PRD.md` and `docs/MoSCoW.md` for the full requirements, and `docs/data-model.md` for the data model.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma ORM + SQLite (`prisma/schema.prisma`) — the app's current working database
- `supabase/01-create-tables.sql` — a parallel Postgres/Supabase schema with Row Level Security, written to the
  same data model, for migrating the app's backend to Supabase (see "Supabase migration" below)
- Claude (`@anthropic-ai/sdk`, model `claude-opus-5-5`) for use-case extraction and five-dimension scoring
- Lightweight role-switcher (Submitter / Reviewer / Decision-Maker) instead of real authentication

## Commands

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies the schema
npm run seed              # seeds fictional company knowledge
npm run dev                # http://localhost:3000
npm run build              # production build
npm run lint
npx tsc --noEmit            # type-check
```

Requires `ANTHROPIC_API_KEY` in `.env` for the AI extraction/scoring calls.

## Supabase migration (not yet done)

The app currently reads/writes `prisma/dev.db` (SQLite) via Prisma. `supabase/01-create-tables.sql` defines the
same tables in Postgres with RLS, ready to run in a real Supabase project, but the Next.js app is **not yet
wired up to Supabase** — that's the next major piece of work. See `docs/build-log.md` for status.

## Conventions

- Dimension keys are `BUSINESS_VALUE`, `STRATEGIC_FIT`, `AI_READINESS`, `IMPLEMENTATION_EFFORT`,
  `GOVERNANCE_RISK` (see `src/lib/dimensions.ts`) — keep these consistent across the Prisma schema, the
  Supabase schema, and the AI prompts in `src/lib/ai.ts`.
- Every database change goes in a new numbered file under `supabase/` (`02-...`, `03-...`), never editing
  `01-create-tables.sql` in place once it's been run against a real project.
- Only fictional data anywhere in the repo, seed scripts, or sample data — no real names, emails, or personal
  details (project guardrail, see `docs/PRD.md`).
