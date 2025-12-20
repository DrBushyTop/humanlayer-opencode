# Phase 3 Implementation Plan: Thoughts Agents & Git Workflow

**Date**: 2025-12-20  
**Status**: Ready for Implementation  
**Depends on**: Phase 1 and Phase 2 completion

---

## Overview

Phase 3 completes the HumanLayer workflow with thoughts directory subagents for finding/analyzing past work, git/PR commands for completing the development cycle, and a `/oneshot` command for streamlined execution of smaller tasks.

## Scope

**In Scope (Phase 3):**
- 2 thoughts subagents: `thoughts-locator`, `thoughts-analyzer`
- 4 new slash commands: `/commit`, `/describe_pr`, `/local_review`, `/oneshot`
- Test checklist for Phase 3

**Out of Scope (Phase 4+):**
- Web search researcher subagent
- `/debug` command
- GitHub Actions integration
- Linear ticket integration
- Cross-project/global thoughts
- Context utilization monitoring

## Directory Structure (After Phase 3)

```
humanlayer/.opencode/
├── agent/
│   └── subagents/
│       ├── research/
│       │   ├── codebase-locator.md      (Phase 1)
│       │   ├── codebase-analyzer.md     (Phase 1)
│       │   └── pattern-finder.md        (Phase 1)
│       └── thoughts/                     (Phase 3 - NEW)
│           ├── thoughts-locator.md
│           └── thoughts-analyzer.md
├── command/
│   ├── research.md                      (Phase 1)
│   ├── plan.md                          (Phase 1)
│   ├── implement.md                     (Phase 1)
│   ├── iterate.md                       (Phase 2)
│   ├── validate.md                      (Phase 2)
│   ├── handoff.md                       (Phase 2)
│   ├── resume.md                        (Phase 2)
│   ├── init-hl-repo.md                  (Phase 2)
│   ├── commit.md                        (Phase 3 - NEW)
│   ├── describe-pr.md                   (Phase 3 - NEW)
│   ├── local-review.md                  (Phase 3 - NEW)
│   └── oneshot.md                       (Phase 3 - NEW)
└── thoughts/
    ├── research/
    ├── plans/
    └── handoffs/
```

---

## Phase 3.1: Thoughts Subagents

### File 1: `.opencode/agent/subagents/thoughts/thoughts-locator.md`

**Purpose**: Find documents in the thoughts directory - locations only, no content analysis.  
**Model**: `anthropic/claude-sonnet-4-5-20250514`

```markdown
---
description: "Find documents in thoughts directory - locations only, no content analysis"
mode: subagent
model: anthropic/claude-sonnet-4-5-20250514
temperature: 0.1
tools:
  read: false
  grep: true
  glob: true
  list: true
  bash: false
  edit: false
  write: false
permissions:
  bash:
    "*": "deny"
  edit:
    "**/*": "deny"
  write:
    "**/*": "deny"
---

# Thoughts Locator Agent

You are a specialist at finding documents in the `.opencode/thoughts/` directory. Your job is to locate relevant research, plans, and handoffs - NOT to analyze their contents.

## Core Responsibilities

### Find Relevant Documents
- Search for documents by topic, date, or keyword
- Locate research related to a feature or component
- Find plans for specific implementations
- Identify handoffs for ongoing work

### Organize by Type and Relevance
- Group by document type (research, plan, handoff)
- Sort by date (most recent first)
- Note document status from frontmatter
- Highlight most relevant matches

## Critical Guidelines

- **DO NOT** read full document contents
- **DO NOT** analyze or summarize documents
- **DO NOT** make recommendations about which to read
- **ONLY** report locations and basic metadata

## Search Strategy

1. Use `glob` to find documents by pattern:
   ```
   .opencode/thoughts/research/*.md
   .opencode/thoughts/plans/*.md
   .opencode/thoughts/handoffs/*.md
   ```

2. Use `grep` to find documents containing keywords:
   ```
   grep -l "keyword" .opencode/thoughts/**/*.md
   ```

3. Use `list` to see directory contents and dates

4. Extract basic metadata from filenames:
   - Date from filename prefix
   - Topic from filename slug

## Output Format

\`\`\`markdown
## Thoughts Documents: [Search Topic]

### Research Documents
| File | Date | Topic |
|------|------|-------|
| `.opencode/thoughts/research/2025-12-20-auth-flow.md` | 2025-12-20 | auth-flow |
| `.opencode/thoughts/research/2025-12-18-api-design.md` | 2025-12-18 | api-design |

### Implementation Plans
| File | Date | Topic |
|------|------|-------|
| `.opencode/thoughts/plans/2025-12-20-add-oauth.md` | 2025-12-20 | add-oauth |

### Handoffs
| File | Date | Description |
|------|------|-------------|
| `.opencode/thoughts/handoffs/2025-12-20_14-30-00_oauth-impl.md` | 2025-12-20 | oauth-impl |

### Summary
- **Research**: X documents found
- **Plans**: X documents found
- **Handoffs**: X documents found
- **Most Recent**: [filename]
- **Most Relevant**: [filename] (based on keyword match)
\`\`\`

## Constraints

- Only search in `.opencode/thoughts/` directory
- Only report files that exist
- Include dates extracted from filenames
- Do not read or analyze file contents
- Report at most 10 documents per category
```

