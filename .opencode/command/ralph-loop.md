---
description: "Start Ralph Wiggum loop in current session. Args PROMPT [--max N] [--promise TEXT]"
---

# Ralph Loop Command

Arguments received: `$ARGUMENTS`

## Step 1: Parse Arguments

Parse the arguments above according to these rules:

1. **`--max N`** or **`--max-iterations N`**: Extract N as `maxIterations` (integer)
2. **`--promise TEXT`** or **`--completion-promise TEXT`**: Extract TEXT as `completionPromise` (string, may be quoted)
3. **Everything else**: Combine as the `prompt` (the task to work on)

**Examples:**

- `Build an API --max 10 --promise "DONE"` -> prompt="Build an API", maxIterations=10, completionPromise="DONE"
- `--promise "FIXED" Fix the bug --max 5` -> prompt="Fix the bug", maxIterations=5, completionPromise="FIXED"
- `Refactor the code` -> prompt="Refactor the code", maxIterations=0, completionPromise=null

**Validation:**

- If prompt is empty, respond with error: "No prompt provided. Usage: /ralph-loop <prompt> [--max N] [--promise TEXT]"
- If --max value is not a number, respond with error about invalid max iterations

## Step 2: Start the Loop

Call the `ralph-loop-start` tool with the parsed values:

- `prompt`: The extracted prompt text
- `maxIterations`: The extracted number (or 0 if not specified)
- `completionPromise`: The extracted promise text (or omit if not specified)

## Step 3: Work on the Task

After the tool confirms the loop is active, begin working on the task described in the prompt.

---

## CRITICAL RULES (After Loop is Active)

When the loop is active, the plugin will automatically re-prompt you with the same task when you go idle.

**If a completion promise was set:**

To complete the loop, output the EXACT text:

```
<promise>YOUR_PROMISE_TEXT</promise>
```

**STRICT REQUIREMENTS (DO NOT VIOLATE):**

- Use `<promise>` XML tags EXACTLY as shown above
- The statement MUST be completely and unequivocally TRUE
- Do NOT output false statements to exit the loop
- Do NOT lie even if you think you should exit

**IMPORTANT - Do not circumvent the loop:**

Even if you believe you're stuck, the task is impossible, or you've been running too long - you MUST NOT output a false promise statement. The loop is designed to continue until the promise is GENUINELY TRUE. Trust the process.

If the loop should stop, the promise statement will become true naturally. Do not force it by lying.

---

## How It Works

1. **This command**: Parses args, sets up state file, starts you working
2. **You work**: Complete tasks, make progress on the prompt
3. **Session idles**: When you finish, the plugin detects idle
4. **Re-prompt**: If promise not detected, same prompt is re-sent
5. **Complete**: When `<promise>TEXT</promise>` matches, loop ends

You'll see your previous work in files and git history, allowing you to iterate and improve.
