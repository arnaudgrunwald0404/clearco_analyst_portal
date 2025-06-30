-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "Influence" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NewsletterStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('EMAIL', 'CALL', 'MEETING', 'DEMO', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('ARTICLE', 'WHITEPAPER', 'DEMO', 'VIDEO', 'WEBINAR', 'REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "AnalystType" AS ENUM ('Analyst', 'Press', 'Investor', 'Practitioner', 'Influencer');

-- CreateEnum
CREATE TYPE "RelationshipHealth" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PublicationType" AS ENUM ('RESEARCH_REPORT', 'BLOG_POST', 'WHITEPAPER', 'WEBINAR', 'PODCAST', 'ARTICLE', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('COMMUNICATION_OVERDUE', 'BRIEFING_DUE', 'RELATIONSHIP_HEALTH', 'SOCIAL_MENTION', 'PUBLICATION_ALERT', 'ENGAGEMENT_OPPORTUNITY');

-- CreateEnum
CREATE TYPE "BriefingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('TWITTER', 'LINKEDIN', 'MEDIUM', 'BLOG', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analyst" (
    "id" TEXT NOT NULL,
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
    "type" "AnalystType" NOT NULL DEFAULT 'Analyst',
    "eligibleNewsletters" TEXT,
    "influenceScore" INTEGER NOT NULL DEFAULT 50,
    "lastContactDate" TIMESTAMP(3),
    "nextContactDate" TIMESTAMP(3),
    "communicationCadence" INTEGER,
    "relationshipHealth" "RelationshipHealth" NOT NULL DEFAULT 'GOOD',
    "recentSocialSummary" TEXT,
    "socialSummaryUpdatedAt" TIMESTAMP(3),
    "keyThemes" TEXT,
    "upcomingPublications" TEXT,
    "recentPublications" TEXT,
    "speakingEngagements" TEXT,
    "awards" TEXT,
    "influence" "Influence" NOT NULL DEFAULT 'MEDIUM',
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analyst_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Newsletter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "htmlContent" TEXT,
    "status" "NewsletterStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscription" (
    "id" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "newsletterId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "opened" BOOLEAN NOT NULL DEFAULT false,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalystCoveredTopic" (
    "id" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,

    CONSTRAINT "AnalystCoveredTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalystAccess" (
    "id" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalystAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ContentType" NOT NULL,
    "url" TEXT,
    "filePath" TEXT,
    "isExclusive" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "summary" TEXT,
    "type" "PublicationType" NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "isTracked" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialHandle" (
    "id" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCrawledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialHandle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "content" TEXT NOT NULL,
    "url" TEXT,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "isRelevant" BOOLEAN NOT NULL DEFAULT true,
    "sentiment" TEXT,
    "themes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Briefing" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" "BriefingStatus" NOT NULL DEFAULT 'SCHEDULED',
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Briefing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "actionTaken" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationSummary" (
    "id" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keyPoints" TEXT,
    "actionItems" TEXT,
    "recordingUrl" TEXT,
    "transcriptUrl" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalystPortalSession" (
    "id" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AnalystPortalSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyVision" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyVision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExclusiveContent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "targetAudience" TEXT,
    "accessLevel" TEXT NOT NULL DEFAULT 'ALL',
    "downloadUrl" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExclusiveContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "context" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "googleAccountId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarMeeting" (
    "id" TEXT NOT NULL,
    "calendarConnectionId" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "attendees" TEXT,
    "analystId" TEXT,
    "isAnalystMeeting" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefingAnalyst" (
    "id" TEXT NOT NULL,
    "briefingId" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BriefingAnalyst_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GongConfig" (
    "id" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GongConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL,
    "briefingId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedTo" TEXT,
    "assignedBy" TEXT,
    "dueDate" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Analyst_email_key" ON "Analyst"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_analystId_newsletterId_key" ON "NewsletterSubscription"("analystId", "newsletterId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalystAccess_analystId_key" ON "AnalystAccess"("analystId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialHandle_analystId_platform_handle_key" ON "SocialHandle"("analystId", "platform", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "AnalystPortalSession_sessionId_key" ON "AnalystPortalSession"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarConnection_userId_googleAccountId_key" ON "CalendarConnection"("userId", "googleAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarMeeting_calendarConnectionId_googleEventId_key" ON "CalendarMeeting"("calendarConnectionId", "googleEventId");

-- CreateIndex
CREATE UNIQUE INDEX "BriefingAnalyst_briefingId_analystId_key" ON "BriefingAnalyst"("briefingId", "analystId");

-- AddForeignKey
ALTER TABLE "Newsletter" ADD CONSTRAINT "Newsletter_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterSubscription" ADD CONSTRAINT "NewsletterSubscription_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "Analyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterSubscription" ADD CONSTRAINT "NewsletterSubscription_newsletterId_fkey" FOREIGN KEY ("newsletterId") REFERENCES "Newsletter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "Analyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalystCoveredTopic" ADD CONSTRAINT "AnalystCoveredTopic_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "Analyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalystAccess" ADD CONSTRAINT "AnalystAccess_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "Analyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "Analyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialHandle" ADD CONSTRAINT "SocialHandle_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "Analyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "Analyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Briefing" ADD CONSTRAINT "Briefing_calendarMeetingId_fkey" FOREIGN KEY ("calendarMeetingId") REFERENCES "CalendarMeeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "Analyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationSummary" ADD CONSTRAINT "ConversationSummary_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "Analyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalystPortalSession" ADD CONSTRAINT "AnalystPortalSession_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "Analyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "Analyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarConnection" ADD CONSTRAINT "CalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarMeeting" ADD CONSTRAINT "CalendarMeeting_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "Analyst"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarMeeting" ADD CONSTRAINT "CalendarMeeting_calendarConnectionId_fkey" FOREIGN KEY ("calendarConnectionId") REFERENCES "CalendarConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefingAnalyst" ADD CONSTRAINT "BriefingAnalyst_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "Analyst"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefingAnalyst" ADD CONSTRAINT "BriefingAnalyst_briefingId_fkey" FOREIGN KEY ("briefingId") REFERENCES "Briefing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_briefingId_fkey" FOREIGN KEY ("briefingId") REFERENCES "Briefing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
