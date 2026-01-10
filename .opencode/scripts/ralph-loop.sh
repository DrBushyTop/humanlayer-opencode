#!/bin/bash
# Ralph Loop - Iterative AI loop for opencode
#
# Usage: ralph-loop.sh [PROMPT_FILE] [OPTIONS]
#
# Reads prompt from a file (default: PROMPT.md) and runs opencode
# in a loop, allowing you to edit the prompt file between iterations.

set -euo pipefail

# Defaults
PROMPT_FILE="${1:-PROMPT.md}"
MODEL=""
AGENT=""
MAX_ITERATIONS=0
COMPLETION_PROMISE=""
ITERATION=1
GIT_PUSH=false
GIT_PUSH_REMOTE="origin"
GIT_PUSH_BRANCH=""

# Parse arguments
# Check for help first before shifting
if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
  cat << 'HELP_EOF'
Ralph Loop - Iterative AI loop for opencode

USAGE:
  ralph-loop.sh [PROMPT_FILE] [OPTIONS]

ARGUMENTS:
  PROMPT_FILE    File containing the prompt (default: PROMPT.md)

OPTIONS:
  -m, --model MODEL      Model to use (e.g., anthropic/claude-sonnet-4-20250514)
  -a, --agent AGENT      Agent to use
  --max N                Maximum iterations (default: unlimited)
  --promise TEXT         Completion promise phrase (optional)
  --push                 Git push after each iteration
  --push-remote REMOTE   Remote to push to (default: origin)
  --push-branch BRANCH   Branch to push (default: current branch)
  -h, --help             Show this help message

DESCRIPTION:
  Runs an iterative loop reading prompts from a file. Edit the file
  between iterations to adjust the task. Each iteration creates a new
  session with a title based on the prompt file name and timestamp.

  If --promise is set, the loop will stop when the AI outputs:
  <promise>YOUR_PHRASE</promise>

EXAMPLES:
  ralph-loop.sh PROMPT.md --model anthropic/claude-sonnet-4-20250514 --max 10
  ralph-loop.sh task.md --agent coder --promise 'DONE'
  ralph-loop.sh PROMPT.md --push  # Push to origin after each iteration
  ralph-loop.sh PROMPT.md --push --push-branch feature/my-branch
  ralph-loop.sh  # Uses PROMPT.md with defaults

STOPPING:
  - Ctrl+C to interrupt
  - Reaching --max iterations
  - Detecting --promise in output (if set)
HELP_EOF
  exit 0
fi

# Skip first positional argument if it doesn't start with dash (it's the prompt file)
if [[ $# -gt 0 ]] && [[ ! "${1:-}" =~ ^- ]]; then
  PROMPT_FILE="$1"
  shift
fi

while [[ $# -gt 0 ]]; do
  case $1 in
    -m|--model)
      MODEL="$2"
      shift 2
      ;;
    -a|--agent)
      AGENT="$2"
      shift 2
      ;;
    --max|--max-iterations)
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    --promise)
      COMPLETION_PROMISE="$2"
      shift 2
      ;;
    --push)
      GIT_PUSH=true
      shift
      ;;
    --push-remote)
      GIT_PUSH=true
      GIT_PUSH_REMOTE="$2"
      shift 2
      ;;
    --push-branch)
      GIT_PUSH=true
      GIT_PUSH_BRANCH="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# Verify prompt file exists
if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "Error: Prompt file not found: $PROMPT_FILE" >&2
  exit 1
fi

echo "=== Ralph Loop ==="
echo "Prompt file: $PROMPT_FILE"
[[ -n "$MODEL" ]] && echo "Model: $MODEL"
[[ -n "$AGENT" ]] && echo "Agent: $AGENT"
if [[ $MAX_ITERATIONS -gt 0 ]]; then
  echo "Max iterations: $MAX_ITERATIONS"
else
  echo "Max iterations: unlimited"
