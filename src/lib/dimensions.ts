export const DIMENSIONS = [
  "BUSINESS_VALUE",
  "STRATEGIC_FIT",
  "AI_READINESS",
  "IMPLEMENTATION_EFFORT",
  "GOVERNANCE_RISK",
] as const;

export type DimensionKey = (typeof DIMENSIONS)[number];

export const DIMENSION_INFO: Record<
  DimensionKey,
  { label: string; description: string; anchors: Record<1 | 2 | 3 | 4 | 5, string> }
> = {
  BUSINESS_VALUE: {
    label: "Business Value",
    description: "Expected benefit: cost savings, revenue, efficiency, better decisions.",
    anchors: {
      1: "No clear or material benefit identified.",
      2: "Minor, localized benefit for a single team.",
      3: "Moderate, measurable benefit for a department.",
      4: "Significant benefit across multiple departments or a core process.",
      5: "Transformational benefit material to company-wide performance.",
    },
  },
  STRATEGIC_FIT: {
    label: "Strategic Fit",
    description: "Alignment with company goals and priorities, including ESG.",
    anchors: {
      1: "No connection to any stated strategic goal.",
      2: "Loosely related to a strategic goal.",
      3: "Supports one strategic goal in a secondary way.",
      4: "Directly advances one or more strategic goals.",
      5: "Central to a top strategic priority, strongly advances it.",
    },
  },
  AI_READINESS: {
    label: "AI Readiness",
    description: "Data, technology, processes, skills and workforce acceptance.",
    anchors: {
      1: "Major gaps in data, tech, process or skills; not feasible now.",
      2: "Significant gaps in at least one readiness area.",
      3: "Some gaps, addressable with moderate preparation.",
      4: "Minor gaps, mostly ready to execute.",
      5: "All readiness areas in place, workforce receptive.",
    },
  },
  IMPLEMENTATION_EFFORT: {
    label: "Implementation Effort",
    description: "Effort, time, cost and integration into the existing tech stack. Scored so 5 = low effort (easy).",
    anchors: {
      1: "Very high effort: long timeline, high cost, deep integration.",
      2: "High effort: multiple systems/teams, meaningful cost.",
      3: "Moderate effort: a few integration points, manageable cost.",
      4: "Low effort: minimal integration, short timeline.",
      5: "Very low effort: near plug-and-play, fits existing stack.",
    },
  },
  GOVERNANCE_RISK: {
    label: "Governance & Risk",
    description: "Regulatory, data protection, security and ethical risks. Scored so 5 = low risk.",
    anchors: {
      1: "Severe unmitigated regulatory, privacy, security or ethical risk.",
      2: "High risk, significant mitigation required before proceeding.",
      3: "Moderate risk, manageable with standard controls.",
      4: "Low risk, minor controls needed.",
      5: "Minimal to no identified risk.",
    },
  },
};

export const DEFAULT_WEIGHTS: Record<DimensionKey, number> = {
  BUSINESS_VALUE: 0.2,
  STRATEGIC_FIT: 0.2,
  AI_READINESS: 0.2,
  IMPLEMENTATION_EFFORT: 0.2,
  GOVERNANCE_RISK: 0.2,
};
