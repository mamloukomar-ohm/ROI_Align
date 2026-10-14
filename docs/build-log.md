# ROI-Align — Build Log

Chronological record of what's been built, for the team and for grading/review. One entry per meaningful
commit.

## 2026-10-13 — Scaffold

Set up the Next.js (App Router) + TypeScript + Tailwind project in the repo.

## 2026-10-13 — Must-scope app (M1–M18)

Built the full working demo against a local SQLite database (via Prisma):

- Data model for use cases, extracted fields, follow-up questions, versioned assessments, dimension scores,
  goal contributions, versioned company knowledge, decisions, and notifications.
- AI pipeline using Claude (Anthropic API): reads a submitted use case, extracts structured facts with labeled
  assumptions, asks follow-up questions when it can't reliably assume, scores the five dimensions with
  rationale, and identifies strategic goal contribution.
- File input: free text, `.docx`/`.pdf` documents, Excel/CSV use-case lists.
- Screens: portfolio ranking (filterable by goal), submission form, use-case detail (follow-ups, score
  review/edit, decision, version history), company-knowledge editor that triggers adaptive re-scoring,
  notifications, role-switcher.
- Seed script with a fictional demo company ("Nordhaven Financial Group," finance/banking).

Verified: `tsc --noEmit`, `npm run lint`, `npm run build` all pass; dev server smoke-tested on all pages and
read routes. **Not yet verified**: the live Claude API calls (extraction/scoring) — no `ANTHROPIC_API_KEY` was
available to test with in the build environment.

## 2026-10-13 — Supabase/Postgres schema with Row Level Security

Added `docs/data-model.md` and `supabase/01-create-tables.sql`: the same data model as the Prisma schema,
written as a standalone Postgres script for Supabase, with RLS enabled on every table and one policy per access
pattern the app needs (e.g. only a Decision-Maker can record a decision; only a Reviewer can edit a score; a
Submitter can only answer their own use case's follow-up questions).

Verified against a real local Postgres 16 instance: the script applies cleanly end-to-end, and a scripted test
confirmed the RLS policies actually enforce the role boundaries (submitter blocked from deciding, reviewer can
edit scores, decision-maker can decide).

**Not yet done**: no Supabase project has been created yet, this SQL has not been run against a real Supabase
project, and the Next.js app is still reading/writing the local SQLite database — it is not connected to
Supabase. That connection is the next major piece of work.

## 2026-10-14 — Project documentation

Added `CLAUDE.md`, `docs/PRD.md`, `docs/MoSCoW.md`, `docs/screen-map.md`, and this build log, per the course's
GitHub/Supabase setup guide.

## Open items

- Create the real Supabase project and run `supabase/01-create-tables.sql` against it.
- Decide and implement how the app connects to Supabase (Project URL + publishable key, respecting RLS) instead
  of the local SQLite database.
- Current workflow has been pushing directly to `main` rather than branch → PR → review, per explicit
  instruction earlier in the build. Worth revisiting now that the repo has more than one contributor — see
  "branch protection" in the course guide, Part 4.
- See `docs/MoSCoW.md` "Open points" for the unresolved team decisions (scoring scale anchors, weights, AI
  model/data-processing location, etc.).
