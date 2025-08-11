-- Create availability_slots table for interactive scheduling
DO $$
DECLARE
  analyst_id_type text;
BEGIN
  -- Determine the actual data type of public.analysts.id (uuid or text)
  SELECT a.atttypid::regtype::text INTO analyst_id_type
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'analysts'
    AND a.attname = 'id'
    AND a.attnum > 0;

  IF analyst_id_type IS NULL THEN
    RAISE EXCEPTION 'Could not determine data type for public.analysts.id';
  END IF;

  EXECUTE format($f$
    CREATE TABLE public.availability_slots (
      id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
      start_time timestamptz NOT NULL,
      end_time timestamptz NOT NULL,
      is_booked boolean NOT NULL DEFAULT false,
      booked_by_analyst_id %s REFERENCES public.analysts(id) ON DELETE SET NULL,
      briefing_id uuid, -- This will be populated after the briefing is created
      created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
      updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
    );
  $f$, analyst_id_type);
END $$;

-- Add indexes
CREATE INDEX idx_availability_slots_start_time ON public.availability_slots(start_time);
CREATE INDEX idx_availability_slots_is_booked ON public.availability_slots(is_booked);

-- Enable RLS
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

-- Grant permissions
-- Allow authenticated users to view available slots
CREATE POLICY "Allow authenticated users to view available slots"
  ON public.availability_slots FOR SELECT
  USING (is_booked = false);

-- Allow admins/editors to manage all slots
CREATE POLICY "Allow admin/editor to manage slots"
  ON public.availability_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id::text = auth.uid()::text 
        AND (role = 'ADMIN' OR role = 'EDITOR')
    )
  );

-- Allow an analyst to book a slot (update)
-- The booking of a slot is handled by a backend API route with elevated privileges,
-- so we don't need a specific RLS policy for an analyst to update the slot.
-- The API will handle the authorization logic.
