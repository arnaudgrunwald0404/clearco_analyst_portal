-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, first_name, last_name, company)
  VALUES (
    NEW.id,
    'EDITOR', -- Default role
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', split_part(split_part(NEW.email, '@', 2), '.', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing users without profiles (if any)
INSERT INTO public.user_profiles (id, role, first_name, last_name, company)
SELECT 
  au.id,
  'EDITOR' as role,
  COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)) as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
  COALESCE(au.raw_user_meta_data->>'company', split_part(split_part(au.email, '@', 2), '.', 1)) as company
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
