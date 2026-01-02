#!/bin/bash
# Ralph Loop CLI - Run iterative AI loops from the command line
#
# Usage: ralph-loop-cli.sh "prompt" [--max N] [--promise TEXT]
#
# This script repeatedly calls opencode run until:
# - The completion promise is detected in output
# - Maximum iterations reached
# - User interrupts with Ctrl+C

set -euo pipefail

# Parse arguments
PROMPT_PARTS=()
MAX_ITERATIONS=0
COMPLETION_PROMISE=""
ATTACH_URL=""
ITERATION=1

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      cat << 'HELP_EOF'
Ralph Loop CLI - Run iterative AI loops from the command line

USAGE:
  ralph-loop-cli.sh [PROMPT...] [OPTIONS]

ARGUMENTS:
  PROMPT...    Task prompt (can be multiple words without quotes)

OPTIONS:
  --max N, --max-iterations N    Maximum iterations (default: unlimited)
  --promise TEXT                 Completion promise phrase
  --attach URL                   Attach to running opencode server
  -h, --help                     Show this help message

DESCRIPTION:
  Runs an iterative loop using opencode run, continuing the same session
  until the completion promise is detected or max iterations reached.

  To signal completion, the AI must output: <promise>YOUR_PHRASE</promise>

EXAMPLES:
  ralph-loop-cli.sh Build a todo API --promise 'DONE' --max 20
  ralph-loop-cli.sh --max 10 Fix the auth bug --promise 'FIXED'
  ralph-loop-cli.sh Refactor cache layer --max 5

STOPPING:
  - Ctrl+C to interrupt
  - Reaching --max iterations
  - Detecting --promise in output
HELP_EOF
      exit 0
      ;;
    --max|--max-iterations)
      if [[ -z "${2:-}" ]]; then
        echo "Error: --max requires a number argument" >&2
        exit 1
      fi
      if ! [[ "$2" =~ ^[0-9]+$ ]]; then
        echo "Error: --max must be a positive integer, got: $2" >&2
        exit 1
      fi
      MAX_ITERATIONS="$2"
      shift 2
      ;;
    --promise|--completion-promise)
      if [[ -z "${2:-}" ]]; then
        echo "Error: --promise requires a text argument" >&2
        exit 1
      fi
      COMPLETION_PROMISE="$2"
      shift 2
      ;;
    --attach)
      if [[ -z "${2:-}" ]]; then
        echo "Error: --attach requires a URL argument" >&2
        exit 1
      fi
      ATTACH_URL="$2"
      shift 2
      ;;
    *)
      PROMPT_PARTS+=("$1")
      shift
      ;;
  esac
done

# Join all prompt parts with spaces
PROMPT="${PROMPT_PARTS[*]}"

if [[ -z "$PROMPT" ]]; then
  echo "Error: No prompt provided" >&2
  echo "Usage: ralph-loop-cli.sh \"prompt\" [--max N] [--promise TEXT]" >&2
  exit 1
fi

echo "=== Ralph Loop CLI ==="
echo "Prompt: $PROMPT"
if [[ $MAX_ITERATIONS -gt 0 ]]; then
  echo "Max iterations: $MAX_ITERATIONS"
else
  echo "Max iterations: unlimited"
fi
if [[ -n "$COMPLETION_PROMISE" ]]; then
  echo "Completion promise: $COMPLETION_PROMISE"
else
  echo "Completion promise: none"
fi
echo ""

# Build base opencode command
OPENCODE_CMD="opencode run"
if [[ -n "$ATTACH_URL" ]]; then
  OPENCODE_CMD="$OPENCODE_CMD --attach $ATTACH_URL"
fi

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
  
  # Build iteration prompt
  MAX_INFO="unlimited"
  if [[ $MAX_ITERATIONS -gt 0 ]]; then
    MAX_INFO="$MAX_ITERATIONS"
  fi
  
  ITER_PROMPT="$PROMPT

---
[Iteration $ITERATION of $MAX_INFO]"
  
  if [[ -n "$COMPLETION_PROMISE" ]]; then
    ITER_PROMPT="$ITER_PROMPT

When the task is COMPLETE, output this EXACTLY on its own line:
<promise>$COMPLETION_PROMISE</promise>

Do NOT output the promise until the task is genuinely complete."
  fi
  
  # Run and capture output
  OUTPUT=$(mktemp)
  
  if [[ $ITERATION -eq 1 ]]; then
    # Generate unique session title with timestamp
    SESSION_TITLE="Ralph-$(date +%H%M%S)-${PROMPT:0:30}"
    $OPENCODE_CMD --title "$SESSION_TITLE" "$ITER_PROMPT" 2>&1 | tee "$OUTPUT"
  else
    $OPENCODE_CMD --continue "$ITER_PROMPT" 2>&1 | tee "$OUTPUT"
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
