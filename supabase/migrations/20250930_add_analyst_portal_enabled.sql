-- Add analyst_portal_enabled column to vendor_domains table
-- Date: 2025-09-30
-- This allows controlling whether the analyst portal is accessible for each vendor domain

BEGIN;

-- Add the analyst_portal_enabled column (defaults to true for existing domains)
ALTER TABLE IF EXISTS public.vendor_domains 
  ADD COLUMN IF NOT EXISTS analyst_portal_enabled BOOLEAN DEFAULT true;

-- Add a comment to document the purpose
COMMENT ON COLUMN public.vendor_domains.analyst_portal_enabled IS 'Controls whether the analyst portal navigation item is shown for this vendor domain';

-- Update clearcompany.com to have analyst portal enabled (explicit)
UPDATE public.vendor_domains 
SET analyst_portal_enabled = true 
WHERE protected_domain = 'clearcompany.com';

COMMIT;