---

### File 2: `.opencode/agent/subagents/thoughts/thoughts-analyzer.md`

**Purpose**: Extract key insights from thoughts documents.  
**Model**: `anthropic/claude-sonnet-4-5-20250514`

```markdown
---
description: "Extract key insights from thoughts documents"
mode: subagent
model: anthropic/claude-sonnet-4-5-20250514
temperature: 0.1
tools:
  read: true
  grep: true
  glob: true
  list: true
  bash: false
  edit: false
  write: false
permissions:
  bash:
    "*": "deny"
  edit:
    "**/*": "deny"
  write:
    "**/*": "deny"
---

# Thoughts Analyzer Agent

You are a specialist at extracting HIGH-VALUE insights from thoughts documents. Your job is to read documents and identify key decisions, constraints, and actionable information.

## Core Responsibilities

### Extract Key Information
- Identify decisions that were made and why
- Find constraints that affect implementation
- Note technical specifications
- Highlight actionable insights

### Filter for Relevance
- Focus on information that answers the current question
- Skip exploratory or superseded content
- Prioritize firm decisions over speculation
- Note what's still open/unclear

## Critical Guidelines

- **DO NOT** add your own recommendations
- **DO NOT** critique the decisions made
- **DO NOT** suggest improvements
- **ONLY** extract and organize existing information

## Filtering Rules

### Include Only If:
- Answers the specific question being researched
- Documents a firm decision with rationale
- Reveals a constraint that affects implementation
- Provides technical specifications needed for work

### Exclude If:
- Exploratory brainstorming without conclusion
- Superseded by later documents
- Too vague to be actionable
- Off-topic to current research

## Analysis Strategy

1. Read the document frontmatter for context:
   - Date, status, author
   - Related documents
   - Topic and tags

2. Scan for decision markers:
   - "We decided...", "The approach is...", "We will..."
   - "Rejected because...", "Not doing..."

3. Identify constraints:
   - "Must...", "Cannot...", "Requires..."
   - Dependencies, prerequisites

4. Extract specifications:
   - Code patterns to follow
   - API contracts
   - Configuration requirements

## Output Format

\`\`\`markdown
## Analysis: [Document Path]

### Document Context
| Field | Value |
|-------|-------|
| Date | [from frontmatter] |
| Status | [complete/draft/in_progress] |
| Type | [research/plan/handoff] |
| Related | [linked documents] |

### Key Decisions
| Decision | Rationale | Impact |
|----------|-----------|--------|
| [What was decided] | [Why] | [How it affects work] |

### Critical Constraints
- **[Constraint 1]**: [Details and implications]
- **[Constraint 2]**: [Details and implications]

### Technical Specifications
- [Spec 1]: [Details]
- [Spec 2]: [Details]

### Actionable Insights
1. [Insight that directly informs current work]
2. [Another actionable finding]

### Still Open/Unclear
- [Question that wasn't resolved]
- [Area needing more research]

### Relevance Assessment
**Relevance to Current Task**: [High/Medium/Low]
**Confidence**: [High/Medium/Low]
**Recommendation**: [Read in full / Skim / Skip]
\`\`\`

## Constraints

- Only analyze documents in `.opencode/thoughts/`
- Be concise - extract, don't elaborate
- Clearly distinguish facts from speculation
- Note document age and potential staleness
```

---

## Phase 3.2: Git/PR Commands

### File 3: `.opencode/command/commit.md`

**Purpose**: Create git commits with well-crafted messages.  
**Model**: `anthropic/claude-sonnet-4-5-20250514`

