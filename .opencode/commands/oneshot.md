---
description: "Execute full research→plan→implement workflow without pauses"
---

# Oneshot Command

## Trigger

`/oneshot [task description]`

## Purpose

Execute the full Research → Plan → Implement workflow in a single session without human pause points. Best for smaller, well-defined tasks where you trust the AI to make reasonable decisions.

## When to Use

### Good Candidates

- Small, well-defined features
- Bug fixes with clear scope
- Refactoring tasks
- Adding tests
- Documentation updates
- Configuration changes

### Not Recommended

- Large features with unclear scope
- Breaking changes
- Security-sensitive changes
- Tasks requiring external input
- Anything you want to review step-by-step

## Process

### Step 1: Parse Task

Extract from `$ARGUMENTS`:

- Task description
- Any constraints mentioned
- Implicit scope

### Step 2: Quick Research

Spawn research subagents in parallel:

- `codebase-locator`: Find relevant files
- `codebase-analyzer`: Understand current implementation
- `pattern-finder`: Find similar patterns to follow

**Time limit**: Keep research focused, don't over-explore.

### Step 3: Rapid Planning

Create a lightweight plan:

- Single phase if possible
- Clear success criteria
- No manual verification steps (automated only)

**Do NOT** write plan to file - keep in context.

### Step 4: Implement

Execute the plan:

- Make all changes
- Run automated verification
- Fix any issues that arise

### Step 5: Verify

Run all automated checks:

```bash
# Detect and run appropriate checks
npm test 2>/dev/null || yarn test 2>/dev/null || echo "No test command"
npm run build 2>/dev/null || yarn build 2>/dev/null || echo "No build command"
npm run typecheck 2>/dev/null || yarn typecheck 2>/dev/null || echo "No typecheck command"
```

### Step 6: Report

```markdown
## Oneshot Complete: [Task]

### What Was Done

[Brief summary of changes]

### Research Findings

- [Key finding 1]
- [Key finding 2]

### Changes Made

| File       | Change    |
| ---------- | --------- |
| `file1.ts` | [Summary] |
| `file2.ts` | [Summary] |

### Verification Results

- Tests: [Pass/Fail]
- Build: [Pass/Fail]
- Types: [Pass/Fail]

### Issues Encountered

[Any issues and how they were resolved, or "None"]

### Result: [SUCCESS] | [PARTIAL] | [FAILED]

---

### Next Steps

If SUCCESS:

- Review changes: `git diff`
- Commit: `/commit`
- Create PR: `/describe_pr`

If PARTIAL or FAILED:

- [What needs manual attention]
- [Suggested fixes]
```

## Error Handling

### Research Finds Nothing

```markdown
## Oneshot Blocked: Insufficient Context

Could not find enough information to proceed safely.

**What I looked for**: [search terms]
**What I found**: [nothing / partial info]

### Recommendation

Run `/research [topic]` first to gather context, then try oneshot again.
```

### Implementation Fails

If automated checks fail:

1. Attempt to fix (max 2 attempts)
2. If still failing, report and stop
3. Don't leave broken code

```markdown
## Oneshot Incomplete: Implementation Issues

Made changes but verification failed.

**Issue**: [what failed]
**Attempted fixes**: [what was tried]

### Current State

- Changes made: [list]
- Verification status: [what passed/failed]

### Options

1. **Manual fix**: Address [specific issue]
2. **Rollback**: `git checkout -- .`
3. **Review**: `/local_review` for details
```

### Ambiguous Task

If task is unclear:

```markdown
## Oneshot Needs Clarification

The task "[task]" is ambiguous. Please clarify:

1. [Question 1]
2. [Question 2]

Or use `/plan [task]` for interactive planning.
```

## Constraints

- Trust the user knows when to use oneshot
- Keep research focused, don't over-explore
- Don't write intermediate artifacts to files
- Always run automated verification
- Stop if anything is unclear - don't guess
- Report honestly if something fails
- Never leave codebase in broken state
