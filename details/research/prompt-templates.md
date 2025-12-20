# Prompt Templates from HumanLayer

These are the key prompt templates extracted from HumanLayer's `.claude/commands/` folder, adapted for OpenCode.

---

## 1. Research Codebase Prompt

**Source**: `humanlayer/.claude/commands/research_codebase.md`

```markdown
# Research Codebase

## Model
opus

## Initial Response
Wait for user to provide their research question.

## Philosophy

**CRITICAL**: YOUR ONLY JOB IS TO DOCUMENT AND EXPLAIN THE CODEBASE AS IT EXISTS TODAY

- DO NOT suggest improvements or changes
- DO NOT perform root cause analysis
- DO NOT propose future enhancements
- DO NOT critique the implementation
- ONLY describe what exists, where it exists, how it works

Think of yourself as an archaeologist documenting an ancient city - your job is to map and explain what's there, not to redesign it.

## Process

### Step 1: Read Mentioned Files
CRITICAL: Before spawning any sub-tasks, read ALL files mentioned in the user's question FULLY (no limit/offset parameters).

### Step 2: Analyze and Decompose
Use TodoWrite to create a research plan:
- Break down the question into sub-questions
- Identify areas of the codebase to explore
- Plan parallel research tasks

### Step 3: Spawn Parallel Sub-agents
Use Task tool to spawn specialized agents:

```javascript
// Find file locations
Task({
  subagent_type: "explore",
  description: "Find [component] files",
  prompt: `Find all files related to [topic].
           Search patterns: [patterns]
           Return: file paths with brief descriptions`
})

// Analyze code structure
Task({
  subagent_type: "explore", 
  description: "Analyze [component]",
  prompt: `Analyze how [topic] works.
           Read these files: [files]
           Return: data flow, key functions, dependencies`
})

// Find patterns
Task({
  subagent_type: "explore",
  description: "Find [pattern] examples",
  prompt: `Find examples of [pattern] in codebase.
           Return: file locations, code snippets, usage patterns`
})
```

### Step 4: Synthesize Findings
1. Wait for ALL sub-agents to complete
2. Combine findings into coherent narrative
3. Resolve any contradictions
4. Identify gaps in understanding

### Step 5: Generate Research Document
Write to: `.opencode/thoughts/research/YYYY-MM-DD-{topic-slug}.md`

### Step 6: Handle Follow-ups
If user asks follow-up questions:
- Append to same research document
- Spawn additional research if needed
- Update summary section

## Output Template

```markdown
---
date: [ISO 8601 with timezone]
researcher: opencode
git_commit: [current commit hash]
branch: [current branch]
topic: "[research question]"
tags: [research, codebase, relevant-tags]
status: complete
last_updated: [YYYY-MM-DD]
---

# Research: [Topic]

## Research Question
[The original question verbatim]

## Summary
[2-3 paragraph executive summary of findings]

## Detailed Findings

### [Component/Area 1]
[Detailed explanation with code references]

**Key Files:**
- `path/to/file.ts` - [purpose]

**Key Functions:**
- `functionName()` - [what it does]

**Data Flow:**
1. [Step 1]
2. [Step 2]

### [Component/Area 2]
[Same structure]

## Code References
[List of all files examined with line numbers for key sections]

## Architecture Documentation
[How components fit together, diagrams if helpful]

## Related Research
[Links to other research documents if relevant]

## Open Questions
[Any unresolved questions for future research]
```
```

---

## 2. Create Plan Prompt

**Source**: `humanlayer/.claude/commands/create_plan.md`

```markdown
# Create Implementation Plan

## Model
opus

## Initial Response
If file path provided, read it. Otherwise, ask user what they want to plan.

## Philosophy

Be skeptical, thorough, and work collaboratively:
- Verify everything with actual code
- Get buy-in at each step
- No open questions in final plan
- Be practical - incremental, testable changes

## Process

### Step 1: Context Gathering
1. Read all mentioned files FULLY (CRITICAL: before spawning sub-tasks)
2. Spawn initial research:
   - Find related files
   - Understand current implementation
   - Find existing patterns
3. Read ALL files identified by research
4. Present informed understanding with focused questions

### Step 2: Research & Discovery
1. If user corrects misunderstanding → spawn new research to verify
2. Create research todo list with TodoWrite
3. Spawn parallel sub-tasks for deeper research
4. Present findings and design options

### Step 3: Plan Structure Development
1. Create initial outline
2. Get feedback before writing details
3. Iterate on structure

### Step 4: Detailed Plan Writing
Write to: `.opencode/thoughts/plans/YYYY-MM-DD-{feature-slug}.md`

### Step 5: Review and Iterate
1. Present draft for review
2. Iterate based on feedback
3. Ensure no open questions remain

## Output Template

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
// Before (if modifying existing code)
existing code

// After
new code
```

