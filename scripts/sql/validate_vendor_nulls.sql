BEGIN;
CREATE TEMP TABLE vdid_audit(table_name text, total bigint, nulls bigint, null_pct numeric);
DO $$
DECLARE r RECORD; tot BIGINT; nul BIGINT; 
BEGIN 
  FOR r IN 
    SELECT table_name FROM information_schema.columns 
    WHERE table_schema='public' AND column_name='vendor_domain_id' ORDER BY 1 
  LOOP 
    EXECUTE format('SELECT count(*) FROM public.%I', r.table_name) INTO tot; 
    EXECUTE format('SELECT count(*) FROM public.%I WHERE vendor_domain_id IS NULL', r.table_name) INTO nul; 
    INSERT INTO vdid_audit VALUES (r.table_name, COALESCE(tot,0), COALESCE(nul,0), CASE WHEN tot>0 THEN round(nul::numeric*100.0/tot,2) ELSE 0 END); 
  END LOOP; 
END $$;
SELECT * FROM vdid_audit ORDER BY nulls DESC, table_name;
ROLLBACK;
