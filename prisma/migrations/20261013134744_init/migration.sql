-- CreateTable
CREATE TABLE "CompanyKnowledgeVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyName" TEXT NOT NULL,
    "strategyGoals" TEXT NOT NULL,
    "techStack" TEXT NOT NULL,
    "aiReadiness" TEXT NOT NULL,
    "governance" TEXT NOT NULL,
    "changeReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UseCase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "rawInput" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "submitterRole" TEXT NOT NULL,
    "submitterName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExtractedField" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "useCaseId" INTEGER NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldValue" TEXT NOT NULL,
    "isAssumption" BOOLEAN NOT NULL DEFAULT false,
    "rationale" TEXT,
    CONSTRAINT "ExtractedField_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "UseCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FollowUpQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "useCaseId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "askedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" DATETIME,
    CONSTRAINT "FollowUpQuestion_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "UseCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "useCaseId" INTEGER NOT NULL,
    "companyKnowledgeVersionId" INTEGER NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "changeSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assessment_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "UseCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assessment_companyKnowledgeVersionId_fkey" FOREIGN KEY ("companyKnowledgeVersionId") REFERENCES "CompanyKnowledgeVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DimensionScore" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assessmentId" INTEGER NOT NULL,
    "dimension" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "weight" REAL NOT NULL,
    "rationale" TEXT NOT NULL,
    "isAssumption" BOOLEAN NOT NULL DEFAULT false,
    "editedByHuman" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DimensionScore_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoalContribution" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assessmentId" INTEGER NOT NULL,
    "goalName" TEXT NOT NULL,
    "contributionNote" TEXT NOT NULL,
    CONSTRAINT "GoalContribution_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "useCaseId" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "decidedBy" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "decidedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Decision_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "UseCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "targetRole" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedUseCaseId" INTEGER,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ExtractedField_useCaseId_idx" ON "ExtractedField"("useCaseId");

-- CreateIndex
CREATE INDEX "FollowUpQuestion_useCaseId_idx" ON "FollowUpQuestion"("useCaseId");

-- CreateIndex
CREATE INDEX "Assessment_useCaseId_idx" ON "Assessment"("useCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_useCaseId_versionNumber_key" ON "Assessment"("useCaseId", "versionNumber");

-- CreateIndex
CREATE INDEX "DimensionScore_assessmentId_idx" ON "DimensionScore"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "DimensionScore_assessmentId_dimension_key" ON "DimensionScore"("assessmentId", "dimension");

-- CreateIndex
CREATE INDEX "GoalContribution_assessmentId_idx" ON "GoalContribution"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Decision_useCaseId_key" ON "Decision"("useCaseId");

-- CreateIndex
CREATE INDEX "Notification_targetRole_read_idx" ON "Notification"("targetRole", "read");
