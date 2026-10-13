"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRole } from "@/lib/roleContext";

export default function SubmitPage() {
  const router = useRouter();
  const { role, name } = useRole();
  const [mode, setMode] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      let res: Response;
      if (mode === "file" && file) {
        const form = new FormData();
        form.append("file", file);
        form.append("submitterRole", role);
        form.append("submitterName", name);
        res = await fetch("/api/use-cases", { method: "POST", body: form });
      } else {
        res = await fetch("/api/use-cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, title, submitterRole: role, submitterName: name }),
        });
      }
      if (!res.ok) throw new Error("Submission failed");
      const data = await res.json();
      router.push(`/use-cases/${data.id}`);
    } catch {
      setError("Something went wrong submitting the use case. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">Submit a Use Case</h1>
      <p className="text-slate-600 text-sm mb-6">
        Describe an AI use case, idea or business problem. The AI will read it, extract key facts, and either
        score it right away or ask a follow-up question if something important is missing.
      </p>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${
            mode === "text" ? "bg-teal-700 text-white" : "bg-white border border-slate-300 text-slate-600"
          }`}
        >
          Free text
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${
            mode === "file" ? "bg-teal-700 text-white" : "bg-white border border-slate-300 text-slate-600"
          }`}
        >
          Document / Excel upload
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        {mode === "text" ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Title (optional)</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                placeholder="e.g. Automate invoice data entry"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
                rows={8}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                placeholder="Describe the process, the current pain point, data involved, and current manual effort..."
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">File (.docx, .pdf, .xlsx, .csv, .txt)</label>
            <input
              type="file"
              accept=".docx,.pdf,.xlsx,.xls,.csv,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
              className="w-full text-sm"
            />
          </div>
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || (mode === "file" && !file) || (mode === "text" && !text)}
          className="px-4 py-2 bg-teal-700 text-white text-sm font-medium rounded-md disabled:opacity-50"
        >
          {submitting ? "Submitting & assessing…" : "Submit use case"}
        </button>
        <p className="text-xs text-slate-400">
          Submitting as <strong>{name}</strong> ({role.replace("_", " ").toLowerCase()}). Change your role in the top bar.
        </p>
      </form>
    </div>
  );
}
