import { prisma } from "./prisma";
import { extractUseCase, scoreUseCase } from "./ai";
import { DEFAULT_WEIGHTS } from "./dimensions";
import { getCurrentCompanyKnowledge, toContext } from "./companyKnowledge";

async function notify(targetRole: "SUBMITTER" | "REVIEWER" | "DECISION_MAKER", message: string, useCaseId?: number) {
  await prisma.notification.create({
    data: { targetRole, message, relatedUseCaseId: useCaseId },
  });
}

async function nextAssessmentVersion(useCaseId: number): Promise<number> {
  const last = await prisma.assessment.findFirst({
    where: { useCaseId },
    orderBy: { versionNumber: "desc" },
  });
  return (last?.versionNumber ?? 0) + 1;
}

async function createAssessment(params: {
  useCaseId: number;
  companyKnowledgeVersionId: number;
  triggeredBy: string;
  changeSummary?: string;
  scoring: Awaited<ReturnType<typeof scoreUseCase>>;
}) {
  const versionNumber = await nextAssessmentVersion(params.useCaseId);
  return prisma.assessment.create({
    data: {
      useCaseId: params.useCaseId,
      companyKnowledgeVersionId: params.companyKnowledgeVersionId,
      versionNumber,
      triggeredBy: params.triggeredBy,
      changeSummary: params.changeSummary,
      dimensionScores: {
        create: params.scoring.dimensionScores.map((s) => ({
          dimension: s.dimension,
          score: s.score,
          rationale: s.rationale,
          isAssumption: s.isAssumption,
          weight: DEFAULT_WEIGHTS[s.dimension],
        })),
      },
      goalContributions: {
        create: params.scoring.goalContributions.map((g) => ({
          goalName: g.goalName,
          contributionNote: g.contributionNote,
        })),
      },
    },
    include: { dimensionScores: true, goalContributions: true },
  });
}

// Runs the AI "understand + clarify + score" pipeline for a use case (M2-M5,
// M7-M9): extracts structured fields, checks completeness, and either scores
// immediately or raises follow-up questions.
export async function runAssessmentPipeline(useCaseId: number) {
  const useCase = await prisma.useCase.findUniqueOrThrow({
    where: { id: useCaseId },
    include: { followUpQuestions: true },
  });

  const companyKnowledge = await getCurrentCompanyKnowledge();
  const context = toContext(companyKnowledge);

  const answeredQuestions = useCase.followUpQuestions
    .filter((q) => q.answer)
    .map((q) => ({ question: q.question, answer: q.answer! }));

  const extraction = await extractUseCase(useCase.rawInput, context, answeredQuestions);

  await prisma.extractedField.deleteMany({ where: { useCaseId } });
  await prisma.extractedField.createMany({
    data: extraction.fields.map((f) => ({
      useCaseId,
      fieldName: f.fieldName,
      fieldValue: f.fieldValue,
      isAssumption: f.isAssumption,
      rationale: f.rationale,
    })),
  });

  if (extraction.title) {
    await prisma.useCase.update({ where: { id: useCaseId }, data: { title: extraction.title } });
  }

  if (extraction.completeness === "needs_followup" && extraction.followUpQuestions.length > 0) {
    await prisma.followUpQuestion.createMany({
      data: extraction.followUpQuestions.map((q) => ({ useCaseId, question: q })),
    });
    await prisma.useCase.update({ where: { id: useCaseId }, data: { status: "CLARIFYING" } });
    await notify("SUBMITTER", `We need more information on "${extraction.title}" before it can be scored.`, useCaseId);
    return { status: "CLARIFYING" as const };
  }

  const scoring = await scoreUseCase(extraction.title, extraction.fields, context);
  await createAssessment({
    useCaseId,
    companyKnowledgeVersionId: companyKnowledge.id,
    triggeredBy: "submission",
    scoring,
  });
  await prisma.useCase.update({ where: { id: useCaseId }, data: { status: "ASSESSED" } });
  await notify("REVIEWER", `"${extraction.title}" has been assessed and is ready for review.`, useCaseId);
  return { status: "ASSESSED" as const };
}

// Re-scores a single use case against the current (possibly just-changed)
// company knowledge, without re-asking the submitter (M13).
export async function rescoreUseCase(useCaseId: number, companyKnowledgeVersionId: number, changeSummary: string) {
  const useCase = await prisma.useCase.findUniqueOrThrow({
    where: { id: useCaseId },
    include: { extractedFields: true },
  });
  if (useCase.extractedFields.length === 0) {
    return null; // not yet assessed once - nothing to re-score
  }

  const companyKnowledge = await prisma.companyKnowledgeVersion.findUniqueOrThrow({
    where: { id: companyKnowledgeVersionId },
  });
  const context = toContext(companyKnowledge);

  const previousAssessment = await prisma.assessment.findFirst({
    where: { useCaseId },
    orderBy: { versionNumber: "desc" },
    include: { dimensionScores: true },
  });

  const scoring = await scoreUseCase(
    useCase.title,
    useCase.extractedFields.map((f) => ({
      fieldName: f.fieldName,
      fieldValue: f.fieldValue,
      isAssumption: f.isAssumption,
      rationale: f.rationale,
    })),
    context,
  );

  const assessment = await createAssessment({
    useCaseId,
    companyKnowledgeVersionId,
    triggeredBy: "rescore",
    changeSummary,
    scoring,
  });

  const rankChanged = previousAssessment
    ? previousAssessment.dimensionScores.some((prevScore) => {
        const newScore = assessment.dimensionScores.find((s) => s.dimension === prevScore.dimension);
        return newScore && newScore.score !== prevScore.score;
      })
    : true;

  if (rankChanged) {
    await notify(
      "DECISION_MAKER",
      `"${useCase.title}" was re-scored after a company knowledge change: ${changeSummary}`,
      useCaseId,
    );
  }

  return assessment;
}
