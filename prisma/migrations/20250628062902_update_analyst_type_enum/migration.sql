-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Analyst" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "title" TEXT,
    "phone" TEXT,
    "linkedIn" TEXT,
    "twitter" TEXT,
    "website" TEXT,
    "bio" TEXT,
    "profileImageUrl" TEXT,
    "type" TEXT NOT NULL DEFAULT 'Analyst',
    "eligibleNewsletters" TEXT,
    "influenceScore" INTEGER NOT NULL DEFAULT 50,
    "lastContactDate" DATETIME,
    "nextContactDate" DATETIME,
    "communicationCadence" INTEGER,
    "relationshipHealth" TEXT NOT NULL DEFAULT 'GOOD',
    "recentSocialSummary" TEXT,
    "socialSummaryUpdatedAt" DATETIME,
    "keyThemes" TEXT,
    "upcomingPublications" TEXT,
    "recentPublications" TEXT,
    "speakingEngagements" TEXT,
    "awards" TEXT,
    "influence" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Analyst" ("awards", "bio", "communicationCadence", "company", "createdAt", "eligibleNewsletters", "email", "firstName", "id", "influence", "influenceScore", "keyThemes", "lastContactDate", "lastName", "linkedIn", "nextContactDate", "notes", "phone", "profileImageUrl", "recentPublications", "recentSocialSummary", "relationshipHealth", "socialSummaryUpdatedAt", "speakingEngagements", "status", "title", "twitter", "type", "upcomingPublications", "updatedAt", "website") SELECT "awards", "bio", "communicationCadence", "company", "createdAt", "eligibleNewsletters", "email", "firstName", "id", "influence", "influenceScore", "keyThemes", "lastContactDate", "lastName", "linkedIn", "nextContactDate", "notes", "phone", "profileImageUrl", "recentPublications", "recentSocialSummary", "relationshipHealth", "socialSummaryUpdatedAt", "speakingEngagements", "status", "title", "twitter", "type", "upcomingPublications", "updatedAt", "website" FROM "Analyst";
DROP TABLE "Analyst";
ALTER TABLE "new_Analyst" RENAME TO "Analyst";
CREATE UNIQUE INDEX "Analyst_email_key" ON "Analyst"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
