# Phase 2 Test Checklist

**Date**: 2025-12-20  
**Status**: Ready for Testing  
**Depends on**: Phase 2 implementation complete

---

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

### 2.1 Basic Functionality
- [ ] Can load plan by path: `/iterate .opencode/thoughts/plans/test.md change X`
- [ ] Can find most recent plan: `/iterate change X`
- [ ] Asks for feedback if not provided: `/iterate`

### 2.2 Edit Behavior
- [ ] Shows proposed changes before editing
- [ ] Makes surgical edits (not full rewrites)
- [ ] Preserves unchanged sections
- [ ] Updates frontmatter `last_modified`

### 2.3 Edge Cases
- [ ] Handles plan not found gracefully
- [ ] Handles empty feedback gracefully
- [ ] Spawns research only when needed

---

## 3. /validate Command

### 3.1 Basic Functionality
- [ ] Can load plan by path
- [ ] Can find most recent plan
- [ ] Runs all automated verification commands

### 3.2 Report Generation
- [ ] Shows implementation status per phase
- [ ] Shows automated check results
- [ ] Lists matches and deviations
- [ ] Provides verdict (PASS/PASS WITH NOTES/NEEDS WORK)

### 3.3 Verification Depth
- [ ] Reads files mentioned in plan
- [ ] Compares actual vs expected changes
- [ ] Identifies missing implementations
- [ ] Notes additional changes not in plan

---

## 4. /handoff Command

### 4.1 Basic Functionality
- [ ] Creates handoff file in correct location
- [ ] Uses correct filename format
- [ ] Generates proper frontmatter

### 4.2 Content Completeness
- [ ] Includes current todo list
- [ ] Includes git status
- [ ] Includes files modified
- [ ] Includes key decisions
- [ ] Includes next steps

### 4.3 Edge Cases
- [ ] Works with no active todos
- [ ] Works with no uncommitted changes
- [ ] Includes custom description if provided

---

## 5. /resume Command

### 5.1 Basic Functionality
- [ ] Can load handoff by path
- [ ] Lists recent handoffs if no path
- [ ] Reads handoff completely

### 5.2 State Verification
- [ ] Compares current commit vs handoff commit
- [ ] Identifies what changed since handoff
- [ ] Loads related plan/research

### 5.3 Context Restoration
- [ ] Creates todo list from remaining items
- [ ] Notes completed items
- [ ] Highlights gotchas/warnings

### 5.4 Edge Cases
- [ ] Handles stale handoff (>1 week old)
- [ ] Handles missing related documents
- [ ] Handles diverged codebase

---

## 6. /init-hl-repo Command

### 6.1 Fresh Repository
- [ ] Creates complete directory structure
- [ ] Creates all agent files
- [ ] Creates all command files
- [ ] Creates .gitkeep files
- [ ] Creates README.md

### 6.2 Existing Repository
- [ ] Detects existing `.opencode/` directory
- [ ] Asks before overwriting
- [ ] Merge option works correctly

### 6.3 Content Verification
- [ ] Agent files have correct YAML frontmatter
- [ ] Command files have correct YAML frontmatter
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

## Test Execution Instructions

### Setup

1. **Prepare test environment**:
   ```bash
   cd humanlayer
   git checkout -b test-phase-2
   ```

2. **Ensure Phase 1 is working**:
   ```bash
   ls .opencode/agent/subagents/research/
   ls .opencode/command/
   ```

### Test Each Command

#### Test 1: Thoughts Directory
```bash
# Verify structure
ls -la .opencode/thoughts/
ls -la .opencode/thoughts/research/
ls -la .opencode/thoughts/plans/
ls -la .opencode/thoughts/handoffs/
```

#### Test 2: /iterate
```
# First create a plan to iterate on
/plan add a test feature

# Then iterate
/iterate add more detail to phase 1

# Verify changes
cat .opencode/thoughts/plans/*.md
```

#### Test 3: /validate
```
# After implementing something
/validate

# Check report format
```

#### Test 4: /handoff
```
# Create a handoff
/handoff testing the handoff system

# Verify file created
ls -la .opencode/thoughts/handoffs/
cat .opencode/thoughts/handoffs/*.md
```

#### Test 5: /resume
```
# Start new session or clear context
/resume

# Select the handoff created above
# Verify context restored
```

#### Test 6: /init-hl-repo
```bash
# Test in a fresh directory
mkdir /tmp/test-repo && cd /tmp/test-repo
git init

# Run init
/init-hl-repo

# Verify structure
find .opencode -type f
```

### Verify Files Created

```bash
# After each test, check files
ls -la .opencode/thoughts/research/
ls -la .opencode/thoughts/plans/
ls -la .opencode/thoughts/handoffs/

# Check frontmatter in files
head -15 .opencode/thoughts/research/*.md
head -15 .opencode/thoughts/plans/*.md
head -15 .opencode/thoughts/handoffs/*.md
```

### Cleanup

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
- Slug generation may not handle all special characters

---

## Test Results Log

| Test | Date | Result | Notes |
|------|------|--------|-------|
| 1.1 Directory Structure | | | |
| 1.2 File Naming | | | |
| 1.3 Frontmatter Generation | | | |
| 2.1 /iterate Basic | | | |
| 2.2 /iterate Edits | | | |
| 2.3 /iterate Edge Cases | | | |
| 3.1 /validate Basic | | | |
| 3.2 /validate Report | | | |
| 3.3 /validate Depth | | | |
| 4.1 /handoff Basic | | | |
| 4.2 /handoff Content | | | |
| 4.3 /handoff Edge Cases | | | |
| 5.1 /resume Basic | | | |
| 5.2 /resume Verification | | | |
| 5.3 /resume Restoration | | | |
| 5.4 /resume Edge Cases | | | |
| 6.1 /init-hl-repo Fresh | | | |
| 6.2 /init-hl-repo Existing | | | |
| 6.3 /init-hl-repo Content | | | |
| 7.1 /research Saves | | | |
| 7.2 /plan Saves | | | |
| 8.1 Full Workflow | | | |
| 8.2 Iteration Workflow | | | |

---

## Issues Found

| Issue # | Description | Severity | Status |
|---------|-------------|----------|--------|
| | | | |
