import { NextResponse } from "next/server";
import { runAssessmentPipeline } from "@/lib/assess";

// Retries the AI assessment pipeline, e.g. after a transient AI/API failure.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const useCaseId = Number((await params).id);
  const result = await runAssessmentPipeline(useCaseId);
  return NextResponse.json(result);
}
