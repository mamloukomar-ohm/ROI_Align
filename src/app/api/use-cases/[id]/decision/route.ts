import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Start / Stop / Continue decision, recorded by the Portfolio Owner or the
// submitter, with rationale (M12).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const useCaseId = Number((await params).id);
  const body = await req.json();
  const { outcome, decidedBy, rationale } = body as {
    outcome: "START" | "STOP" | "CONTINUE";
    decidedBy: string;
    rationale: string;
  };

  if (!outcome || !decidedBy || !rationale) {
    return NextResponse.json({ error: "outcome, decidedBy and rationale are required" }, { status: 400 });
  }

  const decision = await prisma.decision.upsert({
    where: { useCaseId },
    update: { outcome, decidedBy, rationale, decidedAt: new Date() },
    create: { useCaseId, outcome, decidedBy, rationale },
  });

  await prisma.useCase.update({ where: { id: useCaseId }, data: { status: "DECIDED" } });

  return NextResponse.json(decision);
}
