# HumanLayer Agent Architecture Research Report

**Date**: 2025-12-20 (Updated)  
**Purpose**: Research HumanLayer's approach to AI agents for implementation in OpenCode agents

---

> **⚠️ Format Note**: This document contains examples from HumanLayer which uses **Claude Code format**. When implementing these patterns in OpenCode, you must convert to **OpenCode format**. See the "OpenCode Format Reference" section in `opencode-implementation-guide.md` for conversion details.

---

## Executive Summary

HumanLayer implements a sophisticated **Research -> Plan -> Implement** workflow for AI coding agents, built on the principles outlined in their "12-Factor Agents" methodology. The key innovations are:

1. **Frequent Intentional Compaction** - Managing context window through structured phases (keep at 40-60% utilization)
2. **Specialized Sub-agents** - Parallel research agents for efficient context gathering
3. **Human-in-the-Loop Verification** - Pause points between phases for quality control
4. **Persistent Artifacts** - Research, plans, and handoffs stored as markdown files in `thoughts/` directory
5. **Human Leverage Hierarchy** - Focus human attention on highest-leverage points (research > plans > code)

---

## Repository Overview

| Repository | Purpose |
|------------|---------|
| `12-factor-agents/` | Principles and patterns for building reliable LLM applications |
| `advanced-context-engineering-for-coding-agents/` | The "Frequent Intentional Compaction" methodology |
| `humanlayer/` | Production implementation with Claude Code integration |

---

## Part 1: The 12-Factor Agents Principles

### Source File Locations

| Factor | File Path |
|--------|-----------|
| Overview | `12-factor-agents/README.md` |
| Factor 1 | `12-factor-agents/content/factor-01-natural-language-to-tool-calls.md` |
| Factor 2 | `12-factor-agents/content/factor-02-own-your-prompts.md` |
| Factor 3 | `12-factor-agents/content/factor-03-own-your-context-window.md` |
| Factor 4 | `12-factor-agents/content/factor-04-tools-are-structured-outputs.md` |
| Factor 5 | `12-factor-agents/content/factor-05-unify-execution-state.md` |
| Factor 6 | `12-factor-agents/content/factor-06-launch-pause-resume.md` |
| Factor 7 | `12-factor-agents/content/factor-07-contact-humans-with-tools.md` |
| Factor 8 | `12-factor-agents/content/factor-08-own-your-control-flow.md` |
| Factor 9 | `12-factor-agents/content/factor-09-compact-errors.md` |
| Factor 10 | `12-factor-agents/content/factor-10-small-focused-agents.md` |
| Factor 11 | `12-factor-agents/content/factor-11-trigger-from-anywhere.md` |
| Factor 12 | `12-factor-agents/content/factor-12-stateless-reducer.md` |
| Appendix 13 | `12-factor-agents/content/appendix-13-pre-fetch.md` |

### The 12 Factors Summary

| # | Factor | Description | OpenCode Relevance |
|---|--------|-------------|-------------------|
| 1 | **Natural Language to Tool Calls** | Convert natural language into structured JSON tool calls | Core pattern for all tool usage |
| 2 | **Own Your Prompts** | Treat prompts as first-class code, not framework abstractions | Already in OpenCode's agent system |
| 3 | **Own Your Context Window** | Custom context formats (XML), token efficiency, attention optimization | Key for subagent communication |
| 4 | **Tools Are Structured Outputs** | Tools are JSON with `intent` field, deterministic execution | Matches OpenCode's tool pattern |
| 5 | **Unify Execution State** | Keep all state in single serializable structure | Session-based execution |
| 6 | **Launch/Pause/Resume** | Simple APIs to start, pause, and resume agents | Human-in-the-loop gates |
| 7 | **Contact Humans with Tools** | Human interaction via structured tool calls | Approval workflows |
| 8 | **Own Your Control Flow** | Custom control structures per use case | OpenCode's workflow stages |
| 9 | **Compact Errors** | Feed errors back to context for self-healing | Error recovery pattern |
| 10 | **Small, Focused Agents** | 3-20 steps max, clear responsibilities | OpenCode's subagent architecture |
| 11 | **Trigger from Anywhere** | Enable multiple trigger channels | Webhook/CLI/event triggers |
| 12 | **Stateless Reducer** | Agent as `(state, event) -> new_state` | Functional approach |
| 13 | **Pre-fetch Context** | Fetch likely-needed data upfront | Context optimization |

