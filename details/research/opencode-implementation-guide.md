# OpenCode Implementation Guide: Research -> Plan -> Implement Workflow

**Based on**: HumanLayer's Advanced Context Engineering methodology  
**Last Updated**: 2025-12-20

---

## Overview

This guide provides concrete implementation details for adding the Research -> Plan -> Implement workflow to OpenCode agents.

### Key Principles from HumanLayer

1. **Frequent Intentional Compaction** - Keep context at 40-60% utilization
2. **Subagents for Context Control** - Not role-playing, but fresh context windows
3. **Human Leverage Hierarchy** - Focus human attention on research > plans > code
4. **Persistent Artifacts** - Research, plans, handoffs stored as markdown

### Official OpenCode Documentation

| Topic | URL | Purpose |
|-------|-----|---------|
| Agents | https://opencode.ai/docs/agents/ | Agent configuration, types, options |
| Tools | https://opencode.ai/docs/tools/ | Built-in tools reference |
| Permissions | https://opencode.ai/docs/permissions/ | Permission system (allow/ask/deny) |
| Commands | https://opencode.ai/docs/commands/ | Slash command configuration |
| Custom Tools | https://opencode.ai/docs/custom-tools/ | Creating custom tools |

---

## OpenCode Agent Structure Reference

> **Important**: This section documents the **target OpenCode format** for agents. Examples marked with ⚠️ CLAUDE CODE FORMAT show the original HumanLayer format for reference only.

### Agent File Locations

```
~/.config/opencode/
├── agent/
│   ├── {agent-name}.md              # Primary agents
│   └── subagents/
│       ├── research/                # Research subagents (TO BE CREATED)
│       │   ├── codebase-locator.md
│       │   ├── codebase-analyzer.md
│       │   └── pattern-finder.md
│       ├── code/                    # Code subagents (existing)
│       │   ├── build-agent.md
│       │   ├── codebase-pattern-analyst.md
│       │   ├── coder-agent.md
│       │   ├── reviewer.md
│       │   └── tester.md
│       └── core/                    # Core subagents (existing)
│           ├── documentation.md
│           └── task-manager.md
├── command/
│   └── {command-name}.md            # Slash commands
└── opencode.json                    # Global configuration
```

**Project-specific agents** can also be placed in:
```
{project-root}/.opencode/agent/
```

### OpenCode Agent YAML Frontmatter Format

