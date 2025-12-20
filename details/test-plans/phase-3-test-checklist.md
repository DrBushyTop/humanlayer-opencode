# Phase 3 Test Checklist

**Date**: 2025-12-20  
**Status**: Ready for Testing  
**Depends on**: Phase 3 implementation complete

---

## Prerequisites

- [ ] Phase 1 agents and commands working
- [ ] Phase 2 agents and commands working
- [ ] Thoughts directory has some test documents
- [ ] Git repository with some commits
- [ ] `gh` CLI installed (for PR creation)

---

## 1. Thoughts Subagents

### 1.1 thoughts-locator

#### Basic Functionality
- [ ] Can find research documents: searches `.opencode/thoughts/research/`
- [ ] Can find plan documents: searches `.opencode/thoughts/plans/`
- [ ] Can find handoff documents: searches `.opencode/thoughts/handoffs/`
- [ ] Returns file paths with dates extracted from filenames

#### Search Behavior
- [ ] Keyword search works: finds documents containing term
- [ ] Date extraction works: parses YYYY-MM-DD from filenames
- [ ] Groups results by type (research/plans/handoffs)
- [ ] Limits results to 10 per category

#### Edge Cases
- [ ] Empty thoughts directory: returns "no documents found"
- [ ] No matching documents: returns empty results gracefully
- [ ] Malformed filenames: handles gracefully

### 1.2 thoughts-analyzer

#### Basic Functionality
- [ ] Can read document frontmatter
- [ ] Extracts key decisions from content
- [ ] Identifies constraints mentioned
- [ ] Notes what's still open/unclear

#### Analysis Quality
- [ ] Distinguishes facts from speculation
- [ ] Notes document age/staleness
- [ ] Provides relevance assessment
- [ ] Summarizes without adding opinions

#### Edge Cases
- [ ] Document without frontmatter: handles gracefully
- [ ] Empty document: reports as such
- [ ] Very long document: extracts key points without overflow

---

## 2. /commit Command

### 2.1 Basic Functionality
- [ ] Analyzes staged changes correctly
- [ ] Analyzes unstaged changes if nothing staged
- [ ] Determines appropriate commit type (feat/fix/etc)
- [ ] Generates well-formatted commit message

### 2.2 Commit Message Quality
- [ ] First line under 50 characters
- [ ] Uses imperative mood ("Add" not "Added")
- [ ] Body explains why, not what
- [ ] Follows repo's existing style

### 2.3 User Interaction
- [ ] Shows changes before committing
- [ ] Asks for approval before commit
- [ ] Allows editing message
- [ ] Allows cancellation

### 2.4 Edge Cases
- [ ] Nothing to commit: reports and offers options
- [ ] Merge conflicts: detects and reports
- [ ] User provides hint: incorporates into message

---

## 3. /describe_pr Command

### 3.1 Basic Functionality
- [ ] Detects current branch
- [ ] Finds commits ahead of main
- [ ] Generates comprehensive description
- [ ] Creates PR using `gh` CLI

### 3.2 Description Quality
- [ ] Includes summary of changes
- [ ] Lists change type checkboxes
- [ ] Includes testing instructions
- [ ] References related documents if exist

### 3.3 User Interaction
- [ ] Shows full description before creating
- [ ] Asks for approval
- [ ] Allows editing
- [ ] Allows cancellation

### 3.4 Edge Cases
- [ ] On main branch: refuses with explanation
- [ ] No commits ahead: reports nothing to PR
- [ ] Branch not pushed: offers to push
- [ ] PR already exists: detects and reports

---

## 4. /local_review Command

### 4.1 Basic Functionality
- [ ] Reviews uncommitted changes
- [ ] Reviews unpushed commits
- [ ] Categorizes issues by severity
- [ ] Provides fix suggestions

### 4.2 Review Quality
- [ ] Catches actual code issues
- [ ] Security checks (secrets, injection)
- [ ] Performance checks (N+1, etc)
- [ ] Style/convention checks
- [ ] Acknowledges good practices

### 4.3 Report Format
- [ ] Clear severity indicators (🔴🟠🟡✅)
- [ ] File:line references for issues
- [ ] Concrete fix suggestions
- [ ] Summary counts by category
- [ ] Clear verdict (READY/NEEDS FIXES/NEEDS DISCUSSION)

### 4.4 Focus Areas
- [ ] `/local_review security` emphasizes security
- [ ] `/local_review performance` emphasizes performance
- [ ] `/local_review testing` emphasizes test coverage

### 4.5 Edge Cases
- [ ] No changes: reports nothing to review
- [ ] Clean code: returns positive verdict
- [ ] Many issues: prioritizes correctly

---

## 5. /oneshot Command

### 5.1 Basic Functionality
- [ ] Parses task description
- [ ] Runs research phase
- [ ] Creates lightweight plan (in context)
- [ ] Implements changes
- [ ] Runs verification

### 5.2 Workflow Execution
- [ ] Research subagents spawn correctly
- [ ] Planning happens without file creation
- [ ] Implementation makes correct changes
- [ ] Verification runs appropriate commands

