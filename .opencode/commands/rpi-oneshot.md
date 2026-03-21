---
description: "Run the full RPI chain without manual gates"
agent: dev/research-questions
managed_by: opencode-local-tooling-updater
managed_note: "Managed by the local tooling updater; changes will be overwritten. Do not edit by hand."
---

Start the autonomous dev workflow for: `$ARGUMENTS`

- Prefer a ticket pointer like `@.opencode/thoughts/rpi/{ticketid-featname}/ticket.md`.
- If you are given a rough prompt instead of a ticket file, write or update `ticket.md` in the matching workflow directory first.
- Create the research-questions artifact first and update `planner-state.json` with transition mode `revise-then-continue-with-guidance`.
- Use your recommendations instead of stopping for design or plan approval unless the task is genuinely blocked.
- Keep writing the normal workflow artifacts in `.opencode/thoughts/rpi/{ticketid-featname}/` so the plugin can advance the TUI session automatically through research, design, structure, plan, and implementation.
- When the workflow reaches implementation, continue without manual gates, run the relevant checks, and stop only when the work is complete or truly blocked.
