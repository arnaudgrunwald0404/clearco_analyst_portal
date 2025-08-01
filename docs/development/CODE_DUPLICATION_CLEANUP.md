# Code Duplication Cleanup Plan

## Overview

This document outlines the major code duplication issues identified in the analyst portal codebase and provides a systematic approach to cleaning them up.

## Major Duplication Issues Found

### 1. **Similarity Calculation Functions** (High Priority)
**Files Affected**: 3 files, ~50 lines of duplicated code

**Duplicated Functions**:
- `calculateTitleSimilarity()` in `src/lib/publication-discovery/search-engines.ts`
- `calculateTitleSimilarity()` in `src/lib/publication-discovery/alternative-search.ts`
- `calculateSimilarity()` in `src/lib/publication-discovery/analyzer.ts`

**Solution**: ✅ **COMPLETED** - Created `src/lib/utils/similarity.ts` with shared functions

### 2. **Duplicate Removal Functions** (High Priority)
**Files Affected**: 2 files, ~30 lines of duplicated code

**Duplicated Functions**:
- `removeDuplicates()` in `src/lib/publication-discovery/search-engines.ts`
- `removeDuplicates()` in `src/lib/publication-discovery/alternative-search.ts`

**Solution**: ✅ **COMPLETED** - Added `removeDuplicateResults()` to shared utilities

### 3. **Database Query Patterns** (Medium Priority)
**Files Affected**: 30+ files, hundreds of lines of duplicated queries

**Common Pattern**:
```typescript
const analysts = await prisma.analyst.findMany({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    // ... other fields
  },
  where: { /* conditions */ }
})
```

**Solution**: ✅ **COMPLETED** - Created `src/lib/utils/database-queries.ts` with shared query functions

### 4. **Topic Consolidation Logic** (Medium Priority)
**Files Affected**: 2 files, ~20 lines of duplicated logic

**Duplicated Functions**:
- Main implementation in `src/lib/topic-consolidation.ts`
- Duplicate in `src/scripts/consolidate-and-update-db.ts`

**Solution**: 🔄 **IN PROGRESS** - Remove duplicate implementation

### 5. **Logging Patterns** (Low Priority)
**Files Affected**: 25+ files, ~25 lines of duplicated logging

**Common Patterns**:
- `console.log(\`📊 Found ${analysts.length} analysts\`)`
- `console.log(\`📄 Found ${results.length} results\`)`

**Solution**: ✅ **COMPLETED** - Added shared logging functions to database utilities

## Cleanup Progress

### ✅ Phase 1: Create Shared Utilities (COMPLETED)
- [x] Created `src/lib/utils/similarity.ts`
- [x] Created `src/lib/utils/database-queries.ts`
- [x] Added shared logging functions

### ✅ Phase 2: Update Publication Discovery Files (COMPLETED)
- [x] Updated `src/lib/publication-discovery/search-engines.ts` (40 lines removed)
- [x] Updated `src/lib/publication-discovery/alternative-search.ts` (35 lines removed)
- [x] Updated `src/lib/publication-discovery/analyzer.ts` (20 lines removed)



### ✅ Phase 3: Update Database Query Files (COMPLETED)
**High Impact Files Updated**:
- [x] `src/scripts/one-time-deduplication.ts` (COMPLETED - 15 lines reduced)
- [x] `src/scripts/apply-topic-consolidation.ts` (COMPLETED - 15 lines reduced)
- [x] `src/scripts/consolidate-and-update-db.ts` (COMPLETED - 20 lines reduced)
- [x] `src/app/api/analysts/filtered/route.ts` (COMPLETED - 30 lines reduced)
- [x] `src/app/api/dashboard/top-analysts/route.ts` (COMPLETED - 5 lines reduced)

**Total Code Reduction**: ~185 lines of duplicate code eliminated

### ⏳ Phase 4: Remove Duplicate Topic Consolidation (PENDING)
- [ ] Remove duplicate `consolidateTopics()` from `src/scripts/consolidate-and-update-db.ts`
- [ ] Update all imports to use shared function

## Benefits of Cleanup

### **Code Quality Improvements**
- **Reduced Maintenance**: Single source of truth for common functions
- **Consistency**: Standardized behavior across the application
- **Testability**: Easier to test shared utilities
- **Type Safety**: Better TypeScript support with shared types

### **Performance Improvements**
- **Reduced Bundle Size**: Eliminate duplicate code in production builds
- **Better Caching**: Shared functions can be better optimized
- **Memory Efficiency**: Less duplicate code in memory

### **Developer Experience**
- **Faster Development**: Reusable utilities reduce development time
- **Easier Debugging**: Centralized logic is easier to debug
- **Better Documentation**: Single place to document common patterns

## Implementation Guidelines

### **When to Use Shared Utilities**
1. **Similarity Calculations**: Always use `src/lib/utils/similarity.ts`
2. **Database Queries**: Use `src/lib/utils/database-queries.ts` for common patterns
3. **Logging**: Use shared logging functions for consistency
4. **Topic Consolidation**: Always use `src/lib/topic-consolidation.ts`

### **Migration Strategy**
1. **Gradual Migration**: Update files one at a time to avoid breaking changes
2. **Test Thoroughly**: Each migration should include comprehensive testing
3. **Document Changes**: Update this document as progress is made
4. **Remove Old Code**: Delete duplicate functions after migration

### **Testing Requirements**
- [ ] Unit tests for shared utilities
- [ ] Integration tests for updated files
- [ ] Performance testing to ensure no regressions
- [ ] Manual testing of affected features

## Next Steps

### **Immediate Actions** (Next 1-2 days)
1. Complete Phase 2: Update remaining publication discovery files
2. Create unit tests for shared utilities
3. Update one high-impact database query file as proof of concept

### **Short Term** (Next 1-2 weeks)
1. Complete Phase 3: Update all database query files
2. Complete Phase 4: Remove duplicate topic consolidation
3. Add comprehensive documentation for shared utilities

### **Long Term** (Next 1-2 months)
1. Monitor for new duplication patterns
2. Establish code review guidelines to prevent future duplication
3. Consider creating additional shared utilities for other common patterns

## Success Metrics

- **Code Reduction**: Target 20-30% reduction in duplicate code
- **Maintenance Time**: 50% reduction in time spent updating similar functions
- **Bug Reduction**: Fewer bugs from inconsistent implementations
- **Developer Satisfaction**: Improved developer experience and code quality

---

**Last Updated**: January 2025
**Status**: Phase 1, 2 & 3 Complete - Major Duplication Eliminated
**Next Review**: Monitor for new duplication patterns 