### Key Insight: Context Window Management

From Factor 3, the recommended pattern is XML-based context serialization:

```xml
<user_input>
    can you multiply 3 and 4?
</user_input>
<multiply>
    a: 3
    b: 4
</multiply>
<tool_response>
    12
</tool_response>
```

This is more token-efficient than standard message-based formats.

---

## Part 2: The Research -> Plan -> Implement Workflow

### Workflow Diagram

```
+-------------------------------------------------------------------------+
|                    FREQUENT INTENTIONAL COMPACTION                       |
|                                                                          |
|   Keep context utilization at 40-60% through structured phases          |
+-------------------------------------------------------------------------+

                              +-------------+
                              |   TICKET    |
                              |  (Linear)   |
                              +------+------+
                                     |
                    +----------------+----------------+
                    v                v                v
            +-------------+  +-------------+  +-------------+
            | Sub-agent   |  | Sub-agent   |  | Sub-agent   |
            | Locator     |  | Analyzer    |  | Pattern     |
            +------+------+  +------+------+  +------+------+
                   |                |                |
                   +----------------+----------------+
                                    v
                    +------------------------------+
                    |         RESEARCH             |
                    |  thoughts/shared/research/   |
                    |  YYYY-MM-DD-ENG-XXXX-desc.md |
                    +-------------+----------------+
                                  |
                         [Human Review]
                                  |
                                  v
                    +------------------------------+
                    |           PLAN               |
                    |   thoughts/shared/plans/     |
                    |  YYYY-MM-DD-ENG-XXXX-desc.md |
                    +-------------+----------------+
                                  |
                         [Human Review]
                                  |
                                  v
                    +------------------------------+
                    |        IMPLEMENT             |
                    |   Phase 1 -> Verify -> Pause |
                    |   Phase 2 -> Verify -> Pause |
                    |   Phase N -> Verify -> Done  |
                    +-------------+----------------+
                                  |
                                  v
                    +------------------------------+
                    |         VALIDATE             |
                    |   Run all success criteria   |
                    |   Generate validation report |
                    +------------------------------+
```

### Phase Details

#### 1. Research Phase (`/research_codebase`)

**Source**: `humanlayer/.claude/commands/research_codebase.md`
**Model**: `opus`

**Key Philosophy** (Lines 10-17):
> YOUR ONLY JOB IS TO DOCUMENT AND EXPLAIN THE CODEBASE AS IT EXISTS TODAY
> - DO NOT suggest improvements or changes
> - DO NOT perform root cause analysis
> - ONLY describe what exists, where it exists, how it works

**Process Steps**:
1. Read mentioned files FULLY before spawning sub-tasks
2. Analyze and decompose the research question
3. Spawn parallel sub-agents (codebase-locator, codebase-analyzer, etc.)
4. Wait for ALL sub-agents then synthesize
5. Gather metadata via `hack/spec_metadata.sh`
6. Generate research document
7. Add GitHub permalinks (if on main branch)
8. Sync via `humanlayer thoughts sync`
9. Handle follow-up questions

**Output Location**: `thoughts/shared/research/YYYY-MM-DD-ENG-XXXX-description.md`

**Output Format**:
```markdown
---
date: [ISO format with timezone]
researcher: [name]
git_commit: [hash]
branch: [branch name]
repository: [repo name]
topic: "[User's Question/Topic]"
tags: [research, codebase, relevant-component-names]
status: complete
last_updated: [YYYY-MM-DD]
last_updated_by: [name]
---

# Research: [Topic]

## Research Question
## Summary
## Detailed Findings
### [Component/Area 1]
### [Component/Area 2]
## Code References
## Architecture Documentation
## Historical Context (from thoughts/)
## Related Research
## Open Questions
```

#### 2. Planning Phase (`/create_plan`)

**Source**: `humanlayer/.claude/commands/create_plan.md`
**Model**: `opus`

**Key Philosophy** (Lines 306-343):
> Be skeptical, thorough, and work collaboratively
> - Verify everything with actual code
> - Get buy-in at each step
> - No open questions in final plan

**Process Steps**:
1. Context Gathering - Read all mentioned files FULLY
2. Research & Discovery - Spawn sub-agents, create research todo list
3. Plan Structure Development - Get feedback before writing details
4. Detailed Plan Writing - Follow template structure
5. Sync and Review - `humanlayer thoughts sync`

**Output Location**: `thoughts/shared/plans/YYYY-MM-DD-ENG-XXXX-description.md`

