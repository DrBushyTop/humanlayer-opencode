# Tool Comparison: OpenCode vs Claude Code

**Date**: 2025-12-20 (Updated: 2025-12-20)  
**Purpose**: Compare the built-in tooling between OpenCode and Claude Code to inform HumanLayer workflow implementation

> **Note**: This document compares official built-in tools. Both platforms support extensibility via custom tools, MCP servers, and system-injected tools that may vary by deployment.

---

## Executive Summary

OpenCode and Claude Code share a remarkably similar core toolset, both designed for AI-assisted coding workflows. The tools are functionally equivalent with minor naming and parameter differences. This alignment makes HumanLayer's patterns (developed for Claude Code) highly portable to OpenCode.

**Key Finding**: OpenCode's tool architecture is nearly identical to Claude Code's, with the main differences being in configuration flexibility, extensibility, and Claude Code having additional specialized tools (NotebookEdit, WebSearch, background process management).

### Complete Tool Inventory

| Category | OpenCode | Claude Code |
|----------|----------|-------------|
| **Built-in Tools** | read, write, edit, glob, grep, list, bash, patch, todowrite, todoread, webfetch | Read, Write, Edit, Glob, Grep, List, Bash, Task, TodoWrite, WebFetch |
| **System-Injected**¹ | task (subagent spawning) | NotebookEdit, WebSearch, BashOutput, KillShell, ExitPlanMode, SlashCommand |

¹ *System-injected tools are added by the runtime/system prompt rather than being core built-in tools. The `task` tool in OpenCode enables subagent spawning but is not listed in the official OpenCode tools documentation. Similarly, Claude Code's specialized tools may be context-dependent.*

