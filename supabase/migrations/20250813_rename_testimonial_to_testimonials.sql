-- Rename legacy "Testimonial" table to "testimonials" and normalize column names
-- Idempotent: safe to run multiple times

DO $$
BEGIN
  -- Rename table if legacy mixed-case table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Testimonial'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'testimonials'
  ) THEN
    EXECUTE 'ALTER TABLE "Testimonial" RENAME TO testimonials';
  END IF;
END $$;

-- Normalize column names to snake_case and expected fields
DO $$
DECLARE
  col_exists boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='testimonials' AND column_name='analystId') THEN
    EXECUTE 'ALTER TABLE public.testimonials RENAME COLUMN "analystId" TO analyst_id';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='testimonials' AND column_name='quote') THEN
    EXECUTE 'ALTER TABLE public.testimonials RENAME COLUMN quote TO text';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='testimonials' AND column_name='isPublished') THEN
    EXECUTE 'ALTER TABLE public.testimonials RENAME COLUMN "isPublished" TO is_published';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='testimonials' AND column_name='displayOrder') THEN
    EXECUTE 'ALTER TABLE public.testimonials RENAME COLUMN "displayOrder" TO display_order';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='testimonials' AND column_name='createdAt') THEN
    EXECUTE 'ALTER TABLE public.testimonials RENAME COLUMN "createdAt" TO created_at';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='testimonials' AND column_name='updatedAt') THEN
    EXECUTE 'ALTER TABLE public.testimonials RENAME COLUMN "updatedAt" TO updated_at';
  END IF;

  -- Ensure rating column exists (default 5)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='testimonials' AND column_name='rating'
  ) INTO col_exists;
  IF NOT col_exists THEN
    EXECUTE 'ALTER TABLE public.testimonials ADD COLUMN rating integer DEFAULT 5';
  END IF;

  -- Add simple index on display_order to optimize ordering if present
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='testimonials' AND column_name='display_order'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'idx_testimonials_display_order' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX idx_testimonials_display_order ON public.testimonials(display_order)';
  END IF;
END $$;

-- Optional: add FK to analysts if not present (best effort)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='testimonials' AND column_name='analyst_id'
  ) THEN
    -- Try to add FK; ignore if it already exists
    BEGIN
      EXECUTE 'ALTER TABLE public.testimonials
        ADD CONSTRAINT testimonials_analyst_id_fkey
        FOREIGN KEY (analyst_id) REFERENCES public.analysts(id) ON DELETE SET NULL';
    EXCEPTION WHEN duplicate_object THEN
      -- do nothing
    END;
  END IF;
END $$;


