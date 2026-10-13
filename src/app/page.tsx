"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DIMENSIONS, DIMENSION_INFO } from "@/lib/dimensions";

interface DimensionScore {
  dimension: string;
  score: number;
  weight: number;
  isAssumption: boolean;
}

interface GoalContribution {
  goalName: string;
  contributionNote: string;
}

interface Assessment {
  id: number;
  versionNumber: number;
  dimensionScores: DimensionScore[];
  goalContributions: GoalContribution[];
}

interface UseCase {
  id: number;
  title: string;
  status: string;
  submitterName: string;
  createdAt: string;
  assessments: Assessment[];
  decision: { outcome: string } | null;
}

function overallScore(a?: Assessment): number | null {
  if (!a || a.dimensionScores.length === 0) return null;
  const totalWeight = a.dimensionScores.reduce((sum, s) => sum + s.weight, 0) || 1;
  const weighted = a.dimensionScores.reduce((sum, s) => sum + s.score * s.weight, 0);
  return Math.round((weighted / totalWeight) * 10) / 10;
}

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted",
  CLARIFYING: "Needs clarification",
  ASSESSED: "Assessed",
  REVIEWED: "Reviewed",
  DECIDED: "Decided",
};

export default function PortfolioPage() {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [goalFilter, setGoalFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/use-cases")
      .then((r) => r.json())
      .then((data) => {
        setUseCases(data);
        setLoading(false);
      });
  }, []);

  const allGoals = useMemo(() => {
    const goals = new Set<string>();
    useCases.forEach((uc) => uc.assessments[0]?.goalContributions.forEach((g) => goals.add(g.goalName)));
    return Array.from(goals).sort();
  }, [useCases]);

  const filtered = useMemo(() => {
    const list =
      goalFilter === "ALL"
        ? useCases
        : useCases.filter((uc) => uc.assessments[0]?.goalContributions.some((g) => g.goalName === goalFilter));
    return [...list].sort((a, b) => (overallScore(b.assessments[0]) ?? -1) - (overallScore(a.assessments[0]) ?? -1));
  }, [useCases, goalFilter]);

  if (loading) return <p className="text-slate-500">Loading portfolio…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Use Case Portfolio</h1>
          <p className="text-slate-600 text-sm mt-1">
            Ranked by overall score across the five dimensions. Filter by the strategic goal that matters most right now.
          </p>
        </div>
        <select
          value={goalFilter}
          onChange={(e) => setGoalFilter(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
        >
          <option value="ALL">All strategic goals</option>
          {allGoals.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
          No use cases yet.{" "}
          <Link href="/submit" className="text-teal-700 hover:underline">
            Submit the first one
          </Link>
          .
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Use case</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Overall score</th>
                {DIMENSIONS.map((d) => (
                  <th key={d} className="px-3 py-3 font-medium text-center" title={DIMENSION_INFO[d].description}>
                    {DIMENSION_INFO[d].label}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((uc, i) => {
                const a = uc.assessments[0];
                return (
                  <tr key={uc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/use-cases/${uc.id}`} className="font-medium text-teal-700 hover:underline">
                        {uc.title}
                      </Link>
                      <div className="text-xs text-slate-400">by {uc.submitterName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">
                        {STATUS_LABEL[uc.status] ?? uc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{overallScore(a) ?? "—"}</td>
                    {DIMENSIONS.map((d) => {
                      const s = a?.dimensionScores.find((ds) => ds.dimension === d);
                      return (
                        <td key={d} className="px-3 py-3 text-center">
                          {s ? (
                            <span className={s.isAssumption ? "text-amber-700" : ""}>
                              {s.score}
                              {s.isAssumption ? "*" : ""}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      {uc.decision ? (
                        <span className="text-xs font-medium">{uc.decision.outcome}</span>
                      ) : (
                        <span className="text-xs text-slate-400">Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
            * indicates the AI used an assumption for that score.
          </p>
        </div>
      )}
    </div>
  );
}
