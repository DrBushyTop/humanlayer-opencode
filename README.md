# HumanLayer OpenCode

An [OpenCode](https://opencode.ai) implementation of the [HumanLayer](https://github.com/humanlayer/humanlayer) context engineering workflow.

This repository provides agents and commands that implement the Research → Plan → Implement workflow pattern for AI-assisted development.

## Quick Start

Initialize any repository with the HumanLayer workflow:

```bash
# Using curl (macOS/Linux)
curl -fsSL https://raw.githubusercontent.com/DrBushyTop/humanlayer-opencode/master/.opencode/scripts/init-hl-repo.sh | bash

# Using PowerShell (Windows)
irm https://raw.githubusercontent.com/DrBushyTop/humanlayer-opencode/master/.opencode/scripts/init-hl-repo.sh | bash

# Or download and run manually
curl -O https://raw.githubusercontent.com/DrBushyTop/humanlayer-opencode/master/.opencode/scripts/init-hl-repo.sh
chmod +x init-hl-repo.sh
./init-hl-repo.sh [branch] [dest-dir]
```

After installation, restart OpenCode for the commands and agents to become available.

> **Note:** Installation is per-repository since the `thoughts/` directory (research, plans, handoffs) is stored locally in `.opencode/`.

## What's Included

### Commands

| Command | Description |
|---------|-------------|
| `/research [topic]` | Comprehensive codebase research with parallel subagents |
| `/plan [feature]` | Create phased implementation plans with verification gates |
| `/implement [plan]` | Execute plans with human checkpoints between phases |
| `/iterate [plan] [feedback]` | Update existing plans based on feedback |
| `/validate [plan]` | Verify implementation matches the plan |
| `/handoff [ticket]` | Create session handoff for continuity |
| `/resume [handoff]` | Resume work from a previous handoff |

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
├── agent/subagents/
│   ├── research/           # Codebase research agents
│   │   ├── codebase-analyzer.md
│   │   ├── codebase-locator.md
│   │   └── pattern-finder.md
│   └── thoughts/           # Document management agents
│       ├── thoughts-analyzer.md
│       └── thoughts-locator.md
├── command/                # Slash commands
│   ├── research.md
│   ├── plan.md
│   ├── implement.md
│   ├── iterate.md
│   ├── validate.md
│   ├── handoff.md
│   └── resume.md
├── scripts/                # Utility scripts
│   ├── init-hl-repo.sh
│   └── spec_metadata.sh
└── thoughts/               # Persistent artifacts
    ├── research/           # Research documents
    ├── plans/              # Implementation plans
    └── shared/handoffs/    # Session handoffs
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

## References

- [HumanLayer Context Engineering](https://github.com/humanlayer/humanlayer)
- [12-Factor Agents](https://github.com/humanlayer/12-factor-agents)
- [OpenCode Documentation](https://opencode.ai/docs)

## License

Apache 2.0 - See [LICENSE](LICENSE)
