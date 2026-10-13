"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { DIMENSIONS, DIMENSION_INFO } from "@/lib/dimensions";
import { useRole } from "@/lib/roleContext";

interface ExtractedField {
  id: number;
  fieldName: string;
  fieldValue: string;
  isAssumption: boolean;
  rationale: string | null;
}

interface FollowUpQuestion {
  id: number;
  question: string;
  answer: string | null;
}

interface DimensionScore {
  id: number;
  dimension: string;
  score: number;
  weight: number;
  rationale: string;
  isAssumption: boolean;
  editedByHuman: boolean;
}

interface GoalContribution {
  goalName: string;
  contributionNote: string;
}

interface Assessment {
  id: number;
  versionNumber: number;
  triggeredBy: string;
  changeSummary: string | null;
  createdAt: string;
  dimensionScores: DimensionScore[];
  goalContributions: GoalContribution[];
}

interface Decision {
  outcome: string;
  decidedBy: string;
  rationale: string;
  decidedAt: string;
}

interface UseCaseDetail {
  id: number;
  title: string;
  rawInput: string;
  status: string;
  submitterName: string;
  extractedFields: ExtractedField[];
  followUpQuestions: FollowUpQuestion[];
  assessments: Assessment[];
  decision: Decision | null;
}

export default function UseCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const { role, name } = useRole();
  const [uc, setUc] = useState<UseCaseDetail | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [editedScores, setEditedScores] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [decisionForm, setDecisionForm] = useState({ outcome: "START", rationale: "" });

  const load = useCallback(async () => {
    const res = await fetch(`/api/use-cases/${params.id}`);
    if (res.ok) setUc(await res.json());
  }, [params.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  if (!uc) return <p className="text-slate-500">Loading…</p>;

  const latest = uc.assessments[uc.assessments.length - 1];
  const openQuestions = uc.followUpQuestions.filter((q) => !q.answer);

  async function submitAnswers() {
    setBusy(true);
    const payload = Object.entries(answers)
      .filter(([, v]) => v.trim())
      .map(([questionId, answer]) => ({ questionId: Number(questionId), answer }));
    await fetch(`/api/use-cases/${params.id}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: payload }),
    });
    setAnswers({});
    await load();
    setBusy(false);
  }

  async function saveScoreEdits() {
    if (Object.keys(editedScores).length === 0) return;
    setBusy(true);
    await fetch(`/api/use-cases/${params.id}/scores`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        edits: Object.entries(editedScores).map(([dimension, score]) => ({ dimension, score })),
      }),
    });
    setEditedScores({});
    await load();
    setBusy(false);
  }

  async function submitDecision() {
    setBusy(true);
    await fetch(`/api/use-cases/${params.id}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...decisionForm, decidedBy: name }),
    });
    await load();
    setBusy(false);
  }

  async function retry() {
    setBusy(true);
    await fetch(`/api/use-cases/${params.id}/retry`, { method: "POST" });
    await load();
    setBusy(false);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">{uc.title}</h1>
        <p className="text-sm text-slate-500">
          Submitted by {uc.submitterName} · Status: <span className="font-medium">{uc.status}</span>
        </p>
      </div>

      {uc.status === "SUBMITTED" && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
          The AI assessment did not complete.{" "}
          <button onClick={retry} disabled={busy} className="text-teal-700 font-medium hover:underline">
            Retry assessment
          </button>
        </div>
      )}

      {openQuestions.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <h2 className="font-semibold text-amber-900 mb-2">The AI needs more information</h2>
          <div className="space-y-3">
            {openQuestions.map((q) => (
              <div key={q.id}>
                <label className="block text-sm font-medium text-amber-900 mb-1">{q.question}</label>
                <input
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  className="w-full border border-amber-300 rounded-md px-3 py-2 text-sm bg-white"
                />
              </div>
            ))}
          </div>
          <button
            onClick={submitAnswers}
            disabled={busy}
            className="mt-3 px-4 py-2 bg-amber-700 text-white text-sm font-medium rounded-md disabled:opacity-50"
          >
            Submit answers &amp; re-assess
          </button>
        </section>
      )}

      {uc.extractedFields.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="font-semibold mb-3">Extracted facts</h2>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            {uc.extractedFields.map((f) => (
              <div key={f.id} className="border border-slate-100 rounded-md p-3">
                <dt className="font-medium text-slate-700">{f.fieldName}</dt>
                <dd className={f.isAssumption ? "text-amber-700" : "text-slate-600"}>
                  {f.fieldValue}
                  {f.isAssumption && (
                    <div className="text-xs mt-1 italic">Assumption: {f.rationale}</div>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {latest && (
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Assessment (v{latest.versionNumber})</h2>
            {role === "REVIEWER" && (
              <button
                onClick={saveScoreEdits}
                disabled={busy || Object.keys(editedScores).length === 0}
                className="text-sm px-3 py-1.5 bg-teal-700 text-white rounded-md disabled:opacity-50"
              >
                Save score edits
              </button>
            )}
          </div>
          <div className="space-y-3">
            {DIMENSIONS.map((d) => {
              const s = latest.dimensionScores.find((ds) => ds.dimension === d);
              if (!s) return null;
              const info = DIMENSION_INFO[d];
              return (
                <div key={d} className="border border-slate-100 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{info.label}</span>
                    {role === "REVIEWER" ? (
                      <select
                        value={editedScores[d] ?? s.score}
                        onChange={(e) => setEditedScores((es) => ({ ...es, [d]: Number(e.target.value) }))}
                        className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-semibold">{s.score} / 5</span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${s.isAssumption ? "text-amber-700" : "text-slate-600"}`}>
                    {s.rationale}
                    {s.isAssumption && " (assumption)"}
                    {s.editedByHuman && " — edited by reviewer"}
                  </p>
                </div>
              );
            })}
          </div>

          {latest.goalContributions.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-sm mb-2">Strategic goal contribution</h3>
              <ul className="text-sm space-y-1">
                {latest.goalContributions.map((g, i) => (
                  <li key={i}>
                    <span className="font-medium">{g.goalName}:</span> {g.contributionNote}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {uc.assessments.length > 1 && (
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="font-semibold mb-3">Version history</h2>
          <ul className="text-sm space-y-2">
            {uc.assessments
              .slice()
              .reverse()
              .map((a) => (
                <li key={a.id} className="border-b border-slate-100 pb-2 last:border-0">
                  <span className="font-medium">v{a.versionNumber}</span> · {a.triggeredBy} ·{" "}
                  {new Date(a.createdAt).toLocaleString()}
                  {a.changeSummary && <div className="text-slate-500 text-xs mt-0.5">{a.changeSummary}</div>}
                </li>
              ))}
          </ul>
        </section>
      )}

      {role === "DECISION_MAKER" && latest && (
        <section className="bg-white border border-slate-200 rounded-lg p-5">
          <h2 className="font-semibold mb-3">Decision</h2>
          {uc.decision ? (
            <p className="text-sm">
              <strong>{uc.decision.outcome}</strong> by {uc.decision.decidedBy} —{" "}
              {new Date(uc.decision.decidedAt).toLocaleString()}
              <br />
              <span className="text-slate-600">{uc.decision.rationale}</span>
            </p>
          ) : (
            <div className="space-y-3">
              <select
                value={decisionForm.outcome}
                onChange={(e) => setDecisionForm((d) => ({ ...d, outcome: e.target.value }))}
                className="border border-slate-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="START">Start</option>
                <option value="STOP">Stop</option>
                <option value="CONTINUE">Continue</option>
              </select>
              <textarea
                value={decisionForm.rationale}
                onChange={(e) => setDecisionForm((d) => ({ ...d, rationale: e.target.value }))}
                placeholder="Rationale for this decision"
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                rows={3}
              />
              <button
                onClick={submitDecision}
                disabled={busy || !decisionForm.rationale}
                className="px-4 py-2 bg-teal-700 text-white text-sm font-medium rounded-md disabled:opacity-50"
              >
                Record decision
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