**Output Format**:
```markdown
# [Feature/Task Name] Implementation Plan

## Overview
## Current State Analysis
## Desired End State
### Key Discoveries
## What We're NOT Doing
## Implementation Approach

---

## Phase 1: [Descriptive Name]
### Overview
### Changes Required
#### 1. [Component/File Group]
**File**: `path/to/file.ext`
**Changes**: [Summary]
```[language]
// code
```

### Success Criteria
#### Automated Verification
- [ ] Build passes: `make build`
- [ ] Unit tests: `make test`
- [ ] Type checking: `npm run typecheck`

#### Manual Verification
- [ ] [Specific behavior to verify]
- [ ] [Edge case to test]

**Implementation Note**: Pause for manual confirmation before next phase

---
## Phase 2: [Name]
...
```

#### 3. Implementation Phase (`/implement_plan`)

**Source**: `humanlayer/.claude/commands/implement_plan.md`
**Model**: default (sonnet for speed)

**Key Philosophy** (Lines 21-29):
> Plans are carefully designed, but reality can be messy
> - Follow the plan's intent while adapting to what you find
> - Implement each phase fully before moving to the next
> - Update checkboxes in the plan as you complete sections

**Key Behavior**:
1. Read plan completely
2. Check for existing checkmarks `- [x]`
3. Implement each phase fully
4. Run success criteria checks
5. **PAUSE for human verification** after each phase:

```
Phase [N] Complete - Ready for Manual Verification

Automated verification passed:
- [List checks that passed]

Please perform the manual verification steps:
- [Manual verification items from plan]

Let me know when complete so I can proceed to Phase [N+1].
```

#### 4. Validation Phase (`/validate_plan`)

**Source**: `humanlayer/.claude/commands/validate_plan.md`
**Model**: default

**Purpose**: Verify implementation matches plan, all success criteria pass.

**Output Format**:
```markdown
## Validation Report: [Plan Name]

### Implementation Status
| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: [Name] | Fully implemented | All items verified |
| Phase 2: [Name] | Partially implemented | (see issues) |

### Automated Verification Results
| Check | Command | Result |
|-------|---------|--------|
| Build | `make build` | Pass |
| Tests | `npm test` | Pass (47 tests) |

### Code Review Findings
#### Matches Plan
#### Deviations from Plan
#### Potential Issues

### Manual Testing Required
### Recommendations
### Verdict: [PASS / PASS WITH NOTES / NEEDS WORK]
```

---

## Part 3: Agent Prompt Locations

### Primary Command Prompts

**Location**: `humanlayer/.claude/commands/`

| File | Purpose | Model | Lines |
|------|---------|-------|-------|
| `research_codebase.md` | Full research with thoughts integration | opus | 214 |
| `research_codebase_generic.md` | Portable research (no thoughts) | opus | 180 |
| `research_codebase_nt.md` | No-thoughts version | opus | 191 |
| `create_plan.md` | Full planning with thoughts | opus | 450 |
| `create_plan_generic.md` | Portable planning | opus | 443 |
| `create_plan_nt.md` | No-thinking version | opus | - |
| `implement_plan.md` | Execute approved plans | default | 85 |
| `iterate_plan.md` | Update existing plans | opus | 250 |
| `validate_plan.md` | Verify implementation | default | 167 |

### Automation/Orchestration Prompts

| File | Purpose |
|------|---------|
| `ralph_research.md` | Auto-research from Linear queue |
| `ralph_plan.md` | Auto-plan from Linear queue |
| `ralph_impl.md` | Auto-implement with worktree |
| `oneshot.md` | Full research->plan->implement |
| `oneshot_plan.md` | Single-shot planning |

### Continuity Prompts

| File | Purpose |
|------|---------|
| `create_handoff.md` | Create handoff document |
| `resume_handoff.md` | Resume from handoff |

### Git/PR Workflow Prompts

| File | Purpose |
|------|---------|
| `commit.md` | Create git commits |
| `ci_commit.md` | CI-specific commit workflow |
| `describe_pr.md` | Create PR descriptions |
| `ci_describe_pr.md` | CI-specific PR descriptions |
| `local_review.md` | Local code review |
| `create_worktree.md` | Create git worktree |

### Other Commands

| File | Purpose |
|------|---------|
| `debug.md` | Debugging workflow |
| `founder_mode.md` | Experimental feature workflow |
| `linear.md` | Full Linear ticket management |

