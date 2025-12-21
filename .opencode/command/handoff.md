---
description: "Create handoff document for session continuity"
subtask: true
tools:
  bash: true
---

# Handoff Command

Create a handoff document. Optional arguments: `$ARGUMENTS`

**Argument formats:**
- `/handoff` - Create handoff with auto-generated description
- `/handoff some description` - Create handoff with given description
- `/handoff TICKET-123` - Create handoff for ticket TICKET-123
- `/handoff TICKET-123 some description` - Create handoff for ticket with description

## Purpose

Create a comprehensive handoff document that captures current work state, enabling seamless continuation in a new session.

## When to Use

- Session ending mid-task
- Switching to different work
- Complex state that needs preservation
- Context getting too large
- Handing off to another person/agent

## Process

### Step 1: Parse Arguments

Parse `$ARGUMENTS` to extract:
1. **Ticket number** (optional): Pattern like `ENG-1234`, `TICKET-123`, `ISSUE-456`, etc.
2. **Description** (optional): Remaining text after ticket extraction

```
Examples:
- "" → ticket=null, description=auto-generate
- "add oauth support" → ticket=null, description="add oauth support"
- "ENG-2166" → ticket="ENG-2166", description=auto-generate
- "ENG-2166 add oauth support" → ticket="ENG-2166", description="add oauth support"
```

### Step 2: Gather Metadata

**First**, run the spec_metadata script to gather all metadata at once:

```bash
.opencode/scripts/spec_metadata.sh
```

This provides:
- `Current Date/Time (TZ)` - ISO timestamp with timezone
- `Current Git Commit Hash` - for frontmatter
- `Current Branch Name` - for frontmatter
- `Repository Name` - for frontmatter
- `Timestamp For Filename` - formatted as `YYYY-MM-DD_HH-MM-SS`
- `Thoughts Status` - if humanlayer CLI is available

**If the script is not available or fails**, fall back to git commands:

```bash
git rev-parse HEAD              # commit hash
git branch --show-current       # branch name
date '+%Y-%m-%d_%H-%M-%S'       # timestamp for filename
```

### Step 3: Gather Context

1. Read current todo list with TodoRead
2. Check git status: `git status`
3. Check recent commits: `git log --oneline -n 5`
4. Identify any open files or active work

### Step 4: Generate Description

1. If description provided in arguments, use it
2. Otherwise, generate from current task context
3. Create slug: lowercase, hyphens, no special chars

### Step 5: Create Handoff Document

**Location** (based on ticket presence):

- **With ticket**: `.opencode/thoughts/shared/handoffs/{TICKET}/YYYY-MM-DD_HH-MM-SS_{TICKET}_{slug}.md`
- **Without ticket**: `.opencode/thoughts/shared/handoffs/general/YYYY-MM-DD_HH-MM-SS_{slug}.md`

**Examples**:
- With ticket: `.opencode/thoughts/shared/handoffs/ENG-2166/2025-01-08_13-55-22_ENG-2166_add-oauth-support.md`
- Without ticket: `.opencode/thoughts/shared/handoffs/general/2025-01-08_13-55-22_add-oauth-support.md`

**Document Template**:

```markdown
---
date: "[ISO 8601 timestamp with timezone]"
author: opencode
type: handoff
topic: "[description]"
status: in_progress
ticket: "[ticket number or null]"
git_commit: "[commit hash]"
git_branch: "[branch name]"
repository: "[repository name]"
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
/resume [path-to-this-file]
```

Or by ticket:

```
/resume [TICKET]
```

## Immediate Next Steps

1. [First thing to do when resuming]
2. [Second thing to do]
3. [Third thing to do]

## Notes

[Any other relevant information, context, or thoughts]
```

### Step 6: Ensure Directory Exists

Before writing, ensure the target directory exists:

```bash
mkdir -p .opencode/thoughts/shared/handoffs/{TICKET-or-general}
```

### Step 7: Confirm Creation

```markdown
## Handoff Created

**File**: `.opencode/thoughts/shared/handoffs/{path}`

### Summary

- **Task**: [description]
- **Ticket**: [ticket or "none"]
- **Status**: [where we stopped]
- **Next Steps**: [immediate next action]

### To Resume

By path:
```
/resume .opencode/thoughts/shared/handoffs/{path}
```

By ticket (if applicable):
```
/resume {TICKET}
```

Session can now be safely ended.
```

## Constraints

- Include ALL uncommitted changes
- Reference all related documents
- Be specific about where we stopped
- Include enough context to resume without re-reading everything
- Don't include sensitive information
- Use `file:line` references instead of large code blocks
