-- Migration: Add monitoring statistics table for tracking social media crawler runs
-- This table stores timestamped statistics for each monitoring run

CREATE TABLE IF NOT EXISTS "monitoring_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL, -- 'HOURLY_MONITORING', 'DAILY_CRAWL', etc.
    "analysts_checked" INTEGER NOT NULL DEFAULT 0,
    "posts_found" INTEGER NOT NULL DEFAULT 0,
    "posts_stored" INTEGER NOT NULL DEFAULT 0,
    "new_mentions" INTEGER NOT NULL DEFAULT 0,
    "high_relevance_posts" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT, -- JSON array of error messages
    "duration_ms" INTEGER, -- Duration of the monitoring run in milliseconds
    "hostname" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on timestamp for efficient querying
CREATE INDEX IF NOT EXISTS "monitoring_stats_timestamp_idx" ON "monitoring_stats"("timestamp");

-- Create index on type for filtering by monitoring type
CREATE INDEX IF NOT EXISTS "monitoring_stats_type_idx" ON "monitoring_stats"("type");

-- Create a trigger to update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS "monitoring_stats_updated_at"
  AFTER UPDATE ON "monitoring_stats"
  FOR EACH ROW
  BEGIN
    UPDATE "monitoring_stats" SET "updated_at" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
  END;