---

## Part 4: Agent Types and Relations

### Subagent Definitions Location

**HumanLayer Directory**: `humanlayer/.claude/agents/`
**OpenCode Target Directory**: `~/.config/opencode/agent/subagents/research/`

### Complete Subagent Specifications

> **⚠️ CLAUDE CODE FORMAT** - Tool names shown below are Claude Code format. Convert for OpenCode:
> - `Grep` → `grep: true`
> - `Glob` → `glob: true`
> - `LS` → `list: true`
> - `Read` → `read: true`

| Agent | File | Purpose | Tools (Claude Code) | OpenCode Tools |
|-------|------|---------|---------------------|----------------|
| `codebase-locator` | `codebase-locator.md` | Find WHERE files and components live | Grep, Glob, LS | `grep: true, glob: true, list: true, read: false` |
| `codebase-analyzer` | `codebase-analyzer.md` | Understand HOW specific code works | Read, Grep, Glob, LS | `read: true, grep: true, glob: true, list: true` |
| `codebase-pattern-finder` | `codebase-pattern-finder.md` | Find examples of existing patterns | Grep, Glob, Read, LS | `read: true, grep: true, glob: true, list: true` |
| `thoughts-locator` | `thoughts-locator.md` | Discover documents in thoughts/ directory | Grep, Glob, LS | `grep: true, glob: true, list: true` |
| `thoughts-analyzer` | `thoughts-analyzer.md` | Extract key insights from documents | Read, Grep, Glob, LS | `read: true, grep: true, glob: true, list: true` |
| `web-search-researcher` | `web-search-researcher.md` | Web research for external information | WebSearch, WebFetch, TodoWrite, Read, Grep, Glob, LS | `webfetch: true, read: true, grep: true, glob: true` |

### Agent Definition Format (YAML Frontmatter)

> **⚠️ CLAUDE CODE FORMAT** - This is HumanLayer's original format. For OpenCode implementation, see conversion table below.

```yaml
---
name: agent-name
description: Human-readable description of when to use this agent
tools: Tool1, Tool2, Tool3
model: sonnet
color: yellow  # optional
---
```

#### Format Conversion: Claude Code → OpenCode

| Claude Code (Above) | OpenCode (Target) |
|---------------------|-------------------|
| `name: agent-name` | Filename becomes name (e.g., `agent-name.md`) |
| `tools: Tool1, Tool2, Tool3` | `tools: { tool1: true, tool2: true, tool3: true }` |
| `model: sonnet` | `model: anthropic/claude-sonnet-4-20250514` |
| (not available) | `mode: subagent` (required) |
| (not available) | `temperature: 0.1` (recommended) |
| (not available) | `permissions: { ... }` (optional but powerful) |

#### OpenCode Target Format

```yaml
---
description: "Human-readable description of when to use this agent"
mode: subagent
temperature: 0.1
tools:
  read: true
  grep: true
  glob: true
  bash: false
  edit: false
  write: false
permissions:
  bash:
    "*": "deny"
  edit:
    "**/*": "deny"
---
```

### Agent Architecture Diagram

```
+-------------------------------------------------------------+
|                    PRIMARY AGENT                             |
|              (Claude Code Session)                           |
+-------------------------------------------------------------+
                              |
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
+---------------+     +---------------+     +---------------+
|   CODEBASE    |     |   THOUGHTS    |     |   EXTERNAL    |
|   AGENTS      |     |   AGENTS      |     |   AGENTS      |
+---------------+     +---------------+     +---------------+
| - locator     |     | - locator     |     | - web-search  |
| - analyzer    |     | - analyzer    |     | - linear-read |
| - pattern-    |     |               |     | - linear-     |
|   finder      |     |               |     |   search      |
+---------------+     +---------------+     +---------------+
```

### Agent Responsibilities Detail

#### codebase-locator
**Purpose**: Finding WHERE code lives - locating files and organizing by purpose, NOT analyzing contents

**Critical Guidelines**:
- DO NOT read file contents - just report locations
- DO NOT critique file organization
- Group by logical component

**Output Format**:
```markdown
## File Locations for [Feature/Topic]
### Implementation Files
### Test Files
### Configuration
### Type Definitions
### Related Directories
### Entry Points
```

#### codebase-analyzer
**Purpose**: Understanding HOW code works - analyzing implementation details, tracing data flow

**Critical Guidelines**:
- DO NOT suggest improvements or changes
- DO NOT perform root cause analysis
- DO NOT critique the implementation
- Focus on documenting what exists

