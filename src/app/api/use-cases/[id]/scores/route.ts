import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Human review: the Reviewer/Portfolio Owner can change scores and
// assumptions on the latest assessment (M10).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const useCaseId = Number((await params).id);
  const body = await req.json();
  const edits: { dimension: string; score?: number; rationale?: string; isAssumption?: boolean }[] = body.edits ?? [];

  const latest = await prisma.assessment.findFirst({
    where: { useCaseId },
    orderBy: { versionNumber: "desc" },
  });
  if (!latest) {
    return NextResponse.json({ error: "No assessment to edit" }, { status: 404 });
  }

  for (const edit of edits) {
    await prisma.dimensionScore.updateMany({
      where: { assessmentId: latest.id, dimension: edit.dimension as never },
      data: {
        ...(edit.score !== undefined ? { score: edit.score } : {}),
        ...(edit.rationale !== undefined ? { rationale: edit.rationale } : {}),
        ...(edit.isAssumption !== undefined ? { isAssumption: edit.isAssumption } : {}),
        editedByHuman: true,
      },
    });
  }

  await prisma.useCase.update({ where: { id: useCaseId }, data: { status: "REVIEWED" } });

  return NextResponse.json({ ok: true });
}