> **Reference**: [OpenCode Agents Documentation](https://opencode.ai/docs/agents/)

This is the **correct format** for OpenCode agents:

```yaml
---
# Required fields
description: "Brief description of what the agent does"
mode: subagent                    # "primary" | "subagent"

# Optional but recommended
temperature: 0.1                  # 0.0-1.0 (lower = more focused)

# Tool configuration (object format, not comma-separated)
tools:
  read: true
  grep: true
  glob: true
  bash: false
  edit: false
  write: false
  patch: false
  task: false

# Permission configuration (granular control)
permissions:
  bash:
    "git status": "allow"
    "git diff": "allow"
    "git log*": "allow"
    "*": "deny"
  edit:
    "**/*": "deny"
  webfetch: "deny"

# Optional metadata
model: "anthropic/claude-sonnet-4-20250514"
model_family: "claude"
recommended_models:
  - "anthropic/claude-sonnet-4-5"
tested_with: "anthropic/claude-sonnet-4-5"
last_tested: "2025-12-20"
maintainer: "username"
status: "stable"
---

# Agent Title

[Agent prompt content in markdown - instructions, guidelines, output format]
```

### Format Comparison: Claude Code vs OpenCode

> **References**: 
> - Tools: https://opencode.ai/docs/tools/
> - Agents: https://opencode.ai/docs/agents/

| Aspect | ⚠️ Claude Code Format | ✅ OpenCode Format |
|--------|----------------------|-------------------|
| Tools | `tools: Read, Grep, Glob, LS` | `tools: { read: true, grep: true }` |
| Tool names | `Read`, `Grep`, `LS` | `read`, `grep`, `list` |
| Permissions | Not available | Full permission system |
| Temperature | Not documented | `temperature: 0.1` |
| Mode | Implicit | `mode: primary \| subagent` |
| Model | `model: sonnet` | `model: anthropic/claude-sonnet-4-20250514` |

### Permission Values

> **Reference**: [OpenCode Permissions Documentation](https://opencode.ai/docs/permissions/)

| Value | Behavior |
|-------|----------|
| `"allow"` | Execute without prompting |
| `"ask"` | Prompt user for approval |
| `"deny"` | Block the operation |

### Permission Glob Patterns

```yaml
permissions:
  bash:
    "git *": "allow"           # All git commands
    "npm test": "allow"        # Specific command
    "rm -rf *": "deny"         # Dangerous commands
    "*": "ask"                 # Default for unmatched
  edit:
    "**/*.env*": "deny"        # Environment files
    "**/*.key": "deny"         # Key files
    ".git/**": "deny"          # Git internals
    "node_modules/**": "deny"  # Dependencies
```

---

## 1. Research Subagent Definitions

> **Note**: These agents need to be created in `~/.config/opencode/agent/subagents/research/`

### 1.1 codebase-locator.md

> ⚠️ **CLAUDE CODE FORMAT (Original from HumanLayer)**:
> ```yaml
> ---
> name: codebase-locator
> description: Find WHERE files and components live
> tools: Grep, Glob, LS
> model: sonnet
> ---
> ```

✅ **OPENCODE FORMAT (Target Implementation)**:

```markdown
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

You are a specialist at finding WHERE code lives. Your job is to locate files and organize them by purpose, NOT to analyze their contents.

## Core Responsibilities

### Find File Locations
- Search for files by pattern matching
- Locate imports and exports
- Find directory structures
- Identify file organization patterns

### Organize by Purpose
- Group files by logical component
- Identify entry points
- Map directory purposes
- Note naming conventions

## Critical Guidelines

- **DO NOT** read file contents beyond what grep shows
- **DO NOT** analyze code logic or behavior
- **DO NOT** suggest improvements
- **ONLY** report locations and organization

## Search Strategy

1. Use `glob` to find files by name patterns
2. Use `grep` to find imports/exports
3. Use `list` to explore directory structures
4. Group findings by logical component

## Output Format

```markdown
## File Locations for [Feature/Topic]

### Implementation Files
- `src/feature/index.ts` - Main entry point
- `src/feature/handler.ts` - Request handler
- `src/feature/types.ts` - Type definitions

### Test Files
- `tests/feature/handler.test.ts` - Handler tests
- `tests/feature/integration.test.ts` - Integration tests

### Configuration
- `config/feature.json` - Feature configuration

### Type Definitions
- `types/feature.d.ts` - External type declarations

### Related Directories
- `src/feature/` - Main implementation
- `src/shared/` - Shared utilities used by feature

### Entry Points
- `src/index.ts:45` - Feature export
- `src/routes.ts:23` - Route registration
```

## Constraints

- Only report files that exist
- Include brief description of each file's purpose
- Group by logical component
- Do not read or analyze file contents
```

### 1.2 codebase-analyzer.md

> ⚠️ **CLAUDE CODE FORMAT (Original from HumanLayer)**:
> ```yaml
> ---
> name: codebase-analyzer
> description: Understand HOW specific code works
> tools: Read, Grep, Glob, LS
> model: sonnet
> ---
> ```

✅ **OPENCODE FORMAT (Target Implementation)**:

```markdown
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

You are a specialist at understanding HOW code works. Your job is to analyze implementation details, trace data flow, and document architecture.

## Core Responsibilities

### Analyze Implementation
- Read and understand code logic
- Trace function calls and data flow
- Identify key patterns and abstractions
- Document dependencies

### Document Architecture
- Map component relationships
- Identify entry points and exits
- Document error handling paths
- Note configuration requirements

## Critical Guidelines

- **DO NOT** suggest improvements or changes
- **DO NOT** perform root cause analysis
- **DO NOT** critique the implementation
- **DO NOT** propose refactoring
- **ONLY** document and explain what exists

Think of yourself as an archaeologist documenting an ancient city - your job is to map and explain what's there, not to redesign it.

## Analysis Strategy

1. Read entry point files completely
2. Trace function calls through the codebase
3. Identify key data structures
4. Map error handling patterns
5. Document configuration and dependencies

## Output Format

```markdown
## Analysis: [Feature/Component Name]

### Overview
[High-level description of what this component does]

### Entry Points
- `functionName()` in `file.ts:45` - [purpose]
- `ClassName.method()` in `file.ts:67` - [purpose]

### Core Implementation
[Detailed explanation of how the code works]

### Data Flow
1. Request enters at [entry point]
2. Data is validated by [function]
3. Processing occurs in [component]
4. Response is formatted by [function]
5. Result returned via [mechanism]

### Key Patterns
- **Pattern Name**: [how it's used and why]
- **Another Pattern**: [explanation]

### Dependencies
- Internal: `module1`, `module2`
- External: `library1@version`, `library2@version`

### Configuration
- `CONFIG_VAR` - [purpose and default]
- `feature.enabled` - [controls what]

### Error Handling
- [Error type]: Handled by [mechanism]
- [Error type]: Propagated to [handler]
```

## Constraints

- Only describe what exists
- Do not suggest improvements
- Focus on understanding, not critique
- Include file:line references for all findings
```

### 1.3 pattern-finder.md

> ⚠️ **CLAUDE CODE FORMAT (Original from HumanLayer)**:
> ```yaml
> ---
> name: codebase-pattern-finder
> description: Find examples of existing patterns
> tools: Grep, Glob, Read, LS
> model: sonnet
> ---
> ```

✅ **OPENCODE FORMAT (Target Implementation)**:

```markdown
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

You are a specialist at finding code patterns and examples. Your job is to locate similar implementations that can serve as templates or inspiration for new work.

## Core Responsibilities

### Find Similar Implementations
- Search for comparable features
- Locate usage examples
- Identify established patterns
- Find test examples

### Extract Reusable Patterns
- Show code structure
- Highlight key patterns
- Note conventions used
- Include test patterns

### Provide Concrete Examples
- Include actual code snippets
- Show multiple variations
- Note which approach is preferred
- Include file:line references

## Critical Guidelines

- **DO NOT** suggest which pattern is "better"
- **DO NOT** identify anti-patterns or code smells
- **DO NOT** recommend refactoring
- **ONLY** document patterns as they exist

## Search Strategy

1. Identify pattern type from user request
2. Search for similar functionality with grep
3. Find structural patterns with glob
4. Read files to extract examples
5. Categorize and present findings

## Output Format

```markdown
## Pattern Examples: [Pattern Type]

### Pattern 1: [Descriptive Name]
**Found in**: `src/api/users.ts:45-67`
**Used for**: [what this pattern accomplishes]
**Quality**: Well-tested, documented, consistent

\`\`\`typescript
// Actual code snippet from the codebase
async function example() {
  // implementation
}
\`\`\`

**Key aspects:**
- Uses [approach] for [reason]
- Handles errors via [mechanism]
- Follows [convention]

### Pattern 2: [Alternative Approach]
**Found in**: `src/api/products.ts:89-120`
**Used for**: [slightly different use case]

\`\`\`typescript
// Alternative implementation
\`\`\`

**Key aspects:**
- Different approach using [method]
- Better for [specific scenario]

### Testing Patterns
**Found in**: `tests/api/users.test.ts:15-45`

\`\`\`typescript
// How this pattern is tested
describe('Feature', () => {
  it('should work', () => {
    // test implementation
  });
});
\`\`\`

### Pattern Summary
- **Common approach**: [description]
- **Variations found**: [list]
- **Usage count**: Found in X files

### Related Utilities
- `src/utils/helper.ts:12` - Shared helper for this pattern
- `src/middleware/validate.ts:34` - Validation middleware
```

## Constraints

- Only show existing code
- Prefer recent/well-maintained examples
- Note any inconsistencies in pattern usage
- Include file:line references for all examples
```

---

## 2. Slash Command Implementations

> **Reference**: [OpenCode Commands Documentation](https://opencode.ai/docs/commands/)
> 
> **Note**: Commands should be created in `~/.config/opencode/command/`

### 2.1 `/research` Command

Create as `~/.config/opencode/command/research.md`:

```markdown
---
description: "Comprehensive codebase research with parallel subagent analysis"
agent: general
model: anthropic/claude-sonnet-4-20250514
---

# Research Codebase Command

## Trigger
`/research [topic or question]`

## Philosophy

**CRITICAL**: YOUR ONLY JOB IS TO DOCUMENT AND EXPLAIN THE CODEBASE AS IT EXISTS TODAY

- DO NOT suggest improvements or changes
- DO NOT perform root cause analysis
- DO NOT propose future enhancements
- DO NOT critique the implementation
- ONLY describe what exists, where it exists, how it works

Think of yourself as an archaeologist documenting an ancient city - your job is to map and explain what's there, not to redesign it.

## Process

### Step 1: Initial Analysis
1. Parse the research question
2. Identify key terms and concepts
3. Create initial search strategy

### Step 2: Parallel Research
Spawn these subagents in parallel using Task tool:

```javascript
// Spawn all research agents in parallel
Task({
  subagent_type: "subagents/research/codebase-locator",
  description: "Find relevant files",
  prompt: `Find all files related to: ${topic}
           Focus on: ${key_areas}
           Return file paths with descriptions.`
})

Task({
  subagent_type: "subagents/research/codebase-analyzer", 
  description: "Analyze code structure",
  prompt: `Analyze how ${topic} works in this codebase.
           Start with these files: ${initial_files}
           Trace the data flow and dependencies.`
})

Task({
  subagent_type: "subagents/research/pattern-finder",
  description: "Find similar patterns",
  prompt: `Find examples of ${pattern_type} in this codebase.
           Look for similar implementations to: ${topic}`
})
```

### Step 3: Synthesis
1. Wait for ALL subagents to complete
2. Combine findings into coherent narrative
3. Identify gaps or contradictions
4. Generate research document

### Step 4: Output
Write to: `.opencode/thoughts/research/YYYY-MM-DD-{topic-slug}.md`

## Output Template

```markdown
---
date: [ISO format]
researcher: opencode
topic: "[research question]"
status: complete
---

# Research: [Topic]

## Research Question
[The original question]

## Summary
[2-3 paragraph executive summary]

## Detailed Findings

### [Area 1]
[Findings with code references]

### [Area 2]
[Findings with code references]

## Code References
- `path/to/file.ts:45` - [description]
- `path/to/file.ts:67` - [description]

## Architecture Overview
[How components fit together]

## Open Questions
- [Any unresolved questions]
```
```

### 2.2 `/plan` Command

Create as `~/.config/opencode/command/plan.md`:

```markdown
---
description: "Create phased implementation plan with human verification gates"
agent: general
model: anthropic/claude-sonnet-4-20250514
---

# Create Plan Command

## Trigger
`/plan [feature or task description]`
`/plan path/to/research.md` (use existing research)

## Philosophy

Be skeptical, thorough, and work collaboratively:
- Verify everything with actual code
- Get buy-in at each step
- No open questions in final plan

## Process

### Step 1: Context Gathering
1. If research file provided, read it completely
2. If not, spawn research first
3. Read all files mentioned in research
4. Understand current state

### Step 2: Interactive Planning
1. Present understanding to user
2. Ask clarifying questions
3. Propose approach options
4. Get user feedback

### Step 3: Plan Development
1. Create phase structure
2. Define success criteria for each phase
3. Identify risks and mitigations

### Step 4: Output
Write to: `.opencode/thoughts/plans/YYYY-MM-DD-{feature-slug}.md`

## Output Template

```markdown
# [Feature Name] Implementation Plan

## Overview
[What we're building and why]

## Current State Analysis
[How things work today]

## Desired End State
[What success looks like]

## What We're NOT Doing
[Explicit scope boundaries]

## Implementation Approach
[High-level strategy]

---

## Phase 1: [Descriptive Name]

### Overview
[What this phase accomplishes]

### Changes Required

#### 1. [Component/File Group]
**File**: `path/to/file.ext`
**Changes**: [Summary of changes]

\`\`\`[language]
// Before
old code

// After  
new code
\`\`\`

### Success Criteria

#### Automated Verification
- [ ] Tests pass: `npm test`
- [ ] Type check: `npm run typecheck`
- [ ] Lint: `npm run lint`

#### Manual Verification
- [ ] [Specific behavior to verify]
- [ ] [Edge case to test]

**⏸️ PAUSE**: Wait for human verification before Phase 2

---

## Phase 2: [Name]
[Same structure as Phase 1]

---

## Testing Strategy

### Unit Tests
- [ ] [Test case 1]
- [ ] [Test case 2]

### Integration Tests
- [ ] [Test case 1]

### Manual Testing
1. [Step 1]
2. [Step 2]

## Risks and Mitigations
| Risk | Mitigation |
|------|------------|
| [Risk 1] | [How to handle] |

## References
- Research: `.opencode/thoughts/research/YYYY-MM-DD-topic.md`
- Related: [links to relevant docs]
```
```

### 2.3 `/implement` Command

Create as `~/.config/opencode/command/implement.md`:

```markdown
---
description: "Execute approved plan phase by phase with verification gates"
agent: general
---

# Implement Plan Command

## Trigger
`/implement path/to/plan.md`
`/implement` (finds most recent plan)

## Philosophy

Execute the plan exactly as written:
- Trust the plan (it was reviewed)
- Pause for verification between phases
- Update checkboxes as you go

## Process

### Step 1: Load Plan
1. Read plan completely
2. Check for existing checkmarks `- [x]`
3. Find first unchecked phase

### Step 2: Execute Phase
1. Make all changes for current phase
2. Run automated verification commands
3. Update checkboxes in plan file

### Step 3: Pause for Verification

```markdown
## Phase [N] Complete - Ready for Manual Verification

### Automated Checks Passed:
- ✅ Tests: `npm test`
- ✅ Types: `npm run typecheck`
- ✅ Lint: `npm run lint`

### Manual Verification Required:
- [ ] [Item from plan]
- [ ] [Item from plan]

**Please verify and respond to continue to Phase [N+1].**
```

### Step 4: Handle Issues

If something doesn't match the plan:

```markdown
## ⚠️ Issue in Phase [N]

**Expected** (from plan):
[What the plan said]

**Found**:
[Actual situation]

**Impact**:
[Why this matters]

**Options**:
1. [Option A]
2. [Option B]

**How should I proceed?**
```

### Step 5: Continue or Complete
- If more phases: wait for approval, continue
- If done: run final validation
```

---

## 3. Context Bundle Pattern

When spawning subagents, create context bundles:

### Bundle Structure
```markdown
# Context Bundle

## Task
[Clear description of what the subagent should do]

## Scope
[What files/areas to focus on]

## Constraints
- [Constraint 1]
- [Constraint 2]

## Expected Output
[What format to return]

## Loaded Standards
[Relevant standards from context files]
```

### Example Usage
```javascript
// In orchestrator agent
const bundle = `
# Context Bundle

## Task
Find all files related to the authentication system.

## Scope
- Focus on src/auth/ directory
- Include any files that import from auth
- Check for middleware usage

## Constraints
- Only report files that exist
- Include line numbers for key functions
- Group by logical component

## Expected Output
Markdown list of files with descriptions and key line numbers.
`;

Task({
  subagent_type: "subagents/research/codebase-locator",
  description: "Find auth files",
  prompt: bundle
});
```

---

## 4. Thoughts Directory Structure

Add to OpenCode's context system:

```
.opencode/
├── thoughts/
│   ├── research/
│   │   └── YYYY-MM-DD-topic-slug.md
│   ├── plans/
│   │   └── YYYY-MM-DD-feature-slug.md
│   ├── handoffs/
│   │   └── YYYY-MM-DD_HH-MM-SS_description.md
│   └── sessions/
│       └── {session-id}/
│           ├── context.md
│           └── progress.md
```

### File Naming Convention
- Research: `2025-12-20-authentication-flow.md`
- Plans: `2025-12-20-add-oauth-support.md`
- Handoffs: `2025-12-20_14-30-00_oauth-implementation.md`

---

## 5. Workflow Integration

### Modify OpenCode's Execution Stages

```xml
<workflow>
  <stage id="1" name="Analyze">
    Assess request type → Determine if research needed
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

  <stage id="6" name="Complete">
    Update documentation
    Create handoff if needed
    Cleanup session files
  </stage>
</workflow>
```

---

## 6. Human Leverage Points

### Where to Pause

| Point | Why | What Human Reviews |
|-------|-----|-------------------|
| After Research | Verify understanding | Research accuracy, completeness |
| After Plan | Approve approach | Phases, success criteria, risks |
| After Each Phase | Verify implementation | Manual test items |
| After Validation | Confirm completion | Final quality check |

### Pause Message Template
```markdown
## ⏸️ [Stage] Complete - Awaiting Review

### Summary
[What was accomplished]

### Artifacts Created
- [File 1]
- [File 2]

### Review Checklist
- [ ] [Item to verify]
- [ ] [Item to verify]

### Next Steps
[What happens after approval]

**Reply to continue or provide feedback.**
```

---

## 7. Error Handling

### When Things Go Wrong

```markdown
## ❌ Error Encountered

### What Happened
[Description of the error]

### Context
- Phase: [current phase]
- File: [file being modified]
- Command: [command that failed]

### Error Output
```
[error message]
```

### Analysis
[What likely caused this]

### Options
1. **Retry**: [what would be different]
2. **Skip**: [impact of skipping]
3. **Abort**: [how to safely stop]

**How should I proceed?**
```

### Recovery Pattern
1. Never auto-fix errors
2. Report with full context
3. Propose options
4. Wait for human decision
5. Document resolution in plan

---

## 8. Handoff Pattern

### When to Create Handoff
- Session ending mid-task
- Switching to different work
- Complex state to preserve

### Handoff Template
```markdown
---
date: [ISO format]
session_id: [current session]
status: in_progress
---

# Handoff: [Task Description]

## Current State
[Where we are in the process]

## Completed Work
- [x] [Completed item]
- [x] [Completed item]

## Remaining Work
- [ ] [Remaining item]
- [ ] [Remaining item]

## Critical Context
[Important information for next session]

## Files Modified
- `path/to/file.ts` - [what was changed]

## How to Resume
```
/resume path/to/this/handoff.md
```

## Notes
[Any other relevant information]
```

---

## 9. Testing the Implementation

### Test Scenarios

1. **Simple Research**
   - `/research how does authentication work`
   - Verify: subagents spawn, research doc created

2. **Research → Plan**
   - `/research user permissions`
   - `/plan add role-based access control`
   - Verify: plan references research

3. **Full Workflow**
   - `/research`, `/plan`, `/implement`
   - Verify: phases execute with pauses

4. **Error Recovery**
   - Introduce intentional error
   - Verify: proper error reporting, no auto-fix

5. **Handoff/Resume**
   - Start task, create handoff
   - New session, resume
   - Verify: context preserved

---

## 10. Metrics to Track

| Metric | Purpose |
|--------|---------|
| Research accuracy | Did subagents find relevant files? |
| Plan completeness | Were all phases defined? |
| Phase success rate | How often do phases pass first try? |
| Human intervention rate | How often do humans need to correct? |
| Context utilization | Are we staying in 40-60% range? |

---

## 11. Key Differences from HumanLayer Implementation

### What OpenCode Already Has

| Feature | OpenCode Status | HumanLayer Equivalent |
|---------|-----------------|----------------------|
| Task tool for subagents | Exists | Same concept |
| Glob/Grep/Read tools | Exists | Same tools |
| TodoWrite/TodoRead | Exists | Same tools |
| WebFetch | Exists | WebSearch + WebFetch |
| Subagent definitions | Has explore, general agents | 6 specialized agents |

### What Needs to Be Added

1. **Specialized Research Subagents** (in `~/.config/opencode/agent/subagents/research/`)
   - `codebase-locator.md` - find files without reading them
   - `codebase-analyzer.md` - analyze specific code paths
   - `pattern-finder.md` - find similar implementations

2. **Thoughts Directory System**
   - Persistent storage for research/plans/handoffs
   - Sync mechanism between sessions
   - Searchable index

3. **Slash Commands** (in `~/.config/opencode/command/`)
   - `research.md` - comprehensive codebase research
   - `plan.md` - create phased implementation plan
   - `implement.md` - execute plan phase by phase

4. **YAML Frontmatter for Documents**
   - date, researcher, git_commit, branch, topic, status
   - Enables document discovery and tracking

### Format Adaptation Notes

> ⚠️ **Important**: HumanLayer examples use Claude Code format. When implementing, convert to OpenCode format:

| Claude Code (Source) | OpenCode (Target) |
|---------------------|-------------------|
| `tools: Read, Grep, Glob` | `tools: { read: true, grep: true, glob: true }` |
| `model: sonnet` | `model: anthropic/claude-sonnet-4-20250514` |
| No permissions | Full `permissions:` block |
| No temperature | `temperature: 0.1` |
| `name: agent-name` | Filename becomes agent name |

### Adaptation Notes

1. **Model Selection**: HumanLayer uses `opus` for research/planning, `sonnet` for implementation. OpenCode can follow similar pattern or use configurable models.

2. **Linear Integration**: HumanLayer deeply integrates with Linear for ticket management. OpenCode can make this optional or integrate with other issue trackers.

3. **Thoughts Sync**: HumanLayer has `humanlayer thoughts sync` command. OpenCode can implement simpler local-only storage initially.

4. **GitHub Permalinks**: HumanLayer generates GitHub permalinks for code references. OpenCode can implement similar with `file:line` format.

---

## 12. Implementation Priority

### Phase 1: Core Workflow (High Priority)

1. Create `~/.config/opencode/agent/subagents/research/codebase-locator.md`
2. Create `~/.config/opencode/agent/subagents/research/codebase-analyzer.md`
3. Create `~/.config/opencode/agent/subagents/research/pattern-finder.md`
4. Create `~/.config/opencode/command/research.md`
5. Create `~/.config/opencode/command/plan.md`
6. Create `~/.config/opencode/command/implement.md`

### Phase 2: Persistence (Medium Priority)

1. Add thoughts directory structure
2. Implement research document template
3. Implement plan document template
4. Add handoff document support

### Phase 3: Continuity (Medium Priority)

1. Implement `/handoff` command
2. Implement `/resume` command
3. Add session state management
4. Implement `/validate` command

### Phase 4: Automation (Low Priority)

1. Add GitHub Actions integration
2. Add issue tracker integration
3. Implement automated research queue
4. Add WIP limits for parallel work

---

## Appendix A: Complete Agent Examples

### A.1 Existing OpenCode Agent Reference (build-agent.md)

This is an actual working OpenCode agent for reference:

```markdown
---
description: "Type check and build validation agent"
mode: subagent
temperature: 0.1
tools:
  bash: true
  read: true
  grep: true
permissions:
  bash:
    "tsc": "allow"
    "mypy": "allow"
    "go build": "allow"
    "cargo check": "allow"
    "cargo build": "allow"
    "npm run build": "allow"
    "yarn build": "allow"
    "pnpm build": "allow"
    "python -m build": "allow"
    "*": "deny"
  edit:
    "**/*": "deny"
---

# Build Agent

You are a build validation agent. Detect the project language and perform appropriate checks:

## Language Detection & Commands

**TypeScript/JavaScript:**
1. Type check: `tsc`
2. Build: `npm run build` / `yarn build` / `pnpm build`

**Python:**
1. Type check: `mypy .` (if mypy is configured)
2. Build: `python -m build` (if applicable)

**Go:**
1. Type/Build check: `go build ./...`

**Rust:**
1. Type check: `cargo check`
2. Build: `cargo build`

## Execution Steps

1. **Detect Language** - Check for `package.json`, `requirements.txt`, `go.mod`, or `Cargo.toml`
2. **Type Check** - Run appropriate type checker for the language
3. **Build Check** - Run appropriate build command
4. **Report** - Return errors if any occur, otherwise report success

**Rules:**
- Adapt to the detected language
- Only report errors if they occur; otherwise, report success
- Do not modify any code

Execute type check and build validation now.
```

### A.2 Subagent Invocation Reference

From the main agent, invoke subagents using:

```javascript
Task({
  subagent_type: "subagents/research/codebase-locator",
  description: "Find authentication files",
  prompt: `Find all files related to authentication.
           Focus on: src/auth/, middleware/, routes/
           Return: file paths with brief descriptions`
})
```

The `subagent_type` path corresponds to the file location under `~/.config/opencode/agent/`.

---

## Appendix B: References

### Official OpenCode Documentation

| Topic | URL | Use For |
|-------|-----|---------|
| **Agents** | https://opencode.ai/docs/agents/ | Agent types, configuration options, YAML format |
| **Tools** | https://opencode.ai/docs/tools/ | Built-in tool reference, tool configuration |
| **Permissions** | https://opencode.ai/docs/permissions/ | Permission system, glob patterns, allow/ask/deny |
| **Commands** | https://opencode.ai/docs/commands/ | Slash command creation and configuration |
| **Custom Tools** | https://opencode.ai/docs/custom-tools/ | Creating custom tools with TypeScript |

### Related Documentation in This Project

| Document | Purpose |
|----------|---------|
| `humanlayer-agent-research-report.md` | Original HumanLayer research, Claude Code patterns |
| `tool-comparison-opencode-vs-claude-code.md` | Tool differences between platforms |
| `prompt-templates.md` | Extracted prompt templates from HumanLayer |

### External References

- [12-Factor Agents](https://github.com/humanlayer/12-factor-agents) - HumanLayer's agent design principles
- [Advanced Context Engineering](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents) - Frequent Intentional Compaction methodology