**Key Differences**:
- **OpenCode has `patch`**: Apply diff/patch files directly (Claude Code lacks this)
- **Claude Code has `WebSearch`**: Actual web querying (OpenCode's `webfetch` only fetches specific URLs)
- **Claude Code has background process management**: `BashOutput`, `KillShell` for async shell control

---

## Tool-by-Tool Comparison

### 1. File Reading

| Aspect | OpenCode (`read`) | Claude Code (`Read`) |
|--------|-------------------|---------------------|
| **Purpose** | Read file contents from filesystem | Read file contents from filesystem |
| **Path Type** | Absolute path required | Absolute path required |
| **Default Lines** | Up to 2000 lines | Up to 2000 lines |
| **Line Numbers** | Returns with line numbers (cat -n format) | Returns with line numbers (cat -n format) |
| **Offset/Limit** | Supports `offset` and `limit` params | Supports `offset` and `limit` params |
| **Truncation** | Lines >2000 chars truncated | Lines >2000 chars truncated |
| **Image Support** | Can read image files | Can read image files |
| **Batch Reading** | Supports parallel calls | Supports parallel calls |

**Verdict**: Functionally identical.

---

### 2. File Writing

| Aspect | OpenCode (`write`) | Claude Code (`Write`) |
|--------|-------------------|----------------------|
| **Purpose** | Create new files or overwrite existing | Create new files or overwrite existing |
| **Overwrite Behavior** | Overwrites existing files | Overwrites existing files |
| **Read Requirement** | Must read existing files before overwriting | Must read existing files before overwriting |
| **Preference** | Prefer editing over writing new files | Prefer editing over writing new files |
| **Documentation Warning** | Don't create docs unless requested | Don't create docs unless requested |

**Verdict**: Functionally identical.

---

### 3. File Editing

| Aspect | OpenCode (`edit`) | Claude Code (`Edit`) |
|--------|-------------------|---------------------|
| **Purpose** | Exact string replacements in files | Exact string replacements in files |
| **Match Type** | Exact string match | Exact string match |
| **Read Requirement** | Must read file first | Must read file first |
| **Multiple Matches** | Fails if multiple matches (unless `replaceAll`) | Fails if multiple matches (unless `replaceAll`) |
| **Indentation** | Must preserve exact indentation | Must preserve exact indentation |
| **Replace All** | `replaceAll` parameter for global replace | `replaceAll` parameter for global replace |

**Verdict**: Functionally identical.

---

### 4. Shell Command Execution

| Aspect | OpenCode (`bash`) | Claude Code (`Bash`) |
|--------|-------------------|---------------------|
| **Purpose** | Execute shell commands | Execute shell commands |
| **Persistence** | Persistent shell session | Persistent shell session |
| **Timeout** | Configurable (max not specified) | Default 2min, max 10min (600000ms) |
| **Output Limit** | Not specified | 30000 characters |
| **Working Directory** | Supports `workdir` parameter | Not documented (uses cd) |
| **Description** | Required description parameter | Optional but recommended |
| **Background Mode** | Not documented | `run_in_background` parameter |
| **Tool Preference** | Prefer dedicated tools over bash equivalents | Prefer dedicated tools over bash equivalents |

**Claude Code Additional Bash Features**:
- `run_in_background`: Boolean to run command in background
- Background processes can be monitored with `BashOutput` tool
- Background processes can be terminated with `KillShell` tool

**Verdict**: Similar core functionality; Claude Code has explicit background process management.

---

### 5. File Search by Pattern (Glob)

| Aspect | OpenCode (`glob`) | Claude Code (`Glob`) |
|--------|-------------------|---------------------|
| **Purpose** | Find files by glob patterns | Find files by glob patterns |
| **Pattern Support** | Standard glob patterns (`**/*.js`) | Standard glob patterns (`**/*.js`) |
| **Sorting** | By modification time | By modification time |
| **Path Parameter** | Optional, defaults to cwd | Optional, defaults to cwd |
| **Scalability** | Works with any codebase size | Works with any codebase size |

**Verdict**: Functionally identical.

---

### 6. Content Search (Grep)

| Aspect | OpenCode (`grep`) | Claude Code (`Grep`) |
|--------|-------------------|---------------------|
| **Purpose** | Search file contents with regex | Search file contents with regex |
| **Pattern Type** | Regular expressions | Regular expressions |
| **File Filtering** | `include` param for file patterns | `glob` and `type` params |
| **Return Format** | File paths + line numbers | Configurable via `output_mode` |
| **Sorting** | By modification time | By modification time |
| **Backend** | Uses ripgrep | Uses ripgrep |

**Claude Code Additional Grep Parameters**:
- `output_mode`: `"content"` (lines), `"files_with_matches"` (paths), `"count"` (counts)
- `-A`, `-B`, `-C`: Context lines (after, before, both)
- `-i`: Case insensitive search
- `-n`: Show line numbers
- `multiline`: Enable multiline matching
- `head_limit`: Limit output to first N results
- `type`: Filter by file type (e.g., "js", "py", "rust")

**Verdict**: Claude Code has more granular output control; OpenCode is simpler but effective.

---

### 7. Directory Listing

| Aspect | OpenCode (`list`) | Claude Code (`List`) |
|--------|-------------------|---------------------|
| **Purpose** | List files and directories | List files and directories |
| **Path Type** | Absolute path required | Absolute path required |
| **Ignore Patterns** | Supports ignore array | Supports ignore array |
| **Default Directory** | Workspace directory | Working directory |

**Verdict**: Functionally identical.

---

### 8. Web Fetching

| Aspect | OpenCode (`webfetch`) | Claude Code (`WebFetch`) |
|--------|----------------------|------------------------|
| **Purpose** | Fetch and analyze web content | Fetch and analyze web content |
| **URL Requirement** | Fully-formed valid URL | Fully-formed valid URL |
| **HTTPS Upgrade** | HTTP auto-upgrades to HTTPS | HTTP auto-upgrades to HTTPS |
| **Format Options** | `text`, `markdown`, `html` | Converts HTML to markdown |
| **Timeout** | Max 120 seconds | Not specified |
| **Redirect Handling** | Must handle manually | Must handle manually |
| **Caching** | Not specified | 15-minute cache |
| **Prompt Parameter** | Not required | Required (what to extract) |
| **Read-Only** | Yes | Yes |

**Verdict**: Similar functionality; Claude Code requires a prompt parameter for extraction guidance.

---

### 8b. Web Search (Claude Code Only)

| Aspect | Claude Code (`WebSearch`) | OpenCode |
|--------|--------------------------|----------|
| **Purpose** | Search the web for current info | Not available as built-in |
| **Availability** | US only | - |
| **Parameters** | `query`, `allowed_domains`, `blocked_domains` | - |
| **Use Case** | Info beyond knowledge cutoff | Use MCP server |

**Important Distinction**:
- **`webfetch`** (both platforms): Fetches content from a *specific URL* you provide
- **`WebSearch`** (Claude Code only): Performs actual *web search queries* and returns results

OpenCode's `webfetch` cannot search the web - it can only retrieve content from URLs you already know. To add web search capability to OpenCode, configure an MCP server (e.g., Brave Search, Tavily, or similar).

---

### 9. Task/Subagent Management

> **Note**: The `task` tool is system-injected rather than a documented built-in tool in OpenCode. It's added via the system prompt to enable subagent spawning. This is similar to how Claude Code handles specialized tools.

| Aspect | OpenCode (`task`) | Claude Code (`Task`) |
|--------|-------------------|---------------------|
| **Purpose** | Launch specialized subagents | Launch specialized subagents |
| **Tool Type** | System-injected (not in official docs) | System-injected |
| **Agent Types** | `general`, `explore`, custom agents | `general-purpose`, specialized agents |
| **Parallelism** | Supports parallel task launching | Supports parallel task launching |
| **Statefulness** | Stateless unless session_id provided | Stateless (no session continuity) |
| **Required Params** | `subagent_type`, `prompt`, `description` | `subagent_type`, `prompt`, `description` |
| **Custom Agents** | Fully configurable via `.opencode/agent/` | Configurable via `.claude/agents/` |

**OpenCode Default Agent Types** (when `task` is available):
- `general` - General-purpose research and multi-step tasks (all tools)
- `explore` - Fast codebase exploration with thoroughness levels
- Custom agents defined in `.opencode/agent/` directory

**Claude Code Default Agent Types**:
- `general-purpose` - Research, code search, multi-step tasks (all tools)
- Additional specialized agents may be available depending on context

**Custom Agent Support**:
Both platforms support user-defined custom agents via markdown files with YAML frontmatter. These are project-specific and not part of the core tool comparison.

**Verdict**: Both support subagents with similar patterns. The `task` tool itself is system-injected in both cases, not a core built-in.

---

### 10. Todo/Task Tracking

| Aspect | OpenCode (`todowrite`/`todoread`) | Claude Code (`TodoWrite`) |
|--------|----------------------------------|---------------------------|
| **Purpose** | Track tasks during sessions | Track tasks during sessions |
| **Fields** | `id`, `content`, `status`, `priority` | `content`, `activeForm`, `status` |
| **Status Options** | `pending`, `in_progress`, `completed`, `cancelled` | `pending`, `in_progress`, `completed` |
| **Priority Options** | `high`, `medium`, `low` | Not specified |
| **Subagent Access** | Disabled by default for subagents | Available |
| **Active Form** | Not applicable | Required (present continuous text) |

**Claude Code TodoWrite Fields**:
- `content`: Imperative form (e.g., "Run tests")
- `activeForm`: Present continuous (e.g., "Running tests")
- `status`: `pending`, `in_progress`, or `completed`

**Critical Rule (Both)**: Exactly ONE task should be `in_progress` at any time.

**Verdict**: Similar purpose; different field structures. OpenCode has priority, Claude Code has activeForm.

---

### 11. Patch Application (OpenCode Only)

| Aspect | OpenCode (`patch`) | Claude Code |
|--------|-------------------|-------------|
| **Purpose** | Apply patch files to codebase | N/A |
| **Availability** | Official built-in tool ([docs](https://opencode.ai/docs/tools/#patch)) | Not available |

The `patch` tool is documented as an official OpenCode built-in tool. It applies patch/diff files to the codebase, useful for applying changes from various sources.

**Verdict**: OpenCode-exclusive built-in feature for applying diffs/patches.

---

### 12. Notebook Editing (Claude Code Only)

| Aspect | Claude Code (`NotebookEdit`) | OpenCode |
|--------|----------------------------|----------|
| **Purpose** | Edit Jupyter notebook cells | Not available |
| **Parameters** | `notebook_path`, `new_source`, `cell_id`, `cell_type`, `edit_mode` | - |
| **Edit Modes** | `replace`, `insert`, `delete` | - |
| **Cell Types** | `code`, `markdown` | - |

**Verdict**: Claude Code has native Jupyter notebook support; OpenCode would need custom tooling.

---

### 13. Background Process Management (Claude Code Only)

| Tool | Purpose | Parameters |
|------|---------|------------|
| `BashOutput` | Get output from background shells | `bash_id`, `filter` (regex) |
| `KillShell` | Terminate background shells | `shell_id` |

**Use Pattern**:
1. Start: `Bash` with `run_in_background: true`
2. Monitor: `BashOutput` with bash_id
3. Terminate: `KillShell` with shell_id

**OpenCode Alternative**: Not directly supported; would need to manage via standard bash job control.

---

### 14. Plan Mode (Claude Code Only)

| Tool | Purpose | Parameters |
|------|---------|------------|
| `ExitPlanMode` | Exit plan mode after presenting plan | `plan` (markdown) |

**When to Use**: After finishing planning implementation steps (NOT for research tasks).

**OpenCode Alternative**: OpenCode has built-in `plan` agent with different approach (tool restrictions rather than mode exit).

---

### 15. Slash Commands (Claude Code Only)

| Tool | Purpose | Parameters |
|------|---------|------------|
| `SlashCommand` | Execute slash commands programmatically | `command` (e.g., "/review-pr 123") |

**OpenCode Alternative**: OpenCode handles slash commands at the UI level, not as a tool.

---

## Feature Comparison Matrix

| Feature | OpenCode | Claude Code | Notes |
|---------|----------|-------------|-------|
| **Core File Operations** | | | |
| Read files | `read` | `Read` | Built-in |
| Write files | `write` | `Write` | Built-in |
| Edit files (exact match) | `edit` | `Edit` | Built-in |
| Notebook editing | - | `NotebookEdit` | System-injected |
| **Search & Navigation** | | | |
| Glob patterns | `glob` | `Glob` | Built-in |
| Content search | `grep` | `Grep` | Built-in |
| Directory listing | `list` | `List` | Built-in |
| **Execution** | | | |
| Shell commands | `bash` | `Bash` | Built-in |
| Background processes | - | `Bash` + `BashOutput` + `KillShell` | System-injected |
| Apply patches | `patch` | - | OpenCode built-in |
| **Web** | | | |
| Fetch specific URLs | `webfetch` | `WebFetch` | Built-in |
| Web search (queries) | - (via MCP) | `WebSearch` | Different capability |
| **Task Management** | | | |
| Subagent spawning | `task`* | `Task`* | *System-injected |
| Todo tracking | `todowrite`/`todoread` | `TodoWrite` | Built-in |
| **Mode Control** | | | |
| Plan mode exit | Built-in agent | `ExitPlanMode` | System-injected |
| Slash command execution | UI-level | `SlashCommand` | System-injected |
| **Extensibility** | | | |
| Custom tools | TypeScript/JavaScript | - | |
| MCP servers | Supported | Supported | |
| Custom agents | Markdown/JSON config | YAML frontmatter | |
| Custom commands | Markdown files | Markdown files | |

*\* System-injected tools are added via system prompt, not documented as core built-in tools*

---

## Configuration & Extensibility Comparison

### Tool Configuration

**OpenCode**:
```json
{
  "tools": {
    "write": true,
    "bash": false,
    "mymcp_*": false
  }
}
```
- Global and per-agent configuration
- Wildcard patterns for MCP tools
- Can enable/disable any tool

**Claude Code**:
- Tools enabled/disabled via agent YAML frontmatter
- No wildcard patterns
- Less granular control

### Custom Tool Creation

**OpenCode**:
```typescript
// .opencode/tool/database.ts
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Query the project database",
  args: {
    query: tool.schema.string().describe("SQL query"),
  },
  async execute(args) {
    return `Executed: ${args.query}`
  },
})
```
- Full TypeScript/JavaScript support
- Zod schema validation
- Can call any language via shell

**Claude Code**:
- No documented custom tool creation
- Relies on built-in tools + MCP

### Agent/Subagent Definition

**OpenCode** (Markdown):
```markdown
---
description: Code review without edits
mode: subagent
model: anthropic/claude-sonnet-4-20250514
tools:
  write: false
  edit: false
---

You are a code reviewer...
```

**Claude Code** (YAML frontmatter):
```yaml
---
name: codebase-analyzer
description: Understand HOW code works
tools: Read, Grep, Glob, LS
model: sonnet
---
```

### Custom Commands

**OpenCode**:
```markdown
---
description: Run tests with coverage
agent: build
model: anthropic/claude-3-5-sonnet-20241022
---

Run the full test suite with coverage...
```

**Claude Code**:
```markdown
# Command Name

## Model
opus

## Process
1. Step one
2. Step two
...
```

---

## Implications for HumanLayer Workflow Implementation

### High Compatibility Areas

1. **Core Tools** - All essential file/search/execute tools map 1:1
2. **Subagent Pattern** - Both support spawning specialized agents
3. **Todo Tracking** - Identical structure for task management
4. **Command System** - Both support custom slash commands

### Adaptation Needed

1. **Agent Definitions**:
   - OpenCode uses `mode: subagent` vs Claude Code's YAML format
   - OpenCode has more flexible tool configuration per agent

2. **Custom Tools**:
   - OpenCode allows TypeScript tool definitions
   - Can replicate Claude Code's specialized agents as custom subagents

3. **MCP Integration**:
   - OpenCode has native MCP server support
   - Can add external tools (Linear, GitHub, etc.) via MCP

4. **Permissions**:
   - OpenCode has granular permission system (`ask`, `allow`, `deny`)
   - Can configure per-tool, per-command permissions

### Recommended Approach

1. **Use OpenCode's built-in tools directly** - No wrapper needed
2. **Create custom subagents** for HumanLayer-specific patterns:
   - `codebase-locator` -> OpenCode `explore` agent or custom
   - `codebase-analyzer` -> Custom subagent with Read/Grep
   - `pattern-finder` -> Custom subagent
3. **Leverage OpenCode's command system** for `/research`, `/plan`, `/implement`
4. **Use MCP for external integrations** (Linear, GitHub, etc.)

---

## Recommendations for OpenCode Implementation

### Priority 1: Direct Mappings (No Changes Needed)

| HumanLayer Tool | OpenCode Equivalent | Notes |
|-----------------|---------------------|-------|
| Read | `read` | Identical (built-in) |
| Write | `write` | Identical (built-in) |
| Edit | `edit` | Identical (built-in) |
| Glob | `glob` | Identical (built-in) |
| Grep | `grep` | Fewer output options, but functional (built-in) |
| Bash | `bash` | No background mode, use standard job control (built-in) |
| Task | `task` | System-injected; use `subagent_type` param |
| TodoWrite | `todowrite` | Different fields: priority vs activeForm (built-in) |
| TodoRead | `todoread` | Works the same (built-in) |
| WebFetch | `webfetch` | Fetches URLs only; has `format` param (built-in) |
| Patch | `patch` | OpenCode-exclusive built-in for applying diffs |

### Tools Requiring Alternatives

| Claude Code Tool | OpenCode Alternative | Notes |
|-----------------|---------------------|-------|
| `WebSearch` | Add MCP server (e.g., Brave Search, Tavily) | `webfetch` only fetches URLs, doesn't search |
| `NotebookEdit` | Create custom tool or use `edit` on raw .ipynb | |
| `BashOutput` | Standard shell job control | |
| `KillShell` | Standard shell job control | |
| `ExitPlanMode` | Use `plan` agent with tool restrictions | |
| `SlashCommand` | Commands are UI-level, not tools | |

### Priority 2: Custom Subagents to Create

```
.opencode/agent/
├── codebase-locator.md      # Find WHERE files live
├── codebase-analyzer.md     # Understand HOW code works
├── pattern-finder.md        # Find similar implementations
└── thoughts-analyzer.md     # Analyze research/plan docs
```

### Priority 3: Custom Commands to Create

```
.opencode/command/
├── research.md              # /research workflow
├── plan.md                  # /plan workflow
├── implement.md             # /implement workflow
├── validate.md              # /validate workflow
├── handoff.md              # /handoff workflow
└── resume.md               # /resume workflow
```

### Priority 4: Consider MCP Integrations

- Linear ticket management
- GitHub PR/issue management
- Thoughts directory sync

---

## Conclusion

OpenCode and Claude Code have nearly identical core tooling, making HumanLayer's Research -> Plan -> Implement workflow highly portable. The main adaptation work involves:

1. Converting Claude Code agent definitions to OpenCode format
2. Creating custom commands for the workflow stages
3. Optionally adding MCP integrations for external services

OpenCode's additional flexibility (custom tools, MCP servers, granular permissions) actually provides more options for implementing sophisticated workflows than Claude Code's more locked-down approach.

---

## Tool Usage Best Practices (Shared Between Both)

Both Claude Code and OpenCode follow these patterns:

### 1. Prefer Specialized Tools Over Bash
| Task | Use This | NOT This |
|------|----------|----------|
| Find files by name | `glob` | `bash find` |
| Search content | `grep` | `bash grep/rg` |
| Read file | `read` | `bash cat/head/tail` |
| Edit file | `edit` | `bash sed/awk` |
| Create file | `write` | `bash echo >` |

### 2. Batch Independent Operations
Both tools support parallel tool calls in a single message:
```
// Good - parallel
Read file1.ts, Read file2.ts, Read file3.ts  // All in one message

// Bad - sequential
Read file1.ts  // Wait
Read file2.ts  // Wait
Read file3.ts  // Wait
```

### 3. File Operation Workflow
1. **Search** for files with `glob`
2. **Find** content with `grep`
3. **Read** files before editing
4. **Edit** with exact string matching
5. **Write** only for new files

### 4. Complex Task Pattern
```
1. TodoWrite - Plan and track tasks
2. Task - Spawn subagents for research
3. Read/Grep/Glob - Gather context
4. Edit/Write - Make changes
5. Bash - Run tests/builds
6. TodoWrite - Mark completed
```

---

## References

### OpenCode Official Documentation
- [OpenCode Tools Documentation](https://opencode.ai/docs/tools/)
- [OpenCode Agents Documentation](https://opencode.ai/docs/agents/)
- [OpenCode Permissions Documentation](https://opencode.ai/docs/permissions/)
- [OpenCode Custom Tools](https://opencode.ai/docs/custom-tools/)
- [OpenCode Commands](https://opencode.ai/docs/commands/)

### External References
- [Claude Code Tools Reference](https://www.vtrivedy.com/posts/claudecode-tools-reference) - Comprehensive tool guide

### Related Documentation
- HumanLayer Research Report: `humanlayer-agent-research-report.md`
- OpenCode Implementation Guide: `opencode-implementation-guide.md`
