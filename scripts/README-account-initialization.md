# Account Initialization Script

This script provides a comprehensive solution for initializing new vendor accounts in the analyst portal system.

## Overview

The `initialize-new-account.js` script automates the complete setup of a new vendor domain, including:

- ✅ Domain validation and creation
- ✅ Admin user creation with magic link authentication
- ✅ Data duplication from the origin domain (clearcompany.com)
- ✅ Vendor domain assignment to all necessary objects
- ✅ Analyst portal access restriction
- ✅ Company profile building
- ✅ Comprehensive testing

## Prerequisites

1. **Environment Setup**: Ensure `.env.local` file exists with proper Supabase credentials
2. **Database Access**: Script requires `SUPABASE_SERVICE_ROLE_KEY` for admin operations
3. **Node.js**: Version 16+ required
4. **Company Profile Build**: Ensure `npm run company:profile:build` command is available

## Usage

### Method 1: Interactive Script (Recommended)
```bash
# Run the interactive setup script
./scripts/setup-new-account.sh

# Or directly with Node.js
node scripts/initialize-new-account.js
```

### Method 2: Programmatic Usage
```javascript
const { AccountInitializer } = require('./scripts/initialize-new-account.js')

const initializer = new AccountInitializer()
await initializer.initialize()
```

## What the Script Does

### Step 1: Domain Input & Validation
- Prompts for domain input (e.g., "acme.com")
- Validates domain format
- Checks for existing domains
- Offers to update existing or create new

### Step 2: Domain Creation
- Creates new vendor domain record
- Generates unique vendor domain ID
- Sets up basic company information

### Step 3: Admin User Creation
- Creates `admin@{domain}` user account
- Generates magic link for easy login
- Creates user profile with ADMIN role
- Links user to vendor domain

### Step 4: Data Duplication from ClearCompany
**Analysts**: 
- Copies all analysts from clearcompany.com
- Assigns new vendor domain ID
- Sets all influence levels to 'HIGH'
- Skips influence tier column

**Events**:
- Copies all events from clearcompany.com
- Assigns new vendor domain ID
- Skips tag column

**Awards**:
- Copies all awards from clearcompany.com
- Assigns new vendor domain ID
- Skips priority and status columns

### Step 5: Vendor Domain Assignment
Updates all vendor-scoped tables to ensure proper isolation:
- `briefings`
- `briefing_analysts`
- `testimonials`
- `newsletters`
- `newsletter_subscriptions`
- `influence_tiers`
- `calendar_meetings`
- `social_posts`

### Step 6: Analyst Portal Access Restriction
- Sets `analyst_portal_enabled = false` for the new domain
- Prevents access to analyst portal from navigation
- Maintains security boundaries

### Step 7: Company Profile Building
- Runs `npm run company:profile:build -- {domain}`
- Parses output for company information
- Updates vendor domain with company details

### Step 8: Comprehensive Testing
Runs tests to verify:
- Domain creation successful
- Admin user accessible
- Data properly scoped
- Vendor isolation working
- All APIs responding correctly

## Output & Results

The script provides detailed output including:

### Success Summary
```
📊 INITIALIZATION SUMMARY
=========================

🌐 Domain:
   Domain: acme.com
   ID: cl1234567890abcdef
   Status: Created

👤 Admin User:
   Email: admin@acme.com
   ID: user-uuid-here
   Status: Created
   Magic Link: https://...

📋 Data Duplication:
   Analysts: 107 duplicated, 0 failed
   Events: 15 duplicated, 0 failed
   Awards: 8 duplicated, 0 failed

🧪 Tests:
   Passed: 6
   Failed: 0
```

### Magic Link Authentication
The script generates a magic link for immediate admin access:
```
🔗 Magic link for admin@acme.com:
   https://your-app.supabase.co/auth/v1/verify?token=...
```

## Security Features

### Vendor Isolation
- All data is properly scoped by vendor domain ID
- RLS policies ensure cross-domain data isolation
- Admin users can only access their domain's data

### Access Control
- Analyst portal is disabled by default for new domains
- Admin users have full access to their domain's features
- Magic links provide secure, passwordless authentication

### Data Integrity
- Atomic operations ensure consistency
- Rollback capabilities for failed operations
- Comprehensive validation at each step

## Troubleshooting

### Common Issues

**Environment Variables Missing**
```bash
❌ Missing Supabase environment variables
```
Solution: Ensure `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

**Domain Already Exists**
```bash
❌ Domain acme.com already exists
```
Solution: Script will prompt to update existing domain or cancel

**Company Profile Build Fails**
```bash
❌ Company profile build failed
```
Solution: Ensure `npm run company:profile:build` command exists and works

**Database Connection Issues**
```bash
❌ Failed to fetch source analysts
```
Solution: Check Supabase credentials and network connectivity

### Manual Verification

After running the script, verify setup by:

1. **Login Test**: Use the provided magic link to log in as admin
2. **Data Access**: Check that analysts, awards, and other data are visible
3. **Navigation**: Confirm analyst portal is hidden from navigation
4. **API Tests**: Verify all API endpoints return data correctly

## Advanced Configuration

### Custom Data Sources
To duplicate from a different source domain, modify:
```javascript
// In getClearcompanyVendorId method
const sourceVendorId = 'your-source-vendor-id'
```

### Selective Data Duplication
To skip certain data types, comment out the relevant methods:
```javascript
// await this.duplicateEvents()  // Skip events
// await this.duplicateAwards()  // Skip awards
```

### Custom Company Profile
To use custom company information instead of automated building:
```javascript
const companyInfo = {
  name: 'Custom Company Name',
  industry: 'Custom Industry',
  logo: 'https://example.com/logo.png'
}
```

## Integration with Existing Systems

### CI/CD Pipeline Integration
```bash
# Add to deployment scripts
if [ "$SETUP_NEW_ACCOUNT" = "true" ]; then
  echo "$NEW_DOMAIN" | node scripts/initialize-new-account.js
fi
```

### API Integration
```javascript
// Express.js endpoint example
app.post('/api/admin/setup-account', async (req, res) => {
  const { domain } = req.body
  const initializer = new AccountInitializer()
  initializer.domain = domain
  await initializer.initialize()
  res.json({ success: true, results: initializer.results })
})
```

## Maintenance

### Regular Updates
- Keep the source domain (clearcompany.com) updated with latest data
- Review and update the data duplication logic as schema evolves
- Test the script regularly with new domains

### Monitoring
- Monitor script execution logs for errors
- Track success/failure rates
- Alert on failed initializations

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the script output for specific error messages
3. Verify environment configuration
4. Test with a simple domain first

The script is designed to be idempotent - running it multiple times with the same domain should be safe and will update existing records rather than create duplicates.







