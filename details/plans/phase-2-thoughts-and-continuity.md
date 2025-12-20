# Phase 2 Implementation Plan: Thoughts System & Continuity Commands

**Date**: 2025-12-20  
**Status**: Ready for Implementation  
**Depends on**: Phase 1 completion and validation

---

## Overview

Phase 2 adds persistence and session continuity to the Research → Plan → Implement workflow. This includes a thoughts directory system for storing artifacts and 4 new commands for plan lifecycle management and session handoffs.

## Scope

**In Scope (Phase 2):**

- Thoughts directory structure (`.opencode/thoughts/`)
- 4 new slash commands: `/iterate`, `/validate`, `/handoff`, `/resume`
- `/init-hl-repo` command for repository initialization
- Test plan/checklist document
- Auto-generated metadata from git

**Out of Scope (Phase 3+):**

- Global agent installation
- GitHub permalink generation
- Issue tracker integrations
- Cross-project thoughts
- Context utilization monitoring

## Directory Structure (After Phase 2)

```
humanlayer/.opencode/
├── agent/
│   ├── research-humanlayer.md            (Phase 1 - primary agent)
│   ├── plan-humanlayer.md                (Phase 1 - primary agent)
│   └── subagents/
│       └── research/
│           ├── codebase-locator.md      (Phase 1)
│           ├── codebase-analyzer.md     (Phase 1)
│           └── pattern-finder.md        (Phase 1)
├── command/
│   ├── research.md                      (Phase 1)
│   ├── plan.md                          (Phase 1)
│   ├── implement.md                     (Phase 1)
│   ├── iterate.md                       (Phase 2)
│   ├── validate.md                      (Phase 2)
│   ├── handoff.md                       (Phase 2)
│   ├── resume.md                        (Phase 2)
│   └── init-hl-repo.md                  (Phase 2)
└── thoughts/
    ├── research/
    │   └── .gitkeep
    ├── plans/
    │   └── .gitkeep
    └── handoffs/
        └── .gitkeep
```

---

## Phase 2.1: Thoughts Directory System

### Purpose

Persistent storage for workflow artifacts that survives context resets and enables session continuity.

### Directory Structure

```
.opencode/thoughts/
├── research/
│   └── YYYY-MM-DD-{topic-slug}.md
├── plans/
│   └── YYYY-MM-DD-{feature-slug}.md
└── handoffs/
    └── YYYY-MM-DD_HH-MM-SS_{description}.md
```

### File Naming Conventions

| Type     | Pattern                                | Example                             |
| -------- | -------------------------------------- | ----------------------------------- |
| Research | `YYYY-MM-DD-{topic-slug}.md`           | `2025-12-20-auth-flow.md`           |
| Plans    | `YYYY-MM-DD-{feature-slug}.md`         | `2025-12-20-add-oauth.md`           |
| Handoffs | `YYYY-MM-DD_HH-MM-SS_{description}.md` | `2025-12-20_14-30-00_oauth-impl.md` |

### Auto-Generated YAML Frontmatter

All thoughts documents include auto-generated frontmatter:

```yaml
---
date: "2025-12-20T14:30:00Z" # From system time
author: opencode # Fixed value
type: research | plan | handoff # Based on directory
topic: "Brief description" # From command argument
status: complete | in_progress # Based on context
git_commit: abc123def456 # From: git rev-parse HEAD
git_branch: feature/oauth # From: git branch --show-current
---
```

### Git Metadata Retrieval

Commands must fetch git info before writing documents:

```bash
# Get current commit hash
git rev-parse HEAD

# Get current branch name
git branch --show-current
```

### Implementation Notes

- Phase 1 commands (`/research`, `/plan`) need updating to save to thoughts directory
- New commands must save to appropriate subdirectory
- Slug generation: lowercase, hyphens for spaces, remove special chars

---

## Phase 2.2: Slash Commands

### Command Design Decisions

For Phase 2 commands, we need to decide:
1. **Which agent should handle each command?**
2. **Should any commands run as subtasks to avoid polluting context?**