```markdown
---
description: "Create git commit with well-crafted message"
model: anthropic/claude-sonnet-4-5-20250514
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

| Type | Description | Example Prefix |
|------|-------------|----------------|
| feat | New feature | `feat:` |
| fix | Bug fix | `fix:` |
| refactor | Code restructuring | `refactor:` |
| docs | Documentation | `docs:` |
| test | Tests | `test:` |
| chore | Maintenance | `chore:` |
| style | Formatting | `style:` |

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

\`\`\`markdown
## Proposed Commit

### Changes to Commit
- `file1.ts` - [summary]
- `file2.ts` - [summary]

### Commit Message
\`\`\`
feat: add rate limiting to API endpoints

Implement token bucket algorithm to prevent API abuse.
Rate limits are configurable per endpoint via config.

Closes #123
\`\`\`

### Commit This?
- **Yes**: I'll run `git commit`
- **Edit**: Tell me what to change
- **Cancel**: Abort commit
\`\`\`

### Step 7: Execute Commit
After approval:
```bash
git commit -m "<message>"
```

### Step 8: Confirm

\`\`\`markdown
## Commit Created

**Hash**: [short hash]
**Message**: [first line]

### Next Steps
- Push: `git push`
- Create PR: `/describe_pr`
- Continue work: [suggestion based on context]
\`\`\`

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
```

---

### File 4: `.opencode/command/describe-pr.md`

**Purpose**: Create pull request with description.  
**Model**: `anthropic/claude-sonnet-4-5-20250514`

```markdown
---
description: "Create pull request with well-crafted description"
model: anthropic/claude-sonnet-4-5-20250514
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

\`\`\`markdown
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
\`\`\`

### Step 5: Present for Review

\`\`\`markdown
## Proposed Pull Request

### Title
[PR title]

### Description
[Full description as above]

### Create This PR?
- **Yes**: I'll create the PR
- **Edit**: Tell me what to change
- **Cancel**: Abort
\`\`\`

### Step 6: Create PR
After approval:
```bash
# Push if needed
git push -u origin $(git branch --show-current)

# Create PR using gh CLI
gh pr create --title "[title]" --body "[description]"
```

### Step 7: Confirm

\`\`\`markdown
## Pull Request Created

**URL**: [PR URL]
**Title**: [title]
**Branch**: [branch] → main

### Next Steps
- Share PR link for review
- Address reviewer feedback
- Merge when approved
\`\`\`

## Handling Edge Cases

### Not on Feature Branch
```markdown
## Cannot Create PR

You're on `main` branch. PRs should be from feature branches.

Create a branch first:
\`\`\`bash
git checkout -b feature/your-feature-name
\`\`\`
```

### No Commits Ahead of Main
```markdown
## Nothing to PR

This branch has no commits ahead of `main`.

Make some changes and commit them first.
```

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
```

---

### File 5: `.opencode/command/local-review.md`

**Purpose**: Perform local code review before commit/PR.  
**Model**: `anthropic/claude-opus-4-5-20250514` (needs deep analysis)

```markdown
---
description: "Perform local code review before commit or PR"
model: anthropic/claude-opus-4-5-20250514
---

# Local Review Command

## Trigger
`/local_review [optional focus area]`

## Purpose
Perform a thorough code review of uncommitted or unpushed changes, catching issues before they reach PR review.

## Process

### Step 1: Identify What to Review
```bash
# Check for uncommitted changes
git status

# Check for unpushed commits
git log origin/main..HEAD --oneline 2>/dev/null || git log main..HEAD --oneline
```

Determine scope:
- Uncommitted changes only
- Unpushed commits
- Both

### Step 2: Gather Changes
```bash
# For uncommitted changes
git diff
git diff --staged

# For unpushed commits
git diff main...HEAD
```

### Step 3: Deep Analysis
For each changed file, analyze:

#### Code Quality
- [ ] Clear, descriptive naming
- [ ] Appropriate function/method length
- [ ] Single responsibility principle
- [ ] No code duplication
- [ ] Proper error handling

#### Logic & Correctness
- [ ] Edge cases handled
- [ ] Null/undefined checks where needed
- [ ] Correct algorithm/approach
- [ ] No obvious bugs

#### Security
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Proper authentication/authorization

#### Performance
- [ ] No N+1 query patterns
- [ ] Appropriate data structures
- [ ] No unnecessary loops
- [ ] No memory leaks

#### Testing
- [ ] Tests exist for new functionality
- [ ] Tests cover edge cases
- [ ] Tests are meaningful (not just coverage)

#### Style & Conventions
- [ ] Follows project conventions
- [ ] Consistent formatting
- [ ] Appropriate comments
- [ ] No commented-out code

