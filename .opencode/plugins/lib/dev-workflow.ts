/**
 * NOTE: Managed by the local tooling updater; changes will be overwritten. Do not edit by hand.
 */

export type Phase = "questions" | "research" | "design" | "structure" | "plan" | "implement"
export type Mode = "manual" | "guided" | "oneshot"
export type Transition =
  | "standard"
  | "revise-then-continue"
  | "continue-with-guidance"
  | "revise-then-continue-with-guidance"

export const phaseOrder: Phase[] = ["questions", "research", "design", "structure", "plan", "implement"]

const phaseSuffixes: Record<Exclude<Phase, "implement">, string> = {
  questions: "research-questions",
  research: "research",
  design: "design-discussion",
  structure: "structure-outline",
  plan: "plan",
}

const transitionModeMap: Record<Transition, Mode> = {
  standard: "manual",
  "revise-then-continue": "guided",
  "continue-with-guidance": "oneshot",
  "revise-then-continue-with-guidance": "oneshot",
}

export function validTransition(value: string | undefined): value is Transition {
  return !!value && value in transitionModeMap
}

export function modeFromTransition(transition?: string): Mode {
  return validTransition(transition) ? transitionModeMap[transition] : "manual"
}

export function stageSuffix(phase: Exclude<Phase, "implement">) {
  return phaseSuffixes[phase]
}

export function mode(text: string) {
  const value = text.toLowerCase()
  if (
    value.includes("/oneshot")
    || value.includes("/rpi-oneshot")
    || value.includes("oneshot workflow")
    || value.includes("continue-with-guidance")
    || value.includes("do not stop for manual gates")
    || value.includes("go straight to implementation")
  ) return "oneshot" as Mode

  if (
    value.includes("/workflow")
    || value.includes("/rpi-start")
    || value.includes("/rpi-chain")
    || value.includes("guided workflow")
    || value.includes("revise-then-continue")
    || value.includes("keep the workflow moving")
    || value.includes("continue workflow")
  ) return "guided" as Mode

  return "manual" as Mode
}

export function phase(agent?: string) {
  return (
    {
      "hl-research-questions": "questions",
      "hl-research": "research",
      "hl-design": "design",
      "hl-structure": "structure",
      "hl-plan": "plan",
      "hl-implement": "implement",
    } as const
  )[agent ?? ""]
}

export function agent(phase: Phase) {
  return (
    {
      questions: "hl-research-questions",
      research: "hl-research",
      design: "hl-design",
      structure: "hl-structure",
      plan: "hl-plan",
      implement: "hl-implement",
    } as const
  )[phase]
}

export function ticket(text: string) {
  const matches = [...text.matchAll(/@([^\s]+\.opencode\/thoughts\/rpi\/[^\s)]+|[^\s]*\.opencode\/thoughts\/rpi\/[^\s)]+)/g)]
  for (const item of matches) {
    const raw = item[1].replace(/[),.;]+$/, "")
    const mark = "/.opencode/thoughts/rpi/"
    const i = raw.indexOf(mark)
    if (i >= 0) {
      const path = raw.slice(i + 1)
      const parts = path.split("/")
      if (parts.length >= 4) return parts.slice(0, 4).join("/")
    }
    const rel = ".opencode/thoughts/rpi/"
    const j = raw.indexOf(rel)
    if (j >= 0) {
      const path = raw.slice(j)
      const parts = path.split("/")
      if (parts.length >= 4) return parts.slice(0, 4).join("/")
    }
  }
}

export function ticketDir(dir: string) {
  const next = ".opencode/thoughts/rpi/"
  const clean = dir.trim().replace(/[),.;]+$/, "")
  const i = clean.indexOf(`/${next}`)
  if (i >= 0) return clean.slice(i + 1)
  if (clean.startsWith(next)) return clean
  if (!clean.includes("/")) return `${next}${clean}`
  return clean
}

export function next(current: Phase, flow: Mode) {
  if (flow === "manual") return
  if (current === "structure" && flow !== "oneshot") return
  const i = phaseOrder.indexOf(current)
  return i >= 0 && i + 1 < phaseOrder.length ? phaseOrder[i + 1] : undefined
}

export function title(dir: string, phase: Phase) {
  const name = dir.split("/").at(-1) ?? dir
  return `${label(phase)} · ${name}`
}

export function label(phase: Phase) {
  return phase[0].toUpperCase() + phase.slice(1)
}

export function prompt(opts: { phase: Phase; flow: Mode; path: string }) {
  return promptWithContext({ phase: opts.phase, flow: opts.flow, context: { primary: opts.path } })
}