| Command | Agent | Subtask? | Rationale |
|---------|-------|----------|-----------|
| `/iterate` | `plan (humanlayer)` | No | Modifying plans is a planning activity, needs full context |
| `/validate` | `plan (humanlayer)` | No | Validation is read-only analysis, fits plan (humanlayer) agent |
| `/handoff` | (current) | Yes | Quick doc creation, shouldn't pollute primary context |
| `/resume` | (current) | No | Needs to restore context to primary session |
| `/init-hl-repo` | (current) | Yes | One-off setup task, doesn't need to persist in context |

### File 1: `.opencode/command/iterate.md`

**Purpose**: Update an existing implementation plan based on feedback.

> **Key**: Routes to `plan (humanlayer)` agent - iterating on plans is a planning activity.

````markdown
---
description: "Update an existing implementation plan based on feedback"
agent: plan-humanlayer
---

# Iterate Plan Command

Iterate on the plan with: `$ARGUMENTS`

If no path given, find most recent plan in `.opencode/thoughts/plans/`.
If no feedback given, ask user what to change.

## Philosophy

Make surgical edits, not rewrites:

- Preserve existing structure where possible
- Only research if changes require new technical understanding
- Update cross-references in related documents
- Maintain plan integrity and testability

## Process

### Step 1: Parse Input

1. Extract plan path and feedback from: `$ARGUMENTS`
2. If no path given, find most recent plan in `.opencode/thoughts/plans/`
3. If no feedback given, ask user what to change

### Step 2: Load Context

1. Read the plan file COMPLETELY
2. Understand the full context before making changes
3. Identify which sections are affected by feedback

### Step 3: Analyze Feedback

Determine the scope of changes needed:

| Feedback Type      | Scope  | Action                                     |
| ------------------ | ------ | ------------------------------------------ |
| Scope change       | High   | May need new research, restructure phases  |
| Technical approach | Medium | Update specific phase, verify dependencies |
| Clarification      | Low    | Update wording, add details                |
| Add/remove phase   | Medium | Restructure, update numbering              |
| Success criteria   | Low    | Update verification section                |

### Step 4: Research if Needed

Only spawn research subagents if:

- Feedback introduces new technical requirements
- Need to verify feasibility of changes
- Must find new patterns to follow

Do NOT research just to re-verify existing content.

### Step 5: Present Approach

Before editing, explain:

\`\`\`markdown

## Proposed Changes to Plan

### Understanding

I understand you want to: [paraphrase feedback]

### Changes I'll Make:

1. **[Section]**: [what will change]
2. **[Section]**: [what will change]

### What Stays the Same:

- [Unchanged sections]

### Questions (if any):

- [Clarification needed]

**Proceed with these changes?**
\`\`\`

### Step 6: Make Edits

1. Use Edit tool for precise changes
2. Don't rewrite entire sections unnecessarily
3. Preserve existing structure where possible
4. Update phase numbering if phases added/removed
5. Update cross-references to other documents

### Step 7: Update Frontmatter

Update the plan's frontmatter:

```yaml
status: in_progress # or back to draft if major changes
last_modified: "YYYY-MM-DDTHH:MM:SSZ"
last_modified_by: opencode
```
````

### Step 8: Present Summary

\`\`\`markdown

## Plan Updated

### Changes Made:

1. **[Section]**: [what changed]
2. **[Section]**: [what changed]

### Unchanged:

- [Sections that remain valid]

### Updated Plan:

`.opencode/thoughts/plans/YYYY-MM-DD-feature.md`

### Next Steps:

- Review the updated plan
- Run `/implement` when ready to proceed
  \`\`\`

## Constraints

- Never delete content without explicit approval
- Always show diff summary before confirming
- Maintain phase testability
- Keep success criteria aligned with changes

````


---

### File 2: `.opencode/command/validate.md`

**Purpose**: Verify that implementation matches the plan and all success criteria pass.

> **Key**: Routes to `plan (humanlayer)` agent - validation is read-only analysis.

```markdown
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

