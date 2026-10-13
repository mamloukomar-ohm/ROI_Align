import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.companyKnowledgeVersion.findFirst();
  if (existing) {
    console.log("Company knowledge already seeded, skipping.");
    return;
  }

  await prisma.companyKnowledgeVersion.create({
    data: {
      companyName: "Nordhaven Financial Group (fictional)",
      strategyGoals: JSON.stringify([
        {
          name: "Operational Efficiency",
          description: "Reduce manual processing cost and turnaround time across retail and commercial banking operations.",
        },
        {
          name: "ESG Leadership",
          description: "Cut the carbon footprint of internal operations and offer verifiable sustainable-finance products.",
        },
        {
          name: "Customer Experience",
          description: "Improve response time and personalization across digital and branch channels.",
        },
        {
          name: "Regulatory Resilience",
          description: "Stay ahead of evolving financial regulation (incl. EU AI Act) with auditable, explainable processes.",
        },
      ]),
      techStack: JSON.stringify([
        "Core banking platform (on-prem, legacy COBOL back end)",
        "Salesforce Financial Services Cloud (CRM)",
        "Azure cloud (data platform, analytics)",
        "Snowflake (data warehouse)",
        "Internal document management system (SharePoint-based)",
      ]),
      aiReadiness:
        "Moderate. A central data platform exists with reasonably clean structured data for core banking and CRM, " +
        "but most customer documents are unstructured PDFs/scans. A small ML/AI team (6 people) supports a few " +
        "pilot projects. Most business units have limited AI literacy; a company-wide AI training program launched " +
        "this year covering responsible use and prompting basics.",
      governance:
        "Operates under EU banking regulation and GDPR. An AI governance committee reviews any AI use case touching " +
        "customer data or credit decisions. No customer-facing generative AI is live yet. EU AI Act classification " +
        "must be assessed for any new AI use case before pilot approval. No real customer or personal data may be " +
        "used outside production systems.",
      changeReason: "Initial seed of fictional company knowledge for the ROI-Align demo.",
    },
  });

  console.log("Seeded company knowledge for Nordhaven Financial Group.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
