import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rescoreUseCase } from "@/lib/assess";

export async function GET() {
  const versions = await prisma.companyKnowledgeVersion.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json(versions);
}

// Creates a new company knowledge version (a change to strategy, tech stack,
// AI readiness, or governance) and automatically re-scores every assessed
// use case against it (M13, M14).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyName, strategyGoals, techStack, aiReadiness, governance, changeReason } = body as {
    companyName: string;
    strategyGoals: { name: string; description: string }[];
    techStack: string[];
    aiReadiness: string;
    governance: string;
    changeReason: string;
  };

  const version = await prisma.companyKnowledgeVersion.create({
    data: {
      companyName,
      strategyGoals: JSON.stringify(strategyGoals),
      techStack: JSON.stringify(techStack),
      aiReadiness,
      governance,
      changeReason,
    },
  });

  const useCases = await prisma.useCase.findMany({
    where: { status: { in: ["ASSESSED", "REVIEWED", "DECIDED"] } },
    select: { id: true },
  });

  const results = await Promise.allSettled(
    useCases.map((uc) => rescoreUseCase(uc.id, version.id, changeReason || "Company knowledge updated")),
  );
  const failures = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json(
    { version, rescored: useCases.length - failures, failed: failures },
    { status: 201 },
  );
}