\`\`\`markdown
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
\`\`\`

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
````

---

### File 3: `.opencode/command/handoff.md`

**Purpose**: Create a handoff document for transferring work to another session.

> **Key**: Runs as subtask to avoid polluting primary context. Uses current agent.

````markdown
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
````

### Step 3: Generate Description

1. If description provided in `$ARGUMENTS`, use it
2. Otherwise, generate from current task context
3. Create slug: lowercase, hyphens, no special chars

### Step 4: Create Handoff Document

**Location**: `.opencode/thoughts/handoffs/YYYY-MM-DD_HH-MM-SS_{slug}.md`

## \`\`\`markdown

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

\`\`\`
/resume .opencode/thoughts/handoffs/[this-file].md
\`\`\`

## Immediate Next Steps

1. [First thing to do when resuming]
2. [Second thing to do]
3. [Third thing to do]

## Notes

[Any other relevant information, context, or thoughts]
\`\`\`

### Step 5: Confirm Creation

\`\`\`markdown

## Handoff Created

**File**: `.opencode/thoughts/handoffs/YYYY-MM-DD_HH-MM-SS_{slug}.md`

### Summary

- **Task**: [description]
- **Status**: [where we stopped]
- **Next Steps**: [immediate next action]

### To Resume

\`\`\`
/resume .opencode/thoughts/handoffs/YYYY-MM-DD*HH-MM-SS*{slug}.md
\`\`\`

Session can now be safely ended.
\`\`\`

## Constraints

- Include ALL uncommitted changes
- Reference all related documents
- Be specific about where we stopped
- Include enough context to resume without re-reading everything
- Don't include sensitive information

````

---

### File 4: `.opencode/command/resume.md`

**Purpose**: Resume work from a handoff document with full context analysis.

> **Key**: Uses current agent (not subtask) - needs to restore context to primary session.

```markdown
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
````

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
3. Note what context is available

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

\`\`\`markdown

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
\`\`\`

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

````

---

### File 5: `.opencode/command/init-hl-repo.md`

**Purpose**: Initialize a repository with HumanLayer workflow structure.

> **Key**: Runs as subtask - one-off setup task that doesn't need to persist in context.

```markdown
---
description: "Initialize repository with HumanLayer workflow structure"
subtask: true
---

# Initialize HumanLayer Repository Command

Initialize this repository with the HumanLayer workflow structure.

## Purpose
Set up a repository with the complete HumanLayer Research → Plan → Implement workflow structure.

## Process

### Step 1: Check Existing Structure
1. Check if `.opencode/` directory exists
2. If exists, ask user:
   - Overwrite all?
   - Merge (skip existing)?
   - Cancel?

