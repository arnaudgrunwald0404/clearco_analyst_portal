# 🔐 RLS Fix - Execution Order

## 📋 **Run These Scripts in Order**

### **Step 1: Enable RLS on Tables**
```sql
-- Run: scripts/01-enable-rls-on-tables.sql
-- This enables RLS on all the tables mentioned in your Supabase errors
```

### **Step 2: Calendar Connections Policies**
```sql
-- Run: scripts/02-calendar-connections-policies.sql
-- This creates user-specific policies for calendar connections
```

### **Step 3: Basic User Policies**
```sql
-- Run: scripts/03-basic-user-policies.sql
-- This creates basic policies for authenticated users
```

### **Step 4: PascalCase Table Policies**
```sql
-- Run: scripts/04-pascalcase-table-policies.sql
-- This creates policies for Publication, Event, Content, Alert tables
```

### **Step 5: Admin-Only Table Policies**
```sql
-- Run: scripts/05-admin-only-table-policies.sql
-- This creates restricted policies for sensitive admin tables
```

### **Step 6: Remaining Business Table Policies**
```sql
-- Run: scripts/06-remaining-business-tables.sql
-- This creates policies for remaining business tables
```

### **Step 7: Final Table Policies**
```sql
-- Run: scripts/07-final-tables.sql
-- This creates policies for the final remaining tables
```

### **Step 8: Final Snake_Case Table Policies**
```sql
-- Run: scripts/08-final-snake-case-tables.sql
-- This creates policies for the final snake_case tables
```

### **Step 9: Final Fixes**
```sql
-- Run: scripts/09-final-fixes.sql
-- This fixes the remaining RLS issues and creates missing policies
```

## 🎯 **What Each Script Does**

- **Script 1**: Just enables RLS (no policies yet)
- **Script 2**: Creates policies for calendar_connections table
- **Script 3**: Creates basic policies for 4 key tables

## ✅ **After Each Script**

1. Run the verification query at the bottom
2. Check for any errors
3. Let me know if you see issues
4. Then move to the next script

## 🔄 **Feedback Loop**

- Run one script
- Tell me what happens
- I'll adjust the next scripts based on your feedback
- Much easier to debug small chunks!

## 📝 **Next Steps**

After these 3 scripts work, I'll create more small chunks for:
- PascalCase tables (Publication, Event, Content, etc.)
- Admin-only tables (GongConfig, EmailTemplate, etc.)
- Remaining business tables
