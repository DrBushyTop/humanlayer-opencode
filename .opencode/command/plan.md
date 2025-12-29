---
description: "Create phased implementation plan with human verification gates"
agent: plan-humanlayer
---

# Create Plan Command

Create an implementation plan for: `$ARGUMENTS`

The plan-humanlayer agent handles the complete workflow:

1. **Context Gathering** - Checks for existing research, reads relevant files
2. **Research** - Spawns subagents if needed (codebase-locator, codebase-analyzer, pattern-finder)
3. **Interactive Planning** - Asks clarifying questions, proposes approaches
4. **Write to File** - Saves plan to `.opencode/thoughts/plans/YYYY-MM-DD-{slug}.md`
5. **Present Summary** - Shows concise summary with phases and file path
6. **Handle Feedback** - Edits the existing file for iterations

If no topic is provided, ask the user what they'd like to plan.

## Quick Reference

- **Output location**: `.opencode/thoughts/plans/`
- **Feedback**: Edit existing file, don't regenerate
- **Summary**: Phases overview + file path (not full plan)
- **Prerequisite**: Consider running `/research` first for complex features