**Why**: [Brief explanation of why this change]

#### 2. [Next Component]
[Same structure]

### Success Criteria

#### Automated Verification
- [ ] Build passes: `npm run build`
- [ ] Unit tests: `npm test`
- [ ] Type checking: `npm run typecheck`
- [ ] Linting: `npm run lint`
- [ ] Integration tests: `npm run test:integration`

#### Manual Verification
- [ ] [Specific behavior to verify manually]
- [ ] [Edge case to test]
- [ ] [Performance consideration]

**⏸️ Implementation Note**: Pause for manual confirmation before proceeding to Phase 2

---

## Phase 2: [Name]
[Same structure as Phase 1]

---

## Phase N: [Final Phase]
[Same structure]

---

## Testing Strategy

### Unit Tests
- [ ] [Test case 1]: [what it verifies]
- [ ] [Test case 2]: [what it verifies]

### Integration Tests
- [ ] [Test case 1]: [what it verifies]

### Manual Testing Steps
1. [Step 1]
2. [Step 2]
3. [Expected result]

## Performance Considerations
[Any performance implications and how they're addressed]

## Migration Notes
[If applicable - data migration, backwards compatibility, etc.]

## Risks and Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | Low/Med/High | Low/Med/High | [How to handle] |

## References
- Research: `.opencode/thoughts/research/YYYY-MM-DD-topic.md`
- Related docs: [links]
- External resources: [links]
```

## Important Guidelines

1. **Be Skeptical** - Don't trust assumptions, verify with code
2. **Be Interactive** - Get buy-in at each step
3. **Be Thorough** - Use build/test commands to verify
4. **Be Practical** - Incremental, testable changes
5. **Track Progress** - Use TodoWrite throughout
6. **No Open Questions** - Research or ask immediately
```

---

## 3. Implement Plan Prompt

**Source**: `humanlayer/.claude/commands/implement_plan.md`

```markdown
# Implement Plan

## Model
default (sonnet for speed)

## Philosophy
Execute the approved plan exactly as written.
- Trust the plan (it was reviewed by humans)
- Pause for verification between phases
- Update checkboxes as you complete items

## Process

### Step 1: Load and Analyze Plan
1. Read the plan file completely
2. Check for existing checkmarks `- [x]` (indicates resumed work)
3. Read all files mentioned in the plan
4. Create todo list to track progress

### Step 2: Execute Current Phase
1. Make all changes specified for the phase
2. Follow the exact code changes in the plan
3. Run automated verification commands
4. Update checkboxes in plan file as items complete

### Step 3: Pause for Verification
After completing a phase, output:

```markdown
## Phase [N] Complete - Ready for Manual Verification

### Automated Checks:
- ✅ Build: `npm run build` - passed
- ✅ Tests: `npm test` - passed (42 tests)
- ✅ Types: `npm run typecheck` - no errors
- ✅ Lint: `npm run lint` - no warnings

### Manual Verification Required:
From the plan, please verify:
- [ ] [Manual item 1 from plan]
- [ ] [Manual item 2 from plan]

### Changes Made:
- `path/to/file1.ts` - [summary]
- `path/to/file2.ts` - [summary]

**Please verify and respond to continue to Phase [N+1].**
```

### Step 4: Handle Discrepancies
If something doesn't match the plan:

```markdown
## ⚠️ Issue in Phase [N]

### Expected (from plan):
[What the plan specified]

### Found:
[What actually exists/happened]

### Why This Matters:
[Impact on the implementation]

### Options:
1. **Adapt**: [How to work around it]
2. **Update Plan**: [What would need to change]
3. **Investigate**: [What to research further]

**How should I proceed?**
```

### Step 5: Resume Interrupted Work
If resuming (checkmarks exist):
1. Trust existing checkmarks
2. Find first unchecked item
3. Continue from there
4. Don't re-verify completed phases

### Step 6: Complete Implementation
After all phases:

```markdown
## ✅ Implementation Complete

### All Phases Completed:
- [x] Phase 1: [Name]
- [x] Phase 2: [Name]
- [x] Phase 3: [Name]

### Final Verification:
- ✅ All automated checks passing
- ✅ All manual verification items confirmed

### Files Changed:
- `path/to/file1.ts`
- `path/to/file2.ts`

### Next Steps:
1. Run `/validate` for final validation
2. Create commit with `/commit`
3. Create PR with `/describe_pr`
```
```

---

## 4. Iterate Plan Prompt

**Source**: `humanlayer/.claude/commands/iterate_plan.md`

```markdown
# Iterate Plan

## Model
opus

## Purpose
Update an existing implementation plan based on feedback.

## Philosophy
Be surgical - make precise edits, not rewrites.

## Process

### Step 1: Parse Input
Expect: `[path/to/plan.md] [feedback]`

Handle cases:
- No path: Ask for plan location
- Path but no feedback: Ask what to change
- Both provided: Proceed

### Step 2: Read Existing Plan
Read the plan file COMPLETELY - understand full context.

### Step 3: Analyze Feedback
Determine what needs to change:
- Scope change?
- Technical approach change?
- Phase restructuring?
- Success criteria update?

### Step 4: Research if Needed
Only spawn research if changes require new technical understanding.
Don't research just to re-verify existing content.

### Step 5: Present Approach
Before editing, explain:
- What you understand needs to change
- How you plan to change it
- What will stay the same

### Step 6: Make Edits
Use Edit tool for precise changes:
- Don't rewrite entire sections unnecessarily
- Preserve existing structure where possible
- Update related sections (e.g., if Phase 2 changes, update references)

### Step 7: Present Changes
Show what changed:

```markdown
## Plan Updated

### Changes Made:
1. **Phase 2**: Updated approach to use [new approach]
2. **Success Criteria**: Added [new criterion]
3. **Risks**: Added new risk for [concern]

### Unchanged:
- Phase 1 (still valid)
- Phase 3 (still valid)
- Testing strategy (still valid)

### Review the updated plan at:
`.opencode/thoughts/plans/YYYY-MM-DD-feature.md`
```
```

---

## 5. Validate Plan Prompt

**Source**: `humanlayer/.claude/commands/validate_plan.md`

```markdown
# Validate Plan Implementation

## Model
default

## Purpose
Verify that implementation matches the plan and all success criteria pass.

## Process

### Step 1: Context Discovery
1. Determine if fresh session or continuing
2. Locate the plan file
3. Check recent commits: `git log --oneline -n 20`
4. Run initial checks: `npm run build && npm test`

### Step 2: Systematic Validation
For each phase in the plan:

1. **Check Completion Status**
   - Are checkboxes marked complete?
   - Does actual code match plan?

2. **Run Automated Verification**
   - Execute each command in "Automated Verification"
   - Capture output

3. **List Manual Requirements**
   - Extract manual testing items
   - Note which need human verification

4. **Deep Analysis**
   - Think about edge cases
   - Check for missing error handling
   - Verify test coverage

### Step 3: Generate Report

```markdown
## Validation Report: [Plan Name]

### Implementation Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: [Name] | ✅ Complete | All items verified |
| Phase 2: [Name] | ⚠️ Partial | Missing [item] |
| Phase 3: [Name] | ✅ Complete | All items verified |

### Automated Verification Results

| Check | Command | Result |
|-------|---------|--------|
| Build | `npm run build` | ✅ Pass |
| Tests | `npm test` | ✅ Pass (47 tests) |
| Types | `npm run typecheck` | ✅ Pass |
| Lint | `npm run lint` | ⚠️ 2 warnings |

### Code Review Findings

#### Matches Plan ✅
- [Item that matches]
- [Item that matches]

#### Deviations from Plan ⚠️
- [Deviation and why it matters]

#### Potential Issues 🔍
- [Issue to investigate]

### Manual Testing Required
- [ ] [Item needing human verification]
- [ ] [Item needing human verification]

### Recommendations
1. [Recommendation]
2. [Recommendation]

### Verdict
[PASS / PASS WITH NOTES / NEEDS WORK]
```
```

---

## 6. Create Handoff Prompt

**Source**: `humanlayer/.claude/commands/create_handoff.md`

```markdown
# Create Handoff

## Purpose
Create a handoff document for transferring work to another session.

## When to Use
- Session ending mid-task
- Switching to different work
- Complex state to preserve
- Handing off to another person/agent

## Output Location
`.opencode/thoughts/handoffs/YYYY-MM-DD_HH-MM-SS_{description}.md`

## Template

```markdown
---
date: [ISO 8601]
session_id: [current session if available]
git_commit: [current commit]
branch: [current branch]
status: in_progress
type: handoff
---

# Handoff: [Task Description]

## Task Summary
[What we were working on]

## Current Status
[Where we are in the process]

### Completed
- [x] [Completed item with details]
- [x] [Completed item with details]

### In Progress
- [ ] [Current item - where we stopped]

### Remaining
- [ ] [Future item]
- [ ] [Future item]

## Critical Context
[Important information the next session MUST know]

### Key Decisions Made
- [Decision 1]: [Why]
- [Decision 2]: [Why]

### Gotchas / Warnings
- ⚠️ [Thing to watch out for]
- ⚠️ [Thing to watch out for]

## Files Modified
| File | Changes | Status |
|------|---------|--------|
| `path/to/file.ts` | [Summary] | Complete |
| `path/to/file2.ts` | [Summary] | In Progress |

## Related Artifacts
- Plan: `.opencode/thoughts/plans/YYYY-MM-DD-feature.md`
- Research: `.opencode/thoughts/research/YYYY-MM-DD-topic.md`

## How to Resume

```bash
# In new session:
/resume .opencode/thoughts/handoffs/YYYY-MM-DD_HH-MM-SS_description.md
```

## Notes
[Any other relevant information]
```
```

---

## 7. Resume Handoff Prompt

**Source**: `humanlayer/.claude/commands/resume_handoff.md`

```markdown
# Resume Handoff

## Purpose
Resume work from a handoff document with full context analysis.

## Input Options
- Full path: `/resume path/to/handoff.md`
- Just description: `/resume oauth-implementation`
- No params: Prompts for handoff location

## Process

### Step 1: Load Handoff
1. Read handoff document completely
2. Extract key information:
   - What was being worked on
   - Current status
   - Completed vs remaining items
   - Critical context

### Step 2: Verify Current State
Spawn research to verify:
- Are completed items still complete?
- Has codebase changed since handoff?
- Are remaining items still relevant?

### Step 3: Present Analysis

```markdown
## Resuming: [Task Description]

### Handoff Summary
- Created: [date]
- By: [who]
- Status at handoff: [status]

### Current State Verification

#### Still Valid ✅
- [Item that's still complete/relevant]

#### Changed Since Handoff ⚠️
- [Item that changed - what's different]

#### Needs Re-evaluation 🔍
- [Item that needs fresh look]

### Recommended Next Steps
1. [First thing to do]
2. [Second thing to do]

### Context Loaded
- Plan: [path] - [status]
- Research: [path] - [status]

**Ready to continue. What would you like to focus on first?**
```

### Step 4: Create Action Plan
Use TodoWrite to track remaining work.

### Step 5: Begin Work
Reference handoff learnings throughout implementation.

## Common Scenarios

### Clean Continuation
Everything matches handoff - proceed with remaining items.

### Diverged Codebase
Code changed since handoff:
1. Identify what changed
2. Assess impact on remaining work
3. Update plan if needed
4. Continue with adjusted approach

### Incomplete Handoff
Handoff missing critical info:
1. Note what's missing
2. Research to fill gaps
3. Document findings
4. Continue with full context

### Stale Handoff
Handoff is old, much has changed:
1. Treat as starting point only
2. Do fresh research
3. Validate all assumptions
4. Create new plan if needed
```

---

## Usage Notes

### Model Selection
- **opus**: Complex reasoning, research, planning
- **sonnet** (default): Implementation, validation, routine tasks

### Parallel Execution
Always spawn research subagents in parallel when possible:
```javascript
// Good - parallel
Task({...agent1...})
Task({...agent2...})
Task({...agent3...})
// Wait for all, then synthesize

// Bad - sequential
result1 = await Task({...agent1...})
result2 = await Task({...agent2...})
result3 = await Task({...agent3...})
```

### Context Management
- Keep context utilization at 40-60%
- Compact findings into structured documents
- Use handoffs for session continuity
- Reference artifacts instead of re-reading

### Human Leverage
Focus human attention on:
1. Research accuracy (highest leverage)
2. Plan approval (high leverage)
3. Phase verification (medium leverage)
4. Final validation (medium leverage)