**Output Format**:
```markdown
## Analysis: [Feature/Component Name]
### Overview
### Entry Points
### Core Implementation
### Data Flow
### Key Patterns
### Configuration
### Error Handling
```

#### codebase-pattern-finder
**Purpose**: Finding code patterns and examples - similar implementations for templates/inspiration

**Critical Guidelines**:
- DO NOT suggest which pattern is "better"
- DO NOT identify anti-patterns or code smells
- Document patterns as they exist

**Output Format**:
```markdown
## Pattern Examples: [Pattern Type]
### Pattern 1: [Descriptive Name]
**Found in**: `file:line-range`
**Used for**: [description]
[code snippet]
**Key aspects**: [bullets]
### Testing Patterns
### Pattern Usage in Codebase
### Related Utilities
```

#### thoughts-locator
**Purpose**: Finding documents in thoughts/ directory - NOT analyzing contents

**CRITICAL Path Correction Rule**:
- Files in `thoughts/searchable/` must have path corrected
- `thoughts/searchable/shared/research/api.md` -> `thoughts/shared/research/api.md`

**Output Format**:
```markdown
## Thought Documents about [Topic]
### Tickets
### Research Documents
### Implementation Plans
### Related Discussions
### PR Descriptions
Total: X relevant documents found
```

#### thoughts-analyzer
**Purpose**: Extracting HIGH-VALUE insights from thoughts documents

**Filtering Rules**:
- Include Only If: Answers specific question, documents firm decision, reveals constraint
- Exclude If: Exploratory, superseded, too vague to action

**Output Format**:
```markdown
## Analysis of: [Document Path]
### Document Context (Date, Purpose, Status)
### Key Decisions
### Critical Constraints
### Technical Specifications
### Actionable Insights
### Still Open/Unclear
### Relevance Assessment
```

#### web-search-researcher
**Purpose**: Expert web research - finding accurate, relevant information from web sources

**Quality Guidelines**:
- Accuracy: Quote sources accurately with direct links
- Relevance: Focus on information directly addressing query
- Authority: Prioritize official sources, recognized experts

**Output Format**:
```markdown
## Summary
## Detailed Findings
### [Topic/Source 1]
**Source**: [Name with link]
**Relevance**: [Why authoritative]
**Key Information**: [bullets with direct quotes]
## Additional Resources
## Gaps or Limitations
```

---

## Part 5: GitHub Workflow Automation

### Workflow Files Location

**Directory**: `humanlayer/.github/workflows/`

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| Claude PR Bot | `claude.yml` | @claude mentions, issues, PRs | Ad-hoc Claude interaction |
| Research Queue | `linear-research-tickets.yml` | Manual | Process research queue |
| Planning Queue | `linear-create-plan.yml` | Manual | Process planning queue |
| Implementation Queue | `linear-implement-plan.yml` | Manual | Process implementation queue |
| Code Review | `claude-code-review.yml` | PR events (disabled) | Automated code review |

### Workflow Pattern Details

#### linear-research-tickets.yml

**Trigger**: Manual (`workflow_dispatch`) with `num_tickets` input
**Model**: `opus` via CLI

**Claude Command**:
```bash
claude --dangerously-skip-permissions --model opus -p '/research_codebase $TICKET_FILE_PATH ...'
```

**Parallelization**:
- Matrix strategy based on ticket IDs from Linear
- `fail-fast: false` - failures don't stop other jobs
- WIP Limit: `RESEARCH_WIP_LIMIT: 5` (max tickets in "research in review")

**Linear Integration**:
- Fetches tickets in status `'research needed'` assigned to `'LinearLayer (Claude)'`
- Status transitions: `"research needed"` -> `"research in progress"` -> `"research in review"`
- On failure: Resets to `"research needed"`

#### linear-create-plan.yml

**Claude Command**:
```bash
claude --dangerously-skip-permissions --model opus -p '/create_plan $TICKET_FILE_PATH ...'
```

**Linear Integration**:
- Status transitions: `"ready for plan"` -> `"plan in progress"` -> `"plan in review"`
- On failure: Resets to `"ready for plan"`

#### linear-implement-plan.yml

**Multiple Claude Commands**:
1. `/implement_plan` - Execute the plan
2. `/ci_commit` - Create commits
3. Resolve merge conflicts (if any)
4. `/ci_describe_pr` - Create PR description

