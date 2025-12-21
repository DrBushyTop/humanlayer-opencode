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

```markdown
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
```

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

### Step 8: Present Summary

```markdown
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
```

## Constraints

- Never delete content without explicit approval
- Always show diff summary before confirming
- Maintain phase testability
- Keep success criteria aligned with changes
