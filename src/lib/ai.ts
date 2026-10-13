import { anthropic, AI_MODEL } from "./anthropic";
import { DIMENSIONS, DIMENSION_INFO, type DimensionKey } from "./dimensions";
import type Anthropic from "@anthropic-ai/sdk";

export interface CompanyKnowledgeContext {
  companyName: string;
  strategyGoals: { name: string; description: string }[];
  techStack: string[];
  aiReadiness: string;
  governance: string;
}

export interface ExtractedFieldResult {
  fieldName: string;
  fieldValue: string;
  isAssumption: boolean;
  rationale: string | null;
}

export interface ExtractionResult {
  title: string;
  fields: ExtractedFieldResult[];
  completeness: "sufficient" | "needs_followup";
  followUpQuestions: string[];
}

function buildCompanyContextBlock(ck: CompanyKnowledgeContext): string {
  return [
    `Company: ${ck.companyName}`,
    `Strategic goals: ${ck.strategyGoals.map((g) => `${g.name} - ${g.description}`).join("; ")}`,
    `Tech stack: ${ck.techStack.join(", ")}`,
    `AI readiness: ${ck.aiReadiness}`,
    `Governance & risk requirements: ${ck.governance}`,
  ].join("\n");
}

async function callTool<T>(params: {
  system: string;
  userContent: string;
  toolName: string;
  toolDescription: string;
  schema: Anthropic.Tool.InputSchema;
}): Promise<T> {
  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 4096,
    output_config: { effort: "medium" },
    system: params.system,
    tools: [
      {
        name: params.toolName,
        description: params.toolDescription,
        input_schema: params.schema,
        strict: true,
      },
    ],
    tool_choice: { type: "auto" },
    messages: [{ role: "user", content: params.userContent }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("Model did not call the expected tool");
  }
  return toolUse.input as T;
}

// --- Step 1-2: AI reads the input, extracts structured data, and checks
// completeness (M2, M3). Missing details get a justified assumption where
// reliable; otherwise a follow-up question is generated (M4, M5). -----------

export async function extractUseCase(
  rawInput: string,
  companyKnowledge: CompanyKnowledgeContext,
  previousAnswers?: { question: string; answer: string }[],
): Promise<ExtractionResult> {
  const qaBlock =
    previousAnswers && previousAnswers.length > 0
      ? `\n\nPreviously asked follow-up questions and the submitter's answers:\n${previousAnswers
          .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
          .join("\n")}`
      : "";

  return callTool<ExtractionResult>({
    system:
      "You are the AI assistant in ROI-Align, a tool that helps organizations prioritize AI use cases. " +
      "You read a submitted use case (free text, a document, or a row from an Excel list) and extract the " +
      "key structured facts needed to assess it: the business process involved, the current situation/pain " +
      "point, data involved, current manual effort, and any other relevant details. " +
      "Use the provided company knowledge to fill reasonable gaps with a labeled, justified assumption. " +
      "Only ask a follow-up question when you cannot make a reliable assumption. " +
      "You are a decision-support tool, not a decision-maker; never claim to make a final decision, " +
      "and never assume real customer or personal data - this is a demonstration with fictional data only.",
    userContent:
      `Company knowledge (context for assumptions):\n${buildCompanyContextBlock(companyKnowledge)}\n\n` +
      `Submitted use case:\n"""\n${rawInput}\n"""${qaBlock}\n\n` +
      "Extract the structured fields and determine whether there is enough information to score this use case " +
      "across five dimensions (Business Value, Strategic Fit, AI Readiness, Implementation Effort, Governance & Risk), " +
      "making justified assumptions where reasonable. If important information is still missing and cannot be " +
      "reliably assumed, set completeness to \"needs_followup\" and list specific follow-up questions.",
    toolName: "record_extraction",
    toolDescription: "Record the structured extraction and completeness check for a submitted use case.",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "fields", "completeness", "followUpQuestions"],
      properties: {
        title: { type: "string", description: "A short descriptive title for the use case." },
        fields: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["fieldName", "fieldValue", "isAssumption", "rationale"],
            properties: {
              fieldName: { type: "string" },
              fieldValue: { type: "string" },
              isAssumption: { type: "boolean" },
              rationale: { type: ["string", "null"], description: "Required when isAssumption is true." },
            },
          },
        },
        completeness: { type: "string", enum: ["sufficient", "needs_followup"] },
        followUpQuestions: { type: "array", items: { type: "string" } },
      },
    },
  });
}

// --- Step 3: AI scores the five dimensions with rationale and goal
// contribution (M7, M8, M9). ------------------------------------------------

export interface DimensionScoreResult {
  dimension: DimensionKey;
  score: 1 | 2 | 3 | 4 | 5;
  rationale: string;
  isAssumption: boolean;
}

export interface GoalContributionResult {
  goalName: string;
  contributionNote: string;
}

export interface ScoringResult {
  dimensionScores: DimensionScoreResult[];
  goalContributions: GoalContributionResult[];
}

export async function scoreUseCase(
  title: string,
  fields: ExtractedFieldResult[],
  companyKnowledge: CompanyKnowledgeContext,
): Promise<ScoringResult> {
  const anchorsBlock = DIMENSIONS.map((d) => {
    const info = DIMENSION_INFO[d];
    const anchors = ([1, 2, 3, 4, 5] as const).map((n) => `  ${n}: ${info.anchors[n]}`).join("\n");
    return `${info.label} (${d}) - ${info.description}\n${anchors}`;
  }).join("\n\n");

  const fieldsBlock = fields
    .map((f) => `- ${f.fieldName}: ${f.fieldValue}${f.isAssumption ? " [ASSUMPTION]" : ""}`)
    .join("\n");

  return callTool<ScoringResult>({
    system:
      "You are the AI assistant in ROI-Align. You score a use case against five fixed dimensions on a 1-5 " +
      "scale using the anchor descriptions provided, and identify which strategic goals it contributes to most. " +
      "Always justify each score with a short rationale grounded in the use case facts and company knowledge. " +
      "Flag a score as an assumption if it relies on an assumed (not confirmed) fact. " +
      "You support human decision-making; you do not make the final decision, and this is not a binding " +
      "compliance or legal approval.",
    userContent:
      `Company knowledge:\n${buildCompanyContextBlock(companyKnowledge)}\n\n` +
      `Use case: ${title}\n\nExtracted facts:\n${fieldsBlock}\n\n` +
      `Scoring dimensions and anchors:\n${anchorsBlock}\n\n` +
      "Score all five dimensions and list the strategic goals this use case contributes to most, with a short note per goal.",
    toolName: "record_scoring",
    toolDescription: "Record the five-dimension score and strategic goal contributions for a use case.",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["dimensionScores", "goalContributions"],
      properties: {
        dimensionScores: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["dimension", "score", "rationale", "isAssumption"],
            properties: {
              dimension: { type: "string", enum: DIMENSIONS as unknown as string[] },
              score: { type: "integer", enum: [1, 2, 3, 4, 5] },
              rationale: { type: "string" },
              isAssumption: { type: "boolean" },
            },
          },
        },
        goalContributions: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["goalName", "contributionNote"],
            properties: {
              goalName: { type: "string" },
              contributionNote: { type: "string" },
            },
          },
        },
      },
    },
  });
}
