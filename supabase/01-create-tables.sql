-- ROI-Align — Supabase schema, Row Level Security policies, and sample data.
-- Source: docs/data-model.md (derived from the project PRD v2.1 and MoSCoW M1-M18).
--
-- Run this in the Supabase SQL Editor on a fresh project.
--
-- Guardrail (PRD "Guardrails"): this schema must only ever hold FICTIONAL data.
-- No table here is designed to carry real customer or personal data, and the sample
-- data below is entirely made up for a fictional demo company.

-- ============================================================================
-- Extensions
-- ============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ============================================================================
-- Enums
-- ============================================================================

create type app_role as enum ('submitter', 'reviewer', 'decision_maker');

create type dimension as enum (
  'business_value',
  'strategic_fit',
  'ai_readiness',
  'implementation_effort',
  'governance_risk'
);

create type use_case_status as enum (
  'submitted',
  'clarifying',
  'assessed',
  'reviewed',
  'decided'
);

create type decision_outcome as enum ('start', 'stop', 'continue');

-- ============================================================================
-- Tables
-- ============================================================================

-- profiles: maps a Supabase Auth user to an app role and display name.
-- One row per auth.users row, created by the trigger below on sign-up.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role app_role not null default 'submitter',
  name text not null,
  created_at timestamptz not null default now()
);

-- company_knowledge_versions: versioned context the AI scores use cases against
-- (M6). Append-only — a "change" always inserts a new row, never updates one,
-- so every past assessment stays explainable against the version it used (M14).
create table company_knowledge_versions (
  id bigint generated always as identity primary key,
  company_name text not null,
  strategy_goals jsonb not null, -- [{ "name": "...", "description": "..." }, ...], incl. ESG
  tech_stack jsonb not null, -- ["...", "..."]
  ai_readiness text not null,
  governance text not null,
  change_reason text,
  created_at timestamptz not null default now()
);

-- use_cases: a submitted use case (M1).
create table use_cases (
  id bigint generated always as identity primary key,
  title text not null,
  raw_input text not null,
  input_type text not null check (input_type in ('text', 'document', 'excel')),
  submitter_id uuid not null references profiles (id),
  status use_case_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- extracted_fields: AI-extracted structured facts, each flagged as an
-- assumption or not, with a rationale when it is (M2, M5).
create table extracted_fields (
  id bigint generated always as identity primary key,
  use_case_id bigint not null references use_cases (id) on delete cascade,
  field_name text not null,
  field_value text not null,
  is_assumption boolean not null default false,
  rationale text
);

-- follow_up_questions: AI follow-up questions and the submitter's answers,
-- asked only when the AI cannot make a reliable assumption (M4).
create table follow_up_questions (
  id bigint generated always as identity primary key,
  use_case_id bigint not null references use_cases (id) on delete cascade,
  question text not null,
  answer text,
  asked_at timestamptz not null default now(),
  answered_at timestamptz
);

-- assessments: one versioned scoring run of a use case against a specific
-- company knowledge version (M7-M9, M13, M14). A use case can have many
-- assessments over time; the highest version_number is the current one.
create table assessments (
  id bigint generated always as identity primary key,
  use_case_id bigint not null references use_cases (id) on delete cascade,
  company_knowledge_version_id bigint not null references company_knowledge_versions (id),
  version_number int not null,
  triggered_by text not null check (triggered_by in ('submission', 'review-edit', 'rescore')),
  change_summary text, -- what changed vs. the previous version and why (M14)
  created_at timestamptz not null default now(),
  unique (use_case_id, version_number)
);

-- dimension_scores: one of the five dimension scores (1-5) within an
-- assessment, with the weight used and a rationale (M7, M8). A human reviewer
-- can edit score/rationale/assumption after the fact (M10) — edited_by_human
-- keeps that traceable.
create table dimension_scores (
  id bigint generated always as identity primary key,
  assessment_id bigint not null references assessments (id) on delete cascade,
  dimension dimension not null,
  score int not null check (score between 1 and 5),
  weight numeric(4, 3) not null default 0.200,
  rationale text not null,
  is_assumption boolean not null default false,
  edited_by_human boolean not null default false,
  unique (assessment_id, dimension)
);

-- goal_contributions: which strategic goals a use case contributes to most,
-- per assessment (M9).
create table goal_contributions (
  id bigint generated always as identity primary key,
  assessment_id bigint not null references assessments (id) on delete cascade,
  goal_name text not null,
  contribution_note text not null
);

-- decisions: the final Start/Stop/Continue decision for a use case, with a
-- traceable rationale and actor (M12). One decision per use case.
create table decisions (
  id bigint generated always as identity primary key,
  use_case_id bigint not null unique references use_cases (id) on delete cascade,
  outcome decision_outcome not null,
  decided_by uuid not null references profiles (id),
  rationale text not null,
  decided_at timestamptz not null default now()
);

-- notifications: in-app notifications per role — follow-ups, completed
-- assessments, rank changes after re-scoring (M15).
create table notifications (
  id bigint generated always as identity primary key,
  target_role app_role not null,
  message text not null,
  related_use_case_id bigint references use_cases (id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new Supabase Auth user signs up, so
-- every authenticated user has an app role from their first request.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.email), 'submitter');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table profiles enable row level security;
alter table company_knowledge_versions enable row level security;
alter table use_cases enable row level security;
alter table extracted_fields enable row level security;
alter table follow_up_questions enable row level security;
alter table assessments enable row level security;
alter table dimension_scores enable row level security;
alter table goal_contributions enable row level security;
alter table decisions enable row level security;
alter table notifications enable row level security;

-- Table-level privileges: Supabase's own tables pre-grant these automatically
-- for new `public` tables, but we grant them explicitly here so this script
-- is self-contained and doesn't depend on that platform default. RLS (above)
-- is what actually narrows access row by row — these grants just allow the
-- operation type at all; without a matching policy it still can't read/write
-- a single row.
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  profiles,
  company_knowledge_versions,
  use_cases,
  extracted_fields,
  follow_up_questions,
  assessments,
  dimension_scores,
  goal_contributions,
  decisions,
  notifications
to authenticated;

-- Helper: the calling user's app role, read once per statement. Used instead
-- of repeating the profiles subquery in every policy below.
create function public.app_current_role()
returns app_role
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- --- profiles ---------------------------------------------------------------

-- Everyone signed in can see who's who (submitter names shown on use cases,
-- "decided by" on decisions) — profiles hold no sensitive data, just a role
-- and a display name.
create policy "profiles: any authenticated user can read"
  on profiles for select
  to authenticated
  using (true);

