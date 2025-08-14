# 🧪 RLS Policy Testing Guide

## 🎯 **Test Objectives**
Validate that all RLS policies work correctly and don't break your application functionality.

## 📋 **Test Suite Overview**

### **1. Simple RLS Tests** (`simple-rls-test.js`)
- **Purpose**: Basic validation of RLS policies
- **Scope**: Core functionality, field references, cross-table joins
- **Duration**: ~2-3 minutes
- **Risk**: Low (read-only operations)

### **2. API Endpoint Tests** (`test-api-endpoints.js`)
- **Purpose**: Test your actual API endpoints
- **Scope**: Key endpoints that your app uses
- **Duration**: ~1-2 minutes
- **Risk**: Low (GET requests only)

### **3. Comprehensive Tests** (`test-rls-policies.js`)
- **Purpose**: Deep validation of all RLS aspects
- **Scope**: Performance, edge cases, policy logic
- **Duration**: ~5-10 minutes
- **Risk**: Medium (more complex queries)

## 🚀 **Execution Order**

### **Step 1: Start with Simple Tests**
```bash
node scripts/simple-rls-test.js
```
**Expected**: All 5 tests should pass

### **Step 2: Test API Endpoints**
```bash
node scripts/test-api-endpoints.js
```
**Expected**: All API endpoints should return data

### **Step 3: Run Comprehensive Tests** (Optional)
```bash
node scripts/test-rls-policies.js
```
**Expected**: All 8 tests should pass

## 🔍 **What Each Test Validates**

### **Simple RLS Tests**
1. **RLS Status**: All tables have RLS enabled
2. **Policy Counts**: All tables have policies
3. **Basic Access**: Core tables are accessible
4. **Field References**: Quoted fields work correctly
5. **Cross-Table Joins**: Relationships work with RLS

### **API Endpoint Tests**
- `/api/analysts` - Get analysts list
- `/api/briefings` - Get briefings list
- `/api/testimonials` - Get testimonials list
- `/api/topics` - Get topics list
- `/api/awards` - Get awards list

### **Comprehensive Tests**
- Performance validation
- Edge case handling
- Policy logic verification
- Complex query testing

## ⚠️ **Prerequisites**

1. **Environment Variables**: Ensure `.env.local` has:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Dependencies**: Install if missing:
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Database Access**: Service role key must have access to:
   - `pg_tables`
   - `pg_policies`
   - All your business tables

## 📊 **Success Criteria**

### **✅ All Tests Must Pass**
- RLS Status: All tables enabled
- Policy Counts: All tables have policies
- Basic Access: All test tables accessible
- Field References: All quoted fields work
- Cross-Table Joins: All relationships work
- API Endpoints: All return successful responses

### **⚠️ Acceptable Warnings**
- Empty result sets (no data in tables)
- Slow queries (within 5-second threshold)
- Non-policy related errors

### **❌ Unacceptable Failures**
- RLS policy violations
- Permission denied errors
- Field reference errors
- Cross-table join failures

## 🚨 **If Tests Fail**

### **Common Issues & Solutions**

1. **Missing Environment Variables**
   ```bash
   # Check .env.local file
   cat .env.local
   ```

2. **Service Role Key Issues**
   - Verify key has correct permissions
   - Check if key is expired
   - Ensure key can access system tables

3. **RLS Policy Issues**
   - Check Supabase dashboard for errors
   - Verify policies were created correctly
   - Check table names and field references

4. **API Endpoint Issues**
   - Ensure your app is running
   - Check if endpoints exist
   - Verify authentication requirements

### **Debugging Steps**

1. **Check Supabase Dashboard**
   - Look for RLS errors
   - Verify table status

2. **Run Individual Tests**
   ```bash
   # Test just one aspect
   node -e "require('./scripts/simple-rls-test.js').testRLSStatus()"
   ```

3. **Check Database Directly**
   ```sql
   -- In Supabase SQL Editor
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```

## 🎉 **Success Celebration**

When all tests pass:
- ✅ Your RLS policies are working correctly
- ✅ Your application should function normally
- ✅ Your database is properly secured
- ✅ You can deploy with confidence

## 🔄 **Ongoing Testing**

### **After Deployment**
- Run tests in production environment
- Monitor application logs for RLS errors
- Test user-specific functionality

### **Regular Validation**
- Run tests after schema changes
- Validate after policy updates
- Test after major deployments

---

**Remember**: These tests validate that your RLS policies work correctly. If they all pass, your application should function normally with the new security policies in place.
