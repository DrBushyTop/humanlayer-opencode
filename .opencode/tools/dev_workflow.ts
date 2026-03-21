import { tool } from "@opencode-ai/plugin"
import { ticketDir } from "../plugins/lib/dev-workflow"
import { writeState } from "../plugins/lib/dev-workflow-state"

const z = tool.schema

export default tool({
  description: "Write workflow planner state for dev artifacts",
  args: {
    action: z.enum(["complete", "rewind"]).default("complete").describe("Complete the current phase or rewind to an earlier phase"),
    ticket_dir: z.string().describe("Relative ticket directory like .opencode/thoughts/rpi/0000-example"),
    phase: z.enum(["questions", "research", "design", "structure", "plan", "implement"]).describe("Completed phase or rewind target phase"),
    transition_mode: z
      .enum(["standard", "revise-then-continue", "continue-with-guidance", "revise-then-continue-with-guidance"])
      .optional()
      .describe("Optional transition mode override"),
  },
  async execute(args: { action?: "complete" | "rewind"; ticket_dir: string; phase: "questions" | "research" | "design" | "structure" | "plan" | "implement"; transition_mode?: "standard" | "revise-then-continue" | "continue-with-guidance" | "revise-then-continue-with-guidance" }, ctx: { directory: string }) {
    const dir = ticketDir(args.ticket_dir)
    const result = await writeState({
      cwd: ctx.directory,
      ticketDir: dir,
      phase: args.phase,
      transitionMode: args.transition_mode,
      action: args.action,
    })

    return [
      `Updated ${dir}/planner-state.json`,
      `action: ${args.action ?? "complete"}`,
      `currentPhase: ${result.state.currentPhase}`,
      `transitionMode: ${result.state.transitionMode}`,
      `completedPhases: ${JSON.stringify(result.state.completedPhases)}`,
      `stalePhases: ${JSON.stringify(result.state.stalePhases)}`,
    ].join("\n")
  },
})
