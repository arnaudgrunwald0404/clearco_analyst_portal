-- =============================================
-- Social Handle Synchronization Triggers
-- =============================================
-- Automatically sync SocialHandle table when analysts table changes

-- Function to sync social handles
CREATE OR REPLACE FUNCTION sync_social_handles()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    
    -- Sync Twitter Handle
    IF NEW."twitterHandle" IS NOT NULL AND NEW."twitterHandle" != '' THEN
      -- Check if Twitter handle already exists
      IF NOT EXISTS (
        SELECT 1 FROM "SocialHandle" 
        WHERE "analystId" = NEW.id 
        AND platform = 'TWITTER'
      ) THEN
        -- Create new Twitter handle
        INSERT INTO "SocialHandle" (
          id, "analystId", platform, handle, "displayName", "isActive", "updatedAt"
        ) VALUES (
          'sh_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
          NEW.id,
          'TWITTER',
          NEW."twitterHandle",
          CASE 
            WHEN NEW."twitterHandle" LIKE '@%' THEN NEW."twitterHandle"
            ELSE '@' || NEW."twitterHandle"
          END,
          true,
          now()
        );
      ELSE
        -- Update existing Twitter handle
        UPDATE "SocialHandle" 
        SET 
          handle = NEW."twitterHandle",
          "displayName" = CASE 
            WHEN NEW."twitterHandle" LIKE '@%' THEN NEW."twitterHandle"
            ELSE '@' || NEW."twitterHandle"
          END,
          "updatedAt" = now()
        WHERE "analystId" = NEW.id 
        AND platform = 'TWITTER';
      END IF;
    ELSE
      -- Remove Twitter handle if set to null/empty
      DELETE FROM "SocialHandle" 
      WHERE "analystId" = NEW.id 
      AND platform = 'TWITTER';
    END IF;

    -- Sync LinkedIn URL
    IF NEW."linkedinUrl" IS NOT NULL AND NEW."linkedinUrl" != '' THEN
      -- Extract LinkedIn handle from URL
      DECLARE linkedin_handle TEXT;
      BEGIN
        linkedin_handle := CASE 
          WHEN NEW."linkedinUrl" ~ 'linkedin\.com/in/([^/]+)' THEN
            substring(NEW."linkedinUrl" from 'linkedin\.com/in/([^/]+)')
          ELSE NEW."linkedinUrl"
        END;
        
        -- Check if LinkedIn handle already exists
        IF NOT EXISTS (
          SELECT 1 FROM "SocialHandle" 
          WHERE "analystId" = NEW.id 
          AND platform = 'LINKEDIN'
        ) THEN
          -- Create new LinkedIn handle
          INSERT INTO "SocialHandle" (
            id, "analystId", platform, handle, "displayName", "isActive", "updatedAt"
          ) VALUES (
            'sh_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
            NEW.id,
            'LINKEDIN',
            linkedin_handle,
            linkedin_handle,
            true,
            now()
          );
        ELSE
          -- Update existing LinkedIn handle
          UPDATE "SocialHandle" 
          SET 
            handle = linkedin_handle,
            "displayName" = linkedin_handle,
            "updatedAt" = now()
          WHERE "analystId" = NEW.id 
          AND platform = 'LINKEDIN';
        END IF;
      END;
    ELSE
      -- Remove LinkedIn handle if set to null/empty
      DELETE FROM "SocialHandle" 
      WHERE "analystId" = NEW.id 
      AND platform = 'LINKEDIN';
    END IF;

    -- Sync Personal Website
    IF NEW."personalWebsite" IS NOT NULL AND NEW."personalWebsite" != '' THEN
      -- Check if website already exists
      IF NOT EXISTS (
        SELECT 1 FROM "SocialHandle" 
        WHERE "analystId" = NEW.id 
        AND platform = 'BLOG'
      ) THEN
        -- Create new website
        INSERT INTO "SocialHandle" (
          id, "analystId", platform, handle, "displayName", "isActive", "updatedAt"
        ) VALUES (
          'sh_' || extract(epoch from now()) || '_' || substr(md5(random()::text), 1, 8),
          NEW.id,
          'BLOG',
          NEW."personalWebsite",
          NEW."personalWebsite",
          true,
          now()
        );
      ELSE
        -- Update existing website
        UPDATE "SocialHandle" 
        SET 
          handle = NEW."personalWebsite",
          "displayName" = NEW."personalWebsite",
          "updatedAt" = now()
        WHERE "analystId" = NEW.id 
        AND platform = 'BLOG';
      END IF;
    ELSE
      -- Remove website if set to null/empty
      DELETE FROM "SocialHandle" 
      WHERE "analystId" = NEW.id 
      AND platform = 'BLOG';
    END IF;

    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    -- Remove all social handles for the deleted analyst
    DELETE FROM "SocialHandle" WHERE "analystId" = OLD.id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS sync_social_handles_trigger ON analysts;

CREATE TRIGGER sync_social_handles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON analysts
  FOR EACH ROW
  EXECUTE FUNCTION sync_social_handles();

-- Grant permissions
GRANT EXECUTE ON FUNCTION sync_social_handles() TO postgres, anon, authenticated, service_role;

-- Test the trigger with a comment
-- The trigger will now automatically sync SocialHandle whenever:
-- 1. A new analyst is created with social media data
-- 2. An existing analyst's social media data is updated
-- 3. An analyst is deleted (removes all their social handles)