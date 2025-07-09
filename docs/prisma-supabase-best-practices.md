# Prisma + Supabase Best Practices

## Schema Operations with Connection Poolers

### The Issue
When using Supabase with connection poolers (pgbouncer), Prisma schema operations like `db push`, `migrate`, and `generate` can hang or timeout due to:

1. **Connection pooler limitations**: Poolers are optimized for application queries, not schema operations
2. **Prepared statement conflicts**: Multiple stuck processes can leave prepared statements in the pool
3. **Transaction timeouts**: Schema operations require longer-running transactions

### Best Practice Solution

When running Prisma schema operations that hang with pooler connections:

#### 1. Temporarily Switch to Direct Connection
```bash
# In your .env file, temporarily change from:
DATABASE_URL="postgresql://user:pass@host.supabase.com:6543/postgres?pgbouncer=true"

# To direct connection:
DATABASE_URL="postgresql://user:pass@host.supabase.com:5432/postgres"
```

#### 2. Run Your Prisma Commands
```bash
npx prisma db push
# or
npx prisma migrate dev
# or
npx prisma generate
```

#### 3. Switch Back to Pooler Connection
```bash
# Restore pooler connection for application use:
DATABASE_URL="postgresql://user:pass@host.supabase.com:6543/postgres?pgbouncer=true"
```

### When to Use Each Connection Type

| Operation Type | Connection Type | Reason |
|---------------|----------------|---------|
| Schema operations (`db push`, `migrate`) | Direct (port 5432) | Requires DDL operations and longer transactions |
| Application queries | Pooler (port 6543) | Better performance and connection management |
| Database backups | Direct (port 5432) | Requires full database access |
| Bulk operations | Direct (port 5432) | May require longer transactions |

### Emergency Recovery Steps

If you have stuck Prisma processes:

1. **Kill stuck processes**:
   ```bash
   # Find and kill stuck Prisma processes
   ps aux | grep prisma
   kill -9 <process_id>
   ```

2. **Clear connection pool** (if possible):
   - Restart your application
   - Or wait for connection timeout (usually 5-10 minutes)

3. **Use direct connection** for schema operations

### Environment Setup Recommendation

Consider having two environment variables:

```bash
# For application use (pooled)
DATABASE_URL="postgresql://user:pass@host.supabase.com:6543/postgres?pgbouncer=true"

# For schema operations (direct)
DATABASE_URL_DIRECT="postgresql://user:pass@host.supabase.com:5432/postgres"
```

Then use the appropriate one based on the operation type.

### Additional Tips

- **Always backup before schema changes**: Use `pg_dump` with direct connection
- **Test schema changes locally first**: Use a local development database when possible
- **Monitor connection limits**: Supabase has connection limits, especially on free tiers
- **Use transactions for multiple operations**: Wrap related operations in database transactions

This approach ensures reliable schema operations while maintaining optimal application performance with connection pooling.
