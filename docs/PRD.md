# ROI-Align — Product Requirements (from the team's PRD v2.1)

Condensed from `ROI-Align_PRD_Team_Review_Draft_v2_1_EN` (team: Leopold, Omar, Claudia, Pascal).

## The problem

Organizations identify many potential AI use cases but lack a structured, consistent way to evaluate and
prioritize them. Without a standardized approach, evaluations are subjective, hard to compare, and inconsistent
across stakeholders — risking investment in low-value initiatives while overlooking better ones.

The five assessment dimensions map directly to this problem:

| Problem | Dimension |
|---|---|
| Expected business benefits (cost, revenue, efficiency, decisions) are unclear | Business Value |
| Resources/complexity to implement are uncertain | Implementation Effort |
| Org may lack data, tech, process, skills or mindset to implement | AI Readiness |
| Regulatory, privacy, security, ethical, operational risks may be unmanaged | Governance & Risk |
| Use case may not support strategic objectives | Strategic Fit |

## Success measures

- Decision-makers can make informed start/stop/continue decisions.
- Decision-makers can prioritize use cases effectively and efficiently.
- Decision-makers understand expected ROI / business value for planning.
- Assessment quality and accuracy improve; manual assessment effort is reduced.
- Assessment rationales and decisions are complete and traceable.

## Users and roles

- **Submitter** (any employee): submits a use case, idea, or business problem with context. Must NOT submit
  customer/personal data, make the final decision, or issue binding compliance approval.
- **Reviewer** (Portfolio Owner / AI Project Manager): reviews the use case, assesses value/feasibility/risk,
  determines AI vs. automation vs. standard software, records the assessment and rationale, recommends
  prioritization. Must NOT make the final decision, issue compliance approval, change results without
  traceability, or use customer/personal data.
- **Decision-Maker**: reviews completed assessments, compares and prioritizes, makes the final start/stop/
  continue decision, defines AI technology direction. Must NOT rely on an automated final decision, treat the
  assessment as binding compliance approval, or decide without access to the rationale.

A person may hold more than one role (open discussion point in the PRD).

## Out of scope

Technical implementation of assessed use cases; real customer/personal data; binding compliance/legal approval;
automated final decisions without human approval; detailed project planning (budget/resources/schedules);
production operation of assessed use cases. ROI-Align itself is a demonstration mock-up.

## Guardrails

- Humans make the final decision. The AI supports; it does not decide.
- The AI's assumptions are visible and can be changed by humans.
- The assessment is not a binding compliance or legal approval.
- Only fictional data is used — no real customer or personal data.
- Scores and decisions are logged traceably.
- Changes to company knowledge are versioned so re-scorings can be explained.

## Non-functional requirements

- Desktop/laptop browsers only for the MVP.
- Easy to use; clear workflows and current status; readable text/contrast, keyboard-operable, clear errors.
- Clear loading/success/error status after every action.
- Fictional data only, including during testing.
- Role-based access for Submitter, Reviewer, Decision-Maker; no binding compliance approval issued by the app.

Full detail (KPIs per dimension, user stories M1–M8 with acceptance criteria) is in the original PRD document
held outside this repo; ask the team if you need the full text.
