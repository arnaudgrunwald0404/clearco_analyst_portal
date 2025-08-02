# Analyst Portal Test Suite

This directory contains comprehensive tests for the Analyst Portal, focusing on the analyst page and drawer functionality. The tests use Node.js built-in test runner with TypeScript support via `tsx`.

## Test Structure

### 1. Analyst Page Tests (`analyst-page.test.ts`)

Tests for the main analyst detail page functionality including:

#### Data Loading Tests
- ✅ **Fetch analyst data successfully**: Validates API response structure and data integrity
- ✅ **Handle missing analyst gracefully**: Tests error handling for non-existent analysts
- ✅ **Load social handles data**: Verifies multiple social profile data loading

#### Social Profile Icons Tests
- ✅ **Legacy field support**: Tests Twitter icons from legacy fields
- ✅ **Multiple social handles**: Tests rendering multiple icons per platform
- ✅ **Social handles preference**: Verifies new socialHandles take precedence over legacy fields
- ✅ **URL generation**: Tests proper URL construction for social platforms

#### Social Media Search Tests

- ✅ **Twitter profile search**: Tests AI-powered Twitter profile discovery
- ✅ **Error handling**: Tests graceful handling of search API failures

#### Data Formatting Tests
- ✅ **Date formatting**: Tests consistent date display across components
- ✅ **Missing field handling**: Tests graceful handling of null/undefined data
- ✅ **Key themes parsing**: Tests comma-separated theme string parsing
- ✅ **Covered topics structure**: Tests topic array data structure handling

#### UI State Management Tests
- ✅ **Loading states**: Tests loading indicators and state transitions
- ✅ **Tab navigation**: Tests active tab state management
- ✅ **Search loading states**: Tests social search loading indicators

#### Error Handling Tests
- ✅ **API errors**: Tests graceful handling of server errors
- ✅ **Malformed data**: Tests handling of incomplete/invalid data
- ✅ **Empty arrays**: Tests handling of empty social handles arrays

#### Influence and Health Scoring Tests
- ✅ **Influence categorization**: Tests proper scoring categorization logic
- ✅ **Health categorization**: Tests relationship health classification

#### Communication Timeline Tests
- ✅ **Date calculations**: Tests next contact date calculations
- ✅ **Missing data handling**: Tests handling of null communication data
- ✅ **Overdue detection**: Tests logic for identifying overdue communications

### 2. Analyst Drawer Tests (`analyst-drawer.test.ts`)

Tests for the analyst drawer component including:

#### State Management Tests
- ✅ **Drawer open/close**: Tests drawer visibility state management
- ✅ **Tab navigation**: Tests tab switching within drawer
- ✅ **Loading states**: Tests individual data type loading indicators

#### Data Fetching Tests
- ✅ **Publications data**: Tests API calls for publication history
- ✅ **Social posts data**: Tests API calls for social media content
- ✅ **Briefings data**: Tests API calls for briefing history

#### Edit Mode Tests
- ✅ **Enter edit mode**: Tests initialization of edit state with current data
- ✅ **Field updates**: Tests form field state management
- ✅ **Save functionality**: Tests API calls for data persistence
- ✅ **Topic management**: Tests adding/removing covered topics

#### Social Media Engagement Tests
- ✅ **Engagement modals**: Tests reply/share modal state management
- ✅ **AI response generation**: Tests AI-powered engagement content creation
- ✅ **Platform validation**: Tests character limits for different platforms
- ✅ **Engagement submission**: Tests social media posting workflow

#### Social Profile Search Tests
- ✅ **Profile discovery**: Tests AI-powered social profile search
- ✅ **Results modal**: Tests multi-result selection interface
- ✅ **Result selection**: Tests checkbox-based result selection
- ✅ **Result saving**: Tests persistence of selected social profiles

#### Publication Display Tests
- ✅ **Type categorization**: Tests publication type icon mapping
- ✅ **Date formatting**: Tests consistent date display
- ✅ **Summary handling**: Tests publication summary display

#### Briefing History Tests
- ✅ **Status display**: Tests briefing status color coding
- ✅ **Outcomes handling**: Tests display of meeting outcomes
- ✅ **Duration calculation**: Tests meeting duration calculations

#### Contact Information Tests
- ✅ **Email validation**: Tests email format validation
- ✅ **Phone validation**: Tests phone number format validation
- ✅ **URL validation**: Tests website URL validation

#### Error Handling Tests
- ✅ **API failures**: Tests graceful handling of network errors
- ✅ **Malformed responses**: Tests handling of invalid API responses
- ✅ **Empty data**: Tests handling of empty result sets
- ✅ **Search errors**: Tests handling of social search failures

#### Body Scroll Management Tests
- ✅ **Scroll prevention**: Tests body scroll locking when drawer is open
- ✅ **Cleanup**: Tests proper scroll restoration on component unmount

## Key Features Tested

### Social Profile Management
The tests thoroughly validate the new social profile functionality:
- **Multiple platform support**: LinkedIn, Twitter/X with extensible platform system
- **Legacy compatibility**: Fallback to legacy linkedIn/twitter fields
- **Icon rendering**: Multiple clickable icons per platform
- **URL generation**: Proper link construction for different handle formats
- **AI-powered discovery**: Automated social profile search and suggestion

### Real-time Data Management
- **API integration**: Full API call mocking and response validation
- **Loading states**: Comprehensive loading indicator testing
- **Error boundaries**: Graceful error handling and user feedback
- **State synchronization**: Proper state management across components

### User Experience
- **Edit workflows**: Inline editing with save/cancel functionality
- **Modal interactions**: Complex modal state management
- **Form validation**: Input validation for different field types
- **Responsive design**: Component behavior across different states

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx tsx --test tests/analyst-page.test.ts
npx tsx --test tests/analyst-drawer.test.ts

# Run with verbose output
npx tsx --test tests/*.test.ts --reporter=tap
```

## Test Environment

The tests use:
- **Node.js built-in test runner**: Native testing without external frameworks
- **JSDOM**: DOM environment simulation for React components
- **TypeScript**: Full type safety in test code
- **Mocked APIs**: Comprehensive API mocking for isolated testing

## Coverage Areas

### ✅ Covered
- Social profile icon display and interaction
- Data loading and error handling
- Form validation and submission
- State management and transitions
- API integration and mocking
- Date formatting and calculations
- Search and discovery workflows
- Modal and drawer interactions

### 🚧 Future Enhancements
- Component rendering tests (would require React Testing Library)
- E2E user interaction tests (would require Playwright/Cypress)
- Performance benchmarking
- Accessibility testing
- Visual regression testing

## Maintenance

When adding new features to the analyst page or drawer:

1. **Add corresponding tests** to cover new functionality
2. **Update existing tests** if behavior changes
3. **Mock new API endpoints** in the test setup
4. **Document test coverage** for new features
5. **Ensure error paths** are tested alongside happy paths

The test suite is designed to be maintainable and extensible, following the user's preference for simplified explanations while maintaining comprehensive coverage of critical functionality.
