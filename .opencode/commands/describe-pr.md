---
description: "Create pull request with well-crafted description"
agent: Build
subtask: true
---

# Describe PR Command

## Trigger

`/describe_pr [optional title hint]`

## Purpose

Create a pull request with a comprehensive description that helps reviewers understand the changes.

## Process

### Step 1: Gather Context

```bash
# Current branch
git branch --show-current

# Commits in this branch (not in main)
git log main..HEAD --oneline

# Full diff from main
git diff main...HEAD --stat

# Check if branch is pushed
git status -sb
```

### Step 2: Check for Related Documents

Search for related thoughts:

```bash
ls -la .opencode/thoughts/plans/
ls -la .opencode/thoughts/research/
```

Look for plans/research related to this work.

### Step 3: Analyze Changes

From the diff and commits, identify:

- What features/fixes are included
- What files were significantly changed
- What the testing status is
- Any breaking changes

### Step 4: Draft PR Description

```markdown
## [Title - imperative mood, concise]

### Summary

[2-3 sentences explaining what this PR does and why]

### Changes

- [Change 1]
- [Change 2]
- [Change 3]

### Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)

### Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

### Testing Instructions

1. [Step 1]
2. [Step 2]
3. [Expected result]

### Screenshots (if applicable)

[Add screenshots for UI changes]

### Related Issues

- Closes #[issue number]
- Related to #[issue number]

### Related Documents

- Plan: `.opencode/thoughts/plans/[file]`
- Research: `.opencode/thoughts/research/[file]`

### Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (if needed)
- [ ] No new warnings introduced
```

### Step 5: Present for Review

```markdown
## Proposed Pull Request

### Title

[PR title]

### Description

[Full description as above]

### Create This PR?

- **Yes**: I'll create the PR
- **Edit**: Tell me what to change
- **Cancel**: Abort
```

### Step 6: Create PR

After approval:

```bash
# Push if needed
git push -u origin $(git branch --show-current)

# Create PR using gh CLI
gh pr create --title "[title]" --body "[description]"
```

### Step 7: Confirm

```markdown
## Pull Request Created

**URL**: [PR URL]
**Title**: [title]
**Branch**: [branch] → main

### Next Steps

- Share PR link for review
- Address reviewer feedback
- Merge when approved
```

## Handling Edge Cases

### Not on Feature Branch

````markdown
## Cannot Create PR

You're on `main` branch. PRs should be from feature branches.

Create a branch first:

```bash
git checkout -b feature/your-feature-name
```
````

````

### No Commits Ahead of Main
```markdown
## Nothing to PR

This branch has no commits ahead of `main`.

Make some changes and commit them first.
````

### Branch Not Pushed

```markdown
## Branch Not Pushed

This branch hasn't been pushed to remote yet.

I'll push it as part of creating the PR. Continue?
```

## Constraints

- Never create PR without user approval
- Always show full description before creating
- Include related documents if they exist
- Respect repository's PR template if one exists
