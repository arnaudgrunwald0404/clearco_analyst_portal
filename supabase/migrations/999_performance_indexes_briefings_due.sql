-- Performance Indexes for Briefings Due Page Optimization
-- This migration adds critical indexes to eliminate N+1 query performance issues

-- Index for briefing_analysts table (most critical)
CREATE INDEX IF NOT EXISTS idx_briefing_analysts_analyst_id 
ON briefing_analysts(analystId);

CREATE INDEX IF NOT EXISTS idx_briefing_analysts_briefing_id 
ON briefing_analysts(briefingId);

-- Composite index for briefings status and scheduling
CREATE INDEX IF NOT EXISTS idx_briefings_status_scheduled 
ON briefings(status, scheduledAt DESC) 
WHERE status IN ('SCHEDULED', 'RESCHEDULED');

CREATE INDEX IF NOT EXISTS idx_briefings_status_completed 
ON briefings(status, completedAt DESC) 
WHERE status = 'COMPLETED';

-- Index for briefings by status with scheduling info
CREATE INDEX IF NOT EXISTS idx_briefings_status_dates 
ON briefings(status, scheduledAt DESC, completedAt DESC);

-- Index for analysts by status (for active analysts lookup)
CREATE INDEX IF NOT EXISTS idx_analysts_status_active 
ON analysts(status) 
WHERE status = 'ACTIVE';

-- Index for influence tiers lookup
CREATE INDEX IF NOT EXISTS idx_influence_tiers_active 
ON influence_tiers(isActive, "order") 
WHERE isActive = true;

-- Calendar meetings indexes for analyst lookups
CREATE INDEX IF NOT EXISTS idx_calendar_meetings_analyst_id_time 
ON calendar_meetings(analyst_id, start_time DESC) 
WHERE is_analyst_meeting = true;

-- GIN index for attendeeEmails array searches (if using JSONB)
CREATE INDEX IF NOT EXISTS idx_briefings_attendee_emails_gin 
ON briefings USING GIN(attendeeEmails);

-- GIN index for calendar meeting attendees array searches
CREATE INDEX IF NOT EXISTS idx_calendar_meetings_attendees_gin 
ON calendar_meetings USING GIN(attendees);

-- Partial index for future briefings (commonly queried)
CREATE INDEX IF NOT EXISTS idx_briefings_future_scheduled 
ON briefings(scheduledAt ASC) 
WHERE status IN ('SCHEDULED', 'RESCHEDULED') AND scheduledAt > NOW();

-- Partial index for past briefings (for historical lookups)
CREATE INDEX IF NOT EXISTS idx_briefings_past_by_scheduled 
ON briefings(scheduledAt DESC) 
WHERE scheduledAt <= NOW();

-- Comment explaining the optimization
COMMENT ON INDEX idx_briefing_analysts_analyst_id IS 'Critical index for briefings due page - eliminates N+1 queries when looking up analyst briefings';
COMMENT ON INDEX idx_briefings_status_scheduled IS 'Optimizes queries for scheduled/rescheduled briefings ordered by date';
COMMENT ON INDEX idx_briefings_status_completed IS 'Optimizes queries for completed briefings ordered by completion date';
COMMENT ON INDEX idx_briefings_attendee_emails_gin IS 'Enables fast email-based briefing lookups using GIN index on JSONB array';
COMMENT ON INDEX idx_calendar_meetings_attendees_gin IS 'Enables fast email-based calendar meeting lookups using GIN index on JSONB array';












