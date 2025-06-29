/*
  Warnings:

  - You are about to drop the column `analystId` on the `Briefing` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "BriefingAnalyst" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "briefingId" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BriefingAnalyst_briefingId_fkey" FOREIGN KEY ("briefingId") REFERENCES "Briefing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BriefingAnalyst_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "Analyst" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GongConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiKey" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Briefing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "agenda" TEXT,
    "notes" TEXT,
    "outcomes" TEXT,
    "followUpActions" TEXT,
    "recordingUrl" TEXT,
    "transcript" TEXT,
    "transcriptFile" TEXT,
    "aiSummary" TEXT,
    "followUpSummary" TEXT,
    "gongMeetingId" TEXT,
    "calendarMeetingId" TEXT,
    "attendeeEmails" TEXT,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Briefing_calendarMeetingId_fkey" FOREIGN KEY ("calendarMeetingId") REFERENCES "CalendarMeeting" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Briefing" ("agenda", "completedAt", "createdAt", "description", "followUpActions", "id", "notes", "outcomes", "recordingUrl", "scheduledAt", "status", "title", "updatedAt") SELECT "agenda", "completedAt", "createdAt", "description", "followUpActions", "id", "notes", "outcomes", "recordingUrl", "scheduledAt", "status", "title", "updatedAt" FROM "Briefing";
DROP TABLE "Briefing";
ALTER TABLE "new_Briefing" RENAME TO "Briefing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "BriefingAnalyst_briefingId_analystId_key" ON "BriefingAnalyst"("briefingId", "analystId");