### Step 2: Verify Git Repository
```bash
git rev-parse --git-dir
````

If not a git repo, warn user but continue.

### Step 3: Create Directory Structure

\`\`\`
.opencode/
├── agent/
│ └── subagents/
│ └── research/
├── command/
└── thoughts/
├── research/
├── plans/
└── handoffs/
\`\`\`

### Step 4: Create Agent Files

Copy these files to `.opencode/agent/subagents/research/`:

1. `codebase-locator.md`
2. `codebase-analyzer.md`
3. `pattern-finder.md`

[Use the content from Phase 1 plan or read from existing installation]

### Step 5: Create Command Files

Copy these files to `.opencode/command/`:

1. `research.md`
2. `plan.md`
3. `implement.md`
4. `iterate.md`
5. `validate.md`
6. `handoff.md`
7. `resume.md`

[Use the content from Phase 1 and Phase 2 plans]

### Step 6: Create .gitkeep Files

Create `.gitkeep` in empty directories:

- `.opencode/thoughts/research/.gitkeep`
- `.opencode/thoughts/plans/.gitkeep`
- `.opencode/thoughts/handoffs/.gitkeep`

### Step 7: Create README

Create `.opencode/README.md`:

\`\`\`markdown

# OpenCode HumanLayer Workflow

This directory contains the HumanLayer Research → Plan → Implement workflow for AI-assisted development.

## Quick Start

1. **Research**: `/research [topic]` - Understand the codebase
2. **Plan**: `/plan [feature]` - Create implementation plan
3. **Implement**: `/implement [plan]` - Execute the plan

## Directory Structure

\`\`\`
.opencode/
├── agent/subagents/research/ # Research subagents
├── command/ # Slash commands
└── thoughts/ # Persistent artifacts
├── research/ # Research documents
├── plans/ # Implementation plans
└── handoffs/ # Session handoffs
\`\`\`

## Commands

| Command                      | Purpose                              |
| ---------------------------- | ------------------------------------ |
| `/research [topic]`          | Comprehensive codebase research      |
| `/plan [feature]`            | Create phased implementation plan    |
| `/implement [plan]`          | Execute plan with verification gates |
| `/iterate [plan] [feedback]` | Update existing plan                 |
| `/validate [plan]`           | Verify implementation matches plan   |
| `/handoff`                   | Create session handoff document      |
| `/resume [handoff]`          | Resume from handoff                  |

## Workflow

1. **Research Phase**: Understand the codebase before making changes
2. **Planning Phase**: Create detailed, phased implementation plan
3. **Implementation Phase**: Execute plan with human verification at each phase
4. **Validation Phase**: Verify implementation matches plan

## Context Management

This workflow uses "Frequent Intentional Compaction":

- Keep context utilization at 40-60%
- Use subagents for heavy searching
- Store findings in thoughts directory
- Use handoffs for session continuity

## References

- [HumanLayer 12-Factor Agents](https://github.com/humanlayer/12-factor-agents)
- [OpenCode Documentation](https://opencode.ai/docs)
  \`\`\`

### Step 8: Present Summary

\`\`\`markdown

## Repository Initialized

### Structure Created

\`\`\`
.opencode/
├── agent/subagents/research/
│ ├── codebase-locator.md
│ ├── codebase-analyzer.md
│ └── pattern-finder.md
├── command/
│ ├── research.md
│ ├── plan.md
│ ├── implement.md
│ ├── iterate.md
│ ├── validate.md
│ ├── handoff.md
│ └── resume.md
├── thoughts/
│ ├── research/
│ ├── plans/
│ └── handoffs/
└── README.md
\`\`\`

### Next Steps

1. Review `.opencode/README.md` for usage guide
2. Try `/research [topic]` to explore your codebase
3. Use `/plan [feature]` to plan your first implementation

### Optional: Add to .gitignore

Consider adding to `.gitignore`:
\`\`\`

# OpenCode session artifacts (optional)

# .opencode/thoughts/handoffs/

\`\`\`

Ready to use the HumanLayer workflow!
\`\`\`

## Constraints

- Don't overwrite without permission
- Create all directories even if empty
- Include .gitkeep files for empty directories
- Provide clear next steps

````

---

## Phase 2.3: Update Phase 1 Commands

### Updates to `/research` Command

The `/research` command needs to save output to thoughts directory:

**Add to research.md after Step 4 (Generate Research Report):**

```markdown
### Step 4b: Save to Thoughts Directory

1. Get git metadata:
   ```bash
   git rev-parse HEAD
   git branch --show-current
````

2. Generate filename:

   - Date: YYYY-MM-DD
   - Slug: topic in lowercase with hyphens
   - Example: `2025-12-20-authentication-flow.md`

3. Create frontmatter:

   ```yaml
   ---
   date: "[timestamp]"
   author: opencode
   type: research
   topic: "[research question]"
   status: complete
   git_commit: "[hash]"
   git_branch: "[branch]"
   ---
   ```

4. Save to: `.opencode/thoughts/research/YYYY-MM-DD-{slug}.md`

5. Inform user of saved location

````

### Updates to `/plan` Command

The `/plan` command needs to save output to thoughts directory:

**Add to plan.md after Step 5 (Present Plan):**

```markdown
### Step 5b: Save to Thoughts Directory

1. Get git metadata:
   ```bash
   git rev-parse HEAD
   git branch --show-current
````

2. Generate filename:

   - Date: YYYY-MM-DD
   - Slug: feature in lowercase with hyphens
   - Example: `2025-12-20-add-rate-limiting.md`

3. Create frontmatter:

   ```yaml
   ---
   date: "[timestamp]"
   author: opencode
   type: plan
   topic: "[feature description]"
   status: draft
   git_commit: "[hash]"
   git_branch: "[branch]"
   related_research: "[path if exists]"
   ---
   ```

4. Save to: `.opencode/thoughts/plans/YYYY-MM-DD-{slug}.md`

5. Inform user of saved location

````

---

## Phase 2.4: Test Plan

### Test Checklist Document

Create `.development/test-plans/phase-2-test-checklist.md`:

```markdown
# Phase 2 Test Checklist

## Prerequisites
- [ ] Phase 1 agents and commands are working
- [ ] Git repository initialized
- [ ] `.opencode/` directory structure exists

---

