---
description: "Explain Ralph Wiggum technique and available commands"
---

# Ralph Wiggum Plugin Help

Please explain the following to the user:

## What is the Ralph Wiggum Technique?

The Ralph Wiggum technique is an iterative development methodology based on continuous AI loops, pioneered by Geoffrey Huntley.

**Core concept:**
```bash
while :; do
  cat PROMPT.md | opencode run --continue
done
```

The same prompt is fed to the AI repeatedly. The "self-referential" aspect comes from the AI seeing its own previous work in the files and git history, not from feeding output back as input.

**Each iteration:**

1. AI receives the SAME prompt
2. Works on the task, modifying files
3. Session goes idle
4. Plugin detects idle and re-prompts with same prompt
5. AI sees its previous work in the files
6. Iteratively improves until completion

## Available Commands

### /ralph-loop <PROMPT> [OPTIONS]

Start a Ralph loop in your current session.

**Usage:**

```
/ralph-loop Refactor the cache layer --max 20
/ralph-loop Add tests --promise "TESTS COMPLETE"
```

**Options:**

- `--max <n>` - Max iterations before auto-stop
- `--promise <text>` - Promise phrase to signal completion

**How it works:**

1. Creates `.opencode/ralph-loop-state.json` state file
2. You work on the task
3. When session goes idle, plugin detects it
4. Same prompt fed back via SDK
5. You see your previous work
6. Continues until promise detected or max iterations

---

### /cancel-ralph

Cancel an active Ralph loop (removes the loop state file).

---

### /ralph-status

Check the status of an active Ralph loop.

---

## Key Concepts

### Completion Promises

To signal completion, output a `<promise>` tag:

```
<promise>TASK COMPLETE</promise>
```

The plugin looks for this specific tag. Without it (or `--max`), Ralph runs until manually cancelled.

### Self-Reference Mechanism

The "loop" doesn't mean you talk to yourself. It means:

- Same prompt repeated
- Your work persists in files
- Each iteration sees previous attempts
- Builds incrementally toward goal

## Example

### Interactive Bug Fix

```
/ralph-loop Fix the token refresh logic in auth.ts --promise "FIXED" --max 10
```

You'll see Ralph:

- Attempt fixes
- Run tests
- See failures
- Iterate on solution
- In your current session

## When to Use Ralph

**Good for:**

- Well-defined tasks with clear success criteria
- Tasks requiring iteration and refinement
- Iterative development with self-correction
- Greenfield projects

**Not good for:**

- Tasks requiring human judgment or design decisions
- One-shot operations
- Tasks with unclear success criteria

## Learn More

- Original technique: https://ghuntley.com/ralph/
- Ralph Orchestrator: https://github.com/mikeyobrien/ralph-orchestrator
