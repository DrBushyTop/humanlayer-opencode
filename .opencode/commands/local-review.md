---
description: "Perform local code review before commit or PR"
---

# Local Review Command

## Trigger

`/local_review [optional focus area]`

## Purpose

Perform a thorough code review of uncommitted or unpushed changes, catching issues before they reach PR review.

## Process

### Step 1: Identify What to Review

```bash
# Check for uncommitted changes
git status

# Check for unpushed commits
git log origin/main..HEAD --oneline 2>/dev/null || git log main..HEAD --oneline
```

Determine scope:

- Uncommitted changes only
- Unpushed commits
- Both

### Step 2: Gather Changes

```bash
# For uncommitted changes
git diff
git diff --staged

# For unpushed commits
git diff main...HEAD
```

### Step 3: Deep Analysis

For each changed file, analyze:

#### Code Quality

- [ ] Clear, descriptive naming
- [ ] Appropriate function/method length
- [ ] Single responsibility principle
- [ ] No code duplication
- [ ] Proper error handling

#### Logic & Correctness

- [ ] Edge cases handled
- [ ] Null/undefined checks where needed
- [ ] Correct algorithm/approach
- [ ] No obvious bugs

#### Security

- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Proper authentication/authorization

#### Performance

- [ ] No N+1 query patterns
- [ ] Appropriate data structures
- [ ] No unnecessary loops
- [ ] No memory leaks

#### Testing

- [ ] Tests exist for new functionality
- [ ] Tests cover edge cases
- [ ] Tests are meaningful (not just coverage)

#### Style & Conventions

- [ ] Follows project conventions
- [ ] Consistent formatting
- [ ] Appropriate comments
- [ ] No commented-out code

### Step 4: Generate Review Report

````markdown
## Local Code Review

**Scope**: [Uncommitted changes / Unpushed commits / Both]
**Files Reviewed**: [count]
**Review Date**: [timestamp]

---

### Summary

| Category       | Issues Found |
| -------------- | ------------ |
| Critical       | X            |
| Important      | X            |
| Suggestions    | X            |
| Good Practices | X            |

---

### Critical Issues

_Must fix before committing_

#### Issue 1: [Title]

**File**: `path/to/file.ts:45`
**Problem**: [Description]
**Suggestion**: [How to fix]

```typescript
// Current
problematic code

// Suggested
fixed code
```
````

---

### Important Issues

_Should fix, may cause problems_

#### Issue 1: [Title]

**File**: `path/to/file.ts:67`
**Problem**: [Description]
**Suggestion**: [How to fix]

---

### Suggestions

_Nice to have improvements_

- **[File:line]**: [Suggestion]
- **[File:line]**: [Suggestion]

---

### Good Practices

_Things done well_

- [Good practice observed]
- [Good practice observed]

---

### Files Reviewed

| File            | Changes | Issues                    |
| --------------- | ------- | ------------------------- |
| `file1.ts`      | +45/-12 | 1 Critical, 2 Suggestions |
| `file2.ts`      | +23/-5  | 1 Important               |
| `file3.test.ts` | +67/-0  | Clean                     |

---

### Verdict

**[READY TO COMMIT]** | **[NEEDS FIXES]** | **[NEEDS DISCUSSION]**

[Brief explanation]

---

### Next Steps

If READY TO COMMIT:

- Run `/commit` to create commit

If NEEDS FIXES:

1. [First fix needed]
2. [Second fix needed]
3. Run `/local_review` again after fixes

```

## Review Focus Areas

If user specifies a focus area, prioritize:

| Focus | Emphasis |
|-------|----------|
| `security` | Authentication, authorization, input validation, secrets |
| `performance` | Queries, algorithms, memory, caching |
| `testing` | Test coverage, test quality, edge cases |
| `style` | Naming, formatting, conventions |
| `logic` | Correctness, edge cases, error handling |

## Constraints

- Be constructive, not harsh
- Prioritize issues by severity
- Provide concrete fix suggestions
- Acknowledge good practices
- Don't nitpick style if project has no style guide
- Focus on actual problems, not preferences
```