-- A user can only edit their own display name/role switch (demo convenience —
-- in production role changes would be admin-only, but this app's role-switcher
-- is intentionally self-service for testing).
create policy "profiles: a user can update their own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- --- company_knowledge_versions ---------------------------------------------

-- The AI needs this as scoring context and the UI displays it, so every
-- signed-in role can read it.
create policy "company_knowledge: any authenticated user can read"
  on company_knowledge_versions for select
  to authenticated
  using (true);

-- Only the Reviewer/Portfolio Owner or a Decision-Maker may change company
-- knowledge (PRD: this drives automatic re-scoring of the whole portfolio —
-- a Submitter must not be able to trigger that).
create policy "company_knowledge: reviewer or decision-maker can insert"
  on company_knowledge_versions for insert
  to authenticated
  with check (public.app_current_role() in ('reviewer', 'decision_maker'));

-- --- use_cases ---------------------------------------------------------------

-- Portfolio visibility: every role needs to see every use case (the whole
-- point of the portfolio ranking view), not just their own submissions.
create policy "use_cases: any authenticated user can read"
  on use_cases for select
  to authenticated
  using (true);

-- Anyone may submit a use case (PRD M16: "everyone may submit"), but only as
-- themselves — submitter_id must match the caller.
create policy "use_cases: any authenticated user can submit as themselves"
  on use_cases for insert
  to authenticated
  with check (submitter_id = auth.uid());

-- A submitter may still edit their own use case while it's early in the
-- flow (e.g. answering a follow-up updates status); a Reviewer or
-- Decision-Maker may update any use case (status transitions after review
-- or decision). A Submitter must not be able to push a use case straight to
-- "decided" themselves — the app layer, not RLS, enforces which status
-- transitions are valid; RLS here only gates *who* may write the row.
create policy "use_cases: owner, reviewer or decision-maker can update"
  on use_cases for update
  to authenticated
  using (submitter_id = auth.uid() or public.app_current_role() in ('reviewer', 'decision_maker'))
  with check (submitter_id = auth.uid() or public.app_current_role() in ('reviewer', 'decision_maker'));

-- --- extracted_fields ---------------------------------------------------------

-- Read-only to the app's users. These rows are written by the AI pipeline
-- running in the Next.js server (using the service_role key, which bypasses
-- RLS entirely) — no authenticated-role write policy is needed or granted.
create policy "extracted_fields: any authenticated user can read"
  on extracted_fields for select
  to authenticated
  using (true);

-- --- follow_up_questions -------------------------------------------------------

create policy "follow_up_questions: any authenticated user can read"
  on follow_up_questions for select
  to authenticated
  using (true);

-- Only the submitter who owns the use case may answer its follow-up
-- questions (M4) — a Reviewer/Decision-Maker reads the Q&A but doesn't
-- answer on the submitter's behalf.
create policy "follow_up_questions: the owning submitter can answer"
  on follow_up_questions for update
  to authenticated
  using (
    exists (
      select 1 from use_cases uc
      where uc.id = follow_up_questions.use_case_id
        and uc.submitter_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from use_cases uc
      where uc.id = follow_up_questions.use_case_id
        and uc.submitter_id = auth.uid()
    )
  );

-- --- assessments ---------------------------------------------------------------

-- Read-only to the app's users; written by the AI pipeline via service_role
-- (same reasoning as extracted_fields) — scoring runs are not something any
-- client role should be able to insert directly.
create policy "assessments: any authenticated user can read"
  on assessments for select
  to authenticated
  using (true);

-- --- dimension_scores ------------------------------------------------------