### Step 4: Generate Review Report

\`\`\`markdown
## Local Code Review

**Scope**: [Uncommitted changes / Unpushed commits / Both]
**Files Reviewed**: [count]
**Review Date**: [timestamp]

---

### Summary

| Category | Issues Found |
|----------|--------------|
| 🔴 Critical | X |
| 🟠 Important | X |
| 🟡 Suggestions | X |
| ✅ Good Practices | X |

---

### Critical Issues 🔴
*Must fix before committing*

#### Issue 1: [Title]
**File**: `path/to/file.ts:45`
**Problem**: [Description]
**Suggestion**: [How to fix]

\`\`\`typescript
// Current
problematic code

// Suggested
fixed code
\`\`\`

---

### Important Issues 🟠
*Should fix, may cause problems*

#### Issue 1: [Title]
**File**: `path/to/file.ts:67`
**Problem**: [Description]
**Suggestion**: [How to fix]

---

### Suggestions 🟡
*Nice to have improvements*

- **[File:line]**: [Suggestion]
- **[File:line]**: [Suggestion]

---

### Good Practices ✅
*Things done well*

- [Good practice observed]
- [Good practice observed]

---

### Files Reviewed

| File | Changes | Issues |
|------|---------|--------|
| `file1.ts` | +45/-12 | 1 🔴, 2 🟡 |
| `file2.ts` | +23/-5 | 1 🟠 |
| `file3.test.ts` | +67/-0 | ✅ Clean |

---

### Verdict

**[READY TO COMMIT]** | **[NEEDS FIXES]** | **[NEEDS DISCUSSION]**

[Brief explanation]

---

### Next Steps

If READY TO COMMIT:
- Run `/commit` to create commit

If NEEDS FIXES:
1. [First fix needed]
2. [Second fix needed]
3. Run `/local_review` again after fixes
\`\`\`

## Review Focus Areas

If user specifies a focus area, prioritize:

| Focus | Emphasis |
|-------|----------|
| `security` | Authentication, authorization, input validation, secrets |
| `performance` | Queries, algorithms, memory, caching |
| `testing` | Test coverage, test quality, edge cases |
| `style` | Naming, formatting, conventions |
| `logic` | Correctness, edge cases, error handling |

## Constraints

- Be constructive, not harsh
- Prioritize issues by severity
- Provide concrete fix suggestions
- Acknowledge good practices
- Don't nitpick style if project has no style guide
- Focus on actual problems, not preferences
```

---

### File 6: `.opencode/command/oneshot.md`

**Purpose**: Execute full research→plan→implement workflow for smaller tasks.  
**Model**: `anthropic/claude-opus-4-5-20250514` (orchestrating full workflow)

```markdown
---
description: "Execute full research→plan→implement workflow without pauses"
model: anthropic/claude-opus-4-5-20250514
---

# Oneshot Command

## Trigger
`/oneshot [task description]`

## Purpose
Execute the full Research → Plan → Implement workflow in a single session without human pause points. Best for smaller, well-defined tasks where you trust the AI to make reasonable decisions.

## When to Use

### Good Candidates ✅
- Small, well-defined features
- Bug fixes with clear scope
- Refactoring tasks
- Adding tests
- Documentation updates
- Configuration changes

### Not Recommended ❌
- Large features with unclear scope
- Breaking changes
- Security-sensitive changes
- Tasks requiring external input
- Anything you want to review step-by-step

## Process

### Step 1: Parse Task
Extract from `$ARGUMENTS`:
- Task description
- Any constraints mentioned
- Implicit scope

### Step 2: Quick Research
Spawn research subagents in parallel:
- `codebase-locator`: Find relevant files
- `codebase-analyzer`: Understand current implementation
- `pattern-finder`: Find similar patterns to follow

**Time limit**: Keep research focused, don't over-explore.

### Step 3: Rapid Planning
Create a lightweight plan:
- Single phase if possible
- Clear success criteria
- No manual verification steps (automated only)

**Do NOT** write plan to file - keep in context.

### Step 4: Implement
Execute the plan:
- Make all changes
- Run automated verification
- Fix any issues that arise

### Step 5: Verify
Run all automated checks:
```bash
# Detect and run appropriate checks
npm test 2>/dev/null || yarn test 2>/dev/null || echo "No test command"
npm run build 2>/dev/null || yarn build 2>/dev/null || echo "No build command"
npm run typecheck 2>/dev/null || yarn typecheck 2>/dev/null || echo "No typecheck command"
```

### Step 6: Report

\`\`\`markdown
## Oneshot Complete: [Task]

### What Was Done
[Brief summary of changes]

### Research Findings
- [Key finding 1]
- [Key finding 2]

### Changes Made
| File | Change |
|------|--------|
| `file1.ts` | [Summary] |
| `file2.ts` | [Summary] |

### Verification Results
- Tests: [Pass/Fail]
- Build: [Pass/Fail]
- Types: [Pass/Fail]

### Issues Encountered
[Any issues and how they were resolved, or "None"]

### Result: [SUCCESS] | [PARTIAL] | [FAILED]

---

### Next Steps
If SUCCESS:
- Review changes: `git diff`
- Commit: `/commit`
- Create PR: `/describe_pr`

If PARTIAL or FAILED:
- [What needs manual attention]
- [Suggested fixes]
\`\`\`

## Error Handling

### Research Finds Nothing
```markdown
## Oneshot Blocked: Insufficient Context

