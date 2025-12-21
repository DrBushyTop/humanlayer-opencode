---
description: "Create handoff document for session continuity"
subtask: true
---

# Handoff Command

Create a handoff document. Optional description: `$ARGUMENTS`

## Purpose

Create a comprehensive handoff document that captures current work state, enabling seamless continuation in a new session.

## When to Use

- Session ending mid-task
- Switching to different work
- Complex state that needs preservation
- Context getting too large
- Handing off to another person/agent

## Process

### Step 1: Gather Context

1. Read current todo list with TodoRead
2. Check git status: `git status`
3. Check recent commits: `git log --oneline -n 5`
4. Identify any open files or active work

### Step 2: Get Git Metadata

Fetch for frontmatter:

```bash
git rev-parse HEAD              # commit hash
git branch --show-current       # branch name
```

### Step 3: Generate Description

1. If description provided in `$ARGUMENTS`, use it
2. Otherwise, generate from current task context
3. Create slug: lowercase, hyphens, no special chars

### Step 4: Create Handoff Document

**Location**: `.opencode/thoughts/handoffs/YYYY-MM-DD_HH-MM-SS_{slug}.md`

```markdown
---
date: "[ISO 8601 timestamp]"
author: opencode
type: handoff
topic: "[description]"
status: in_progress
git_commit: "[commit hash]"
git_branch: "[branch name]"
related_plan: "[path to plan if exists]"
related_research: "[path to research if exists]"
---

# Handoff: [Description]

## Task Summary

[What we were working on - 2-3 sentences]

## Current Status

[Where we are in the process]

### Progress

- [x] [Completed item with details]
- [x] [Completed item with details]
- [ ] [In progress item - where we stopped]
- [ ] [Remaining item]
- [ ] [Remaining item]

## Critical Context

### Key Decisions Made

| Decision     | Rationale           |
| ------------ | ------------------- |
| [Decision 1] | [Why we chose this] |
| [Decision 2] | [Why we chose this] |

### Important Discoveries

- [Discovery that affects implementation]
- [Constraint we found]

### Gotchas / Warnings

- ⚠️ [Thing to watch out for]
- ⚠️ [Potential issue]

## Files Modified

| File               | Changes   | Status      |
| ------------------ | --------- | ----------- |
| `path/to/file1.ts` | [Summary] | Complete    |
| `path/to/file2.ts` | [Summary] | In Progress |

## Uncommitted Changes

[Output of git status if there are changes]

## Related Artifacts

- **Plan**: `[path]`
- **Research**: `[path]`
- **Previous Handoff**: `[path if exists]`

## How to Resume

```
/resume .opencode/thoughts/handoffs/[this-file].md
```

## Immediate Next Steps

1. [First thing to do when resuming]
2. [Second thing to do]
3. [Third thing to do]

## Notes

[Any other relevant information, context, or thoughts]
```

### Step 5: Confirm Creation

```markdown
## Handoff Created

**File**: `.opencode/thoughts/handoffs/YYYY-MM-DD_HH-MM-SS_{slug}.md`

### Summary

- **Task**: [description]
- **Status**: [where we stopped]
- **Next Steps**: [immediate next action]

### To Resume

```
/resume .opencode/thoughts/handoffs/YYYY-MM-DD_HH-MM-SS_{slug}.md
```

Session can now be safely ended.
```

## Constraints

- Include ALL uncommitted changes
- Reference all related documents
- Be specific about where we stopped
- Include enough context to resume without re-reading everything
- Don't include sensitive information
