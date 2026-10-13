import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const useCase = await prisma.useCase.findUnique({
    where: { id },
    include: {
      extractedFields: true,
      followUpQuestions: { orderBy: { askedAt: "asc" } },
      assessments: {
        orderBy: { versionNumber: "asc" },
        include: { dimensionScores: true, goalContributions: true, companyKnowledgeVersion: true },
      },
      decision: true,
    },
  });
  if (!useCase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(useCase);
}