**Linear Integration**:
- Status transitions: `"ready for dev"` -> `"in dev"` -> `"code review"`
- Creates PR, links to Linear ticket
- On failure: Resets to `"ready for dev"`

---

## Part 6: Tools Required for OpenCode Implementation

### Core Tools (Already in OpenCode)

| Tool | Purpose | Status |
|------|---------|--------|
| `Read` | Read file contents | Exists |
| `Write` | Write files | Exists |
| `Edit` | Edit files | Exists |
| `Glob` | Find files by pattern | Exists |
| `Grep` | Search file contents | Exists |
| `Bash` | Execute commands | Exists |
| `Task` | Spawn sub-agents | Exists |
| `WebFetch` | Fetch web content | Exists |
| `TodoWrite/TodoRead` | Track progress | Exists |

### New Tools to Consider

| Tool | Purpose | Priority | Notes |
|------|---------|----------|-------|
| `ThoughtsSync` | Sync thoughts directory | Medium | For persistent artifacts |
| `LinearTicket` | Fetch Linear ticket details | Low | Optional integration |
| `LinearSearch` | Search Linear tickets | Low | Optional integration |
| `GitPermalink` | Generate GitHub permalinks | Low | For code references |
| `SpecMetadata` | Extract spec metadata | Low | `hack/spec_metadata.sh` equivalent |

### Slash Commands to Implement

| Command | Priority | Maps To | Model |
|---------|----------|---------|-------|
| `/research` | High | Research codebase | opus |
| `/plan` | High | Create implementation plan | opus |
| `/implement` | High | Execute plan | default |
| `/iterate` | Medium | Update existing plan | opus |
| `/validate` | Medium | Verify implementation | default |
| `/handoff` | Medium | Create handoff document | default |
| `/resume` | Medium | Resume from handoff | default |

---

## Part 7: Thoughts Directory Structure

### Directory Layout

```
~/thoughts/                          # Default location (configurable)
+-- repos/                           # Repository-specific thoughts
|   +-- {repo-name}/
|       +-- {username}/              # Personal notes
|       +-- shared/                  # Team-shared notes
|           +-- handoffs/            # Handoff documents
|           |   +-- ENG-XXXX/        # Per-ticket handoffs
|           +-- plans/               # Implementation plans
|           +-- research/            # Research documents
+-- global/                          # Cross-repository thoughts
    +-- {username}/                  # Personal cross-repo notes
    +-- shared/                      # Team cross-repo notes
```

### Symlink Structure in Code Repo

```
{code-repo}/thoughts/
+-- {username}/     -> ~/thoughts/repos/{repo-name}/{username}/
+-- shared/         -> ~/thoughts/repos/{repo-name}/shared/
+-- global/         -> ~/thoughts/global/
+-- searchable/     # Hard links for searching (auto-generated)
+-- CLAUDE.md       # Documentation
```

### File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Research | `YYYY-MM-DD-ENG-XXXX-description.md` | `2025-12-20-ENG-1234-auth-flow.md` |
| Plans | `YYYY-MM-DD-ENG-XXXX-description.md` | `2025-12-20-ENG-1234-add-oauth.md` |
| Handoffs | `YYYY-MM-DD_HH-MM-SS_ENG-XXXX_description.md` | `2025-12-20_14-30-00_ENG-1234_oauth.md` |

### Key Commands

```bash
humanlayer thoughts init    # Initialize thoughts for a repo
humanlayer thoughts sync    # Sync changes and update searchable index
humanlayer thoughts status  # Check sync status
```

---

## Part 8: Key Insights from Advanced Context Engineering

### Source File

`advanced-context-engineering-for-coding-agents/ace-fca.md`

### The Core Problem

> AI tools work well for greenfield projects, but are often counter-productive for brownfield codebases and complex tasks.

### The Solution: Frequent Intentional Compaction

1. **Design entire workflow around context management**
2. **Keep utilization at 40-60%** (not 100%)
3. **Build high-leverage human review into pipeline**

### Human Leverage Hierarchy

```
Bad line of RESEARCH -> Thousands of bad lines of code
Bad line of PLAN     -> Hundreds of bad lines of code  
Bad line of CODE     -> One bad line of code
```

**Focus human attention on highest-leverage points** (research and planning).

### What Makes This Work

1. **Not magic** - requires engaged human review
2. **Subagents for context control** - not role-playing
3. **Compaction artifacts** - research docs, plans, handoffs
4. **Iterative refinement** - throw out bad research, restart

