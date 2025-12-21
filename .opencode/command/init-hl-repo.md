---
description: "Initialize repository with HumanLayer workflow structure"
subtask: true
tools:
  bash: true
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
```

If not a git repo, warn user but continue.

### Step 3: Create Directory Structure

```
.opencode/
├── agent/
│   └── subagents/
│       ├── research/
│       └── thoughts/
├── command/
├── scripts/
└── thoughts/
    ├── research/
    ├── plans/
    └── shared/
        └── handoffs/
            └── general/
```

### Step 4: Create Agent Files

Copy these files to `.opencode/agent/subagents/research/`:

1. `codebase-locator.md`
2. `codebase-analyzer.md`
3. `pattern-finder.md`

Copy these files to `.opencode/agent/subagents/thoughts/`:

1. `thoughts-locator.md`
2. `thoughts-analyzer.md`

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

### Step 6: Create Scripts

Copy to `.opencode/scripts/`:

1. `spec_metadata.sh` - Metadata gathering script for handoffs

Make executable:
```bash
chmod +x .opencode/scripts/spec_metadata.sh
```

### Step 7: Create .gitkeep Files

Create `.gitkeep` in empty directories:

- `.opencode/thoughts/research/.gitkeep`
- `.opencode/thoughts/plans/.gitkeep`
- `.opencode/thoughts/shared/handoffs/.gitkeep`
- `.opencode/thoughts/shared/handoffs/general/.gitkeep`

### Step 8: Create README

Create `.opencode/README.md`:

```markdown
# OpenCode HumanLayer Workflow

This directory contains the HumanLayer Research → Plan → Implement workflow for AI-assisted development.

## Quick Start

1. **Research**: `/research [topic]` - Understand the codebase
2. **Plan**: `/plan [feature]` - Create implementation plan
3. **Implement**: `/implement [plan]` - Execute the plan

## Directory Structure

```
.opencode/
├── agent/subagents/
│   ├── research/           # Research subagents
│   └── thoughts/           # Thoughts management subagents
├── command/                # Slash commands
├── scripts/                # Utility scripts
└── thoughts/               # Persistent artifacts
    ├── research/           # Research documents
    ├── plans/              # Implementation plans
    └── shared/handoffs/    # Session handoffs
        ├── {TICKET}/       # Ticket-specific handoffs
        └── general/        # Non-ticket handoffs
```

## Commands

| Command                      | Purpose                              |
| ---------------------------- | ------------------------------------ |
| `/research [topic]`          | Comprehensive codebase research      |
| `/plan [feature]`            | Create phased implementation plan    |
| `/implement [plan]`          | Execute plan with verification gates |
| `/iterate [plan] [feedback]` | Update existing plan                 |
| `/validate [plan]`           | Verify implementation matches plan   |
| `/handoff`                   | Create session handoff document      |
| `/handoff TICKET-123`        | Create handoff for specific ticket   |
| `/resume [handoff]`          | Resume from handoff                  |
| `/resume TICKET-123`         | Resume from most recent ticket handoff |

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
```

### Step 9: Present Summary

```markdown
## Repository Initialized

### Structure Created

```
.opencode/
├── agent/subagents/
│   ├── research/
│   │   ├── codebase-locator.md
│   │   ├── codebase-analyzer.md
│   │   └── pattern-finder.md
│   └── thoughts/
│       ├── thoughts-locator.md
│       └── thoughts-analyzer.md
├── command/
│   ├── research.md
│   ├── plan.md
│   ├── implement.md
│   ├── iterate.md
│   ├── validate.md
│   ├── handoff.md
│   └── resume.md
├── scripts/
│   └── spec_metadata.sh
├── thoughts/
│   ├── research/
│   ├── plans/
│   └── shared/handoffs/
│       └── general/
└── README.md
```

### Next Steps

1. Review `.opencode/README.md` for usage guide
2. Try `/research [topic]` to explore your codebase
3. Use `/plan [feature]` to plan your first implementation

### Optional: Add to .gitignore

Consider adding to `.gitignore`:
```
# OpenCode session artifacts (optional)
# .opencode/thoughts/shared/handoffs/
```

Ready to use the HumanLayer workflow!
```

## Constraints

- Don't overwrite without permission
- Create all directories even if empty
- Include .gitkeep files for empty directories
- Provide clear next steps
