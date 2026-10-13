# ROI-Align

ROI-Align helps companies prioritize AI use cases by scoring them consistently and transparently across five
dimensions — Business Value, Strategic Fit, AI Readiness, Implementation Effort, and Governance & Risk — and
showing which use case is most worthwhile and which strategic goals it advances.

This is a demonstration mock-up built on the project's PRD and MoSCoW scope, using fictional company data only.
See `/root/.claude/plans/modular-foraging-fairy.md` in the session that built this for the original implementation
plan.

## How it works

1. **Submit** a use case as free text or a document/Excel upload.
2. The **AI reads** the input and extracts the relevant structured facts, filling reasonable gaps with a
   labeled, justified assumption where it can, or asking a **follow-up question** when it can't.
3. The AI **scores** the use case 1–5 on each of the five dimensions with a rationale, and shows which
   strategic goals it contributes to most.
4. A **Reviewer / Portfolio Owner** reviews the scores, can edit them, and the portfolio view ranks all use
   cases, filterable by strategic goal.
5. A **Decision-Maker** records a Start / Stop / Continue decision with rationale.
6. If **company knowledge** changes (tech stack, AI readiness, governance requirements), every assessed use
   case is automatically **re-scored**, with the before/after kept and explained.

Humans make the final decision — the AI supports, it never decides, and this is not a binding compliance or
legal approval. Only fictional data is used.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- SQLite via Prisma ORM
- Claude (Anthropic API) for extraction and scoring
- A lightweight role-switcher (Submitter / Reviewer / Decision-Maker) instead of real authentication — this is a
  demo mock-up, not a production system

## Setup

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies the schema
npm run seed              # seeds fictional company knowledge (Nordhaven Financial Group)
```

Set your Anthropic API key before running the app:

```bash
echo 'ANTHROPIC_API_KEY=sk-ant-...' >> .env
```

Then:

```bash
npm run dev
```

Open http://localhost:3000. Use the role selector in the top bar to switch between Submitter, Reviewer, and
Decision-Maker to see each role's view.

## Scope

Implements the 18 Must requirements (M1–M18) from the project's MoSCoW doc. Should/Could items (pitch step,
voice input, confidence levels, what-if weighting, etc.) are intentionally out of scope for this version.
