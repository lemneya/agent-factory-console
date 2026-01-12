# AFC-1.4 Ralph Mode Runner - Test Summary

## Unit Tests

**File**: `__tests__/models/ralph.test.ts`

### Test Results

- Total: 53 tests
- Passed: 53
- Failed: 0

### Test Categories

#### RunPolicy Model - defaults (7 tests)

- should have default maxIterations of 25
- should have default maxWallClockSeconds of 4 hours
- should have default maxFailures of 10
- should have default maxRepeatedError of 3 for thrash detection
- should have default maxNoProgressIterations of 5
- should have default verificationCommands
- should have default completionPromise

#### RunPolicy Model - create (2 tests)

- should create a run policy
- should create policy with custom values

#### RunPolicy Model - findUnique (2 tests)

- should find policy by runId
- should return null if policy not found

#### RunPolicy Model - update (1 test)

- should update policy values

#### RunIteration Model - statuses (5 tests)

- should have exactly 5 valid iteration statuses
- should recognize RUNNING as valid status
- should recognize PASSED as valid status
- should recognize FAILED as valid status
- should recognize WAITING_FOR_APPROVAL as valid status
- should recognize ABORTED as valid status

#### RunIteration Model - create (2 tests)

- should create an iteration with RUNNING status
- should track iteration number sequentially

#### RunIteration Model - status transitions (4 tests)

- should transition from RUNNING to PASSED
- should transition from RUNNING to FAILED with error fingerprint
- should transition to WAITING_FOR_APPROVAL on thrash detection
- should transition to ABORTED on manual abort

#### RunIteration Model - verification summary (1 test)

- should record verification command results

#### RunIteration Model - diff stats (1 test)

- should record diff statistics

#### AbortReason Model - reasons (5 tests)

- should have exactly 5 valid abort reasons
- should recognize TIME_BUDGET as valid reason
- should recognize ITERATION_BUDGET as valid reason
- should recognize FAILURE_BUDGET as valid reason
- should recognize THRASHING as valid reason
- should recognize MANUAL_ABORT as valid reason

#### AbortReason Model - create (5 tests)

- should create abort reason for TIME_BUDGET
- should create abort reason for ITERATION_BUDGET
- should create abort reason for FAILURE_BUDGET
- should create abort reason for THRASHING
- should create abort reason for MANUAL_ABORT

#### Circuit Breaker Logic - thrash detection (2 tests)

- should detect repeated errorFingerprint
- should not trigger for different error fingerprints

#### Circuit Breaker Logic - budget checks (2 tests)

- should count total iterations
- should count failed iterations

#### Ralph Mode Control - start (2 tests)

- should enable Ralph mode on run
- should create policy when starting Ralph mode

#### Ralph Mode Control - stop (2 tests)

- should disable Ralph mode on run
- should record abort reason on stop

#### Ralph Mode Control - approve (2 tests)

- should resume from WAITING_FOR_APPROVAL
- should create new iteration after approval

#### Verification Flow (3 tests)

- should record verification results
- should detect completion promise in output
- should not detect completion without promise

#### Run with Ralph Mode Relations (3 tests)

- should include policy in run query
- should include iterations in run query
- should include abortReason in run query

## E2E Tests

**File**: `tests/ralph.spec.ts`

### Test Categories

#### Ralph Mode API - Policy API (3 tests)

- should respond to policy GET API
- should return JSON content type
- should handle policy PUT request

#### Ralph Mode API - Iterations API (3 tests)

- should respond to iterations GET API
- should return JSON content type
- should respond to specific iteration GET API

#### Ralph Mode API - Ralph Control API (5 tests)

- should respond to ralph POST API (start)
- should respond to ralph POST API (stop)
- should respond to ralph POST API (approve)
- should reject invalid action
- should return JSON content type

#### Ralph Mode API - Verify Result API (5 tests)

- should respond to verify-result POST API
- should return JSON content type
- should require iteration number
- should require passed boolean
- should accept error fingerprint for failed verification
- should accept diff stats

#### Ralph Mode UI (2 tests)

- should display Ralph Mode panel on runs page
- should have runs page structure

#### Policy Validation (4 tests)

- should reject negative maxIterations
- should reject zero maxIterations
- should reject negative maxWallClockSeconds
- should reject invalid verificationCommands type

#### Iteration Status Tracking (3 tests)

- should support RUNNING status
- should support PASSED status
- should support FAILED status with error fingerprint

#### Circuit Breaker Detection (1 test)

- should accept thrash detection data

#### Ralph Mode Flow (1 test)

- should handle full lifecycle (start -> verify -> stop)

#### Error Responses (4 tests)

- should return 404 for non-existent run policy
- should return 404 for non-existent run iterations
- should return 404 for non-existent iteration
- should return proper error structure

#### Default Values (1 test)

- policy should have expected defaults documented

## Overall Summary

| Test Suite | Tests | Passed | Failed |
| ---------- | ----- | ------ | ------ |
| Unit Tests | 53    | 53     | 0      |
| E2E Tests  | 32    | TBD    | TBD    |

**Status**: All 53 unit tests passing. E2E tests defined and ready for execution in CI environment with database.

## Implementation Details

### Database Models

- `RunPolicy`: Stores loop/budget rules per run
- `RunIteration`: Tracks each loop attempt with status, verification summary, error fingerprint
- `RunAbortReason`: Records why run was aborted

### API Endpoints

- `GET/PUT /api/runs/[id]/policy`: Policy management
- `POST /api/runs/[id]/ralph`: Ralph control (start/stop/approve)
- `GET /api/runs/[id]/iterations`: List all iterations
- `GET /api/runs/[id]/iterations/[n]`: Get specific iteration
- `POST /api/runs/[id]/verify-result`: Record verification results

### UI Components

- `RalphModePanel`: Expandable panel showing Ralph mode status, policy, and iteration timeline

### Circuit Breakers

- Thrash detection: Repeated errorFingerprint triggers WAITING_FOR_APPROVAL
- Failure budget: Max failures before abort
- Iteration budget: Max iterations before abort
- Time budget: Max wall clock seconds before abort
- No progress: Consecutive failures without progress trigger approval gate
