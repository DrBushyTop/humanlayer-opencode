---
description: "Start the guided RPI chain"
agent: dev/research-questions
managed_by: opencode-local-tooling-updater
managed_note: "Managed by the local tooling updater; changes will be overwritten. Do not edit by hand."
---

User message: `$ARGUMENTS`

- If the message is a ticket ID or an azure devops work-item URL, find the corresponding ticket file and read the context from there using logged in az cli context.
- Write or update `ticket.md` in the matching workflow directory if it doesn't exist or if the context has changed.
- Create the research-questions artifact, then update `planner-state.json` with transition mode `revise-then-continue`.
