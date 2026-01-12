# AFC-1.3 Adoptability Council MVP - Test Summary

## Unit Tests

**File**: `__tests__/models/council.test.ts`

### Test Results
- Total: 18 tests
- Passed: 18
- Failed: 0

### Test Categories

#### create (3 tests)
- ✓ should create a council decision
- ✓ should create an ADOPT decision
- ✓ should create an ADAPT decision

#### findMany (4 tests)
- ✓ should find all council decisions
- ✓ should filter by decision type
- ✓ should filter by maintenance risk
- ✓ should filter by project

#### findUnique (2 tests)
- ✓ should find a council decision by id
- ✓ should return null if not found

#### update (1 test)
- ✓ should update a council decision

#### delete (1 test)
- ✓ should delete a council decision

#### override (1 test)
- ✓ should create an override decision

#### relations (2 tests)
- ✓ should include project relation
- ✓ should include task relation

#### validation (4 tests)
- ✓ should require projectId
- ✓ should have confidence between 0 and 1
- ✓ should have valid decision type
- ✓ should have valid maintenance risk

## E2E Tests

**File**: `tests/council.spec.ts`

### Test Categories

#### Council Dashboard (7 tests)
- should load council page
- should display page header
- should have new evaluation button
- should have decision type filter
- should have maintenance risk filter
- should display stats cards
- should navigate to new evaluation page

#### New Evaluation Page (14 tests)
- should load new evaluation page
- should have back link to council
- should have project selector
- should have decision type buttons
- should have candidate name input
- should have candidate url input
- should have license type selector
- should have maintenance risk selector
- should have confidence slider
- should have integration plan textarea
- should have red team critique textarea
- should have sources textarea
- should have reasoning textarea
- should have submit button
- should select decision type on click

#### Council API (12 tests)
- should respond to council decisions GET API
- should support decision filter parameter
- should support maintenanceRisk filter parameter
- should return 400 for evaluate without projectId
- should return 400 for evaluate without decision
- should return 400 for invalid decision type
- should return 400 for confidence out of range
- should return 400 for invalid maintenanceRisk
- should return 400 for sources not array
- should return 400 for missing reasoning
- should return 404 for non-existent decision
- should return 404 for non-existent project council
- should return 404 for override non-existent decision

#### Decision Types (3 tests)
- ADOPT option should be available
- ADAPT option should be available
- BUILD option should be available

## Overall Summary

| Test Suite | Tests | Passed | Failed |
|------------|-------|--------|--------|
| Unit Tests | 172   | 172    | 0      |
| E2E Tests  | 36+   | TBD    | TBD    |

**Status**: All unit tests passing. E2E tests defined and ready for execution in CI environment with database.
