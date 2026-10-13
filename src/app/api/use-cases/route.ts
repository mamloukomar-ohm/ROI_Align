import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseUploadedFile } from "@/lib/parseUpload";
import { runAssessmentPipeline } from "@/lib/assess";

export async function GET() {
  const useCases = await prisma.useCase.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      assessments: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: { dimensionScores: true, goalContributions: true },
      },
      decision: true,
    },
  });
  return NextResponse.json(useCases);
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  let rawInput: string;
  let inputType: "text" | "document" | "excel";
  let title: string;
  let submitterRole: string;
  let submitterName: string;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    submitterRole = String(form.get("submitterRole") ?? "SUBMITTER");
    submitterName = String(form.get("submitterName") ?? "Anonymous");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const parsed = await parseUploadedFile(file);
    rawInput = parsed.text;
    inputType = parsed.inputType;
    title = file.name;
  } else {
    const body = await req.json();
    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }
    rawInput = body.text;
    inputType = "text";
    title = body.title || body.text.slice(0, 60);
    submitterRole = body.submitterRole ?? "SUBMITTER";
    submitterName = body.submitterName ?? "Anonymous";
  }

  const useCase = await prisma.useCase.create({
    data: {
      title,
      rawInput,
      inputType,
      submitterRole: submitterRole as "SUBMITTER" | "REVIEWER" | "DECISION_MAKER",
      submitterName,
      status: "SUBMITTED",
    },
  });

  try {
    await runAssessmentPipeline(useCase.id);
  } catch (err) {
    console.error("Assessment pipeline failed", err);
    return NextResponse.json(
      { id: useCase.id, warning: "Use case was created, but the AI assessment failed. You can retry it." },
      { status: 201 },
    );
  }

  return NextResponse.json({ id: useCase.id }, { status: 201 });
}