## 1. Thoughts Directory System

### 1.1 Directory Structure
- [ ] `.opencode/thoughts/research/` exists
- [ ] `.opencode/thoughts/plans/` exists
- [ ] `.opencode/thoughts/handoffs/` exists
- [ ] `.gitkeep` files present in empty directories

### 1.2 File Naming
- [ ] Research files use `YYYY-MM-DD-{slug}.md` format
- [ ] Plan files use `YYYY-MM-DD-{slug}.md` format
- [ ] Handoff files use `YYYY-MM-DD_HH-MM-SS_{slug}.md` format
- [ ] Slugs are lowercase with hyphens

### 1.3 Frontmatter Generation
- [ ] `date` is ISO 8601 format
- [ ] `git_commit` matches current commit
- [ ] `git_branch` matches current branch
- [ ] `type` is correct (research/plan/handoff)
- [ ] `status` is set appropriately

---

## 2. /iterate Command

### 2.1 Agent Routing
- [ ] Routes to `plan (humanlayer)` agent (verify agent indicator)
- [ ] Has read-only permissions (cannot edit codebase files)

### 2.2 Basic Functionality
- [ ] Can load plan by path: `/iterate .opencode/thoughts/plans/test.md change X`
- [ ] Can find most recent plan: `/iterate change X`
- [ ] Asks for feedback if not provided: `/iterate`

### 2.3 Edit Behavior
- [ ] Shows proposed changes before editing
- [ ] Makes surgical edits (not full rewrites)
- [ ] Preserves unchanged sections
- [ ] Updates frontmatter `last_modified`

### 2.4 Edge Cases
- [ ] Handles plan not found gracefully
- [ ] Handles empty feedback gracefully
- [ ] Spawns research only when needed

---

## 3. /validate Command

### 3.1 Agent Routing
- [ ] Routes to `plan (humanlayer)` agent (verify agent indicator)
- [ ] Has read-only permissions (analysis only)

### 3.2 Basic Functionality
- [ ] Can load plan by path
- [ ] Can find most recent plan
- [ ] Runs all automated verification commands

### 3.3 Report Generation
- [ ] Shows implementation status per phase
- [ ] Shows automated check results
- [ ] Lists matches and deviations
- [ ] Provides verdict (PASS/PASS WITH NOTES/NEEDS WORK)

### 3.4 Verification Depth
- [ ] Reads files mentioned in plan
- [ ] Compares actual vs expected changes
- [ ] Identifies missing implementations
- [ ] Notes additional changes not in plan

---

## 4. /handoff Command

