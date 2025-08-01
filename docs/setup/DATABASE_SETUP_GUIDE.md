# Database Setup Guide: Prisma + Supabase Configuration

## Overview

This project uses **Prisma ORM** with **Supabase PostgreSQL** as the database provider. This setup allows you to leverage Prisma's excellent TypeScript integration and migration tools while using Supabase's managed PostgreSQL infrastructure.

## Current Issue: Failed to Load Calendar Connections

The error "Failed to load calendar connections" is caused by Prisma being unable to connect to your Supabase database. This is typically due to:

1. **Missing or incorrect DATABASE_URL**
2. **Wrong connection string format**
3. **Network connectivity issues**
4. **Database credential problems**

## Quick Fix Steps

### 1. Get Your Supabase Connection Details

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Project Settings → Database**
3. Look for **Connection string** section
4. Copy the **Pooler** connection string (recommended) or **Direct** connection string

### 2. Update Your Environment File

Update your `.env` file with the correct DATABASE_URL:

```bash
# For POOLER connection (recommended - better performance)
DATABASE_URL="postgresql://postgres.qimvwwfwakvgfvclqpue:[YOUR_PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# OR for DIRECT connection (fallback)
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.qimvwwfwakvgfvclqpue.supabase.co:5432/postgres"
```

**Replace `[YOUR_PASSWORD]` with your actual database password.**

### 3. Test the Connection

Run the database connection test:

```bash
npm run test:db
```

This will verify your connection and provide troubleshooting guidance.

### 4. Restart Your Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Connection String Formats

### Option 1: Direct Connection
- **Simple PostgreSQL connection**
- **Good for development and debugging**
- **Lower concurrency limits**
- **Format**: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`
- **Environment**: `DATABASE_URL`

### Option 2: Transaction Pooler (Recommended for API routes)
- **Optimized for short-lived transactions**
- **Perfect for Next.js API routes**
- **Higher concurrency support**
- **Format**: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&pool_mode=transaction`
- **Environment**: `DATABASE_URL_2`

### Option 3: Session Pooler (Recommended for long operations)
- **Optimized for longer database sessions**
- **Good for batch operations and migrations**
- **Maintains session state**
- **Format**: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&pool_mode=session`
- **Environment**: `DATABASE_URL_3`

## Common Connection Issues

### Issue 1: "Can't reach database server"
**Cause**: Network/DNS issues or wrong host
**Solution**: 
- Verify project reference ID
- Check if using correct region
- Try direct connection string

### Issue 2: "Authentication failed"
**Cause**: Wrong password or username
**Solution**:
- Verify database password in Supabase dashboard
- Reset password if needed
- Ensure no special characters are URL-encoded

### Issue 3: "Database does not exist"
**Cause**: Wrong database name or project
**Solution**:
- Verify project reference ID
- Ensure using `postgres` as database name

### Issue 4: "Connection timeout"
**Cause**: Firewall or network restrictions
**Solution**:
- Check if behind corporate firewall
- Verify Supabase project is active (not paused)

## Prisma + Supabase Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │ ── │   Prisma ORM     │ ── │  Supabase DB    │
│                 │    │                  │    │                 │
│ • API Routes    │    │ • Type Safety    │    │ • PostgreSQL    │
│ • Components    │    │ • Migrations     │    │ • Auth & RLS    │
│ • Queries       │    │ • Query Builder  │    │ • Real-time     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Best Practices

### 1. Environment Security
- ✅ **Never commit `.env` files**
- ✅ **Use `.env.example` for documentation**
- ✅ **Rotate credentials after exposure**

### 2. Connection Management
- ✅ **Use pooler for production**
- ✅ **Implement connection retry logic**
- ✅ **Monitor connection usage**

### 3. Database Migrations
- ✅ **Test migrations locally first**
- ✅ **Backup before production migrations**
- ✅ **Use shadow database for development**

## Development Workflow

### Local Development
1. **Setup**: Configure `.env` with database credentials
2. **Generate**: Run `npm run db:generate` to generate Prisma client
3. **Migrate**: Run `npm run db:migrate` for schema changes
4. **Seed**: Run `npm run db:seed` to populate test data

### Production Deployment
1. **Environment**: Set DATABASE_URL in production environment
2. **Build**: Prisma client generation happens during build
3. **Deploy**: Application connects using production credentials

## Troubleshooting Commands

```bash
# Test database connection
npm run test:db

# Check Prisma client generation
npx prisma generate

# View database schema
npx prisma db pull

# Reset local database (development only)
npm run db:reset

# Check connection without Prisma
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

## Support Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma + Supabase Guide](https://supabase.com/docs/guides/integrations/prisma)

## Security Incident Reference

Following the security best practices from `GIT_SECURITY_INCIDENT.md`:

1. **Never commit sensitive credentials**
2. **Use environment variables for all secrets**
3. **Implement proper `.gitignore` patterns**
4. **Rotate credentials after any exposure**
5. **Monitor for accidental commits**
