---
description: "Execute approved plan phase by phase with verification gates"
---

# Implement Plan Command

Implement the plan: `$ARGUMENTS`

If no path provided, find the most recent plan in `.opencode/thoughts/plans/`.

## Philosophy

Execute the approved plan exactly as written:
- Trust the plan (it was reviewed by humans)
- Pause for verification between phases
- Update checkboxes as you complete items
- Adapt to reality while preserving intent

## Process

### Step 1: Load and Analyze Plan
1. Find or read the plan file: `$ARGUMENTS`
2. If no path given, ask user which plan to implement
3. Read the plan completely
4. Check for existing checkmarks `- [x]` (indicates resumed work)
5. Identify first incomplete phase

### Step 2: Pre-Implementation Setup
1. Create todo list with TodoWrite for current phase
2. Read all files that will be modified
3. Verify current state matches plan's expectations

### Step 3: Execute Current Phase
For each change in the phase:
1. Make the change as specified in the plan
2. Mark the specific item complete in your todo list
3. If something differs from plan, note it but continue if intent is preserved

### Step 4: Run Verification
After all changes in a phase:
1. Run automated verification commands from plan
2. Capture results

### Step 5: Pause for Human Verification
Present completion status:

```markdown
## Phase [N] Complete - Ready for Manual Verification

### Automated Checks:
- ✅ Build: `[command]` - passed
- ✅ Tests: `[command]` - passed (X tests)
- ✅ Types: `[command]` - no errors

### Manual Verification Required:
From the plan, please verify:
- [ ] [Manual item 1 from plan]
- [ ] [Manual item 2 from plan]

### Changes Made:
- `path/to/file1.ts` - [summary]
- `path/to/file2.ts` - [summary]

### Notes:
[Any deviations from plan or issues encountered]

**Please verify and respond to continue to Phase [N+1].**
```

### Step 6: Handle Issues
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

### Step 7: Resume Interrupted Work
If resuming (checkmarks exist in plan):
1. Trust existing checkmarks
2. Find first unchecked item
3. Continue from there
4. Don't re-verify completed phases

### Step 8: Complete Implementation
After all phases:

```markdown
## ✅ Implementation Complete

### All Phases Completed:
- [x] Phase 1: [Name]
- [x] Phase 2: [Name]

### Final Verification:
- ✅ All automated checks passing
- ✅ All manual verification items confirmed

### Files Changed:
- `path/to/file1.ts`
- `path/to/file2.ts`

### Summary:
[Brief summary of what was implemented]

### Next Steps:
1. Run full test suite if not done
2. Create commit with descriptive message
3. Consider creating PR if ready
```

## Error Recovery

If an error occurs during implementation:
1. Stop immediately
2. Report what happened
3. Show what was already changed
4. Propose recovery options
5. Wait for user decision

Do NOT auto-fix errors - always pause for human decision.
