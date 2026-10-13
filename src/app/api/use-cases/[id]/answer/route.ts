import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAssessmentPipeline } from "@/lib/assess";

// Submitter answers one or more open follow-up questions (M4), which
// re-triggers the AI understand/clarify/score pipeline.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const useCaseId = Number((await params).id);
  const body = await req.json();
  const answers: { questionId: number; answer: string }[] = body.answers ?? [];

  for (const a of answers) {
    await prisma.followUpQuestion.update({
      where: { id: a.questionId },
      data: { answer: a.answer, answeredAt: new Date() },
    });
  }

  const result = await runAssessmentPipeline(useCaseId);
  return NextResponse.json(result);
}