### 4.1 Subtask Behavior
- [ ] Runs as subtask (doesn't pollute primary context)
- [ ] Results are returned to primary session

### 4.2 Basic Functionality
- [ ] Creates handoff file in correct location
- [ ] Uses correct filename format
- [ ] Generates proper frontmatter

### 4.3 Content Completeness
- [ ] Includes current todo list
- [ ] Includes git status
- [ ] Includes files modified
- [ ] Includes key decisions
- [ ] Includes next steps

### 4.4 Edge Cases
- [ ] Works with no active todos
- [ ] Works with no uncommitted changes
- [ ] Includes custom description if provided

---

## 5. /resume Command

### 5.1 Session Behavior
- [ ] Runs in primary context (NOT subtask)
- [ ] Context persists after command completes

### 5.2 Basic Functionality
- [ ] Can load handoff by path
- [ ] Lists recent handoffs if no path
- [ ] Reads handoff completely

### 5.3 State Verification
- [ ] Compares current commit vs handoff commit
- [ ] Identifies what changed since handoff
- [ ] Loads related plan/research

### 5.4 Context Restoration
- [ ] Creates todo list from remaining items
- [ ] Notes completed items
- [ ] Highlights gotchas/warnings

### 5.5 Edge Cases
- [ ] Handles stale handoff (>1 week old)
- [ ] Handles missing related documents
- [ ] Handles diverged codebase

---

## 6. /init-hl-repo Command

### 6.1 Subtask Behavior
- [ ] Runs as subtask (one-off setup)
- [ ] Results are returned to primary session

### 6.2 Fresh Repository
- [ ] Creates complete directory structure
- [ ] Creates all agent files (including primary agents)
- [ ] Creates all command files
- [ ] Creates .gitkeep files
- [ ] Creates README.md

### 6.3 Existing Repository
- [ ] Detects existing `.opencode/` directory
- [ ] Asks before overwriting
- [ ] Merge option works correctly

### 6.4 Content Verification
- [ ] Primary agent files have correct YAML frontmatter
- [ ] Subagent files have correct YAML frontmatter
- [ ] Command files route to correct agents
- [ ] README has accurate information

---

## 7. Updated Phase 1 Commands

### 7.1 /research Saves to Thoughts
- [ ] Creates file in `.opencode/thoughts/research/`
- [ ] Uses correct filename format
- [ ] Includes proper frontmatter
- [ ] Reports saved location to user

### 7.2 /plan Saves to Thoughts
- [ ] Creates file in `.opencode/thoughts/plans/`
- [ ] Uses correct filename format
- [ ] Includes proper frontmatter
- [ ] Reports saved location to user

---

## 8. Integration Tests

### 8.1 Full Workflow
- [ ] `/research` → creates research doc
- [ ] `/plan` → creates plan doc, references research
- [ ] `/implement` → executes plan phases
- [ ] `/validate` → verifies implementation
- [ ] `/handoff` → creates handoff doc
- [ ] (new session) `/resume` → restores context

### 8.2 Iteration Workflow
- [ ] `/plan` → creates plan
- [ ] `/iterate [feedback]` → updates plan
- [ ] `/validate` → still works with updated plan

---

## Test Execution Notes

### How to Test Each Command

1. **Prepare test environment**:
   ```bash
   cd humanlayer
   git checkout -b test-phase-2
````

2. **Test each command** in order above

3. **Check files created** after each command:

   ```bash
   ls -la .opencode/thoughts/research/
   ls -la .opencode/thoughts/plans/
   ls -la .opencode/thoughts/handoffs/
   ```

4. **Verify frontmatter** in created files:

   ```bash
   head -20 .opencode/thoughts/research/*.md
   ```

5. **Clean up** after testing:
   ```bash
   git checkout main
   git branch -D test-phase-2
   ```

---

## Known Limitations

- Commands assume git repository exists
- No validation of model availability
- No cross-project thoughts support
- Manual cleanup of old thoughts required

```

---

## Success Criteria for Phase 2

### Automated Verification
- [ ] All 5 new command files created
- [ ] All Phase 1 command files updated
- [ ] Thoughts directory structure created
- [ ] Test checklist document created
- [ ] YAML frontmatter valid in all files

### Manual Verification
- [ ] `/iterate` routes to `plan (humanlayer)` agent (read-only)
- [ ] `/iterate` makes surgical plan edits
- [ ] `/validate` routes to `plan (humanlayer)` agent (read-only)
- [ ] `/validate` produces comprehensive report
- [ ] `/handoff` runs as subtask (doesn't pollute context)
- [ ] `/handoff` captures complete context
- [ ] `/resume` runs in primary context (not subtask)
- [ ] `/resume` restores session state
- [ ] `/init-hl-repo` runs as subtask
- [ ] `/init-hl-repo` creates full structure
- [ ] Frontmatter includes correct git metadata
- [ ] Files saved to correct locations

---

## Implementation Order

1. Create thoughts directory structure (`.opencode/thoughts/`)
2. Create `/iterate` command
3. Create `/validate` command
4. Create `/handoff` command
5. Create `/resume` command
6. Create `/init-hl-repo` command
7. Update `/research` to save to thoughts
8. Update `/plan` to save to thoughts
9. Create test checklist document
10. Run through test checklist
11. Document any issues found

---

## Continuation Instructions for Phase 3

See `.development/plans/phase-3-thoughts-agents-and-git-workflow.md` for:

1. **Thoughts Subagents** - `thoughts-locator`, `thoughts-analyzer`
2. **Git/PR Commands** - `/commit`, `/describe_pr`, `/local_review`
3. **Oneshot Command** - `/oneshot` for streamlined execution

Future phases (Phase 4+) may include:
- Global Agent Installation
- GitHub Permalink Generation
- Issue Tracker Integration (Linear, GitHub Issues)
- Thoughts Sync (cross-machine/team)
- Context Utilization Monitoring
- Web Search Researcher
- Debug Command
```
