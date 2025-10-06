DO $$
DECLARE
  v_vendor_id text;
  v_count integer;
  updated_count bigint;
BEGIN
  RAISE NOTICE 'Targeted vendor backfill start: %', now();

  -- 1) Backfill briefings from briefing_analysts (use any non-null vendor id per briefing)
  WITH src AS (
    SELECT ba."briefingId" AS briefing_id,
           MIN(ba.vendor_domain_id) AS vendor_domain_id
    FROM public.briefing_analysts ba
    WHERE ba.vendor_domain_id IS NOT NULL
    GROUP BY ba."briefingId"
  )
  UPDATE public.briefings b
     SET vendor_domain_id = s.vendor_domain_id
    FROM src s
   WHERE b.id = s.briefing_id
     AND b.vendor_domain_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'briefings updated from briefing_analysts: %', updated_count;

  -- 2) If exactly one vendor_domains row exists, set global-like tables
  SELECT COUNT(*), MAX(id) INTO v_count, v_vendor_id FROM public.vendor_domains;
  IF v_count = 1 THEN
    RAISE NOTICE 'Single vendor_domain detected: %', v_vendor_id;

    UPDATE public.awards
       SET vendor_domain_id = v_vendor_id
     WHERE vendor_domain_id IS NULL;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'awards updated: %', updated_count;

    UPDATE public.influence_tiers
       SET vendor_domain_id = v_vendor_id
     WHERE vendor_domain_id IS NULL;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'influence_tiers updated: %', updated_count;

    UPDATE public.analyst_portal_settings
       SET vendor_domain_id = v_vendor_id
     WHERE vendor_domain_id IS NULL;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'analyst_portal_settings updated: %', updated_count;
  ELSE
    RAISE NOTICE 'vendor_domains rows: %, skipping global table backfills', v_count;
  END IF;

  RAISE NOTICE 'Targeted vendor backfill complete: %', now();
END $$;