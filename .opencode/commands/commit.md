---
description: "Create git commit with well-crafted message"
agent: Build
subtask: true
---

# Commit Command

## Trigger

`/commit [optional message hint]`

## Purpose

Create a git commit with a well-crafted message that explains the "why" not just the "what".

## Process

### Step 1: Analyze Changes

Run these commands to understand what's being committed:

```bash
# See what files changed
git status

# See the actual changes
git diff --staged
# If nothing staged, also check unstaged
git diff

# See recent commit style
git log --oneline -n 5
```

### Step 2: Stage Changes (if needed)

If changes aren't staged:

1. Ask user what to stage, or
2. If user provided hint, stage relevant files
3. Use `git add -p` logic to select specific changes if needed

### Step 3: Analyze Staged Changes

Examine the diff to understand:

- What files were modified/added/deleted
- What functionality changed
- Why these changes were made (infer from context)

### Step 4: Determine Commit Type

Categorize the change:

| Type     | Description        | Example Prefix |
| -------- | ------------------ | -------------- |
| feat     | New feature        | `feat:`        |
| fix      | Bug fix            | `fix:`         |
| refactor | Code restructuring | `refactor:`    |
| docs     | Documentation      | `docs:`        |
| test     | Tests              | `test:`        |
| chore    | Maintenance        | `chore:`       |
| style    | Formatting         | `style:`       |

### Step 5: Draft Commit Message

Structure:

```
<type>: <short summary in imperative mood>

<optional body explaining why, not what>

<optional footer with references>
```

Guidelines:

- First line: 50 chars max, imperative mood ("Add" not "Added")
- Body: Wrap at 72 chars, explain motivation
- Focus on WHY, not WHAT (the diff shows what)

### Step 6: Present for Approval

```markdown
## Proposed Commit

### Changes to Commit

- `file1.ts` - [summary]
- `file2.ts` - [summary]

### Commit Message
```

feat: add rate limiting to API endpoints

Implement token bucket algorithm to prevent API abuse.
Rate limits are configurable per endpoint via config.

Closes #123

```

### Commit This?
- **Yes**: I'll run `git commit`
- **Edit**: Tell me what to change
- **Cancel**: Abort commit
```

### Step 7: Execute Commit

After approval:

```bash
git commit -m "<message>"
```

### Step 8: Confirm

```markdown
## Commit Created

**Hash**: [short hash]
**Message**: [first line]

### Next Steps

- Push: `git push`
- Create PR: `/describe_pr`
- Continue work: [suggestion based on context]
```

## Handling Edge Cases

### Nothing to Commit

```markdown
## Nothing to Commit

No staged changes found. Would you like to:

1. Stage all changes: `git add .`
2. Stage specific files: Tell me which files
3. See what's changed: `git status`
```

### Merge Conflicts

```markdown
## Merge Conflicts Detected

Cannot commit with unresolved conflicts in:

- `file1.ts`
- `file2.ts`

Resolve conflicts first, then try `/commit` again.
```

## Constraints

- Never commit without user approval
- Never force push
- Always show what will be committed
- Respect existing commit message conventions in repo
