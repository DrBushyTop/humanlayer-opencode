---
description: "Continue the guided RPI chain from current state"
managed_by: opencode-local-tooling-updater
managed_note: "Managed by the local tooling updater; changes will be overwritten. Do not edit by hand."
---

Continue the current RPI chain for: `$ARGUMENTS`

- Prefer a ticket pointer like `@.opencode/thoughts/rpi/{ticketid-featname}/ticket.md` or any artifact in that directory.
- If the message is a ticket ID or an azure devops work-item URL, find the corresponding ticket file and read the context from there using logged in az cli context.
- Resolve the workflow directory first. Reuse the existing workflow directory and current `planner-state.json` when present.
- Ensure `ticket.md` exists in that workflow directory. If it is missing, create it from the current prompt or fetched ticket context before continuing.
- Read and follow the current `planner-state.json` so you understand which phase is current, which later phases are stale, and what artifact should be updated next.
- If the workflow is already mid-stream (for example at research, design, structure, or plan), continue from that current phase instead of restarting at research questions.
- If no workflow directory exists yet, create or update `ticket.md`, then initialize `planner-state.json` with transition mode `revise-then-continue` and continue the flow.
- Keep the workflow moving through pre-plan phases automatically, but do not advance from structure to plan unless the user explicitly asks for planning or the current artifact says to proceed there.
