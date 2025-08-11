CREATE TABLE newsletters (
  id text PRIMARY KEY DEFAULT 'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  title text NOT NULL,
  content text NOT NULL,
  subject text NOT NULL,
  "authorId" text NOT NULL,
  status text DEFAULT 'DRAFT',
  "sentAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);
