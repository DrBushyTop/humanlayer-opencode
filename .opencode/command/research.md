---
description: "Comprehensive codebase research with parallel subagent analysis"
agent: research-humanlayer
---

# Research Codebase Command

Research the following topic: `$ARGUMENTS`

## Process

### Step 1: Initial Analysis
1. Parse the research question
2. Identify key terms and concepts to search for
3. Create initial search strategy with TodoWrite

### Step 2: Parallel Research
Spawn these subagents in parallel using Task tool:

```
Task 1: codebase-locator
- Find all files related to the topic
- Focus on implementation, test, config, and type files
- Return file paths grouped by purpose

Task 2: codebase-analyzer  
- Analyze how the topic works in this codebase
- Trace the data flow and dependencies
- Document the architecture

Task 3: pattern-finder
- Find examples of similar patterns
- Look for related implementations
- Include test patterns
```

**IMPORTANT**: Launch all 3 tasks in parallel using the Task tool with:
- `subagent_type: "subagents/research/codebase-locator"`
- `subagent_type: "subagents/research/codebase-analyzer"`
- `subagent_type: "subagents/research/pattern-finder"`

### Step 3: Synthesis
1. Wait for ALL subagents to complete
2. Combine findings into coherent narrative
3. Identify gaps or contradictions
4. Resolve any conflicting information

### Step 4: Generate Research Report
Present the research findings in this format:

```markdown
# Research: [Topic]

## Research Question
[The original question verbatim]

## Summary
[2-3 paragraph executive summary of findings]

## File Locations
[From codebase-locator]

## How It Works
[From codebase-analyzer]

## Related Patterns
[From pattern-finder]

## Code References
- `path/to/file.ts:45` - [description]
- `path/to/file.ts:67` - [description]

## Architecture Overview
[How components fit together]

## Open Questions
[Any unresolved questions for future research]
```

### Step 4b: Save to Thoughts Directory

1. Get git metadata:
   ```bash
   git rev-parse HEAD
   git branch --show-current
   ```

2. Generate filename:
   - Date: YYYY-MM-DD
   - Slug: topic in lowercase with hyphens
   - Example: `2025-12-20-authentication-flow.md`

3. Create frontmatter:
   ```yaml
   ---
   date: "[timestamp]"
   author: opencode
   type: research
   topic: "[research question]"
   status: complete
   git_commit: "[hash]"
   git_branch: "[branch]"
   ---
   ```

4. Save to: `.opencode/thoughts/research/YYYY-MM-DD-{slug}.md`

5. Inform user of saved location

### Step 5: Await User Feedback
After presenting research:
- Ask if user wants to explore any area deeper
- Offer to spawn additional research if needed
- Be ready to clarify any findings

## Context Management

Keep context utilization at 40-60%:
- Subagents handle the heavy searching
- Parent agent synthesizes and presents
- Don't re-read files already analyzed by subagents
- Reference findings by file:line, don't paste entire files

## Error Handling

If a subagent fails or returns incomplete results:
1. Note what information is missing
2. Attempt targeted research to fill gap
3. Present findings with explicit gaps noted
