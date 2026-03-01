# GitHub Copilot mapping for RPI workflow

This folder maps the local OpenCode `research -> plan -> implement` workflow to GitHub Copilot customization primitives.

## What is included

- Custom agents in `.github/agents/`
  - `hl-research.agent.md`
  - `hl-plan.agent.md`
  - `hl-implement.agent.md`
  - Subagents used for orchestration:
    - `hl-thoughts-locator.agent.md`
    - `hl-thoughts-analyzer.agent.md`
    - `hl-codebase-locator.agent.md`
    - `hl-codebase-analyzer.agent.md`
    - `hl-pattern-finder.agent.md`
    - `hl-web-search-researcher.agent.md`
    - `hl-coder-agent.agent.md`
- Prompt files in `.github/prompts/`
  - `research.prompt.md`
  - `plan.prompt.md`
  - `implement.prompt.md`
- Repository-wide guidance in `.github/copilot-instructions.md`

## How this maps to Copilot

- **Custom agents** provide reusable specialist behavior and tool constraints.
- **Prompt files** act as slash-command style shortcuts in IDE chat (`/research`, `/plan`, `/implement`).
- **Repository instructions** apply always-on context.
- **Subagents** are custom agents invoked by a coordinator agent, with isolated context windows.

## Usage notes

- Prompt files are currently IDE-oriented (VS Code, Visual Studio, JetBrains).
- In Copilot CLI, use `/agent` or `--agent <name>` to select an agent.
- If your editor requires it, enable prompt files in workspace settings (`chat.promptFiles: true`).
- Subagent orchestration in VS Code requires the `agent` tool and is configured via custom agent frontmatter (`agents`, `user-invokable`, `disable-model-invocation`).
- Some frontmatter fields are VS Code specific. GitHub.com coding agent ignores unsupported fields.
