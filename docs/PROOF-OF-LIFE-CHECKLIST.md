# AFC-0 Proof of Life Verification Checklist

This document provides a comprehensive verification checklist for the AFC-0 gate. Use this checklist to verify that all Definition of Done criteria are met before signing off on the gate.

## Pre-Verification Setup

Before running through the checklist:

1. Ensure Docker and Docker Compose are installed
2. Clone the repository fresh (or pull latest changes)
3. Have a GitHub account ready for OAuth testing
4. Have access to a test repository for webhook testing

## Verification Checklist

### 1. Application Startup

**Objective:** Verify the application starts correctly with Docker Compose

| #   | Check                       | Command/Action               | Expected Result    | Pass/Fail |
| --- | --------------------------- | ---------------------------- | ------------------ | --------- |
| 1.1 | Docker Compose file exists  | `ls docker-compose.yml`      | File exists        | [ ]       |
| 1.2 | Environment template exists | `ls .env.example`            | File exists        | [ ]       |
| 1.3 | Create environment file     | `cp .env.example .env`       | File created       | [ ]       |
| 1.4 | Configure environment       | Edit `.env` with credentials | Variables set      | [ ]       |
| 1.5 | Start services              | `docker-compose up -d`       | All services start | [ ]       |
| 1.6 | Check app container         | `docker-compose ps`          | App is "Up"        | [ ]       |
| 1.7 | Check database container    | `docker-compose ps`          | Postgres is "Up"   | [ ]       |
| 1.8 | Access application          | Open `http://localhost:3000` | Page loads         | [ ]       |
| 1.9 | Check for errors            | `docker-compose logs app`    | No fatal errors    | [ ]       |

**Notes:**

```
_____________________________________________________________________
_____________________________________________________________________
```

---

### 2. GitHub OAuth Authentication

**Objective:** Verify GitHub OAuth login flow works correctly

| #   | Check                        | Action              | Expected Result                      | Pass/Fail |
| --- | ---------------------------- | ------------------- | ------------------------------------ | --------- |
| 2.1 | Login button visible         | Visit homepage      | "Sign in with GitHub" button visible | [ ]       |
| 2.2 | OAuth redirect               | Click login button  | Redirect to GitHub OAuth page        | [ ]       |
| 2.3 | Authorize app                | Authorize on GitHub | Redirect back to app                 | [ ]       |
| 2.4 | Session created              | Check page          | User info displayed                  | [ ]       |
| 2.5 | Access protected route       | Visit `/projects`   | Page loads (not redirected)          | [ ]       |
| 2.6 | Logout works                 | Click logout        | Session cleared                      | [ ]       |
| 2.7 | Protected route after logout | Visit `/projects`   | Redirected to login                  | [ ]       |

**Notes:**

```
_____________________________________________________________________
_____________________________________________________________________
```

---

### 3. Projects Page

**Objective:** Verify project inventory functionality

| #   | Check              | Action                  | Expected Result           | Pass/Fail |
| --- | ------------------ | ----------------------- | ------------------------- | --------- |
| 3.1 | Page loads         | Navigate to `/projects` | Page renders              | [ ]       |
| 3.2 | Repository list    | View projects list      | GitHub repos displayed    | [ ]       |
| 3.3 | Sync button        | Look for sync/refresh   | Button exists             | [ ]       |
| 3.4 | Sync functionality | Click sync button       | Repos refresh from GitHub | [ ]       |
| 3.5 | Project details    | Click a project         | Project info displayed    | [ ]       |
| 3.6 | Empty state        | User with no repos      | Appropriate message shown | [ ]       |

**Notes:**

```
_____________________________________________________________________
_____________________________________________________________________
```

---

### 4. Runs Page

**Objective:** Verify runs list and creation functionality

| #   | Check                  | Action                  | Expected Result           | Pass/Fail |
| --- | ---------------------- | ----------------------- | ------------------------- | --------- |
| 4.1 | Page loads             | Navigate to `/runs`     | Page renders              | [ ]       |
| 4.2 | Create run button      | Look for create button  | Button exists             | [ ]       |
| 4.3 | Create run             | Click create, fill form | Run created successfully  | [ ]       |
| 4.4 | Run in list            | View runs list          | New run appears           | [ ]       |
| 4.5 | Run status             | Check run status        | Status displayed (Active) | [ ]       |
| 4.6 | Navigate to task board | Click run               | Redirects to `/runs/[id]` | [ ]       |

**Notes:**

```
_____________________________________________________________________
_____________________________________________________________________
```

---

### 5. Task Board (Kanban)

