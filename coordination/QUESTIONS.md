# Cross-Agent Questions Tracker

This document tracks questions, blockers, and coordination requests between agents.

## How to Use

### Posting a Question

Add your question using this template:

```markdown
### [Q-XXX] Your question title

**From:** your-agent-id
**To:** target-agent-id (or "all")
**Date:** YYYY-MM-DD
**Status:** Open | Answered | Resolved

**Question:**
Your detailed question here.

**Context:**
Why you need this, what you're trying to accomplish.

---

**Answer:** (filled in by target agent)

**Resolution:** (how it was resolved)
```

### Question Numbering

- Use sequential numbers: Q-001, Q-002, etc.
- Don't reuse numbers even if questions are deleted

---

## Active Questions

_No active questions at this time._

---

## Resolved Questions

_No resolved questions at this time._

---

## Templates

### Dependency Request Template

````markdown
### [Q-XXX] Need [feature/API/component] for [purpose]

**From:** requesting-agent
**To:** providing-agent
**Date:** YYYY-MM-DD
**Status:** Open

**Question:**
I need [specific thing] to implement [your feature].

**Context:**

- What I'm building: [description]
- How I plan to use it: [usage example]
- When I need it: [timeline]

**Suggested Interface:**

```typescript
// Your proposed interface
```
````

---

**Answer:**

**Resolution:**

````

### Blocker Report Template

```markdown
### [Q-XXX] Blocked on [issue]

**From:** blocked-agent
**To:** responsible-agent
**Date:** YYYY-MM-DD
**Status:** Open
**Priority:** High

**Question:**
I am blocked and cannot proceed with [task] because [reason].

**Context:**
- What I was doing: [description]
- Error/Issue: [details]
- What I've tried: [attempts]

---

**Answer:**

**Resolution:**
````

### Clarification Request Template

```markdown
### [Q-XXX] Clarification on [topic]

**From:** asking-agent
**To:** knowing-agent
**Date:** YYYY-MM-DD
**Status:** Open

**Question:**
I need clarification on [topic/decision/interface].

**Context:**

- My understanding: [what you think]
- Confusion: [what's unclear]
- Impact: [how this affects your work]

---

**Answer:**

**Resolution:**
```

---

## Index

| ID  | Title | From | To  | Status | Date |
| --- | ----- | ---- | --- | ------ | ---- |
| -   | -     | -    | -   | -      | -    |
