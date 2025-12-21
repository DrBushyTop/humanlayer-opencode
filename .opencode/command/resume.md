---
description: "Resume work from a handoff document"
---

# Resume Command

Resume from handoff: `$ARGUMENTS`

If no path given, list recent handoffs from `.opencode/thoughts/handoffs/`.

## Purpose
Resume work from a handoff document, verifying current state and restoring context for seamless continuation.

## Process

### Step 1: Find Handoff
1. If path provided in `$ARGUMENTS`, use it
2. If no path, list recent handoffs:
   ```bash
   ls -lt .opencode/thoughts/handoffs/ | head -10
   ```
3. Present list and ask user to choose

### Step 2: Load Handoff

1. Read handoff document COMPLETELY
2. Extract key information:
   - Original task description
   - Completed vs remaining items
   - Critical context and decisions
   - Related artifacts (plan, research)
   - Where we stopped

### Step 3: Load Related Documents

1. If plan referenced, read it
2. If research referenced, read it
3. Spawn thoughts-locator to find other related documents:
   - Use `subagent_type: "subagents/thoughts/thoughts-locator"`
   - Search for documents related to the task topic
4. Use thoughts-analyzer on highly relevant documents:
   - Use `subagent_type: "subagents/thoughts/thoughts-analyzer"`
   - Extract key decisions and constraints
5. Note what context is available

### Step 4: Verify Current State

Check if anything changed since handoff:

```bash
# Compare commits
git log --oneline [handoff_commit]..HEAD

# Check current branch
git branch --show-current

# Check for uncommitted changes
git status
```

### Step 5: Analyze Changes

Spawn research if needed to verify:

- Are completed items still complete?
- Has codebase changed since handoff?
- Are remaining items still relevant?
- Any new conflicts or issues?

### Step 6: Present Analysis

```markdown
## Resuming: [Task Description]

### Handoff Summary

| Field             | Value     |
| ----------------- | --------- |
| Created           | [date]    |
| Branch            | [branch]  |
| Commit at handoff | [commit]  |
| Current commit    | [current] |

### State Verification

#### Still Valid ✅

- [x] [Item that's still complete/relevant]
- [x] [Item that's still complete/relevant]

#### Changed Since Handoff ⚠️

- **[File/Item]**: [What changed]
- **[File/Item]**: [What changed]

#### Needs Re-evaluation 🔍

- [Item that may need fresh look]

### Context Restored

- **Plan**: [path] - [status]
- **Research**: [path] - [status]
- **Key Decisions**: [count] decisions noted
- **Warnings**: [count] gotchas to remember

### Recommended Next Steps

1. [First action based on handoff]
2. [Second action]
3. [Third action]

### Todo List

[Created from remaining items in handoff]

**Ready to continue. What would you like to focus on first?**
```

### Step 7: Create Action Plan

1. Use TodoWrite to track remaining work
2. Include any new items discovered during verification
3. Mark first item as in_progress

### Step 8: Begin Work

After user confirmation:

1. Reference handoff learnings throughout
2. Update handoff or create new one if session ends
3. If all work complete, mark handoff as resolved

## Handling Edge Cases

### Clean Continuation

Everything matches handoff - proceed with remaining items.

### Diverged Codebase

Code changed since handoff:

1. Identify what changed
2. Assess impact on remaining work
3. Update plan if needed
4. Continue with adjusted approach

### Stale Handoff

Handoff is old (>1 week), much has changed:

1. Treat as starting point only
2. Do fresh research on current state
3. Validate all assumptions
4. Consider creating new plan if major drift

### Incomplete Handoff

Handoff missing critical info:

1. Note what's missing
2. Research to fill gaps
3. Document findings
4. Continue with full context

## Constraints

- Always verify current state before continuing
- Don't blindly trust old handoff data
- Create new handoff if session ends again
- Reference related documents for full context
