# HumanLayer OpenCode

> > **⚠️ Work in Progress** - This is an experimental personal project, not production-ready.

An [OpenCode](https://opencode.ai) implementation of the [HumanLayer](https://github.com/humanlayer/humanlayer) context engineering workflow.

This repository provides agents and commands that implement the Research → Plan → Implement workflow pattern for AI-assisted development.

## Quick Start

Initialize any repository with the HumanLayer workflow:

```bash
# Using curl (macOS/Linux)
curl -fsSL https://raw.githubusercontent.com/DrBushyTop/humanlayer-opencode/master/init-hl-repo.sh | bash

# Or download and run manually
curl -O https://raw.githubusercontent.com/DrBushyTop/humanlayer-opencode/master/init-hl-repo.sh
chmod +x init-hl-repo.sh
./init-hl-repo.sh [branch] [dest-dir]
```

```powershell
# Using PowerShell (Windows)
irm https://raw.githubusercontent.com/DrBushyTop/humanlayer-opencode/master/init-hl-repo.ps1 -OutFile init-hl-repo.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File .\init-hl-repo.ps1 -Branch master -DestDir .opencode
```

After installation, restart OpenCode for the commands and agents to become available.

> **Note:** Installation is per-repository since the `thoughts/` directory (research, plans, handoffs) is stored locally in `.opencode/`.

## What's Included

### Commands

**Core Workflow:**

| Command                      | Description                                                |
| ---------------------------- | ---------------------------------------------------------- |
| `/research [topic]`          | Comprehensive codebase research with parallel subagents    |
| `/plan [feature]`            | Create phased implementation plans with verification gates |
| `/implement [plan]`          | Execute plans with human checkpoints between phases        |
| `/iterate [plan] [feedback]` | Update existing plans based on feedback                    |
| `/validate [plan]`           | Verify implementation matches the plan                     |
| `/handoff [ticket]`          | Create session handoff for continuity                      |
| `/resume [handoff]`          | Resume work from a previous handoff                        |

**Git Workflow:**

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `/commit`       | Create a well-structured git commit  |
| `/describe-pr`  | Generate PR description from changes |
| `/local-review` | Review changes before committing     |

**Utility:**

| Command           | Description                      |
| ----------------- | -------------------------------- |
| `/oneshot [task]` | Quick single-shot task execution |

**Ralph Loop (Iterative Development):**

| Command                          | Description                              |
| -------------------------------- | ---------------------------------------- |
| `/ralph-loop [prompt] [options]` | Start iterative AI loop until completion |
| `/cancel-ralph`                  | Cancel active Ralph loop                 |
| `/ralph-status`                  | Check Ralph loop status                  |
| `/ralph-help`                    | Explain Ralph Wiggum technique           |

### Subagents

**Research Agents:**

- `codebase-locator` - Find WHERE files and components live
- `codebase-analyzer` - Understand HOW specific code works
- `pattern-finder` - Find examples of existing patterns

**Thoughts Agents:**

- `thoughts-locator` - Discover existing documentation
- `thoughts-analyzer` - Extract insights from documents

## Workflow Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  /research  │ ──▶ │   /plan     │ ──▶ │ /implement  │
│             │     │             │     │             │
│ Understand  │     │ Create      │     │ Execute     │
│ codebase    │     │ phased plan │     │ with gates  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  thoughts/  │     │  thoughts/  │     │  /validate  │
│  research/  │     │  plans/     │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Key Principles

1. **Research First** - Understand the codebase before making changes
2. **Phased Implementation** - Break work into verifiable phases
3. **Human Checkpoints** - Pause for manual verification between phases
4. **Persistent Artifacts** - Store research and plans in `thoughts/` directory
5. **Context Management** - Use subagents to avoid context bloat

## Directory Structure

After initialization:

```
.opencode/
├── agent/
│   ├── plan-humanlayer.md      # Planning orchestrator agent
│   ├── research-humanlayer.md  # Research orchestrator agent
│   └── subagents/
│       ├── research/           # Codebase research agents
│       │   ├── codebase-analyzer.md
│       │   ├── codebase-locator.md
│       │   └── pattern-finder.md
│       └── thoughts/           # Document management agents
│           ├── thoughts-analyzer.md
│           └── thoughts-locator.md
├── command/                    # Slash commands
│   ├── research.md
│   ├── plan.md
│   ├── implement.md
│   ├── iterate.md
│   ├── validate.md
│   ├── handoff.md
│   ├── resume.md
│   ├── commit.md
│   ├── describe-pr.md
│   ├── local-review.md
│   └── oneshot.md
├── scripts/                    # Utility scripts
│   └── spec_metadata.sh
└── thoughts/                   # Persistent artifacts
    ├── research/               # Research documents
    ├── plans/                  # Implementation plans
    └── shared/handoffs/        # Session handoffs
```

## Usage Examples

### Research a Feature Area

```
/research authentication flow
```

Creates a research document in `thoughts/research/` with:

- File locations and references
- Architecture documentation
- Cross-component connections

### Create an Implementation Plan

```
/plan add user preferences API
```

Creates a phased plan in `thoughts/plans/` with:

- Current state analysis
- Phased implementation steps
- Success criteria (automated + manual)
- Verification gates between phases

### Implement with Verification

```
/implement thoughts/plans/2025-01-15-user-preferences.md
```

Executes the plan phase by phase, pausing for human verification after each phase.

### Hand Off Work

```
/handoff TICKET-123
```

Creates a handoff document capturing current state for session continuity.

### Iterative Development with Ralph Loop

```
/ralph-loop Build a REST API with tests --max 20 --promise "API COMPLETE"
```

The AI will work iteratively until it outputs `<promise>API COMPLETE</promise>` or reaches 20 iterations. Each iteration sees previous work in files.

**CLI Mode:** For command-line usage, use the dedicated script:

```bash
# Basic usage
.opencode/scripts/ralph-loop-cli.sh "Build API" --max 5 --promise "DONE"

# With a running server (faster)
opencode serve  # In another terminal
.opencode/scripts/ralph-loop-cli.sh "Build API" --max 5 --promise "DONE" --attach http://localhost:4096
```

## References

- [HumanLayer Context Engineering](https://github.com/humanlayer/humanlayer)
- [12-Factor Agents](https://github.com/humanlayer/12-factor-agents)
- [OpenCode Documentation](https://opencode.ai/docs)

## License

Apache 2.0 - See [LICENSE](LICENSE)
