# Dashboard Metrics Definitions

This document explains how each metric in the dashboard is calculated and what it represents.

## Key Performance Indicators (KPIs)

### 1. Total Analysts
- **Definition**: Total number of analyst records in the system
- **Active Analysts**: Subset of total analysts with status = 'ACTIVE'
- **Purpose**: Track the size and growth of your analyst network

### 2. Relationship Health
- **Definition**: Weighted average of relationship health scores across all active analysts
- **Calculation**: 
  - EXCELLENT = 100 points
  - GOOD = 80 points
  - FAIR = 60 points
  - POOR = 40 points
  - CRITICAL = 20 points
- **Weighting**: Each analyst's score is weighted by their influence score (0-100)
- **Formula**: `Sum(health_score × influence_score) / Sum(influence_scores)`
- **Purpose**: Understand overall relationship quality, prioritizing high-influence analysts

### 3. Engagement Rate
- **Definition**: Percentage representing how actively engaged analysts are with your organization over the last 30 days
- **Calculation**: `(Total meaningful interactions in last 30 days / Total active analysts) × 100`
- **Meaningful interactions include**:
  - Newsletter opens and clicks
  - Completed briefings
  - Logged interactions (calls, meetings, emails, demos, events)
  - Calendar meetings identified as analyst meetings
- **Cap**: Maximum 100% (prevents inflation from highly engaged analysts)
- **Purpose**: Measure the effectiveness of your engagement efforts

### 4. Active Alerts
- **Definition**: Number of unread alerts in the system
- **Calculation**: Count of alerts where `isRead = false`
- **Purpose**: Track actionable items requiring immediate attention

## Secondary Metrics

### 5. Newsletters Sent
- **Definition**: Total number of newsletters with status = 'SENT'
- **Purpose**: Track communication volume and outreach efforts

### 6. Content Items
- **Definition**: Total number of content pieces in the system
- **Purpose**: Measure content library growth and available resources

### 7. Briefings This Month
- **Definition**: Number of briefings scheduled in the current calendar month
- **Calculation**: Count where `scheduledAt >= first day of current month`
- **Purpose**: Track monthly briefing activity and analyst engagement

## Dashboard Sections

### Recent Activity
- **Time Frame**: Last 7 days
- **Sources**: 
  - Analyst profile updates
  - Newsletter sends
  - Completed briefings
  - New alerts
  - Logged interactions
  - Calendar meetings with analysts
- **Sorting**: Chronological order (most recent first)
- **Limit**: Top 10 activities displayed

### Top Analysts
- **Ranking**: Sorted by influence score (highest first)
- **Limit**: Top 5 analysts displayed
- **Health Indicators**: Color-coded relationship health status
- **Last Contact**: Most recent interaction from any source:
  - Manual interactions
  - Completed briefings
  - Calendar meetings
  - Stored `lastContactDate` field

## Engagement Rate Deep Dive

The engagement rate is a key metric for measuring analyst relations effectiveness:

### Why This Formula?
1. **Comprehensive**: Includes all meaningful touchpoints
2. **Normalized**: Per-analyst basis allows comparison across different network sizes
3. **Time-bound**: 30-day window provides relevant, actionable insights
4. **Realistic**: Capped at 100% to prevent skewing from highly active periods

### Interpreting Engagement Rates:
- **0-25%**: Low engagement - consider increasing outreach
- **26-50%**: Moderate engagement - room for improvement
- **51-75%**: Good engagement - maintain current efforts
- **76-100%**: Excellent engagement - analysts are highly engaged

### Improving Engagement Rate:
1. **Newsletter Strategy**: Improve open/click rates through better content
2. **Briefing Frequency**: Schedule more regular briefings with key analysts
3. **Proactive Outreach**: Log more interactions through calls and meetings
4. **Calendar Integration**: Ensure analyst meetings are properly identified

## Data Sources

All metrics are calculated from the following database tables:
- `Analyst` - analyst profiles and metadata
- `NewsletterSubscription` - newsletter engagement tracking
- `Briefing` - scheduled and completed briefings
- `Interaction` - logged communications
- `CalendarMeeting` - calendar-integrated meeting data
- `Alert` - system alerts and notifications
- `Newsletter` - newsletter creation and sending
- `Content` - content library items

## Refresh Frequency

Dashboard data is fetched on each page load. For production deployments, consider:
- Caching metrics for 5-15 minutes
- Background refresh for heavy calculations
- Real-time updates for critical alerts

## Technical Notes

- All date calculations use system timezone
- Deleted analysts are excluded from calculations
- Engagement calculations handle edge cases (zero active analysts)
- Health scores use default values for missing data
- Activity timestamps are converted to human-readable formats
