-- CreateEnum
CREATE TYPE "TopicCategory" AS ENUM ('CORE', 'ADDITIONAL');

-- CreateEnum
CREATE TYPE "AwardPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "general_settings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT '',
    "protectedDomain" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "industryName" TEXT NOT NULL DEFAULT 'HR Technology',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "general_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyst_portal_settings" (
    "id" TEXT NOT NULL,
    "welcomeQuote" TEXT NOT NULL DEFAULT '',
    "quoteAuthor" TEXT NOT NULL DEFAULT '',
    "authorImageUrl" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analyst_portal_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PredefinedTopic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TopicCategory" NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredefinedTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Award" (
    "id" TEXT NOT NULL,
    "awardName" TEXT NOT NULL,
    "publicationDate" TIMESTAMP(3) NOT NULL,
    "processStartDate" TIMESTAMP(3) NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "priority" "AwardPriority" NOT NULL DEFAULT 'MEDIUM',
    "topics" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Award_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PredefinedTopic_name_key" ON "PredefinedTopic"("name");
