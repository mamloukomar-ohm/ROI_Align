# ROI-Align — MoSCoW Prioritization

Condensed from `ROI-Align_MoSCoW_Prioritization_EN` (team doc, last updated by @Leopold). Defines what
ROI-Align must do in the first iteration, what comes next, and what's deliberately left out.

| Level | Meaning |
|---|---|
| Must | Without this, the described process does not work. |
| Should | Important; comes directly after the Must, in the order listed. |
| Could | Nice to have, only if time allows. |
| Won't | Deliberately not in this version — not "never." |

## Must (M1–M18) — built in this repo

Recommended build order: data model/roles/company knowledge (M6, M16) → input & understanding (M1–M5) →
assessment/scale/goal contribution (M7–M9) → review/portfolio/selection (M10–M12) →
re-assessment/versioning/notifications (M13–M15).

| ID | Requirement | Status |
|---|---|---|
| M1 | Input via free text, document upload, Excel list | Done |
| M2 | AI reads input and structures key data | Done |
| M3 | Completeness check (sufficient / assumable / follow-up needed) | Done (duplicate/similarity detection not yet built) |
| M4 | Follow-up question to submitter + re-delivery of info | Done |
| M5 | AI assumptions with rationale, labeled | Done |
| M6 | Store/maintain company knowledge (strategy, ESG, tech stack, AI readiness, governance) | Done |
| M7 | AI assessment of 5 dimensions with score + rationale | Done |
| M8 | Scale 1–5 with anchor descriptions, adjustable weights | Done (anchors are a first draft, not team-reviewed) |
| M9 | Goal contribution (which strategic goals a use case advances) | Done |
| M10 | Review result: scorecard, assumptions, goal contribution; human can edit scores | Done |
| M11 | Portfolio view: ranking, filter by goal, output formats | Partial — ranking + goal filter done; one-pager/dashboard export formats not yet built |
| M12 | Selection and decision with rationale | Done |
| M13 | Adaptive re-assessment on company knowledge change | Done |
| M14 | Versioning: old/new scores, company knowledge changes, reason for rank changes | Done |
| M15 | Notifications (follow-ups, completed assessments, rank changes) | Done (in-app list only) |
| M16 | Roles and permissions (employee, Portfolio Owner, Decision-Maker; everyone may submit) | Done as a role-switcher, not real authentication |
| M17 | Guardrails (human decides, fictional data only, no binding compliance approval) | Done |
| M18 | History page: use case progress/status | Partial — status + version history shown on the use-case detail page; no dedicated history page yet |

## Should (next, in order) — not yet built

1. Pitch step: Portfolio Owner refines goal contribution, AI re-assesses
2. Voice input (speech to text)
3. Confidence per score (high/medium/low)
4. External sources (e.g. EU AI Act) propose a company-knowledge change for human approval
5. What-if: change weights/assumptions live, see ranking effect
6. Score history of a use case over time
7. Value-vs-Effort matrix
8. Management export as PDF or CSV
9. Duplicate/similarity notice on submission
10. Status lifecycle (Idea, Assessed, Decided, Pilot, Operation, Ended)

## Could — not yet built

Real monitoring of external sources (vs. simulated feed), capturing actual post-implementation values to
calibrate AI assumptions, Portfolio Owner feedback on assumption quality, dependencies/bundling between use
cases, budget/capacity windows, German + English language support.

## Won't (this version)

Real customer/personal data; autonomous final decision by the AI; binding compliance/legal approval;
unreviewed adoption of external changes into company knowledge; third-party integrations (SSO/ERP/ticketing);
training/fine-tuning proprietary models; detailed project planning/implementation; mobile app.

## Open points (still to decide as a team)

- Anchor values of the 1–5 scale and weights of the five dimensions (current anchors in
  `src/lib/dimensions.ts` are a first draft)
- Which AI model is used and where data is processed (currently Claude via the Anthropic API)
- Who decides when the submitter isn't the Portfolio Owner
- How demo company knowledge is populated (currently a fictional finance/banking company, "Nordhaven
  Financial Group")
- How the demo triggers re-assessment (currently a "save new version" action on the Company Knowledge page)
