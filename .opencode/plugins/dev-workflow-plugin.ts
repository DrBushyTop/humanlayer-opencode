/**
 * NOTE: Managed by the local tooling updater; changes will be overwritten. Do not edit by hand.
 */

import type { Plugin } from "@opencode-ai/plugin"
import fsSync from "node:fs"
import fs from "node:fs/promises"
import {
  agent,
  label,
  mode,
  modeFromTransition,
  next,
  phase,
  promptWithContext,
  stagePath,
  ticket,
  ticketDir,
  title,
  type Mode,
  type Phase,
} from "./lib/dev-workflow"

type Msg = {
  info?: {
    role?: string
    agent?: string
  }
  parts?: Array<{
    type?: string
    text?: string
  }>
}

type State = {
  currentPhase?: string
  transitionMode?: string
}

const LOG_FILE = (() => {
  try {
    if (typeof process === "undefined" || !process.env) return undefined
    return process.env.OPENCODE_DEV_WORKFLOW_DEBUG_FILE ?? process.env.OPENCODE_DEBUG_FILE
  } catch {
    return undefined
  }
})()

const DEBUG = (() => {
  try {
    if (typeof process === "undefined" || !process.env) return false
    const raw = process.env.OPENCODE_DEV_WORKFLOW_DEBUG ?? process.env.OPENCODE_DEBUG
    if (!raw && !LOG_FILE) return false
    if (!raw && LOG_FILE) return true
    const val = String(raw).toLowerCase().trim()
    return val === "1" || val === "true" || val === "yes" || val === "debug"
  } catch {
    return false
  }
})()

function debug(...args: unknown[]) {
  if (!DEBUG) return
  try {
    const stamp = new Date().toISOString()
    const payload = args.length === 1 ? args[0] : args
    const line = typeof payload === "string"
      ? `[dev-workflow] [${stamp}] ${payload}`
      : `[dev-workflow] [${stamp}] ${JSON.stringify(payload)}`
    if (LOG_FILE) {
      fsSync.appendFile(LOG_FILE, line + "\n", () => {})
      return
    }
    console.log(line)
  } catch {}
}