export function promptWithContext(opts: {
  phase: Phase
  flow: Mode
  context: {
    ticket?: string
    questions?: string
    research?: string
    design?: string
    structure?: string
    plan?: string
    primary?: string
  }
}) {
  const current = [
    opts.context.ticket,
    opts.context.questions,
    opts.context.research,
    opts.context.design,
    opts.context.structure,
    opts.context.plan,
    opts.context.primary,
  ]
    .map((item) => {
      if (!item) return
      const mark = ".opencode/thoughts/rpi/"
      const i = item.indexOf(mark)
      if (i < 0) return
      const rel = item.slice(i)
      const parts = rel.split("/")
      if (parts.length < 4) return
      return parts.slice(0, 4).join("/")
    })
    .find(Boolean)
  const bullet = (label: string, path?: string) => path ? `- ${label}: @${path}` : undefined
  const avoid = current
    ? `If you use thoughts subagents, do not search or re-analyze the current work-item directory @${current}; only use other thought directories as prior context.`
    : undefined
  const format = (title: string, body: string, artifacts: Array<string | undefined>) => {
    const lines = artifacts.filter(Boolean) as string[]
    return [
      title,
      "",
      body,
      "",
      "Relevant artifacts:",
      ...lines,
    ].join("\n")
  }

  if (opts.phase === "research") {
    const questions = opts.context.questions ?? opts.context.primary
    return format(
      "Start the research phase.",
      [
        "Stay objective. Use only the research questions as the brief unless they explicitly point to another source.",
        avoid,
        "Write the research artifact, update planner state, and keep the workflow moving.",
      ].filter(Boolean).join(" "),
      [
        bullet("Research questions", questions),
      ],
    )
  }

  if (opts.phase === "design") {
    return format(
      "Start the design discussion phase.",
      "Use the full ticket context, the original research questions, and the research artifact. Keep decisions crisp, write the design artifact, update planner state, and keep the workflow moving.",
      [
        bullet("Ticket", opts.context.ticket),
        bullet("Research questions", opts.context.questions),
        bullet("Research", opts.context.research ?? opts.context.primary),
      ],
    )
  }

  if (opts.phase === "structure") {
    return format(
      "Start the structure phase.",
      "Use the full context so the outline reflects the ticket, research trail, and current design decisions. Write the structure artifact, update planner state, and keep the workflow moving.",
      [
        bullet("Ticket", opts.context.ticket),
        bullet("Research questions", opts.context.questions),
        bullet("Research", opts.context.research),
        bullet("Design", opts.context.design ?? opts.context.primary),
      ],
    )
  }

  if (opts.phase === "plan") {
    return format(
      "Start the planning phase.",
      [
        "Create the implementation plan using the approved upstream artifacts.",
        avoid,
        "Use your recommended defaults instead of stopping for manual approval, write the plan artifact, and update planner state.",
      ].filter(Boolean).join(" "),
      [
        bullet("Ticket", opts.context.ticket),
        bullet("Research questions", opts.context.questions),
        bullet("Research", opts.context.research),
        bullet("Design", opts.context.design),
        bullet("Structure", opts.context.structure ?? opts.context.primary),
      ],
    )
  }

  if (opts.context.plan) {
    return format(
      "Start the implementation phase.",
      "Implement using the approved plan as the primary execution map. Use design and structure as supporting context when you need intent or ordering details. Do not stop for manual gates; use your best recommendation when choices are reasonable, then validate before finishing.",
      [
        bullet("Plan", opts.context.plan ?? opts.context.primary),
        bullet("Design", opts.context.design),
        bullet("Structure", opts.context.structure),
      ],
    )
  }

  return format(
    "Start the implementation phase.",
    "Implement using the highest approved upstream artifact as the primary execution map. Use supporting artifacts as evidence for intent and constraints. Do not stop for manual gates; use your best recommendation when choices are reasonable, then validate before finishing.",
    [
      bullet("Research", opts.context.research),
      bullet("Design", opts.context.design),
      bullet("Structure", opts.context.structure ?? opts.context.primary),
      bullet("Ticket", !opts.context.research && !opts.context.design && !opts.context.structure ? opts.context.ticket : undefined),
      bullet("Research questions", !opts.context.research && !opts.context.design && !opts.context.structure ? opts.context.questions : undefined),
    ],
  )
}

export function stagePath(dir: string, phase: Exclude<Phase, "implement">, files: string[]) {
  const suffix = stageSuffix(phase)
  return files
    .filter((item) => item.startsWith(dir + "/") && item.endsWith(`-${suffix}.md`))
    .sort()
    .at(-1)
}