**Objective:** Verify task board and task management

| #   | Check              | Action                   | Expected Result                                | Pass/Fail |
| --- | ------------------ | ------------------------ | ---------------------------------------------- | --------- |
| 5.1 | Page loads         | Navigate to `/runs/[id]` | Task board renders                             | [ ]       |
| 5.2 | Kanban columns     | View board               | 4 columns visible (TODO, DOING, DONE, BLOCKED) | [ ]       |
| 5.3 | Add task button    | Look for add button      | Button exists                                  | [ ]       |
| 5.4 | Create task        | Click add, fill form     | Task created in TODO                           | [ ]       |
| 5.5 | Task card          | View task                | Title and info displayed                       | [ ]       |
| 5.6 | Move task          | Drag/click to move       | Task moves to new column                       | [ ]       |
| 5.7 | Task status update | Check task status        | Status matches column                          | [ ]       |
| 5.8 | Edit task          | Click to edit            | Can modify task                                | [ ]       |

**Notes:**

```
_____________________________________________________________________
_____________________________________________________________________
```

---

### 6. Notifications Page (GitHub Events)

**Objective:** Verify webhook event storage and display

| #   | Check            | Action                        | Expected Result                   | Pass/Fail |
| --- | ---------------- | ----------------------------- | --------------------------------- | --------- |
| 6.1 | Page loads       | Navigate to `/notifications`  | Page renders                      | [ ]       |
| 6.2 | Events list      | View notifications            | Events displayed (or empty state) | [ ]       |
| 6.3 | Webhook endpoint | Check `/api/webhooks/github`  | Endpoint responds                 | [ ]       |
| 6.4 | Receive webhook  | Send test webhook to endpoint | 200 response                      | [ ]       |
| 6.5 | Event stored     | Query database                | Event in GitHubEvent table        | [ ]       |
| 6.6 | Event displayed  | Refresh notifications page    | New event visible                 | [ ]       |
| 6.7 | Event details    | View event                    | Type, action, timestamp shown     | [ ]       |

**Webhook Test Command:**

```bash
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{"repository": {"full_name": "test/repo"}, "action": "opened"}'
```

**Notes:**

```
_____________________________________________________________________
_____________________________________________________________________
```

---

### 7. Database Integrity

**Objective:** Verify database schema and data integrity

| #   | Check             | Action                 | Expected Result                  | Pass/Fail |
| --- | ----------------- | ---------------------- | -------------------------------- | --------- |
| 7.1 | Project table     | Query database         | Table exists with correct schema | [ ]       |
| 7.2 | Run table         | Query database         | Table exists with correct schema | [ ]       |
| 7.3 | Task table        | Query database         | Table exists with correct schema | [ ]       |
| 7.4 | GitHubEvent table | Query database         | Table exists with correct schema | [ ]       |
| 7.5 | Foreign keys      | Check constraints      | Relationships enforced           | [ ]       |
| 7.6 | Migrations        | Check migration status | All migrations applied           | [ ]       |

**Database Check Commands:**

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d agent_factory

# Check tables
\dt

# Check Project schema
\d "Project"

# Check Run schema
\d "Run"

# Check Task schema
\d "Task"

