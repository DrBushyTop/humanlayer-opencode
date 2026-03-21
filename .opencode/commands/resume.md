---
description: "Resume work from a handoff document"
tools:
  bash: true
---

# Resume Command

Resume from handoff: `$ARGUMENTS`

**Argument formats:**
- `/resume` - List recent handoffs and ask user to choose
- `/resume path/to/handoff.md` - Resume from specific handoff file
- `/resume TICKET-123` - Resume from most recent handoff for ticket

## Purpose
Resume work from a handoff document, verifying current state and restoring context for seamless continuation.

## Process

### Step 1: Parse Arguments and Find Handoff

Parse `$ARGUMENTS` to determine the lookup method:

1. **If full path provided** (contains `/` or ends with `.md`):
   - Use the path directly
   - Read the handoff document

2. **If ticket number provided** (pattern like `ENG-1234`, `TICKET-123`):
   - Look in `.opencode/thoughts/shared/handoffs/{TICKET}/`
   - List directory contents to find handoffs
   - If multiple files, use the most recent (based on timestamp in filename)
   - If no files found, inform user and ask for path

3. **If no arguments provided**:
   - List recent handoffs from all directories:
     ```bash
     find .opencode/thoughts/shared/handoffs -name "*.md" -type f | head -20
     ```
   - Present list and ask user to choose

### Step 2: Load Handoff

1. Read handoff document COMPLETELY
2. Extract key information:
   - Original task description
   - Ticket number (if any)
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
| Ticket            | [ticket or "none"] |
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

### Ticket Not Found

If ticket directory doesn't exist or is empty:

```markdown
I couldn't find any handoffs for ticket `{TICKET}`.

Available options:
1. Check if the ticket number is correct
2. Provide the full path to the handoff file
3. Run `/resume` without arguments to see all available handoffs
```

## Directory Structure

Handoffs are stored in:
```
.opencode/thoughts/shared/handoffs/
├── ENG-2166/
│   ├── 2025-01-08_13-55-22_ENG-2166_add-oauth-support.md
│   └── 2025-01-09_10-30-00_ENG-2166_oauth-continuation.md
├── TICKET-789/
│   └── 2025-01-10_09-00-00_TICKET-789_fix-auth-bug.md
└── general/
    ├── 2025-01-07_14-20-00_refactor-utils.md
    └── 2025-01-08_16-45-00_update-docs.md
```

## Constraints

- Always verify current state before continuing
- Don't blindly trust old handoff data
- Create new handoff if session ends again
- Reference related documents for full context
