import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { AgentMessage } from "@earendil-works/pi-agent-core"
import {
  buildSessionContext,
  convertToLlm,
  getAgentDir,
  serializeConversation,
  type ExtensionAPI,
  type ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent"

const SIDE_QUESTION_SYSTEM_PROMPT = `You answer a private side question about a Pi coding-agent session.
Use only the supplied session context. Do not use tools or treat the question as a new coding task.
Answer directly and concisely. If the context does not contain the answer, say so.`

export function parseQuestion(args: string): string | undefined {
  const question = args.trim()
  return question || undefined
}

function getCurrentSessionMessages(
  ctx: ExtensionCommandContext,
): AgentMessage[] {
  return buildSessionContext(
    ctx.sessionManager.getEntries(),
    ctx.sessionManager.getLeafId(),
  ).messages
}

function getErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/\s+/gu, " ").trim() || "Request failed."
}

function getHerdrPaneId(stdout: string): string | undefined {
  try {
    const response = JSON.parse(stdout) as {
      result?: { pane?: { pane_id?: unknown } }
    }
    const paneId = response.result?.pane?.pane_id
    return typeof paneId === "string" && paneId.trim() ? paneId : undefined
  } catch {
    return undefined
  }
}

function getHerdrPaneLabel(question: string): string {
  const summary = question.replace(/\s+/gu, " ").trim()
  return `btw: ${summary.slice(0, 48)}`
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}

function buildHerdrScript(options: {
  cwd: string
  model: { provider: string; id: string }
  prompt: string
  question: string
  tempDir: string
  thinkingLevel: string
}): string {
  const args = [
    "pi",
    "--no-session",
    "--no-extensions",
    "--no-context-files",
    "--no-skills",
    "--no-prompt-templates",
    "--no-tools",
    "--approve",
    "--provider",
    options.model.provider,
    "--model",
    options.model.id,
    "--thinking",
    options.thinkingLevel,
    "--system-prompt",
    options.prompt,
    "--",
    options.question,
  ]

  return [
    "#!/bin/sh",
    `cleanup() { rm -rf ${shellQuote(options.tempDir)}; }`,
    "trap cleanup EXIT HUP INT TERM",
    `cd ${shellQuote(options.cwd)}`,
    args.map(shellQuote).join(" "),
    "status=$?",
    'exit "$status"',
    "",
  ].join("\n")
}

async function openHerdrPane(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  model: { provider: string; id: string },
  question: string,
  messages: readonly AgentMessage[],
): Promise<void> {
  const tempDir = await mkdtemp(join(tmpdir(), "pi-btw-"))
  const scriptPath = join(tempDir, "run.sh")
  let paneId: string | undefined

  try {
    await writeFile(
      join(tempDir, "settings.json"),
      JSON.stringify({ quietStartup: true, tuiMode: "fullscreen" }) + "\n",
      "utf8",
    )
    await symlink(join(getAgentDir(), "auth.json"), join(tempDir, "auth.json"))
    await writeFile(
      scriptPath,
      buildHerdrScript({
        cwd: ctx.cwd,
        model,
        prompt: [
          SIDE_QUESTION_SYSTEM_PROMPT,
          "",
          "Current session context:",
          "",
          serializeConversation(convertToLlm([...messages])),
        ].join("\n"),
        question,
        tempDir,
        thinkingLevel: ctx.thinkingLevel ?? "off",
      }),
      { encoding: "utf8", mode: 0o700 },
    )

    const createdPane = await pi.exec(
      "herdr",
      [
        "pane",
        "split",
        "--current",
        "--direction",
        "right",
        "--cwd",
        ctx.cwd,
        "--no-focus",
      ],
      { timeout: 5_000 },
    )
    if (createdPane.code !== 0) {
      throw new Error(createdPane.stderr.trim() || "could not split pane")
    }

    paneId = getHerdrPaneId(createdPane.stdout)
    if (!paneId) throw new Error("could not find the new pane")

    const renamedPane = await pi.exec(
      "herdr",
      ["pane", "rename", paneId, getHerdrPaneLabel(question)],
      { timeout: 5_000 },
    )
    if (renamedPane.code !== 0) {
      throw new Error(renamedPane.stderr.trim() || "could not label the pane")
    }

    const started = await pi.exec(
      "herdr",
      ["pane", "run", paneId, `clear; bash ${shellQuote(scriptPath)}`],
      { timeout: 5_000 },
    )
    if (started.code !== 0) {
      throw new Error(started.stderr.trim() || "could not run Pi in the pane")
    }
  } catch (error: unknown) {
    if (paneId) {
      await pi.exec("herdr", ["pane", "close", paneId], { timeout: 5_000 })
    }
    await rm(tempDir, { recursive: true, force: true })
    ctx.ui.notify(
      `Could not open Herdr pane: ${getErrorMessage(error)}`,
      "error",
    )
  }
}

export default function btwExtension(pi: ExtensionAPI): void {
  pi.registerCommand("btw", {
    description: "ask a private side question in a Herdr pane",
    handler: async (args, ctx) => {
      if (ctx.mode !== "tui") {
        ctx.ui.notify("pi-btw requires interactive mode", "error")
        return
      }

      const question = parseQuestion(args)
      if (!question) {
        ctx.ui.notify("Usage: /btw <question>", "error")
        return
      }

      if (process.env["HERDR_ENV"] !== "1") {
        ctx.ui.notify("pi-btw requires Herdr", "error")
        return
      }

      const model = ctx.model
      if (!model) {
        ctx.ui.notify("No model selected", "error")
        return
      }

      await openHerdrPane(
        pi,
        ctx,
        model,
        question,
        getCurrentSessionMessages(ctx),
      )
    },
  })
}
