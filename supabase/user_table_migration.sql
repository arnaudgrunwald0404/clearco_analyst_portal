-- User Table Migration for Authentication System
-- This creates the User table that the authentication code expects

-- Create user role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'EDITOR', 'ANALYST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create User table (PascalCase to match authentication code)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT ('usr' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 25)),
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "role" user_role NOT NULL DEFAULT 'EDITOR',
    "password" TEXT, -- For password authentication (hashed)
    "profileImageUrl" TEXT,
    "company" TEXT,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");

-- Disable RLS and grant permissions
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
GRANT ALL ON "User" TO authenticated;
GRANT ALL ON "User" TO anon;

-- Insert default admin user for testing
INSERT INTO "User" (id, email, name, role, password, company, title) 
VALUES (
    'usr_admin_001', 
    'admin@clearcompany.com', 
    'Admin User', 
    'ADMIN', 
    '$2b$10$rBTYJsGzWvYfGBQ1sGtlnOmGJYJ8qSPZw7bGxF8LZrGrZWx9hTzPa', -- 'password' hashed
    'ClearCompany', 
    'Administrator'
) ON CONFLICT (email) DO NOTHING;

-- Insert default analyst user for testing
INSERT INTO "User" (id, email, name, role, password, company, title) 
VALUES (
    'usr_analyst_001', 
    'sarah.chen@clearcompany.com', 
    'Sarah Chen', 
    'ANALYST', 
    '$2b$10$rBTYJsGzWvYfGBQ1sGtlnOmGJYJ8qSPZw7bGxF8LZrGrZWx9hTzPa', -- 'password' hashed
    'ClearCompany', 
    'Industry Analyst'
) ON CONFLICT (email) DO NOTHING;

-- Create function to update updatedAt on change
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updatedAt
DROP TRIGGER IF EXISTS trigger_update_user_updated_at ON "User";
CREATE TRIGGER trigger_update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_user_updated_at(); 