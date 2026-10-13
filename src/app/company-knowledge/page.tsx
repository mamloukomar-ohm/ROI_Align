"use client";

import { useEffect, useState } from "react";

interface Goal {
  name: string;
  description: string;
}

interface CompanyKnowledgeVersion {
  id: number;
  companyName: string;
  strategyGoals: string;
  techStack: string;
  aiReadiness: string;
  governance: string;
  changeReason: string | null;
  createdAt: string;
}

export default function CompanyKnowledgePage() {
  const [versions, setVersions] = useState<CompanyKnowledgeVersion[]>([]);
  const [form, setForm] = useState<{
    companyName: string;
    goals: Goal[];
    techStack: string;
    aiReadiness: string;
    governance: string;
    changeReason: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/company-knowledge");
    const data: CompanyKnowledgeVersion[] = await res.json();
    setVersions(data);
    if (data.length > 0 && !form) {
      const current = data[0];
      setForm({
        companyName: current.companyName,
        goals: JSON.parse(current.strategyGoals),
        techStack: JSON.parse(current.techStack).join(", "),
        aiReadiness: current.aiReadiness,
        governance: current.governance,
        changeReason: "",
      });
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!form) return <p className="text-slate-500">Loading…</p>;

  async function saveChange() {
    if (!form) return;
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/company-knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: form.companyName,
        strategyGoals: form.goals,
        techStack: form.techStack.split(",").map((s) => s.trim()).filter(Boolean),
        aiReadiness: form.aiReadiness,
        governance: form.governance,
        changeReason: form.changeReason,
      }),
    });
    const data = await res.json();
    setResult(`Saved as a new version. Re-scored ${data.rescored} use case(s)${data.failed ? `, ${data.failed} failed` : ""}.`);
    setForm((f) => (f ? { ...f, changeReason: "" } : f));
    await load();
    setBusy(false);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Company Knowledge</h1>
        <p className="text-slate-600 text-sm mt-1">
          This is the context the AI uses to score use cases: strategy and ESG goals, tech stack, AI readiness and
          governance requirements. Saving a change creates a new version and automatically re-scores every assessed
          use case against it.
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Company name</label>
          <input
            value={form.companyName}
            onChange={(e) => setForm((f) => (f ? { ...f, companyName: e.target.value } : f))}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Strategic goals (incl. ESG)</label>
          <div className="space-y-2">
            {form.goals.map((g, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                <input
                  value={g.name}
                  onChange={(e) =>
                    setForm((f) => {
                      if (!f) return f;
                      const goals = [...f.goals];
                      goals[i] = { ...goals[i], name: e.target.value };
                      return { ...f, goals };
                    })
                  }
                  placeholder="Goal name"
                  className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                />
                <input
                  value={g.description}
                  onChange={(e) =>
                    setForm((f) => {
                      if (!f) return f;
                      const goals = [...f.goals];
                      goals[i] = { ...goals[i], description: e.target.value };
                      return { ...f, goals };
                    })
                  }
                  placeholder="Description"
                  className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                />
                <button
                  onClick={() => setForm((f) => (f ? { ...f, goals: f.goals.filter((_, gi) => gi !== i) } : f))}
                  className="text-rose-600 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setForm((f) => (f ? { ...f, goals: [...f.goals, { name: "", description: "" }] } : f))
              }
              className="text-teal-700 text-sm hover:underline"
            >
              + Add goal
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tech stack (comma-separated)</label>
          <textarea
            value={form.techStack}
            onChange={(e) => setForm((f) => (f ? { ...f, techStack: e.target.value } : f))}
            rows={2}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">AI readiness</label>
          <textarea
            value={form.aiReadiness}
            onChange={(e) => setForm((f) => (f ? { ...f, aiReadiness: e.target.value } : f))}
            rows={3}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Governance &amp; risk requirements</label>
          <textarea
            value={form.governance}
            onChange={(e) => setForm((f) => (f ? { ...f, governance: e.target.value } : f))}
            rows={3}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Reason for this change</label>
          <input
            value={form.changeReason}
            onChange={(e) => setForm((f) => (f ? { ...f, changeReason: e.target.value } : f))}
            placeholder="e.g. Adopted a new cloud data platform, raising AI readiness"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        {result && <p className="text-sm text-teal-700">{result}</p>}

        <button
          onClick={saveChange}
          disabled={busy || !form.changeReason}
          className="px-4 py-2 bg-teal-700 text-white text-sm font-medium rounded-md disabled:opacity-50"
        >
          {busy ? "Saving & re-scoring…" : "Save new version & re-score portfolio"}
        </button>
      </section>

      <section className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="font-semibold mb-3">Version history</h2>
        <ul className="text-sm space-y-2">
          {versions.map((v) => (
            <li key={v.id} className="border-b border-slate-100 pb-2 last:border-0">
              <span className="font-medium">v{v.id}</span> · {new Date(v.createdAt).toLocaleString()}
              {v.changeReason && <div className="text-slate-500 text-xs mt-0.5">{v.changeReason}</div>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
