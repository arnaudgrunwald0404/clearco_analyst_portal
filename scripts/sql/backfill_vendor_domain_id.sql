-- Backfill vendor_domain_id across tables based on existing relationships
-- Strategy:
-- 1) For any table with vendor_domain_id and analyst_id, copy from analysts.vendor_domain_id
-- 2) For any table with vendor_domain_id and briefing_id, copy from briefings.vendor_domain_id
--
-- Idempotent: safe to re-run; only fills NULLs and only from non-NULL source values.
-- Uses dynamic SQL to discover eligible tables/columns at runtime.

DO $$
DECLARE
  r RECORD;
  updated_count BIGINT;
BEGIN
  RAISE NOTICE 'Backfill vendor_domain_id: start at %', now();

  -- 1) Tables with analyst_id
  FOR r IN
    WITH tables_with_vdid AS (
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name = 'vendor_domain_id'
    ),
    candidate_cols AS (
      SELECT t.table_name,
             CASE 
               WHEN EXISTS (
                 SELECT 1 FROM information_schema.columns c 
                 WHERE c.table_schema='public' AND c.table_name=t.table_name AND c.column_name='analyst_id'
               ) THEN 'analyst_id'
               WHEN EXISTS (
                 SELECT 1 FROM information_schema.columns c 
                 WHERE c.table_schema='public' AND c.table_name=t.table_name AND c.column_name='analystId'
               ) THEN '"analystId"'
             END AS analyst_col
      FROM tables_with_vdid t
    )
    SELECT table_name, analyst_col
    FROM candidate_cols
    WHERE analyst_col IS NOT NULL
  LOOP
    EXECUTE format(
      'WITH u AS (
         UPDATE public.%I t
            SET vendor_domain_id = a.vendor_domain_id
           FROM public.analysts a
          WHERE t.%s = a.id
            AND t.vendor_domain_id IS NULL
            AND a.vendor_domain_id IS NOT NULL
        RETURNING 1)
       SELECT count(*) FROM u',
      r.table_name, r.analyst_col
    ) INTO updated_count;
    RAISE NOTICE 'Table %: backfilled from analysts via %, rows updated=%', r.table_name, r.analyst_col, COALESCE(updated_count,0);
  END LOOP;

  -- 2) Tables with briefing_id
  FOR r IN
    WITH tables_with_vdid AS (
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name = 'vendor_domain_id'
    ),
    candidate_cols AS (
      SELECT t.table_name,
             CASE 
               WHEN EXISTS (
                 SELECT 1 FROM information_schema.columns c 
                 WHERE c.table_schema='public' AND c.table_name=t.table_name AND c.column_name='briefing_id'
               ) THEN 'briefing_id'
               WHEN EXISTS (
                 SELECT 1 FROM information_schema.columns c 
                 WHERE c.table_schema='public' AND c.table_name=t.table_name AND c.column_name='briefingId'
               ) THEN '"briefingId"'
             END AS briefing_col
      FROM tables_with_vdid t
    )
    SELECT table_name, briefing_col
    FROM candidate_cols
    WHERE briefing_col IS NOT NULL
  LOOP
    EXECUTE format(
      'WITH u AS (
         UPDATE public.%I t
            SET vendor_domain_id = b.vendor_domain_id
           FROM public.briefings b
          WHERE t.%s = b.id
            AND t.vendor_domain_id IS NULL
            AND b.vendor_domain_id IS NOT NULL
        RETURNING 1)
       SELECT count(*) FROM u',
      r.table_name, r.briefing_col
    ) INTO updated_count;
    RAISE NOTICE 'Table %: backfilled from briefings via %, rows updated=%', r.table_name, r.briefing_col, COALESCE(updated_count,0);
  END LOOP;

  RAISE NOTICE 'Backfill vendor_domain_id: complete at %', now();
END $$;
