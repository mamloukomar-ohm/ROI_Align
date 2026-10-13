import { prisma } from "./prisma";
import type { CompanyKnowledgeContext } from "./ai";

export async function getCurrentCompanyKnowledge() {
  const latest = await prisma.companyKnowledgeVersion.findFirst({
    orderBy: { id: "desc" },
  });
  if (!latest) {
    throw new Error("No company knowledge configured. Run the seed script first.");
  }
  return latest;
}

export function toContext(ck: {
  companyName: string;
  strategyGoals: string;
  techStack: string;
  aiReadiness: string;
  governance: string;
}): CompanyKnowledgeContext {
  return {
    companyName: ck.companyName,
    strategyGoals: JSON.parse(ck.strategyGoals),
    techStack: JSON.parse(ck.techStack),
    aiReadiness: ck.aiReadiness,
    governance: ck.governance,
  };
}