fi
[[ -n "$COMPLETION_PROMISE" ]] && echo "Completion promise: $COMPLETION_PROMISE"
if [[ "$GIT_PUSH" == true ]]; then
  PUSH_TARGET="$GIT_PUSH_REMOTE"
  [[ -n "$GIT_PUSH_BRANCH" ]] && PUSH_TARGET="$PUSH_TARGET $GIT_PUSH_BRANCH"
  echo "Git push: $PUSH_TARGET"
fi
echo ""

# Function to check if output contains a real promise (not in backticks/code)
check_promise() {
  local output_file="$1"
  local promise="$2"
  
  # Look for promise on its own line (strongest signal)
  if grep -qE "^[[:space:]]*<promise>${promise}</promise>[[:space:]]*$" "$output_file" 2>/dev/null; then
    return 0
  fi
  
  # Count total vs backtick occurrences
  local total_count
  local backtick_count
  
  total_count=$(grep -c "<promise>${promise}</promise>" "$output_file" 2>/dev/null) || total_count=0
  backtick_count=$(grep -c "\`<promise>${promise}</promise>\`" "$output_file" 2>/dev/null) || backtick_count=0
  
  # If total > backtick, we have a real promise
  if [[ "$total_count" -gt "$backtick_count" ]]; then
    return 0
  fi
  
  return 1
}

# Main loop
while true; do
  # Check max iterations
  if [[ $MAX_ITERATIONS -gt 0 ]] && [[ $ITERATION -gt $MAX_ITERATIONS ]]; then
    echo ""
    echo "=== Max iterations ($MAX_ITERATIONS) reached ==="
    exit 0
  fi
  
  echo ""
  echo "=== Iteration $ITERATION ==="
  
  # Read prompt from file
  PROMPT=$(cat "$PROMPT_FILE")
  
  # Generate title from prompt file name and timestamp
  PROMPT_BASENAME=$(basename "$PROMPT_FILE" .md)
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  SESSION_TITLE="ralph-${PROMPT_BASENAME}-${TIMESTAMP}-iter${ITERATION}"
  
  # Build prompt without iteration info (model doesn't need to know what iteration it's on)
  ITER_PROMPT="$PROMPT"

  if [[ -n "$COMPLETION_PROMISE" ]]; then
    ITER_PROMPT="$ITER_PROMPT

---

When the task is COMPLETE, output this EXACTLY on its own line:
<promise>$COMPLETION_PROMISE</promise>

Do NOT output the promise until the task is genuinely complete."
  fi
  
  # Build opencode command with verbose logging
  CMD=(opencode run --print-logs --log-level INFO)
  [[ -n "$MODEL" ]] && CMD+=(-m "$MODEL")
  [[ -n "$AGENT" ]] && CMD+=(--agent "$AGENT")
  
  # Capture output
  OUTPUT=$(mktemp)
  
  # Each iteration creates a new session with a descriptive title
  "${CMD[@]}" --title "$SESSION_TITLE" "$ITER_PROMPT" 2>&1 | tee "$OUTPUT"
  
  # Git push if enabled
  if [[ "$GIT_PUSH" == true ]]; then
    echo ""
    echo "=== Git push ==="
    if [[ -n "$GIT_PUSH_BRANCH" ]]; then
      git push "$GIT_PUSH_REMOTE" "$GIT_PUSH_BRANCH" || echo "Warning: git push failed"
    else
      git push "$GIT_PUSH_REMOTE" || echo "Warning: git push failed"
    fi
  fi
  
  # Check for completion promise
  if [[ -n "$COMPLETION_PROMISE" ]] && check_promise "$OUTPUT" "$COMPLETION_PROMISE"; then
    echo ""
    echo "=== Loop completed on iteration $ITERATION ==="
    rm "$OUTPUT"
    exit 0
  fi
  
  rm "$OUTPUT"
  ITERATION=$((ITERATION + 1))
  
  # Small delay between iterations
  sleep 1
done
