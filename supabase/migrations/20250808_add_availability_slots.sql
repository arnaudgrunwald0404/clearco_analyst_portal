-- Create availability_slots table for interactive scheduling
CREATE TABLE public.availability_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  booked_by_analyst_id UUID REFERENCES public.analysts(id) ON DELETE SET NULL,
  briefing_id UUID, -- This will be populated after the briefing is created
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

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
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'EDITOR')
    )
  );

-- Allow an analyst to book a slot (update)
-- The booking of a slot is handled by a backend API route with elevated privileges,
-- so we don't need a specific RLS policy for an analyst to update the slot.
-- The API will handle the authorization logic.
