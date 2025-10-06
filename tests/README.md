# Bulk Delete Feature Test Suite

This directory contains comprehensive tests for the analyst access removal/deletion feature implemented in the admin panel.

## 🧪 Test Coverage

### 1. **API Unit Tests** (`api/admin/remove-analyst-access.test.ts`)
Tests the backend API endpoint `/api/admin/remove-analyst-access` with comprehensive coverage:

#### Authentication Tests
- ✅ Requires super admin authentication
- ✅ Rejects unauthorized requests
- ✅ Proceeds when authentication succeeds

#### Input Validation Tests
- ✅ Rejects empty analyst IDs array
- ✅ Rejects missing analyst IDs
- ✅ Rejects non-array analyst IDs
- ✅ Validates proper request format

#### Database Operations Tests
- ✅ Handles database errors when fetching analysts
- ✅ Handles case when no analysts are found
- ✅ Successfully removes access for all analysts
- ✅ Handles partial success scenarios
- ✅ Skips analysts without email addresses
- ✅ Skips analysts without corresponding auth users

#### Error Handling Tests
- ✅ Handles unexpected errors gracefully
- ✅ Handles malformed JSON requests
- ✅ Returns appropriate error responses

### 2. **Frontend Integration Tests** (`components/admin/AnalystAccountsSection.test.tsx`)
Tests the React component with user interaction scenarios:

#### Checkbox Selection Tests
- ✅ Renders checkboxes for each analyst row
- ✅ Allows selecting individual analysts
- ✅ Allows selecting all analysts with header checkbox
- ✅ Deselects all when header checkbox is clicked again
- ✅ Shows clear selection button functionality

#### Bulk Delete Button Tests
- ✅ Shows remove access button when analysts are selected
- ✅ Updates button count when selection changes
- ✅ Hides button when no analysts are selected

#### Modal Interaction Tests
- ✅ Opens confirmation modal when remove access is clicked
- ✅ Shows correct singular/plural text in modal
- ✅ Allows canceling the deletion
- ✅ Maintains selection state after cancel

#### Delete Execution Tests
- ✅ Successfully deletes selected analysts
- ✅ Handles API errors gracefully
- ✅ Shows loading state during deletion
- ✅ Handles partial success responses
- ✅ Refreshes data after successful deletion

### 3. **End-to-End Tests** (`e2e/admin-bulk-delete.spec.ts`)
Tests the complete user workflow using Playwright:

#### User Interface Tests
- ✅ Displays analyst accounts with checkboxes
- ✅ Allows selecting individual analysts
- ✅ Allows selecting all analysts with header checkbox
- ✅ Shows clear selection button and functionality
- ✅ Updates selection count dynamically

#### Modal Workflow Tests
- ✅ Opens confirmation modal when remove access is clicked
- ✅ Allows canceling the deletion
- ✅ Successfully performs bulk deletion
- ✅ Handles API errors gracefully
- ✅ Handles partial success responses

#### State Management Tests
- ✅ Maintains selection state during filtering
- ✅ Clears selection after successful deletion
- ✅ Updates UI appropriately after operations

## 🚀 Running the Tests

### Prerequisites
```bash
npm install
npm install -D vitest @testing-library/react @testing-library/user-event playwright
```

### Run All Tests
```bash
# Run the comprehensive test suite
node scripts/test-bulk-delete.js

# Run with coverage report
node scripts/test-bulk-delete.js --coverage
```

### Run Individual Test Types

#### Unit Tests (API)
```bash
npx vitest run tests/api/admin/remove-analyst-access.test.ts
```

#### Integration Tests (React Components)
```bash
npx vitest run tests/components/admin/AnalystAccountsSection.test.tsx
```

#### End-to-End Tests
```bash
npx playwright test tests/e2e/admin-bulk-delete.spec.ts
```

## 📊 Test Metrics

### Coverage Goals
- **API Endpoint**: 100% line coverage
- **React Component**: 95%+ line coverage
- **User Workflows**: All critical paths covered

### Test Scenarios Covered
- ✅ **Happy Path**: Successful bulk deletion
- ✅ **Error Handling**: API failures, network errors
- ✅ **Edge Cases**: Empty selections, partial failures
- ✅ **User Experience**: Loading states, confirmations
- ✅ **Security**: Authentication, authorization
- ✅ **Data Integrity**: Proper cleanup, refresh

## 🔧 Test Configuration

### Mocking Strategy
- **API Calls**: Mocked with realistic responses
- **Authentication**: Mocked super admin auth
- **Database**: Mocked Supabase client
- **Router**: Mocked Next.js navigation

### Test Data
- **Mock Analysts**: 3 realistic analyst records
- **Mock Domains**: 2 vendor domain records
- **Mock Responses**: Success, error, and partial success scenarios

## 🐛 Debugging Tests

### Common Issues
1. **Authentication Failures**: Check mock auth setup
2. **API Timeouts**: Verify mock response timing
3. **UI State Issues**: Check React state management mocks
4. **E2E Flakiness**: Add proper wait conditions

### Debug Commands
```bash
# Run tests in watch mode
npx vitest --watch

# Run E2E tests in headed mode
npx playwright test --headed

# Generate detailed test report
npx playwright show-report
```

## 📝 Test Maintenance

### Adding New Tests
1. Follow existing test structure and naming conventions
2. Include both positive and negative test cases
3. Mock external dependencies appropriately
4. Add comprehensive assertions

### Updating Tests
1. Update tests when API contracts change
2. Maintain test data consistency
3. Update mocks when dependencies change
4. Ensure backward compatibility

## 🎯 Quality Assurance

### Test Quality Checklist
- ✅ Tests are independent and can run in any order
- ✅ Tests clean up after themselves
- ✅ Tests have clear, descriptive names
- ✅ Tests cover both success and failure scenarios
- ✅ Tests are maintainable and readable
- ✅ Tests run quickly and reliably

### Performance Considerations
- Tests complete in under 30 seconds total
- E2E tests use efficient selectors
- Mocks are lightweight and fast
- No unnecessary delays or timeouts

This comprehensive test suite ensures the bulk delete feature is robust, reliable, and user-friendly across all scenarios.