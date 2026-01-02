---
description: "Check ralph loop status"
---

# Ralph Status Command

Check the status of any active ralph loop by reading the state file:

```bash
if [[ -f .opencode/ralph-loop-state.json ]]; then
  cat .opencode/ralph-loop-state.json
else
  echo "NO_ACTIVE_LOOP"
fi
```

Check the output above:

1. **If NO_ACTIVE_LOOP**:

   - Say "No active Ralph loop."

2. **If JSON output**:
   - Parse and report the loop status including:
     - Current iteration (and max if set)
     - Completion promise (if set)
     - Prompt being repeated
     - Time elapsed since started