### Subagent Usage Pattern

Subagents are NOT about "playing house and anthropomorphizing roles." They are about **context control**:
- Fresh context window for finding/searching/summarizing
- Parent agent gets straight to work without clouding context with Glob/Grep/Read calls

---

## Part 9: Handoff and Continuity Patterns

### Handoff Document Creation

**Source**: `humanlayer/.claude/commands/create_handoff.md`

**Location Pattern**: `thoughts/shared/handoffs/ENG-XXXX/YYYY-MM-DD_HH-MM-SS_ENG-ZZZZ_description.md`

**Template includes**:
- YAML frontmatter (date, researcher, git_commit, branch, repository, topic, tags, status)
- Sections: Task(s), Critical References, Recent changes, Learnings, Artifacts, Action Items & Next Steps

### Session Resumption

**Source**: `humanlayer/.claude/commands/resume_handoff.md`

**Three invocation modes**:
1. Direct path: `/resume_handoff thoughts/shared/handoffs/ENG-XXXX/YYYY-MM-DD.md`
2. Ticket reference: `/resume_handoff ENG-XXXX` (finds most recent)
3. No parameters: prompts user to select

**Resume Process**:
1. Read handoff document FULLY
2. Read linked research/plan documents
3. Spawn parallel research to verify current state
4. Present comprehensive analysis
5. Create action plan using TodoWrite
6. Begin implementation after confirmation

---

## Part 10: Implementation Recommendations for OpenCode

### 1. New Subagent Definitions

Create in `~/.config/opencode/agent/subagents/research/`:

> **Note**: The examples below show the **target OpenCode format**. See `opencode-implementation-guide.md` for complete agent file contents.

#### codebase-locator.md (OpenCode Format)
```yaml
---
description: "Find WHERE files and components live in the codebase - locations only, no content analysis"
mode: subagent
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
---

# Codebase Locator Agent
[Prompt content - see opencode-implementation-guide.md]
```

#### codebase-analyzer.md (OpenCode Format)
```yaml
---
description: "Understand HOW specific code works - data flow, dependencies, patterns"
mode: subagent
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
---

# Codebase Analyzer Agent
[Prompt content - see opencode-implementation-guide.md]
```

#### pattern-finder.md (OpenCode Format)
```yaml
---
description: "Find examples of existing patterns in the codebase for templates and inspiration"
mode: subagent
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
---

# Pattern Finder Agent
[Prompt content - see opencode-implementation-guide.md]
```

### 2. Context Bundle Pattern

When spawning subagents, create context bundles:

```markdown
# Context Bundle for Subagent

## Task
[Description of what to research/analyze]

## Constraints
- Only describe what exists
- Do not suggest improvements
- Focus on [specific area]

## Expected Output
- File locations
- Code flow explanation
- Key patterns found

## Loaded Standards
[Include relevant standards from context files]
```

### 3. Human Leverage Points

Build in pause points at highest-leverage moments:

1. **After Research**: Human reviews understanding before planning
2. **After Plan**: Human approves approach before implementation
3. **After Each Phase**: Human verifies before next phase
4. **After Validation**: Human confirms completion

### 4. Success Criteria Pattern

Split into two categories in all plans:

**Automated Verification**:
- Build commands
- Test suites
- Type checking
- Linting

**Manual Verification**:
- UI functionality
- Edge cases
- Performance considerations

### 5. Workflow Stages

```xml
<workflow>
  <stage id="1" name="Analyze">
    Assess request type -> Determine if research needed
  </stage>

  <stage id="2" name="Research" when="complex_task">
    Spawn parallel research subagents
    Synthesize findings
    Generate research document
    [PAUSE for human review]
  </stage>

  <stage id="3" name="Plan" when="implementation_needed">
    Load research (if exists)
    Interactive planning with user
    Generate phased plan
    [PAUSE for human review]
  </stage>

  <stage id="4" name="Implement" when="plan_approved">
    Execute phase by phase
    Run verification after each phase
    [PAUSE for manual verification]
    Continue to next phase
  </stage>

  <stage id="5" name="Validate">
    Run all success criteria
    Generate validation report
    [PAUSE for final approval]
  </stage>
</workflow>
```

---

## Appendix A: Complete File Reference

### humanlayer/.claude/ Structure

