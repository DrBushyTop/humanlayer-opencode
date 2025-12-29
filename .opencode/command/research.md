---
description: "Comprehensive codebase research with parallel subagent analysis"
agent: research-humanlayer
---

# Research Codebase Command

Research the following topic: `$ARGUMENTS`

The research-humanlayer agent handles the complete workflow:

1. **Parallel Research** - Spawns codebase-locator, codebase-analyzer, pattern-finder, and thoughts-locator subagents
2. **Write to File** - Saves findings to `.opencode/thoughts/research/YYYY-MM-DD-{slug}.md`
3. **Present Summary** - Shows concise summary with key findings and file path
4. **Handle Follow-ups** - Edits the existing file for follow-up questions

If no topic is provided, ask the user what they'd like to research.

## Quick Reference

- **Output location**: `.opencode/thoughts/research/`
- **Follow-ups**: Edit existing file, don't create new
- **Summary**: Key findings + file path (not full report)
