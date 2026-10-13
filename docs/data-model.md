# ROI-Align Data Model

This documents the data model for ROI-Align, derived from the project's PRD (v2.1) and MoSCoW requirements
(M1–M18). It mirrors `prisma/schema.prisma` (the SQLite/Prisma model already built) but is written here as the
source of truth for the Supabase/Postgres version in `supabase/01-create-tables.sql`.

## Roles

Three roles, matching the PRD (Section 2):

- **submitter** — submits use cases. Cannot make the final prioritization decision, cannot issue binding
  compliance approval, cannot submit real customer/personal data.
- **reviewer** — the Reviewer / Portfolio Owner. Assesses use cases, can edit AI-generated scores and
  assumptions with traceability. Cannot make the final start/stop/continue decision.
- **decision_maker** — reviews completed assessments, compares use cases, records the final start/stop/continue
  decision. Cannot silently change assessment content.

A person may hold more than one role (PRD, discussion point) — modeled here as one role per profile for
simplicity, matching the app's current role-switcher; a profile can be changed to a different role at any time.

## Tables

| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | Maps a Supabase Auth user to an app role and display name | `id` (= `auth.users.id`), `role`, `name` |
| `company_knowledge_versions` | Versioned context the AI uses to score use cases: strategy/ESG goals, tech stack, AI readiness, governance (M6). A new version triggers re-scoring (M13) | `id`, `company_name`, `strategy_goals` (jsonb), `tech_stack` (jsonb), `ai_readiness`, `governance`, `change_reason` |
| `use_cases` | A submitted use case (M1) | `id`, `title`, `raw_input`, `input_type`, `submitter_id`, `status` |
| `extracted_fields` | AI-extracted structured facts per use case, each flagged as an assumption or not (M2, M5) | `id`, `use_case_id`, `field_name`, `field_value`, `is_assumption`, `rationale` |
| `follow_up_questions` | AI follow-up questions and the submitter's answers (M4) | `id`, `use_case_id`, `question`, `answer` |
| `assessments` | A versioned scoring run for a use case, tied to the company knowledge version used (M7–M9, M13, M14) | `id`, `use_case_id`, `company_knowledge_version_id`, `version_number`, `triggered_by`, `change_summary` |
| `dimension_scores` | One of the five dimension scores (1–5) within an assessment, with weight and rationale (M7, M8, M10) | `id`, `assessment_id`, `dimension`, `score`, `weight`, `rationale`, `is_assumption`, `edited_by_human` |
| `goal_contributions` | Which strategic goals a use case contributes to, per assessment (M9) | `id`, `assessment_id`, `goal_name`, `contribution_note` |
| `decisions` | The final Start/Stop/Continue decision for a use case (M12) | `id`, `use_case_id` (unique), `outcome`, `decided_by`, `rationale` |
| `notifications` | In-app notifications per role: follow-ups, completed assessments, rank changes (M15) | `id`, `target_role`, `message`, `related_use_case_id`, `read` |

## Relationships

```
auth.users 1─1 profiles
profiles 1─N use_cases (submitter_id)
use_cases 1─N extracted_fields
use_cases 1─N follow_up_questions
use_cases 1─N assessments
use_cases 1─1 decisions
company_knowledge_versions 1─N assessments
assessments 1─N dimension_scores
assessments 1─N goal_contributions
```

## Guardrails reflected in the schema (PRD Section "Guardrails")

- No table stores real customer or personal data — this is a process/discipline guardrail (fictional data only),
  not something a CHECK constraint can enforce; it's called out in `supabase/01-create-tables.sql` comments.
- `decisions` and `dimension_scores` always carry a human-attributable actor (`decided_by`, `edited_by_human`) so
  scores and decisions stay traceable.
- `company_knowledge_versions` is append-only (versioned, never updated in place) so re-scorings stay explainable.