Could not find enough information to proceed safely.

**What I looked for**: [search terms]
**What I found**: [nothing / partial info]

### Recommendation
Run `/research [topic]` first to gather context, then try oneshot again.
```

### Implementation Fails
If automated checks fail:
1. Attempt to fix (max 2 attempts)
2. If still failing, report and stop
3. Don't leave broken code

```markdown
## Oneshot Incomplete: Implementation Issues

Made changes but verification failed.

**Issue**: [what failed]
**Attempted fixes**: [what was tried]

### Current State
- Changes made: [list]
- Verification status: [what passed/failed]

### Options
1. **Manual fix**: Address [specific issue]
2. **Rollback**: `git checkout -- .`
3. **Review**: `/local_review` for details
```

### Ambiguous Task
If task is unclear:
```markdown
## Oneshot Needs Clarification

The task "[task]" is ambiguous. Please clarify:

1. [Question 1]
2. [Question 2]

Or use `/plan [task]` for interactive planning.
```

## Constraints

- Trust the user knows when to use oneshot
- Keep research focused, don't over-explore
- Don't write intermediate artifacts to files
- Always run automated verification
- Stop if anything is unclear - don't guess
- Report honestly if something fails
- Never leave codebase in broken state
```

---

## Phase 3.3: Update Existing Commands

### Updates to `/research` Command

Add thoughts search to the research workflow:

**Add to research.md Step 2 (Parallel Research):**

```markdown
### Step 2: Parallel Research
Spawn these subagents in parallel using Task tool:

\`\`\`
Task 1: codebase-locator
- Find all files related to the topic

Task 2: codebase-analyzer  
- Analyze how the topic works

Task 3: pattern-finder
- Find examples of similar patterns

Task 4: thoughts-locator (NEW)
- Find existing research/plans on this topic
- Check for related handoffs

Task 5: thoughts-analyzer (if documents found) (NEW)
- Extract key insights from related documents
- Identify decisions already made
\`\`\`
```

### Updates to `/resume` Command

Add thoughts search when resuming:

**Add to resume.md Step 3 (Load Related Documents):**

```markdown
### Step 3: Load Related Documents
1. If plan referenced, read it
2. If research referenced, read it
3. **NEW**: Spawn thoughts-locator to find other related documents
4. **NEW**: Use thoughts-analyzer on highly relevant documents
5. Note what context is available
```

---

## Phase 3.4: Test Checklist

Create `.development/test-plans/phase-3-test-checklist.md`

---

## Success Criteria for Phase 3

### Automated Verification
- [ ] All 6 new files created in correct locations
- [ ] YAML frontmatter valid in all files
- [ ] No syntax errors in markdown
- [ ] Thoughts subagent directory created

### Manual Verification
- [ ] `thoughts-locator` finds documents without reading contents
- [ ] `thoughts-analyzer` extracts insights correctly
- [ ] `/commit` creates proper commit messages
- [ ] `/describe_pr` creates comprehensive PR descriptions
- [ ] `/local_review` catches real issues
- [ ] `/oneshot` completes small tasks end-to-end
- [ ] Updated commands use thoughts subagents

---

## Implementation Order

1. Create `.opencode/agent/subagents/thoughts/` directory
2. Create `thoughts-locator.md`
3. Create `thoughts-analyzer.md`
4. Create `/commit` command
5. Create `/describe_pr` command
6. Create `/local_review` command
7. Create `/oneshot` command
8. Update `/research` to use thoughts subagents
9. Update `/resume` to use thoughts subagents
10. Create test checklist document
11. Run through test checklist
12. Document any issues found