---
description: "Verify implementation matches plan and all success criteria pass"
agent: plan-humanlayer
---

# Validate Plan Command

Validate the plan: `$ARGUMENTS`

If no path given, find most recent plan in `.opencode/thoughts/plans/`.

## Purpose
Comprehensive verification that implementation matches the plan, with detailed reporting of matches, deviations, and issues.

## Process

### Step 1: Load Plan
1. Find or read the plan file: `$ARGUMENTS`
2. If no path given, find most recent plan in `.opencode/thoughts/plans/`
3. Read the plan completely
4. Extract all phases and success criteria

### Step 2: Gather Current State
1. Run: `git status` to see current changes
2. Run: `git log --oneline -n 10` to see recent commits
3. List all files mentioned in the plan

### Step 3: Run Automated Verification
For each automated check in the plan:

1. Extract the command (e.g., `npm test`, `npm run build`)
2. Execute the command
3. Capture exit code and output
4. Record pass/fail status

### Step 4: Code Review
For each phase in the plan:

1. Read the files that were supposed to be changed
2. Verify the expected changes exist
3. Check for any deviations from the plan
4. Note any additional changes not in plan

### Step 5: Deep Analysis
Think critically about:
- Edge cases that might not be covered
- Error handling completeness
- Performance implications
- Security considerations
- Test coverage

### Step 6: Generate Report

```markdown
## Validation Report: [Plan Name]

**Plan**: `[path/to/plan.md]`
**Validated**: [timestamp]
**Git Commit**: [current commit]
**Branch**: [current branch]

---

### Implementation Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: [Name] | ✅ Complete | All items verified |
| Phase 2: [Name] | ⚠️ Partial | Missing [specific item] |
| Phase 3: [Name] | ❌ Not Started | No changes found |

---

### Automated Verification Results

| Check | Command | Result | Output |
|-------|---------|--------|--------|
| Build | `npm run build` | ✅ Pass | - |
| Tests | `npm test` | ✅ Pass | 47 tests, 0 failures |
| Types | `npm run typecheck` | ⚠️ Warn | 2 warnings |
| Lint | `npm run lint` | ✅ Pass | - |

---

### Code Review Findings

#### Matches Plan ✅
- [x] `file1.ts`: Function X added as specified
- [x] `file2.ts`: Handler updated per plan
- [x] `file3.test.ts`: Tests added for new functionality

#### Deviations from Plan ⚠️
| File | Expected | Found | Impact |
|------|----------|-------|--------|
| `file.ts` | [expected] | [actual] | [low/medium/high] |

#### Potential Issues 🔍
- **[Issue 1]**: [description and recommendation]
- **[Issue 2]**: [description and recommendation]

---

### Manual Verification Checklist

From the plan, these items require manual verification:
- [ ] [Manual item 1]
- [ ] [Manual item 2]
- [ ] [Manual item 3]

---

### Recommendations

1. **[Priority: High]**: [recommendation]
2. **[Priority: Medium]**: [recommendation]
3. **[Priority: Low]**: [recommendation]

---

### Verdict

**[PASS]** | **[PASS WITH NOTES]** | **[NEEDS WORK]**

[Brief explanation of verdict]

---

### Next Steps

If PASS:
1. Create commit: `git commit -m "[description]"`
2. Consider creating PR

If NEEDS WORK:
1. Address issues listed above
2. Run `/validate` again
```

## Verdict Criteria

| Verdict | Criteria |
|---------|----------|
| **PASS** | All phases complete, all automated checks pass, no deviations |
| **PASS WITH NOTES** | All phases complete, minor deviations that don't affect functionality |
| **NEEDS WORK** | Missing phases, failing checks, or significant deviations |

## Constraints

- Run ALL automated verification commands
- Read ALL files mentioned in plan
- Be thorough but objective
- Don't suggest improvements beyond plan scope
- Focus on "does it match the plan?" not "could it be better?"
