DO $$
DECLARE
  v_count int;
  v_vendor_id text;
  updated_count bigint;
BEGIN
  SELECT COUNT(*), MAX(id)::text INTO v_count, v_vendor_id FROM public.vendor_domains;
  IF v_count = 1 THEN
    UPDATE public.briefings
       SET vendor_domain_id = v_vendor_id
     WHERE vendor_domain_id IS NULL;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'briefings set to single vendor: %', updated_count;

    UPDATE public."Event"
       SET vendor_domain_id = v_vendor_id
     WHERE vendor_domain_id IS NULL;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Event set to single vendor: %', updated_count;
  ELSE
    RAISE NOTICE 'Found % vendor_domains rows, skipping updates', v_count;
  END IF;
END $$;
