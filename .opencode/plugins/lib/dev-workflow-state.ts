import fs from "node:fs/promises"
import path from "node:path"
import {
  phaseOrder,
  stageSuffix,
  validTransition,
  type Phase,
  type Transition,
} from "./dev-workflow"

export type Action = "complete" | "rewind"

export function validMode(value: string | undefined): value is Transition {
  return validTransition(value)
}

export function next(phase: Phase) {
  const i = phaseOrder.indexOf(phase)
  return i >= 0 && i + 1 < phaseOrder.length ? phaseOrder[i + 1] : phase
}

export function auto(mode: Transition) {
  return mode !== "standard"
}

export function guided(mode: Transition) {
  return mode === "continue-with-guidance" || mode === "revise-then-continue-with-guidance"
}

export function workItemId(dir: string) {
  const match = path.basename(dir).match(/^(\d+)-/)
  return match ? Number(match[1]) : 0
}

export function completed(current: Phase, stale: string[]) {
  const bad = new Set(stale)
  const out: string[] = []
  for (const phase of phaseOrder) {
    if (phase === current) {
      out.push(phase)
      break
    }
    if (!bad.has(phase)) out.push(phase)
  }
  return out
}

export function staleAfter(phase: Phase) {
  const i = phaseOrder.indexOf(phase)
  return i >= 0 ? phaseOrder.slice(i + 1) : []
}

async function moveStaleArtifacts(cwd: string, dir: string, phase: Phase) {
  const staleDir = path.join(cwd, dir, "stale")
  await fs.mkdir(staleDir, { recursive: true })
  const moved: string[] = []

  for (const item of staleAfter(phase)) {
    if (item === "implement") continue
    const itemSuffix = stageSuffix(item)
    if (!itemSuffix) continue

    const names = (await fs.readdir(path.join(cwd, dir)).catch(() => []))
      .filter((name) => name.endsWith(`-${itemSuffix}.md`))

    for (const name of names) {
      const source = path.join(cwd, dir, name)
      const target = path.join(staleDir, `${new Date().toISOString().replace(/[:.]/g, "-")}-${name}`)
      const renamed = await fs.rename(source, target).then(() => true).catch(() => false)
      if (renamed) moved.push(target)
    }
  }

  return moved
}

export function normalizeStale(current: Phase, stale: string[]) {
  const keep = new Set(stale)
  const currentIndex = phaseOrder.indexOf(current)
  return phaseOrder.filter((phase, index) => index > currentIndex && keep.has(phase))
}

export async function branch(cwd: string) {
  try {
    return (await Bun.$`git branch --show-current`.cwd(cwd).quiet().text()).trim()
  } catch {
    return ""
  }
}

async function latest(cwd: string, dir: string, suffix: string) {
  return (await fs.readdir(path.join(cwd, dir)).catch(() => []))
    .filter((item) => item.endsWith(`-${suffix}.md`))
    .sort()
    .at(-1)
}

async function open(cwd: string, dir: string) {
  const file = await latest(cwd, dir, "design-discussion")
  if (!file) return false
  const text = await Bun.file(path.join(cwd, dir, file)).text().catch(() => "")
  return /Decision status:\s*(pending|needs follow-up)/i.test(text)
}

async function risks(cwd: string, dir: string) {
  const file = await latest(cwd, dir, "structure-outline")
  if (!file) return false
  const text = await Bun.file(path.join(cwd, dir, file)).text().catch(() => "")
  const hit = text.match(/## Risks Or Ordering Notes\s*([\s\S]*)/i)?.[1] ?? ""
  const lines = hit
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !item.startsWith("## "))
  return lines.some((item) => item !== "None right now." && item !== "- None right now.")
}

export async function resolve(input: { cwd: string; ticketDir: string; phase: Phase; transitionMode: Transition }) {
  if (input.phase === "questions") return "research"
  if (input.phase === "research") return "design"
  if (input.phase === "design") return (await open(input.cwd, input.ticketDir)) ? "design" : "structure"
  if (!auto(input.transitionMode)) return input.phase
  if (input.phase === "structure") {
    if (!guided(input.transitionMode)) return "structure"
    return (await risks(input.cwd, input.ticketDir)) ? "structure" : "plan"
  }
  if (input.phase === "plan") return auto(input.transitionMode) ? "implement" : "plan"
  return "implement"
}

export async function writeState(input: {
  cwd: string
  ticketDir: string
  phase: Phase
  transitionMode?: string
  action?: Action
}) {
  const file = path.join(input.cwd, input.ticketDir, "planner-state.json")
  const prev = await Bun.file(file)
    .json()
    .catch(() => undefined) as
    | {
        transitionMode?: string
        stalePhases?: string[]
        branchName?: string
      }
    | undefined

  const transitionMode: Transition = validMode(input.transitionMode)
    ? input.transitionMode
    : validMode(prev?.transitionMode)
      ? prev.transitionMode
      : "standard"

  const previousStale = Array.isArray(prev?.stalePhases) ? prev.stalePhases.filter((x): x is string => typeof x === "string") : []
  const action: Action = input.action ?? "complete"
  const currentPhase = action === "rewind"
    ? input.phase
    : await resolve({ cwd: input.cwd, ticketDir: input.ticketDir, phase: input.phase, transitionMode })
  const stalePhases = action === "rewind"
    ? staleAfter(input.phase)
    : normalizeStale(currentPhase, previousStale)
  if (action === "rewind") {
    await moveStaleArtifacts(input.cwd, input.ticketDir, input.phase)
  }
  const branchName = prev?.branchName || (await branch(input.cwd))
  const state = {
    schema: "implementation-planner/v1",
    workflow: "rpi-v2",
    workItemId: workItemId(input.ticketDir),
    branchName,
    currentPhase,
    transitionMode,
    updatedAtUtc: new Date().toISOString(),
    completedPhases: completed(currentPhase, stalePhases),
    stalePhases,
  }

  await Bun.write(file, `${JSON.stringify(state, null, 2)}\n`)
  return { file, state }
}
