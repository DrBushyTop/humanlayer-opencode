---
description: "Create phased implementation plan with human verification gates"
agent: plan-humanlayer
---

# Create Plan Command

Create an implementation plan for: `$ARGUMENTS`

## Process

### Step 1: Context Gathering
1. Parse the planning request: `$ARGUMENTS`
2. Check if research exists (ask user if unsure)
3. If no research: suggest running `/research` first, or do quick research
4. Read all relevant files mentioned

### Step 2: Research & Discovery
1. Spawn research subagents if needed:
   - codebase-locator: Find files that will be modified
   - codebase-analyzer: Understand current implementation
   - pattern-finder: Find similar implementations to follow
2. Create research todo list with TodoWrite
3. Present findings to user

### Step 3: Interactive Planning
1. Present understanding to user
2. Ask clarifying questions:
   - What's the priority?
   - Are there constraints?
   - What's out of scope?
3. Propose approach options if multiple valid paths
4. Get user feedback before detailed planning

### Step 4: Plan Development
Structure the plan in phases:
- Each phase is independently testable
- Each phase has clear success criteria
- Pause points between phases for verification

### Step 5: Present Plan
Output the plan in this format:

```markdown
# [Feature/Task Name] Implementation Plan

## Overview
[What we're building and why - 2-3 sentences]

## Current State Analysis
[How things work today, with code references]

## Desired End State
[What success looks like]

### Key Discoveries
[Important findings from research that inform the approach]

## What We're NOT Doing
[Explicit scope boundaries - what's out of scope]

## Implementation Approach
[High-level strategy - why this approach over alternatives]

---

## Phase 1: [Descriptive Name]

### Overview
[What this phase accomplishes - 1-2 sentences]

### Changes Required

#### 1. [Component/File Group]

**File**: `path/to/file.ext`

**Changes**: [Summary of what changes]

```[language]
// Code to add or modify
```

**Why**: [Brief explanation]

### Success Criteria

#### Automated Verification
- [ ] Build passes: `[build command]`
- [ ] Tests pass: `[test command]`
- [ ] Type check: `[typecheck command]`

#### Manual Verification
- [ ] [Specific behavior to verify]
- [ ] [Edge case to test]

**⏸️ PAUSE**: Wait for human verification before Phase 2

---

## Phase 2: [Name]
[Same structure as Phase 1]

---

## Testing Strategy

### Unit Tests
- [ ] [Test case]: [what it verifies]

### Integration Tests
- [ ] [Test case]: [what it verifies]

## Risks and Mitigations
| Risk | Mitigation |
|------|------------|
| [Risk 1] | [How to handle] |

## References
- Research: [link if exists]
- Related docs: [links]
```

### Step 5b: Save to Thoughts Directory

1. Get git metadata:
   ```bash
   git rev-parse HEAD
   git branch --show-current
   ```

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

### Step 6: Iterate Based on Feedback
1. Wait for user feedback on plan
2. Adjust phases, scope, or approach as needed
3. Ensure no open questions remain before implementation