# Check GitHubEvent schema
\d "GitHubEvent"
```

**Notes:**

```
_____________________________________________________________________
_____________________________________________________________________
```

---

### 8. API Endpoints

**Objective:** Verify all API endpoints respond correctly

| #    | Endpoint               | Method | Expected Status                 | Pass/Fail |
| ---- | ---------------------- | ------ | ------------------------------- | --------- |
| 8.1  | `/api/projects`        | GET    | 200 (auth) / 401 (no auth)      | [ ]       |
| 8.2  | `/api/projects`        | POST   | 201 (created) / 401 (no auth)   | [ ]       |
| 8.3  | `/api/projects/[id]`   | GET    | 200 (found) / 404 (not found)   | [ ]       |
| 8.4  | `/api/runs`            | GET    | 200 (auth) / 401 (no auth)      | [ ]       |
| 8.5  | `/api/runs`            | POST   | 201 (created) / 401 (no auth)   | [ ]       |
| 8.6  | `/api/runs/[id]`       | GET    | 200 (found) / 404 (not found)   | [ ]       |
| 8.7  | `/api/tasks`           | GET    | 200 (auth) / 401 (no auth)      | [ ]       |
| 8.8  | `/api/tasks`           | POST   | 201 (created) / 401 (no auth)   | [ ]       |
| 8.9  | `/api/tasks/[id]`      | PATCH  | 200 (updated) / 404 (not found) | [ ]       |
| 8.10 | `/api/webhooks/github` | POST   | 200 (valid) / 400 (invalid)     | [ ]       |

**Notes:**

```
_____________________________________________________________________
_____________________________________________________________________
```

---

### 9. Code Quality

**Objective:** Verify code passes quality checks

| #   | Check                    | Command                 | Expected Result | Pass/Fail |
| --- | ------------------------ | ----------------------- | --------------- | --------- |
| 9.1 | TypeScript compiles      | `npm run build`         | No type errors  | [ ]       |
| 9.2 | Lint passes              | `npm run lint`          | No lint errors  | [ ]       |
| 9.3 | Unit tests pass          | `npm run test`          | All tests pass  | [ ]       |
| 9.4 | E2E tests pass           | `npm run test:e2e`      | All tests pass  | [ ]       |
| 9.5 | Coverage meets threshold | `npm run test:coverage` | >= 50% coverage | [ ]       |

**Notes:**

```
_____________________________________________________________________
_____________________________________________________________________
```

---

### 10. Documentation

**Objective:** Verify documentation is complete and accurate

| #    | Check              | File/Location                      | Status           | Pass/Fail |
| ---- | ------------------ | ---------------------------------- | ---------------- | --------- |
| 10.1 | README exists      | `README.md`                        | Complete         | [ ]       |
| 10.2 | Setup instructions | README.md                          | Verified working | [ ]       |
| 10.3 | Agent config       | `.claude/agents.json`              | Complete         | [ ]       |
| 10.4 | Boundaries doc     | `BOUNDARIES.md`                    | Complete         | [ ]       |
| 10.5 | Sprint doc         | `coordination/SPRINT-AFC-0.md`     | Complete         | [ ]       |
| 10.6 | Handoff protocol   | `coordination/HANDOFF-PROTOCOL.md` | Complete         | [ ]       |
| 10.7 | Architecture doc   | `docs/architecture.md`             | Complete         | [ ]       |

**Notes:**

```
_____________________________________________________________________
_____________________________________________________________________
```

---

## Sign-Off

### Summary

| Category            | Total Checks | Passed | Failed |
| ------------------- | ------------ | ------ | ------ |
| Application Startup | 9            |        |        |
| GitHub OAuth        | 7            |        |        |
| Projects Page       | 6            |        |        |
| Runs Page           | 6            |        |        |
| Task Board          | 8            |        |        |
| Notifications       | 7            |        |        |
| Database            | 6            |        |        |
| API Endpoints       | 10           |        |        |
| Code Quality        | 5            |        |        |
| Documentation       | 7            |        |        |
| **TOTAL**           | **71**       |        |        |

### Definition of Done Verification

| #   | Criteria                                | Status |
| --- | --------------------------------------- | ------ |
| 1   | App starts with `docker-compose up`     | [ ]    |
| 2   | GitHub OAuth login works                | [ ]    |
| 3   | User repositories appear on `/projects` | [ ]    |
| 4   | Webhook events are stored and displayed | [ ]    |
| 5   | Can create/view runs and tasks          | [ ]    |
| 6   | All agent code merged to sprint branch  | [ ]    |
| 7   | Basic tests passing                     | [ ]    |

### Final Sign-Off

**Gate Status:** [ ] PASS / [ ] FAIL

**Verified By:** ************\_************

**Date:** ************\_************

**Notes:**

```
_____________________________________________________________________
_____________________________________________________________________
_____________________________________________________________________
```

### Issues Found

| #   | Description | Severity | Owner | Status |
| --- | ----------- | -------- | ----- | ------ |
|     |             |          |       |        |
|     |             |          |       |        |
|     |             |          |       |        |

---

## Appendix: Troubleshooting

### Common Issues

#### Docker Compose Won't Start

```bash
# Check Docker is running
docker info

# Check port conflicts
lsof -i :3000
lsof -i :5432

# Clean start
docker-compose down -v
docker-compose up --build
```

#### Database Connection Issues

```bash
# Check postgres is running
docker-compose ps postgres

# Check connection string in .env
# Should be: postgresql://postgres:postgres@postgres:5432/agent_factory

# Reset database
docker-compose down -v
docker-compose up -d
npm run db:migrate
```

#### OAuth Callback Errors

- Verify `NEXTAUTH_URL` matches your app URL
- Verify GitHub OAuth app callback URL matches
- Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct

#### Tests Failing

```bash
# Run specific test with verbose output
npm run test -- --verbose __tests__/example.test.ts

# Debug E2E tests
npx playwright test --debug
```