### 5.3 Report Quality
- [ ] Summarizes what was done
- [ ] Lists all changes made
- [ ] Shows verification results
- [ ] Clear SUCCESS/PARTIAL/FAILED verdict

### 5.4 Error Handling
- [ ] Ambiguous task: asks for clarification
- [ ] Research finds nothing: reports and stops
- [ ] Implementation fails: attempts fix, then reports
- [ ] Never leaves broken code

### 5.5 Edge Cases
- [ ] Very simple task: completes quickly
- [ ] Task too complex: suggests using /plan instead
- [ ] Verification fails: reports honestly

---

## 6. Updated Commands

### 6.1 /research Uses Thoughts Subagents
- [ ] Spawns thoughts-locator in parallel with codebase agents
- [ ] Uses thoughts-analyzer on relevant documents
- [ ] Incorporates findings into research report
- [ ] References existing research/plans

### 6.2 /resume Uses Thoughts Subagents
- [ ] Searches for related documents beyond handoff references
- [ ] Analyzes relevant documents for additional context
- [ ] Notes if newer research exists
- [ ] Warns if related plans have changed

---

## 7. Integration Tests

### 7.1 Full Commit Workflow
- [ ] Make changes
- [ ] `/local_review` → review passes
- [ ] `/commit` → commit created
- [ ] `/describe_pr` → PR created

### 7.2 Oneshot Workflow
- [ ] `/oneshot add a simple utility function`
- [ ] Research runs
- [ ] Implementation happens
- [ ] Verification passes
- [ ] Can commit results

### 7.3 Thoughts Integration
- [ ] Create research with `/research`
- [ ] New `/research` finds previous research
- [ ] `/plan` references existing research
- [ ] `/resume` finds related documents

---

## Test Execution Instructions

### Setup

1. **Prepare test environment**:
   ```bash
   cd humanlayer
   git checkout -b test-phase-3
   ```

2. **Create test thoughts** (if not exist):
   ```bash
   # Create sample documents
   echo "---
   date: '2025-12-20'
   type: research
   topic: 'test research'
   status: complete
   ---
   # Test Research
   This is test content." > .opencode/thoughts/research/2025-12-20-test-research.md
   ```

3. **Ensure gh CLI works**:
   ```bash
   gh auth status
   ```

### Test Each Component

#### Test thoughts-locator
```
# In OpenCode, ask:
"Find all thoughts documents about testing"

# Verify spawns thoughts-locator
# Verify returns file list without content
```

#### Test thoughts-analyzer
```
# In OpenCode, ask:
"Analyze the test research document"

# Verify spawns thoughts-analyzer
# Verify extracts key information
```

#### Test /commit
```bash
# Make a test change
echo "// test" >> some-file.ts
git add some-file.ts
```
```
/commit add test comment

# Verify shows changes
# Verify asks for approval
# Verify creates commit if approved
```

#### Test /describe_pr
```
/describe_pr

# Verify detects branch
# Verify generates description
# Verify asks before creating
```

#### Test /local_review
```bash
# Make some changes with potential issues
echo "const password = 'hardcoded123'" >> test-file.ts
```
```
/local_review security

# Verify catches hardcoded secret
# Verify severity is critical
```

#### Test /oneshot
```
/oneshot add a helper function that formats dates as ISO strings

# Verify research runs
# Verify implementation happens
# Verify verification runs
# Verify reports results
```

### Cleanup

```bash
git checkout main
git branch -D test-phase-3
```

---

## Known Limitations

- `/describe_pr` requires `gh` CLI installed and authenticated
- `/oneshot` works best with small, well-defined tasks
- thoughts-analyzer may be slow on large documents
- `/local_review` analysis quality depends on model capability

---

## Test Results Log

| Test | Date | Result | Notes |
|------|------|--------|-------|
| 1.1 thoughts-locator basic | | | |
| 1.1 thoughts-locator search | | | |
| 1.1 thoughts-locator edge cases | | | |
| 1.2 thoughts-analyzer basic | | | |
| 1.2 thoughts-analyzer quality | | | |
| 1.2 thoughts-analyzer edge cases | | | |
| 2.1 /commit basic | | | |
| 2.2 /commit message quality | | | |
| 2.3 /commit interaction | | | |
| 2.4 /commit edge cases | | | |
| 3.1 /describe_pr basic | | | |
| 3.2 /describe_pr quality | | | |
| 3.3 /describe_pr interaction | | | |
| 3.4 /describe_pr edge cases | | | |
| 4.1 /local_review basic | | | |
| 4.2 /local_review quality | | | |
| 4.3 /local_review format | | | |
| 4.4 /local_review focus | | | |
| 4.5 /local_review edge cases | | | |
| 5.1 /oneshot basic | | | |
| 5.2 /oneshot workflow | | | |
| 5.3 /oneshot report | | | |
| 5.4 /oneshot errors | | | |
| 5.5 /oneshot edge cases | | | |
| 6.1 /research thoughts | | | |
| 6.2 /resume thoughts | | | |
| 7.1 commit workflow | | | |
| 7.2 oneshot workflow | | | |
| 7.3 thoughts integration | | | |

---

## Issues Found

| Issue # | Description | Severity | Status |
|---------|-------------|----------|--------|
| | | | |
