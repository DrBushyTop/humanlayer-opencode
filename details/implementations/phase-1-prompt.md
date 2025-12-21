# Task: Implement Phase 1 of HumanLayer Research Workflow Agents

# Context

You are implementing the first phase of a Research → Plan → Implement workflow system for OpenCode, based on HumanLayer's "Frequent Intentional Compaction" methodology.
Primary Reference
**Implementation Plan**: `humanlayer-opencode/details/plans/phase-1-research-workflow-agents.md`
Read this file completely before starting. It contains:

- Exact file contents for all 6 files to create
- Directory structure
- Success criteria
- Testing instructions
  Supporting Research (Reference as Needed)
- `humanlayer-opencode/details/research/humanlayer-agent-research-report.md` - Full methodology
- `humanlayer-opencode/details/research/opencode-implementation-guide.md` - OpenCode format details
- `humanlayer-opencode/details/research/tool-comparison-opencode-vs-claude-code.md` - Tool mappings
  What to Create
  Directory Structure

## Implementation Guidelines

### Context Management

- **Do NOT re-read the plan file multiple times** - read once, extract what you need
- **Delegate verification** to subagents if available (e.g., use explore agent to verify file creation)
- **Work incrementally** - create one file, verify, then next
- **Keep context lean** - reference file paths, don't paste entire contents back

### Execution Approach

1. Read the plan file once completely
2. Create directories first
3. Create files one at a time in the order specified
4. After each file, briefly verify it was created correctly
5. After all files, run a final verification

### Quality Checks

For each file created, verify:

- YAML frontmatter is valid (proper `---` delimiters)
- Required fields present: `description`, `mode`, `model`, `tools`, `permissions` (for agents)
- Required fields present: `description`, `model` (for commands)
- Markdown content follows the template in the plan

### Do NOT

- Modify the plan file
- Create files not specified in the plan
- Add features beyond Phase 1 scope
- Skip the verification steps

## Success Criteria

From the plan:

- [ ] All 6 files created in correct locations
- [ ] YAML frontmatter is valid in all files
- [ ] No syntax errors in markdown

## Output Format

After implementation, report:

```markdown
## Phase 1 Implementation Complete

### Files Created

- [ ] `filepath`

### Verification

- Directory structure: [OK/Issue]
- YAML frontmatter: [OK/Issue]
- File contents: [OK/Issue]

### Ready for Testing

The following manual tests can now be performed:

1. [Test instruction from plan]
2. [Test instruction from plan]

### Issues Encountered

[Any issues and how they were resolved, or "None"]
Start
Begin by reading humanlayer-opencode/details/plans/phase-1-research-workflow-agents.md, then proceed with implementation.
```
