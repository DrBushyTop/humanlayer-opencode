# Copilot RPI workflow baseline

This repository uses a three-stage flow for non-trivial work:

1. Research current state.
2. Plan phased implementation.
3. Implement with verification.

When a user asks to follow this flow:

- Prefer the custom agents in `.github/agents/`:
  - `hl-research`
  - `hl-plan`
  - `hl-implement`
- Prefer the prompt files in `.github/prompts/` for shortcut entry points.

General behavior rules:

- Keep responses concise and practical.
- Use existing conventions in this repo.
- Do not commit or push unless explicitly requested.
- For non-trivial work, include verification commands and outcomes.
- Use `bun` instead of `npm` for JavaScript package workflows.
