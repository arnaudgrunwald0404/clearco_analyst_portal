# Supabase Authentication Setup Guide

This guide will help you set up Supabase authentication for the ClearCompany Analyst Portal.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Wait for the project to be fully provisioned

## 2. Get Your Supabase Credentials

1. Go to your project settings > API
2. Copy the following values:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **Anon public key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **Service role key** (SUPABASE_SERVICE_ROLE_KEY)

## 3. Update Environment Variables

Update your `.env` file with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 4. Set Up Database Schema

Run the following SQL in your Supabase SQL editor to create the user profiles table:

```sql
-- Enable Row Level Security
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'EDITOR', 'ANALYST')),
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow service role to insert profiles (for user creation)
CREATE POLICY "Service role can insert profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, first_name, last_name, company)
  VALUES (
    NEW.id,
    'EDITOR', -- Default role, change as needed
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'last_name',
    CASE 
      WHEN NEW.email LIKE '%@clearcompany.com' THEN 'ClearCompany'
      ELSE NEW.raw_user_meta_data->>'company'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

## 5. Configure Authentication Settings

1. Go to Authentication > Settings in your Supabase dashboard
2. Under **Site URL**, add your development URL: `http://localhost:3000`
3. Under **Redirect URLs**, add: `http://localhost:3000/auth/callback`

## 6. Set Up Google OAuth (Optional)

1. Go to Authentication > Providers in Supabase
2. Enable Google provider
3. Follow the setup instructions to create Google OAuth credentials
4. Add your Google Client ID and Secret

## 7. Create Test Users

### For ClearCompany Staff:
```sql
-- Insert a ClearCompany admin user (replace with actual email)
INSERT INTO user_profiles (id, role, first_name, last_name, company)
VALUES (
  'your-user-id-here', -- Get this after user signs up
  'ADMIN',
  'John',
  'Doe',
  'ClearCompany'
);
```

### For Industry Analysts:
```sql
-- Insert an analyst user
INSERT INTO user_profiles (id, role, first_name, last_name, company)
VALUES (
  'analyst-user-id-here',
  'ANALYST',
  'Sarah',
  'Chen',
  'Gartner'
);
```

## 8. Role-Based Access Control

The application has three user roles:

- **ADMIN**: Full access to all features
- **EDITOR**: Access to most features (ClearCompany staff)
- **ANALYST**: Access only to the analyst portal

### Access Patterns:
- ClearCompany staff (ADMIN/EDITOR) → Main dashboard with sidebar
- Industry analysts (ANALYST) → Analyst portal (/portal)
- Unauthenticated users → Login page

## 9. Testing Authentication

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. You should be redirected to the login page
4. Try logging in with different user types to test role-based routing

## 10. Production Deployment

When deploying to production:

1. Update your Supabase Site URL and Redirect URLs
2. Use environment variables for all sensitive keys
3. Consider setting up email templates for magic links
4. Set up proper email configuration in Supabase

## Security Notes

- Never expose your `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Use Row Level Security (RLS) policies to protect data
- Regularly rotate your API keys
- Monitor authentication logs in Supabase dashboard

## Troubleshooting

### Common Issues:

1. **Redirect loops**: Check your middleware configuration and role assignments
2. **CORS errors**: Verify your Site URL and Redirect URLs in Supabase
3. **Profile not found**: Ensure the trigger is working and profiles are created
4. **Permission denied**: Check your RLS policies

### Debug Steps:
1. Check browser console for errors
2. Verify Supabase logs in the dashboard
3. Test authentication flow step by step
4. Validate environment variables are loaded correctly
