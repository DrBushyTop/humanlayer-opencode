---
description: "Cancel active Ralph Wiggum loop"
---

# Cancel Ralph

First check if a loop is active by reading the state file:

```bash
if [[ -f .opencode/ralph-loop-state.json ]]; then
  ITERATION=$(cat .opencode/ralph-loop-state.json | grep -o '"iteration":[0-9]*' | cut -d: -f2)
  echo "FOUND_LOOP=true"
  echo "ITERATION=$ITERATION"
else
  echo "FOUND_LOOP=false"
fi
```

Check the output above:

1. **If FOUND_LOOP=false**:

   - Say "No active Ralph loop found."

2. **If FOUND_LOOP=true**:
   - Use Bash: `rm .opencode/ralph-loop-state.json`
   - Report: "Cancelled Ralph loop (was at iteration N)" where N is the ITERATION value from above.
