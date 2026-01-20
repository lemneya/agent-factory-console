# SECURITY-0: Auth/Ownership Enforcement Audit

## Summary

This audit addresses critical security gaps in API write endpoints. Prior to this work, **15+ write endpoints** had **no authentication or authorization checks**, allowing any request (even unauthenticated) to modify or delete resources.

## Audit Date
2026-01-19

## Scope

- All write endpoints (POST/PUT/PATCH/DELETE) in `/src/app/api/`
- Authentication enforcement (session required)
- Resource ownership verification (user must own the resource)
- PR #35 (`/api/projects/[id] PATCH`) security review

## Critical Findings (Pre-Fix)

### 1. Missing Authentication (401 checks)

| Endpoint | Method | Issue |
|----------|--------|-------|
| `/api/projects/[id]` | PUT | No auth check |
| `/api/projects/[id]` | DELETE | No auth check |
| `/api/tasks/[id]` | PUT | No auth check |
| `/api/tasks/[id]` | DELETE | No auth check |
| `/api/assets/[id]` | PUT | No auth check |
| `/api/assets/[id]` | DELETE | No auth check |
| `/api/workorders/[id]` | PATCH | No auth check |
| `/api/council/decisions/[id]` | DELETE | No auth check |
| `/api/council/decisions/[id]/override` | POST | No auth check |
| `/api/copilot/drafts/[id]/reject` | POST | Optional auth only |

### 2. Missing Ownership Verification (403 checks)

All endpoints above also lacked ownership verification. Any authenticated user could:
- Modify/delete any user's projects
- Update/delete any task
- Override council decisions on any project
- Reject any user's copilot drafts

### 3. PR #35 Specific Issues

The PATCH endpoint for project repo binding (`/api/projects/[id]`) in PR #35 had:
- No `getServerSession()` call
- No ownership check
- Anyone could modify any project's repo configuration

## Remediation

### New Auth Helper Module

Created `src/lib/auth-helpers.ts` with:

```typescript
// Authentication check
export async function requireAuth(): Promise<AuthResult | AuthError>

// Ownership checks (per resource type)
export async function requireProjectOwnership(projectId: string, userId: string)
export async function requireTaskOwnership(taskId: string, userId: string)
export async function requireDraftOwnership(draftId: string, userId: string)
export async function requireCouncilDecisionOwnership(decisionId: string, userId: string)
export async function requireWorkOrderOwnership(workOrderId: string, userId: string)
export async function requireBlueprintOwnership(blueprintId: string, userId: string)
```

### Dev/Test/CI Bypass

The auth helpers support bypass mode for testing:
- `process.env.CI === 'true'`
- `process.env.NODE_ENV === 'test'`
- `process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'`

**IMPORTANT**: `NEXT_PUBLIC_DEV_AUTH_BYPASS` should NEVER be set in production.

### Fixed Endpoints

| Endpoint | Method | Auth | Ownership |
|----------|--------|------|-----------|
| `/api/projects/[id]` | PUT | ✅ | ✅ Project owner |
| `/api/projects/[id]` | PATCH | ✅ | ✅ Project owner |
| `/api/projects/[id]` | DELETE | ✅ | ✅ Project owner |
| `/api/tasks/[id]` | PUT | ✅ | ✅ Via run→project |
| `/api/tasks/[id]` | DELETE | ✅ | ✅ Via run→project |
| `/api/assets/[id]` | PUT | ✅ | N/A (shared) |
| `/api/assets/[id]` | DELETE | ✅ | N/A (shared) |
| `/api/workorders/[id]` | PATCH | ✅ | ✅ Via blueprint→project |
| `/api/council/decisions/[id]` | DELETE | ✅ | ✅ Via project |
| `/api/council/decisions/[id]/override` | POST | ✅ | ✅ Via project |
| `/api/copilot/drafts/[id]/reject` | POST | ✅ | ✅ Draft owner |

## Security Tests

Added `tests/security-auth.spec.ts` with:
- Tests for 401 responses on unauthenticated requests
- Tests for proper error message format
- Documentation of bypass conditions

## Token Redaction Verification

Verified existing redaction patterns in `src/services/runner/index.ts`:

```typescript
const TOKEN_PATTERNS = [
  /ghp_[a-zA-Z0-9]{36}/g,        // GitHub PATs
  /gho_[a-zA-Z0-9]{36}/g,        // OAuth tokens
  /ghs_[a-zA-Z0-9]{36}/g,        // App installation
  /ghu_[a-zA-Z0-9]{36}/g,        // User-to-server
  /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/g,  // Fine-grained PATs
  /x-access-token:[^@\s]+/gi,    // URL embedded tokens
  /Bearer\s+[a-zA-Z0-9._-]+/gi,  // Bearer tokens
  /token=[a-zA-Z0-9._-]+/gi,     // Query params
];
```

The `redactSecrets()` and `redactSecretsFromObject()` functions properly:
- Redact tokens from log messages
- Redact tokens from database entries
- Redact tokens from evidence files
- Redact sensitive field names (token, secret, password, auth, key, credential)

## Files Modified

```
src/lib/auth-helpers.ts                                  (NEW)
src/app/api/projects/[id]/route.ts                       (Modified)
src/app/api/tasks/[id]/route.ts                          (Modified)
src/app/api/assets/[id]/route.ts                         (Modified)
src/app/api/workorders/[id]/route.ts                     (Modified)
src/app/api/council/decisions/[id]/route.ts              (Modified)
src/app/api/council/decisions/[id]/override/route.ts     (Modified)
src/app/api/copilot/drafts/[id]/reject/route.ts          (Modified)
tests/security-auth.spec.ts                              (NEW)
evidence/SECURITY-0/README.md                            (NEW)
```

## Verification Commands

```bash
# TypeScript check
npm run typecheck

# Run security tests
npx playwright test tests/security-auth.spec.ts

# Full test suite
npm test
```

## Recommendations

1. **Production Deployment**: Ensure `NEXT_PUBLIC_DEV_AUTH_BYPASS` is NOT set
2. **Rate Limiting**: Add rate limiting middleware to prevent abuse
3. **Audit Logging**: Consider logging all write operations for audit trail
4. **Input Validation**: Add schema validation (zod/joi) for request bodies
5. **CSRF Protection**: Consider adding CSRF tokens for state-changing requests

## Sign-off

- Executor: Claude Code (Track B)
- Date: 2026-01-19
- Status: ✅ Complete
