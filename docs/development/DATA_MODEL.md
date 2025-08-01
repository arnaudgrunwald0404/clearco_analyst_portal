# Analyst Portal Data Model

This document summarizes the main data model for the Analyst Portal, based on the Prisma schema. Use this as a reference for generating SQL queries from natural language.

---

## Tables & Fields (with Typical Values)

### User
- `id` (String, PK) — e.g., "clx123abc"
- `email` (String, unique) — e.g., "jane.doe@clearcompany.com"
- `name` (String) — e.g., "Jane Doe"
- `password` (String)
- `role` (Role, enum) — e.g., "ADMIN", "EDITOR"
- `createdAt` (DateTime) — e.g., "2024-07-23T12:00:00Z"
- `updatedAt` (DateTime)

### Analyst
- `id` (String, PK) — e.g., "cmcmxojah000wmmlpugyp1cfy"
- `firstName` (String) — e.g., "Emi"
- `lastName` (String) — e.g., "Chiba"
- `email` (String, unique) — e.g., "emi.chiba@gartner.com"
- `company` (String) — e.g., "Gartner", "Forrester", "IDC"
- `title` (String) — e.g., "Principal Analyst"
- `phone` (String) — e.g., "+1-555-123-4567"
- `linkedIn` (String) — e.g., "https://linkedin.com/in/emichiba"
- `twitter` (String) — e.g., "@emi_chiba"
- `website` (String) — e.g., "https://emichiba.com"
- `bio` (String) — e.g., "Expert in HR technology."
- `profileImageUrl` (String) — e.g., "/analyst-images/emi.jpg"
- `type` (AnalystType, enum) — e.g., "Analyst", "Press"
- `influenceScore` (Int) — e.g., 50, 80
- `relationshipHealth` (RelationshipHealth, enum) — e.g., "GOOD", "EXCELLENT"
- `influence` (Influence, enum) — e.g., "VERY_HIGH", "MEDIUM"
- `status` (Status, enum) — e.g., "ACTIVE", "INACTIVE"
- `createdAt` (DateTime) — e.g., "2024-07-23T12:00:00Z"
- `updatedAt` (DateTime)
- ... (other fields, see schema)

### Newsletter
- `id` (String, PK)
- `title` (String) — e.g., "Q4 Analyst Update"
- `subject` (String) — e.g., "Product Launch Announcement"
- `content` (String) — e.g., "We are excited to announce..."
- `status` (NewsletterStatus, enum) — e.g., "DRAFT", "SCHEDULED"
- `scheduledAt` (DateTime) — e.g., "2024-08-01T09:00:00Z"
- `sentAt` (DateTime)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### NewsletterSubscription
- `id` (String, PK)
- `analystId` (String, FK to Analyst)
- `newsletterId` (String, FK to Newsletter)
- `sentAt` (DateTime)
- `opened` (Boolean) — e.g., true, false
- `clicked` (Boolean) — e.g., true, false
- `createdAt` (DateTime)

### Briefing
- `id` (String, PK)
- `title` (String) — e.g., "Quarterly Briefing"
- `description` (String)
- `scheduledAt` (DateTime) — e.g., "2024-08-10T15:00:00Z"
- `completedAt` (DateTime)
- `status` (BriefingStatus, enum) — e.g., "SCHEDULED", "COMPLETED"
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### BriefingAnalyst
- `id` (String, PK)
- `briefingId` (String, FK to Briefing)
- `analystId` (String, FK to Analyst)
- `role` (String) — e.g., "Lead", "Participant"
- `createdAt` (DateTime)

### InfluenceTier
- `id` (String, PK)
- `name` (String) — e.g., "Very High", "Medium"
- `color` (String) — e.g., "#dc2626"
- `briefingFrequency` (Int) — e.g., 180
- `touchpointFrequency` (Int) — e.g., 90
- `order` (Int) — e.g., 1, 2
- `isActive` (Boolean) — e.g., true, false
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### SchedulingConversation
- `id` (String, PK)
- `analystId` (String, FK to Analyst)
- `status` (SchedulingStatus, enum) — e.g., "INITIATED", "CONFIRMED"
- `subject` (String) — e.g., "ClearCompany Briefing - Emi Chiba"
- `suggestedTimes` (String, JSON array) — e.g., '["2024-08-10T15:00:00Z"]'
- `agreedTime` (DateTime)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### SchedulingEmail
- `id` (String, PK)
- `conversationId` (String, FK to SchedulingConversation)
- `direction` (EmailDirection, enum) — e.g., "OUTBOUND", "INBOUND"
- `subject` (String)
- `content` (String)
- `sentAt` (DateTime)
- `createdAt` (DateTime)

---

## Enums (with Values)

### Role
- ADMIN
- EDITOR

### Influence
- LOW
- MEDIUM
- HIGH
- VERY_HIGH

### Status
- ACTIVE
- INACTIVE
- ARCHIVED

### NewsletterStatus
- DRAFT
- SCHEDULED
- SENT
- CANCELLED

### BriefingStatus
- SCHEDULED
- COMPLETED
- CANCELLED
- RESCHEDULED

### AnalystType
- Analyst
- Press
- Investor
- Practitioner
- Influencer

### RelationshipHealth
- EXCELLENT
- GOOD
- FAIR
- POOR
- CRITICAL

### SchedulingStatus
- INITIATED
- WAITING_RESPONSE
- NEGOTIATING
- CONFIRMED
- SCHEDULED
- CANCELLED
- EXPIRED

### EmailDirection
- OUTBOUND
- INBOUND

---

## Relationships
- **Analyst** has many **BriefingAnalyst**, **NewsletterSubscription**, **SchedulingConversation**, etc.
- **Briefing** has many **BriefingAnalyst** (many-to-many with Analyst)
- **Newsletter** has many **NewsletterSubscription**
- **SchedulingConversation** has many **SchedulingEmail**

---

**For more details, see the full Prisma schema.** 