const DevWorkflow: Plugin = async ({ client, directory }) => {
  const busy = new Set<string>()
  const flow = new Map<string, Mode>()
  const launched = new Map<string, string>()
  const ticketDirs = new Map<string, string>()
  const phaseSessions = new Map<string, string>()
  const implementationSource = new Map<string, "plan" | "structure">()

  function phaseKey(dir: string, currentPhase: Phase) {
    return `${dir}:${currentPhase}`
  }

  function rememberSession(dir: string, currentPhase: Phase, sessionID: string) {
    phaseSessions.set(phaseKey(dir, currentPhase), sessionID)
  }

  function rememberImplementationSource(dir: string, source: "plan" | "structure") {
    implementationSource.set(dir, source)
  }

  async function post(url: string, body: unknown) {
    const low = (client as any)?._client
    if (!low?.post) throw new Error("Plugin client does not expose _client.post")
    debug("sdk.raw.post", { url, body })
    return low.post({
      url,
      body,
      headers: { "Content-Type": "application/json" },
    })
  }

  async function get(url: string) {
    const low = (client as any)?._client
    if (!low?.get) throw new Error("Plugin client does not expose _client.get")
    debug("sdk.raw.get", { url })
    return low.get({ url })
  }

  async function toast(message: string, variant: "info" | "success" | "warning" | "error" = "info") {
    debug("sdk.toast", { message, variant })
    const tuiClient = (client as any)?.tui?._client
    if (tuiClient?.post) {
      await tuiClient.post({
        url: "/tui/show-toast",
        body: { title: "Dev workflow", message, variant, duration: 7000 },
        headers: { "Content-Type": "application/json" },
      }).catch(() => undefined)
      return
    }
  }

  async function messages(sessionID: string) {
    debug("sdk.messages", { sessionID })
    return (await get(`/session/${sessionID}/message?limit=20`).then((res: any) => res.data ?? res)) as Msg[]
  }

  async function fallback() {
    const root = `${directory}/.opencode/thoughts/rpi`
    const dirs = await fs.readdir(root, { withFileTypes: true }).catch(() => [])
    const files = await Promise.all(
      dirs
        .filter((item) => item.isDirectory())
        .map(async (item) => {
          const path = `${root}/${item.name}/planner-state.json`
          const stat = await fs.stat(path).catch(() => undefined)
          return stat ? { dir: `.opencode/thoughts/rpi/${item.name}`, time: stat.mtimeMs } : undefined
        }),
    )
    return files
      .filter((item): item is { dir: string; time: number } => !!item)
      .sort((a, b) => b.time - a.time)
      .at(0)?.dir
  }

  async function files(dir: string) {
    return (await fs.readdir(`${directory}/${dir}`).catch(() => []))
      .map((item) => `${dir}/${item}`)
  }

  function implementationContext(dir: string, list: string[]) {
    const plan = stagePath(dir, "plan", list)
    const structure = stagePath(dir, "structure", list)
    const design = stagePath(dir, "design", list)
    const research = stagePath(dir, "research", list)
    const ticket = ticketPath(dir, list)
    const questions = stagePath(dir, "questions", list)
    const source = implementationSource.get(dir)

    if (source === "structure" && structure) {
      return {
        primary: structure,
        research,
        design,
        structure,
      }
    }

    if ((source === "plan" || !source) && plan) {
      return {
        primary: plan,
        plan,
        design,
        structure,
      }
    }

    if (structure) {
      return {
        primary: structure,
        research,
        design,
        structure,
      }
    }

    return {
      primary: design ?? research ?? questions ?? ticket,
      ticket,
      questions,
      research,
      design,
      structure,
      plan,
    }
  }

  function ticketPath(dir: string, list: string[]) {
    return list.find((item) => item === `${dir}/ticket.md`)
  }

  async function wait(sessionID: string) {
    for (let i = 0; i < 50; i++) {
      const list = await get(`/session/${sessionID}/message?limit=1`).then((res: any) => res.data ?? res ?? []).catch(() => [])
      debug("sdk.wait", { sessionID, attempt: i + 1, messages: list.length })
      if (list.length > 0) return
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    throw new Error(`Timed out waiting for session ${sessionID} to receive its first message`)
  }

  async function focusSession(sessionID: string, nextPhase: Phase) {
    debug("sdk.selectSession", { sessionID })
    if (typeof client.tui.selectSession === "function") {
      await client.tui.selectSession({ sessionID }).catch((error) => {
        debug("sdk.selectSession.error", error instanceof Error ? { message: error.message, stack: error.stack } : String(error))
        throw error
      })
    } else {
      debug("sdk.selectSession.missing", { sessionID, keys: Object.keys(client.tui ?? {}) })
      const tuiClient = (client as any)?.tui?._client
      await (tuiClient?.post
        ? tuiClient.post({
            url: "/tui/publish",
            body: {
              type: "tui.session.select",
              properties: { sessionID },
            },
            headers: { "Content-Type": "application/json" },
          })
        : client.tui.publish({
            body: {
              type: "tui.session.select",
              properties: { sessionID },
            },
          })
      )
        .catch((error) => {
          debug("sdk.publishSelect.error", error instanceof Error ? { message: error.message, stack: error.stack } : String(error))
          throw error
        })
    }

    await toast(`Moved workflow to ${label(nextPhase)}.`, "info")
  }

  async function create(parentID: string, text: string, nextPhase: Phase, dir: string) {
    debug("sdk.create", { parentID, nextPhase, dir, isolated: true })
    try {
      const expectedTitle = title(dir, nextPhase)
      const created = await post("/session", {
        title: expectedTitle,
      }).then((res: any) => {
        debug("sdk.create.result", res)
        return res.data ?? res
      })

      debug("sdk.promptAsync", { sessionID: created.id, nextPhase, dir })
      await post(`/session/${created.id}/prompt_async`, {
        agent: agent(nextPhase),
        parts: [{ type: "text", text }],
      }).then((res: any) => debug("sdk.raw.promptAsync.result", res)).catch(async (error) => {
        debug("sdk.raw.promptAsync.error", error instanceof Error ? { message: error.message, stack: error.stack } : String(error))
        await post(`/session/${created.id}/message`, {
          agent: agent(nextPhase),
          parts: [{ type: "text", text }],
        }).then((res: any) => debug("sdk.raw.prompt.result", res))
      })

      setTimeout(async () => {
        try {
          await wait(created.id)
          await focusSession(created.id, nextPhase)
        } catch (error) {
          debug("sdk.followup.error", error instanceof Error ? { message: error.message, stack: error.stack } : String(error))
          await toast(`Failed to open ${label(nextPhase)} session.`, "error")
        }
      }, 0)

      return created.id
    } catch (error) {
      debug("sdk.create.error", error instanceof Error ? { message: error.message, stack: error.stack } : String(error))
      throw error
    }
  }

  async function maybeAdvance(sessionID: string, hint?: { dir?: string; phase?: Phase; mode?: string; action?: string }) {
    if (busy.has(sessionID)) return
    busy.add(sessionID)
    debug("advance.start", { sessionID, hint })

    try {
      const items = hint ? undefined : await messages(sessionID).catch(() => undefined)
      const last = items?.filter((item) => item.info?.role === "user").at(-1)
      const current = hint?.phase ?? phase(last?.info?.agent)
      if (!current) return

      const text = last?.parts
        ?.filter((part) => part.type === "text" && part.text)
        .map((part) => part.text)
        .join("\n")
      const dir = hint?.dir ?? ticketDirs.get(sessionID) ?? ticket(text ?? "") ?? (await fallback())
      if (!dir) {
        debug("advance.skip.no_dir", { sessionID, hint, text })
        return
      }
      ticketDirs.set(sessionID, dir)
      rememberSession(dir, current, sessionID)

      const state = (await Bun.file(`${directory}/${dir}/planner-state.json`).json().catch(() => undefined)) as State | undefined
      const picked = hint?.mode ? modeFromTransition(hint.mode) : flow.get(sessionID) ?? mode(text ?? "") ?? modeFromTransition(state?.transitionMode)
      const currentPhase = state?.currentPhase as Phase | undefined
      debug("advance.state", { sessionID, dir, current, picked, currentPhase, state })
      const target = currentPhase && currentPhase !== current
        ? currentPhase
        : current === "implement"
          ? "implement"
        : current === "questions" || current === "research" || current === "plan"
          ? next(current, picked)
          : undefined
      if (!target) {
        debug("advance.skip.no_target", { sessionID, dir, current, picked, currentPhase })
        if (current === "structure" && picked !== "oneshot") {
          await toast("Structure is ready. Review it, then move to plan when you want.", "success")
        }
        return
      }

      const key = `${dir}:${target}`
      const existing = phaseSessions.get(phaseKey(dir, target))
      if (hint?.action === "rewind" && existing && existing !== sessionID) {
        debug("advance.rewind.focus_existing", { sessionID, dir, target, existing })
        try {
          await focusSession(existing, target)
          return
        } catch (error) {
          debug("advance.rewind.focus_existing.error", error instanceof Error ? { message: error.message, stack: error.stack } : String(error))
        }
      }

      if (launched.get(key)) return

      const list = await files(dir)
      debug("advance.files", { sessionID, dir, target, list })
      const implement = target === "implement" ? implementationContext(dir, list) : undefined
      const path = target === "implement"
        ? implement?.primary
        : stagePath(
            dir,
            target === "research"
              ? "questions"
              : target === "design"
                ? "research"
                : target === "structure"
                  ? "design"
                  : "structure",
            list,
          )
      if (!path) {
        debug("advance.skip.no_path", { sessionID, dir, target, list })
        return
      }

      const prompt = promptWithContext({
        phase: target,
        flow: picked,
        context: target === "implement"
          ? {
              primary: implement?.primary,
              ticket: implement?.ticket,
              questions: implement?.questions,
              research: implement?.research,
              design: implement?.design,
              structure: implement?.structure,
              plan: implement?.plan,
            }
          : {
              primary: path,
              ticket: ticketPath(dir, list),
              questions: stagePath(dir, "questions", list),
              research: stagePath(dir, "research", list),
              design: stagePath(dir, "design", list),
              structure: stagePath(dir, "structure", list),
              plan: stagePath(dir, "plan", list),
            },
      })

      launched.set(key, sessionID)
      debug("advance.create", { sessionID, dir, target, path })
      const child = await create(sessionID, prompt, target, dir).catch(async () => {
        launched.delete(key)
        debug("advance.error.create", { sessionID, dir, target, path })
        await toast(`Failed to move workflow to ${label(target)}.`, "error")
        return undefined
      })
      if (!child) return
      debug("advance.done", { sessionID, child, dir, target })
      flow.set(child, picked)
    } catch (error) {
      debug("advance.error", {
        sessionID,
        hint,
        error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
      })
    } finally {
      busy.delete(sessionID)
    }
  }

  return {
    "tool.execute.after": async (input) => {
      if (input.tool !== "dev_workflow") return
      debug("tool.execute.after", input)
      const dir = input.args.ticket_dir ? ticketDir(input.args.ticket_dir) : undefined
      if (dir && input.args.phase === "implement") {
        const items = await messages(input.sessionID).catch(() => undefined)
        const last = items?.filter((item) => item.info?.role === "user").at(-1)
        const sourcePhase = phase(last?.info?.agent)
        if (sourcePhase === "plan" || sourcePhase === "structure") {
          rememberImplementationSource(dir, sourcePhase)
          debug("tool.execute.after.implementation_source", { dir, sourcePhase, sessionID: input.sessionID })
        }
      }
      setTimeout(() => {
        if (dir) ticketDirs.set(input.sessionID, dir)
        void maybeAdvance(input.sessionID, {
          dir,
          phase: input.args.phase,
          mode: input.args.transition_mode,
          action: input.args.action,
        })
      }, 0)
    },
    event: async ({ event }) => {
      if (event.type === "command.executed") {
        if (event.properties.name === "rpi-oneshot") {
          flow.set(event.properties.sessionID, "oneshot")
          return
        }
        if (
          event.properties.name === "rpi-start"
          || event.properties.name === "rpi-chain"
        ) {
          flow.set(event.properties.sessionID, "guided")
          return
        }
      }

      if (event.type === "session.idle") {
        await maybeAdvance(event.properties.sessionID)
      }
    },
  }
}

export { DevWorkflow }
export default DevWorkflow