```
humanlayer/.claude/
+-- settings.json                    # Claude Code permissions, env vars
+-- agents/                          # Subagent definitions (6 files)
|   +-- codebase-analyzer.md
|   +-- codebase-locator.md
|   +-- codebase-pattern-finder.md
|   +-- thoughts-analyzer.md
|   +-- thoughts-locator.md
|   +-- web-search-researcher.md
+-- commands/                        # Slash command prompts (28 files)
    +-- create_handoff.md
    +-- create_plan.md
    +-- create_plan_generic.md
    +-- create_plan_nt.md
    +-- create_worktree.md
    +-- ci_commit.md
    +-- ci_describe_pr.md
    +-- commit.md
    +-- debug.md
    +-- describe_pr.md
    +-- founder_mode.md
    +-- implement_plan.md
    +-- iterate_plan.md
    +-- linear.md
    +-- local_review.md
    +-- oneshot.md
    +-- oneshot_plan.md
    +-- ralph_impl.md
    +-- ralph_plan.md
    +-- ralph_research.md
    +-- research_codebase.md
    +-- research_codebase_generic.md
    +-- research_codebase_nt.md
    +-- resume_handoff.md
    +-- validate_plan.md
    +-- ...
```

### 12-factor-agents Structure

```
12-factor-agents/
+-- README.md                        # Overview and navigation
+-- CLAUDE.md                        # Claude development context
+-- content/                         # Factor documentation
|   +-- brief-history-of-software.md
|   +-- factor-01-natural-language-to-tool-calls.md
|   +-- factor-02-own-your-prompts.md
|   +-- factor-03-own-your-context-window.md
|   +-- factor-04-tools-are-structured-outputs.md
|   +-- factor-05-unify-execution-state.md
|   +-- factor-06-launch-pause-resume.md
|   +-- factor-07-contact-humans-with-tools.md
|   +-- factor-08-own-your-control-flow.md
|   +-- factor-09-compact-errors.md
|   +-- factor-10-small-focused-agents.md
|   +-- factor-11-trigger-from-anywhere.md
|   +-- factor-12-stateless-reducer.md
|   +-- appendix-13-pre-fetch.md
+-- packages/
|   +-- create-12-factor-agent/template/  # TypeScript implementation
+-- workshops/
    +-- 2025-05/                     # TypeScript workshop
```

---

## Next Steps

1. **Create subagent definitions** in `~/.config/opencode/agent/subagents/research/`:
   - `codebase-locator.md`
   - `codebase-analyzer.md`
   - `pattern-finder.md`

2. **Create slash commands** in `~/.config/opencode/command/`:
   - `research.md` - spawns parallel subagents, synthesizes findings
   - `plan.md` - interactive planning with phase structure
   - `implement.md` - phase-by-phase execution with pause points

3. **Add thoughts directory** support to OpenCode context system

4. **Test on real codebase** with complex multi-phase task

5. **Add validation and handoff** commands for workflow continuity

---

## Appendix: Format Reference Quick Guide

### Claude Code → OpenCode Conversion

| Aspect | Claude Code | OpenCode |
|--------|-------------|----------|
| Agent location | `.claude/agents/` | `~/.config/opencode/agent/` or `.opencode/agent/` |
| Command location | `.claude/commands/` | `~/.config/opencode/command/` or `.opencode/command/` |
| Tool format | `tools: Read, Grep, Glob` | `tools: { read: true, grep: true, glob: true }` |
| Tool names | `Read`, `Grep`, `LS`, `Glob` | `read`, `grep`, `list`, `glob` |
| Model reference | `model: sonnet` | `model: anthropic/claude-sonnet-4-20250514` |
| Agent type | Implicit | `mode: primary \| subagent` |
| Temperature | Not available | `temperature: 0.1` |
| Permissions | Not available | Full `permissions:` block with glob patterns |
| Agent name | `name:` field | Filename (e.g., `review.md` → `review`) |

### OpenCode Permission Values

| Value | Behavior |
|-------|----------|
| `"allow"` | Execute without prompting |
| `"ask"` | Prompt user for approval |
| `"deny"` | Block the operation |

### OpenCode Tool Names

| OpenCode | Purpose |
|----------|---------|
| `read` | Read file contents |
| `write` | Create/overwrite files |
| `edit` | Edit files (string replacement) |
| `grep` | Search file contents |
| `glob` | Find files by pattern |
| `list` | List directory contents |
| `bash` | Execute shell commands |
| `patch` | Apply diff patches |
| `task` | Spawn subagents |
| `webfetch` | Fetch web content |
