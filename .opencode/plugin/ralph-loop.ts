import { type Plugin, tool } from "@opencode-ai/plugin";

// State interface for loop tracking
interface LoopState {
  active: boolean;
  iteration: number;
  maxIterations: number;
  completionPromise: string | null;
  prompt: string;
  sessionID: string;
  startedAt: string;
  lastMessageId?: string; // Track last processed message ID to prevent duplicates
}

const STATE_FILE = ".opencode/ralph-loop-state.json";
const DEBUG = false; // Disable debug logging to not break UI

// In-memory tracking of which message counts we've started processing
// This is checked SYNCHRONOUSLY before any async work
const processingMessageCounts = new Set<string>();

function debugLog(...args: any[]) {
  if (DEBUG) {
    const timestamp = new Date().toISOString().substring(11, 23);
    console.error(`[ralph-debug ${timestamp}]`, ...args);
  }
}

export const RalphLoopPlugin: Plugin = async ({ client, directory, serverUrl, $ }) => {
  // Helper: Get full state file path
  const getStatePath = () => `${directory}/${STATE_FILE}`;

  // Direct fetch to show toast, bypassing SDK wrapper which has a bug
  const showToast = async (options: {
    title?: string;
    message: string;
    variant: "info" | "success" | "warning" | "error";
    duration?: number;
  }) => {
    const url = new URL("/tui/show-toast", serverUrl);
    url.searchParams.set("directory", directory);
    
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
    } catch (e) {
      debugLog("Failed to show toast:", e);
    }
  };

  // Helper: Load state from JSON file
  const loadState = async (): Promise<LoopState | null> => {
    try {
      const file = Bun.file(getStatePath());
      if (await file.exists()) {
        const content = await file.text();
        return JSON.parse(content);
      }
    } catch (e) {
      debugLog("Failed to load state:", e);
    }
    return null;
  };

  // Helper: Save state to JSON file
  const saveState = async (state: LoopState): Promise<void> => {
    try {
      await Bun.write(getStatePath(), JSON.stringify(state, null, 2));
    } catch (e) {
      debugLog("Failed to save state:", e);
    }
  };

  // Helper: Delete state file (loop ended)
  const deleteState = async (): Promise<void> => {
    try {
      const file = Bun.file(getStatePath());
      if (await file.exists()) {
        await $`rm ${getStatePath()}`;
      }
    } catch (e) {
      // Ignore errors during deletion
    }
  };

  // Helper: Extract promise text from <promise>...</promise> tags
  const extractPromise = (text: string): string | null => {
    const match = text.match(/<promise>([\s\S]*?)<\/promise>/);
    if (match && match[1]) {
      // Normalize whitespace like the original
      return match[1].trim().replace(/\s+/g, " ");
    }
    return null;
  };

  return {
    // Event handler for session.idle - core loop logic
    event: async ({ event }) => {
      // Only process session.idle events
      if (event.type !== "session.idle") return;

      debugLog("session.idle event received");

      const state = await loadState();

      // No active loop - nothing to do
      if (!state?.active) {
        debugLog("No active loop, ignoring");
        return;
      }

      // Different session - not our loop
      const sessionID = (event.properties as { sessionID?: string })?.sessionID;
      if (!sessionID || state.sessionID !== sessionID) {
        debugLog("Different session, ignoring");
        return;
      }

      debugLog(`Processing for session ${sessionID}, iteration ${state.iteration}`);

      // Get session messages to check for completion promise and get last message ID
      try {
        const messagesResult = await client.session.messages({
          path: { id: state.sessionID },
        });

        // Handle the SDK response - it returns { data, error, request, response }
        const messages = (messagesResult as any)?.data;
        if (!messages || !Array.isArray(messages)) {
          debugLog("Failed to get messages");
          return;
        }

        debugLog(`Got ${messages.length} messages`);

        // Use message count + session as unique key for deduplication
        const messageCount = messages.length;
        const processingKey = `${sessionID}:${messageCount}`;
        
        // SYNCHRONOUS CHECK: If we're already processing this exact message count, skip
        if (processingMessageCounts.has(processingKey)) {
          debugLog(`Already processing ${processingKey}, skipping duplicate event`);
          return;
        }
        
        // Mark as processing IMMEDIATELY (synchronous)
        processingMessageCounts.add(processingKey);
        
        // Clean up old keys after a delay (prevent memory leak)
        setTimeout(() => {
          processingMessageCounts.delete(processingKey);
        }, 30000); // 30 second cleanup

        // Find the last assistant message and its index
        const reversedMessages = [...messages].reverse();
        const lastAssistantIndex = reversedMessages.findIndex((m: any) => m.info?.role === "assistant");
        const lastAssistant = lastAssistantIndex >= 0 ? reversedMessages[lastAssistantIndex] : null;

        if (!lastAssistant) {
          debugLog("No assistant message found");
          return;
        }

        // Check state-based deduplication as well
        const lastProcessedCount = state.lastMessageId ? parseInt(state.lastMessageId, 10) : 0;
        
        debugLog(`Message count: ${messageCount}, last processed count: ${lastProcessedCount}`);

        // CRITICAL: Check if we already processed this message count (file-based check)
        if (lastProcessedCount >= messageCount) {
          debugLog("Already processed this message count, skipping");
          return;
        }

        // Extract text content from parts
        const textContent =
          lastAssistant.parts
            ?.filter((p) => p.type === "text")
            .map((p) => (p as { text?: string }).text || "")
            .join("\n") || "";

        debugLog(`Message text length: ${textContent.length}`);

        // Check for completion promise BEFORE checking max iterations
        if (state.completionPromise) {
          const extractedPromise = extractPromise(textContent);
          debugLog(`Extracted promise: "${extractedPromise}", expected: "${state.completionPromise}"`);

          if (extractedPromise === state.completionPromise) {
            debugLog("Completion promise detected! Ending loop.");
            await showToast({
              title: "Ralph Loop Complete",
              message: `Promise fulfilled: ${state.completionPromise} (${state.iteration} iteration${state.iteration !== 1 ? "s" : ""})`,
              variant: "success",
              duration: 5000,
            });
            await deleteState();
            return;
          }
        }

        // Now check max iterations (after completion check)
        if (state.maxIterations > 0 && state.iteration >= state.maxIterations) {
          debugLog("Max iterations reached, ending loop");
          await showToast({
            title: "Ralph Loop Complete",
            message: `Max iterations (${state.maxIterations}) reached without completion`,
            variant: "warning",
            duration: 5000,
          });
          await deleteState();
          return;
        }

        // Not complete - continue loop
        // Update state BEFORE sending prompt to prevent race conditions
        state.iteration++;
        state.lastMessageId = String(messageCount); // Store message count as string
        await saveState(state);

        debugLog(`Saved state with iteration ${state.iteration}, messageCount ${messageCount}`);

        // Show progress toast
        await showToast({
          title: "Ralph Loop",
          message: `Starting iteration ${state.iteration}${
            state.maxIterations > 0 ? ` of ${state.maxIterations}` : ""
          }`,
          variant: "info",
          duration: 3000,
        });

        // Build re-prompt message
        const iterationInfo = state.completionPromise
          ? `\n\n---\n[Iteration ${state.iteration}] Output <promise>${state.completionPromise}</promise> when complete (ONLY when true!)`
          : `\n\n---\n[Iteration ${state.iteration}]`;

        debugLog(`Sending prompt for iteration ${state.iteration}`);

        // Re-prompt the session
        await client.session.promptAsync({
          path: { id: state.sessionID },
          body: {
            parts: [
              {
                type: "text",
                text: state.prompt + iterationInfo,
              },
            ],
          },
        });

        debugLog("Prompt sent successfully");
      } catch (e) {
        debugLog("Error in event handler:", e);
        await showToast({
          title: "Ralph Loop Error",
          message: String(e),
          variant: "error",
          duration: 5000,
        });
      }
    },

    // Tools for controlling the ralph loop
    tool: {
      "ralph-loop-start": tool({
        description:
          "Start an iterative prompt loop until completion. The loop will re-prompt the session with the same prompt until the completion promise is detected or max iterations reached.",
        args: {
          prompt: tool.schema
            .string()
            .describe("The prompt to repeat each iteration"),
          maxIterations: tool.schema
            .number()
            .optional()
            .describe("Maximum iterations (0 or omit for unlimited)"),
          completionPromise: tool.schema
            .string()
            .optional()
            .describe(
              "Text that signals completion when wrapped in <promise>...</promise>"
            ),
        },
        async execute(args, ctx) {
          debugLog("ralph-loop-start called", args);

          // Check for existing loop
          const existingState = await loadState();
          if (existingState?.active) {
            return `Error: A ralph loop is already active (iteration ${existingState.iteration}). Cancel it first with /cancel-ralph.`;
          }

          // Create new loop state
          const state: LoopState = {
            active: true,
            iteration: 1,
            maxIterations: args.maxIterations || 0,
            completionPromise: args.completionPromise || null,
            prompt: args.prompt,
            sessionID: ctx.sessionID,
            startedAt: new Date().toISOString(),
          };

          await saveState(state);
          debugLog("Loop started, state saved");

          // Show toast notification
          await showToast({
            title: "Ralph Loop Started",
            message: `Iteration 1${state.maxIterations > 0 ? ` of ${state.maxIterations}` : " (unlimited)"}`,
            variant: "info",
            duration: 3000,
          });

          // Build response message
          let response = `Ralph loop activated!

**Iteration**: 1
**Max iterations**: ${state.maxIterations > 0 ? state.maxIterations : "unlimited"}
**Completion promise**: ${state.completionPromise ? `"${state.completionPromise}"` : "none (runs until max iterations)"}

The loop is now active. When this session goes idle, the same prompt will be re-sent.
`;

          if (state.completionPromise) {
            response += `
To complete the loop, output:
\`\`\`
<promise>${state.completionPromise}</promise>
\`\`\`

**CRITICAL**: Only output the promise when the statement is completely TRUE. Do not lie to exit the loop.
`;
          }

          return response;
        },
      }),

      "ralph-loop-cancel": tool({
        description: "Cancel the current ralph loop if one is active",
        args: {},
        async execute(args, ctx) {
          const state = await loadState();

          if (!state?.active) {
            return "No active ralph loop to cancel.";
          }

          const iterations = state.iteration;
          await deleteState();

          await showToast({
            title: "Ralph Loop Cancelled",
            message: `Stopped after ${iterations} iteration${iterations !== 1 ? "s" : ""}`,
            variant: "warning",
            duration: 3000,
          });

          return `Ralph loop cancelled after ${iterations} iteration${iterations !== 1 ? "s" : ""}.`;
        },
      }),

      "ralph-loop-status": tool({
        description: "Check the status of the current ralph loop",
        args: {},
        async execute(args, ctx) {
          const state = await loadState();

          if (!state?.active) {
            return "No active ralph loop.";
          }

          const elapsed = Date.now() - new Date(state.startedAt).getTime();
          const elapsedMin = Math.floor(elapsed / 60000);
          const elapsedSec = Math.floor((elapsed % 60000) / 1000);

          return `**Ralph Loop Status**

**Active**: Yes
**Session**: ${state.sessionID}
**Iteration**: ${state.iteration}${state.maxIterations > 0 ? ` of ${state.maxIterations}` : " (unlimited)"}
**Completion Promise**: ${state.completionPromise || "none"}
**Running Time**: ${elapsedMin}m ${elapsedSec}s
**Started**: ${state.startedAt}

**Prompt**:
\`\`\`
${state.prompt}
\`\`\`
`;
        },
      }),
    },
  };
};

export default RalphLoopPlugin;