create policy "dimension_scores: any authenticated user can read"
  on dimension_scores for select
  to authenticated
  using (true);

-- Only the Reviewer/Portfolio Owner may edit a score or its assumption flag
-- after the AI produced it (PRD M10: "the human can change scores and
-- assumptions" — that human is the Reviewer, not the Submitter or the
-- Decision-Maker, who must not "change assessment results without
-- traceability").
create policy "dimension_scores: reviewer can edit"
  on dimension_scores for update
  to authenticated
  using (public.app_current_role() = 'reviewer')
  with check (public.app_current_role() = 'reviewer');

-- --- goal_contributions ----------------------------------------------------

-- Read-only to the app's users; written by the AI pipeline via service_role.
create policy "goal_contributions: any authenticated user can read"
  on goal_contributions for select
  to authenticated
  using (true);

-- --- decisions ---------------------------------------------------------------

create policy "decisions: any authenticated user can read"
  on decisions for select
  to authenticated
  using (true);

-- Only a Decision-Maker may record the final Start/Stop/Continue decision
-- (PRD: Submitter and Reviewer "must not be able to make the final start,
-- stop or continue decision"), and only attributed to themselves.
create policy "decisions: decision-maker can record their own decision"
  on decisions for insert
  to authenticated
  with check (public.app_current_role() = 'decision_maker' and decided_by = auth.uid());

create policy "decisions: decision-maker can update their own decision"
  on decisions for update
  to authenticated
  using (public.app_current_role() = 'decision_maker' and decided_by = auth.uid())
  with check (public.app_current_role() = 'decision_maker' and decided_by = auth.uid());

-- --- notifications -----------------------------------------------------------

-- A user only sees notifications addressed to their own role (there's no
-- per-user inbox in this model — notifications are role-wide, e.g. every
-- Reviewer sees "use case X is ready for review").
create policy "notifications: user can read notifications for their role"
  on notifications for select
  to authenticated
  using (target_role = public.app_current_role());

-- Marking a notification read is limited to the role it was addressed to.
create policy "notifications: user can mark their role's notifications read"
  on notifications for update
  to authenticated
  using (target_role = public.app_current_role())
  with check (target_role = public.app_current_role());

-- Notifications themselves are created by the server-side AI pipeline via
-- service_role — no authenticated insert policy is needed.

-- ============================================================================
-- Sample data (fictional only)
-- ============================================================================

-- Company knowledge has no FK to auth.users, so it can be seeded directly.
insert into company_knowledge_versions (
  company_name, strategy_goals, tech_stack, ai_readiness, governance, change_reason
) values (
  'Nordhaven Financial Group (fictional)',
  '[
    {"name": "Operational Efficiency", "description": "Reduce manual processing cost and turnaround time across retail and commercial banking operations."},
    {"name": "ESG Leadership", "description": "Cut the carbon footprint of internal operations and offer verifiable sustainable-finance products."},
    {"name": "Customer Experience", "description": "Improve response time and personalization across digital and branch channels."},
    {"name": "Regulatory Resilience", "description": "Stay ahead of evolving financial regulation (incl. EU AI Act) with auditable, explainable processes."}
  ]'::jsonb,
  '["Core banking platform (on-prem, legacy COBOL back end)", "Salesforce Financial Services Cloud (CRM)", "Azure cloud (data platform, analytics)", "Snowflake (data warehouse)", "Internal document management system (SharePoint-based)"]'::jsonb,
  'Moderate. A central data platform exists with reasonably clean structured data for core banking and CRM, but most customer documents are unstructured PDFs/scans. A small ML/AI team (6 people) supports a few pilot projects.',
  'Operates under EU banking regulation and GDPR. An AI governance committee reviews any AI use case touching customer data or credit decisions. EU AI Act classification must be assessed for any new AI use case before pilot approval.',
  'Initial seed of fictional company knowledge for the ROI-Align demo.'
);

-- use_cases, assessments etc. all require a real submitter_id / decided_by
-- referencing an authenticated Supabase user (profiles.id = auth.users.id),
-- which cannot be created by plain SQL — Supabase Auth owns that table.
--
-- To seed a full functional example after you have at least one signed-up
-- user:
--   1. Sign up a test user in the app (or via the Supabase dashboard ->
--      Authentication -> Add user). The handle_new_user trigger above
--      creates their profiles row automatically with role = 'submitter'.
--   2. Promote them to whichever role you want to test, e.g.:
--        update profiles set role = 'reviewer' where id = '<their-uuid>';
--   3. Then insert a sample use case as that user, e.g.:
--        insert into use_cases (title, raw_input, input_type, submitter_id, status)
--        values (
--          'Automate invoice data entry',
--          'Our AP team manually keys ~400 vendor invoices/week from PDF scans into the core banking system, taking ~3 FTE days/week.',
--          'text',
--          '<their-uuid>',
--          'submitted'
--        );
--   4. extracted_fields, assessments, dimension_scores and goal_contributions
--      are normally populated by the app's AI pipeline (src/lib/assess.ts)
--      running server-side — that pipeline already produces this data today
--      against the SQLite/Prisma schema and can be pointed at this schema
--      instead by swapping its database client.
