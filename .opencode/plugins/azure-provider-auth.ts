import type { Plugin } from "@opencode-ai/plugin"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const DEFAULT_RESOURCE = "https://cognitiveservices.azure.com"
const REFRESH_SKEW_MS = 2 * 60 * 1000

const LOG_PREFIX = "[azure-provider-auth]"

const LOG_FILE = (() => {
  try {
    if (typeof process === "undefined" || !process.env) return undefined
    return (
      process.env.OPENCODE_AZURE_PROVIDER_AUTH_DEBUG_FILE ??
      process.env.OPENCODE_DEBUG_FILE
    )
  } catch {
    return undefined
  }
})()

let logFsModule: Promise<typeof import("node:fs")> | undefined

const DEBUG_ENABLED = (() => {
  try {
    if (typeof process === "undefined" || !process.env) return false
    const raw =
      process.env.OPENCODE_AZURE_PROVIDER_AUTH_DEBUG ??
      process.env.OPENCODE_DEBUG
    if (!raw && !LOG_FILE) return false
    if (!raw && LOG_FILE) return true
    const v = String(raw).toLowerCase().trim()
    return v === "1" || v === "true" || v === "yes" || v === "debug"
  } catch {
    return false
  }
})()

function debug(...args: any[]) {
  if (!DEBUG_ENABLED) return
  try {
    const payload = args.length === 1 ? args[0] : args
    let line: string
    if (typeof payload === "string") {
      line = `${LOG_PREFIX} ${payload}`
    } else {
      try {
        line = `${LOG_PREFIX} ${JSON.stringify(payload)}`
      } catch {
        line = `${LOG_PREFIX} ${String(payload)}`
      }
    }

    if (LOG_FILE) {
      if (!logFsModule) {
        try {
          logFsModule = import("node:fs")
        } catch {
          logFsModule = undefined
        }
      }
      if (logFsModule) {
        logFsModule
          .then((fs) => {
            try {
              fs.appendFile(LOG_FILE!, line + "\n", () => {})
            } catch {
              // ignore
            }
          })
          .catch(() => {
            console.log(line)
          })
      } else {
        console.log(line)
      }
    } else {
      console.log(line)
    }
  } catch {
    // ignore
  }
}

type Token = {
  value: string
  expires: number
}

const cache = new Map<string, Token>()
const inflight = new Map<string, Promise<Token>>()

type AzureAuthConfig = {
  enabled?: boolean
  clientId?: string
  resource?: string
  tenant?: string
  autoLogin?: "browser" | "device-code" | false
  loginTimeoutMs?: number
  allowNoSubscriptions?: boolean
  subscription?: string
  match?: {
    url_prefix?: string[]
    hostname_includes?: string[]
    hostname?: string[]
  }
}

const LOGIN_COOLDOWN_MS = 10 * 60 * 1000
const DEFAULT_LOGIN_TIMEOUT_MS = 10 * 60 * 1000

type AzResult = {
  stdout: string
  stderr: string
  exit: number
}

function dataDir() {
  const xdg = process.env.XDG_DATA_HOME
  return path.join(xdg ?? path.join(os.homedir(), ".local", "share"), "opencode")
}

function authPath() {
  return path.join(dataDir(), "auth.json")
}

function authApiProviders(): Set<string> {
  try {
    const file = authPath()
    const raw = fs.readFileSync(file, "utf8")
    const json = JSON.parse(raw) as Record<string, any>
    return new Set(
      Object.entries(json)
        .filter(([, v]) => v && v.type === "api" && typeof v.key === "string" && v.key.length > 0)
        .map(([k]) => k),
    )
  } catch {
    return new Set()
  }
}

function looksAzureHost(url: string | undefined) {
  if (!url) return false
  try {
    const host = new URL(url).hostname.toLowerCase()
    return (
      host.includes(".services.ai.azure.com") ||
      host.includes(".openai.azure.com") ||
      host.includes(".cognitiveservices.azure.com")
    )
  } catch {
    return false
  }
}

function match(url: string, cfg?: AzureAuthConfig["match"]) {
  if (!cfg) return false
  if (cfg.url_prefix?.some((p) => url.startsWith(p))) return true
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (cfg.hostname?.some((h) => host === h.toLowerCase())) return true
    if (cfg.hostname_includes?.some((h) => host.includes(h.toLowerCase()))) return true
  } catch {}
  return false
}

function stale(t: Token | undefined) {
  if (!t) return true
  return Date.now() >= t.expires - REFRESH_SKEW_MS
}

function tokenArgs(cfg?: AzureAuthConfig) {
  if (cfg?.clientId) {
    debug("tokenArgs using clientId scope", { clientId: cfg.clientId })
    return ["--scope", `api://${cfg.clientId}/.default`] as const
  }
  debug("tokenArgs using resource", { resource: cfg?.resource ?? DEFAULT_RESOURCE })
  return ["--resource", cfg?.resource ?? DEFAULT_RESOURCE] as const
}

function loginScope(cfg?: AzureAuthConfig) {
  if (cfg?.clientId) return `api://${cfg.clientId}/.default`
  const resource = (cfg?.resource ?? DEFAULT_RESOURCE).replace(/\/+$/, "")
  return `${resource}/.default`
}

async function run(cmd: string[], timeoutMs?: number): Promise<AzResult> {
  debug("run", { cmd: cmd.join(" "), timeoutMs })
  const p = Bun.spawn({
    cmd,
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore",
  })

  const stdout = new Response(p.stdout).text()
  const stderr = new Response(p.stderr).text()

  let timeout: ReturnType<typeof setTimeout> | undefined
  const exit = await (timeoutMs
    ? Promise.race([
        p.exited,
        new Promise<number>((resolve) => {
          timeout = setTimeout(() => resolve(-1), timeoutMs)
        }),
      ])
    : p.exited)

  if (timeout) clearTimeout(timeout)
  if (exit === -1) {
    debug("run timeout", { cmd: cmd.join(" ") })
    try {
      p.kill()
    } catch {
      // ignore
    }
    throw new Error("az timeout")
  }

  return {
    exit,
    stdout: await stdout,
    stderr: await stderr,
  }
}

function needsLogin(text: string) {
  const t = text.toLowerCase()
  return (
    t.includes("az login") ||
    t.includes("not logged in") ||
    t.includes("please run") ||
    t.includes("authentication") ||
    t.includes("interaction_required") ||
    t.includes("aadsts") ||
    t.includes("no subscription found")
  )
}

function loginKey(cfg?: AzureCliAuthConfig) {
  return cfg?.tenant ? `tenant:${cfg.tenant}` : "tenant:default"
}

function withAuth(init: any | undefined, value: string) {
  const headers = new Headers(init?.headers)
  headers.set("Authorization", `Bearer ${value}`)
  if (headers.has("api-key")) headers.delete("api-key")
  return {
    ...(init ?? {}),
    headers,
  }
}

function withRequestHeaders(input: any, init: any | undefined) {
  if (init?.headers) return init
  if (typeof Request !== "undefined" && input instanceof Request) {
    return { ...(init ?? {}), headers: input.headers }
  }
  return init
}

async function identityAccessToken(cfg?: AzureAuthConfig): Promise<Token | undefined> {
  try {
    debug("identityAccessToken start", { scope: loginScope(cfg) })
    const mod = (await import("@azure/identity")) as any
    const DefaultAzureCredential = mod.DefaultAzureCredential
    if (!DefaultAzureCredential) {
      debug("identityAccessToken missing DefaultAzureCredential")
      return undefined
    }

    const credential = new DefaultAzureCredential()
    const scope = loginScope(cfg)
    const res = await credential.getToken(scope)
    if (!res?.token || !res.expiresOnTimestamp) {
      debug("identityAccessToken missing token or expiresOnTimestamp")
      return undefined
    }

    debug("identityAccessToken success", { expiresOnTimestamp: res.expiresOnTimestamp })
    return { value: res.token, expires: res.expiresOnTimestamp }
  } catch (e) {
    debug("identityAccessToken error", String(e))
    return undefined
  }
}

export const AzureProviderAuth: Plugin = async ({ client, serverUrl, directory }) => {
  const skip = authApiProviders()
  const managed = new Map<string, AzureAuthConfig>()
  const loginAt = new Map<string, number>()
  const loginInflight = new Map<string, Promise<void>>()

  debug("plugin init", { directory, skipProviders: [...skip] })
  async function toast(msg: string) {
    const body = {
      title: "Azure login required",
      message: msg,
      variant: "warning",
      duration: 8000,
    }

    try {
      const url = new URL("/tui/show-toast", serverUrl)
      url.searchParams.set("directory", directory)

      const password = process.env.OPENCODE_SERVER_PASSWORD
      const headers: Record<string, string> = {
        "content-type": "application/json",
        "x-opencode-directory": directory,
      }
      if (password) {
        const username = process.env.OPENCODE_SERVER_USERNAME ?? "opencode"
        headers.authorization = `Basic ${btoa(`${username}:${password}`)}`
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      })

      if (res.ok) return
    } catch {
      // fall through
    }

    try {
      const inner = (client as any)?._client
      if (typeof inner?.request === "function") {
        await inner.request({
          url: "/tui/show-toast",
          method: "POST",
          query: { directory },
          headers: {
            "content-type": "application/json",
            "x-opencode-directory": directory,
          },
          body,
        })
        return
      }
    } catch {
      // ignore
    }

    console.log("[azure-provider-auth]", msg)
  }

  async function login(cfg?: AzureAuthConfig) {
    debug("login called", { autoLogin: cfg?.autoLogin, tenant: cfg?.tenant })
    const mode = cfg?.autoLogin === undefined ? "browser" : cfg.autoLogin
    if (mode === false) {
      const hint = cfg?.tenant
        ? `az login --tenant ${cfg.tenant} --allow-no-subscriptions`
        : "az login"
      await toast(`Azure login required. Run: ${hint}`)
      return false
    }

    const key = loginKey(cfg)
    const last = loginAt.get(key) ?? 0
    if (Date.now() - last < LOGIN_COOLDOWN_MS) return true
    loginAt.set(key, Date.now())

    const current = loginInflight.get(key)
    if (current) {
      await current
      return true
    }

    const started = (async () => {
      const cmd = ["az", "login"]
      if (cfg?.tenant) cmd.push("--tenant", cfg.tenant)

      const allowNoSubscriptions = cfg?.allowNoSubscriptions ?? Boolean(cfg?.tenant)
      if (allowNoSubscriptions) cmd.push("--allow-no-subscriptions")
      if (mode === "device-code") cmd.push("--use-device-code")

      cmd.push("--scope", loginScope(cfg))

      await toast(
        mode === "device-code"
          ? "Signing in with device code... follow the instructions to continue."
          : "Signing in via browser... complete the sign-in flow to continue.",
      )

      const timeoutMs = cfg?.loginTimeoutMs ?? DEFAULT_LOGIN_TIMEOUT_MS
      const result = await run(cmd, timeoutMs).catch((e) => ({ stdout: "", stderr: String(e), exit: 1 }))
      debug("login result", { exit: result.exit })
      if (result.exit !== 0) {
        const hint = cfg?.tenant
          ? `az login --tenant ${cfg.tenant} --allow-no-subscriptions`
          : "az login"
        await toast(`Azure login failed. Try running: ${hint}`)
        throw new Error(result.stderr || result.stdout || "az login failed")
      }
    })().finally(() => {
      loginInflight.delete(key)
    })

    loginInflight.set(key, started)
    await started
    return true
  }

  async function accessToken(cfg?: AzureAuthConfig) {
    const args = tokenArgs(cfg)
    const key = `${args[0]}=${args[1]}|tenant=${cfg?.tenant ?? ""}`

    const existing = cache.get(key)
    if (!stale(existing)) {
      debug("accessToken cache hit", { key, expires: existing?.expires })
      return existing!
    }

    const current = inflight.get(key)
    if (current) {
      debug("accessToken inflight reuse", { key })
      return current
    }

    const started = (async () => {
      const fromIdentity = await identityAccessToken(cfg)
      if (fromIdentity) {
        debug("accessToken using identity token", { key, expires: fromIdentity.expires })
        cache.set(key, fromIdentity)
        inflight.delete(key)
        return fromIdentity
      }

      const cmd = ["az", "account", "get-access-token", args[0], args[1], "-o", "json"]
      if (cfg?.tenant) cmd.push("--tenant", cfg.tenant)
      debug("accessToken running az", { cmd: cmd.join(" "), tenant: cfg?.tenant })

      const result = await run(cmd)
      if (result.exit !== 0) {
        debug("accessToken az exited with error", { exit: result.exit })
        const out = `${result.stderr}\n${result.stdout}`.trim()

        if (out.toLowerCase().includes("no subscription found")) {
          const subs = await run(["az", "account", "list", "--all", "-o", "json"]).catch(() => undefined)
          const list = subs && subs.exit === 0 ? (JSON.parse(subs.stdout) as Array<{ id?: string }>) : []
          const sub = cfg?.subscription ?? list.find((x) => x.id)?.id
          if (sub) {
            await run(["az", "account", "set", "--subscription", sub]).catch(() => undefined)
            const retry0 = await run(cmd)
            if (retry0.exit === 0) {
              return retry0.stdout
            }
          }
        }

        if (needsLogin(out)) {
          const ok = await login(cfg)
          if (!ok) throw new Error(out || "az token failed")

          const retry = await run(cmd)
          if (retry.exit === 0) {
            return retry.stdout
          }
          throw new Error((`${retry.stderr}\n${retry.stdout}`).trim() || "az token failed")
        }

        throw new Error(out || "az token failed")
      }

      return result.stdout
    })()
      .then((out) => {
        // identityAccessToken() already returns a Token; skip JSON parsing
        if (typeof out === "object" && out !== null && "value" in out && "expires" in out) {
          return out as Token
        }
        debug("accessToken parsing az output")
        const json = JSON.parse(out as string) as {
          accessToken?: string
          expires_on?: string | number
          expiresOn?: string | number
        }

        const value = json.accessToken
        if (!value) throw new Error("az returned no accessToken")

        const raw = json.expires_on ?? json.expiresOn
        const expires = (() => {
          const seconds = Number(raw)
          if (Number.isFinite(seconds)) return seconds * 1000
          if (typeof raw === "string") {
            const parsed = Date.parse(raw)
            if (Number.isFinite(parsed)) return parsed
          }
          return NaN
        })()
        if (!Number.isFinite(expires)) throw new Error("az returned invalid expires")

        const t = { value, expires }
        debug("accessToken obtained", { key, expires })
        cache.set(key, t)
        inflight.delete(key)
        return t
      })
      .catch((e) => {
        debug("accessToken error", String(e))
        inflight.delete(key)
        throw e
      })

    inflight.set(key, started)
    return started
  }

  return {
    "chat.headers": async (input, output) => {
      if (skip.has(input.model.providerID)) {
        debug("chat.headers skipping provider (api key set)", { providerID: input.model.providerID })
        return
      }

      const cfg = managed.get(input.model.providerID)
      const base = input.model.api.url
      if (!cfg && !looksAzureHost(base)) {
        debug("chat.headers skipping (no config and not azure host)", { providerID: input.model.providerID, base })
        return
      }

      debug("chat.headers injecting token", { providerID: input.model.providerID, base, hasCfg: Boolean(cfg) })
      const t = await accessToken(cfg)
      output.headers["Authorization"] = `Bearer ${t.value}`
    },
    config: async (cfg: any) => {
      const providers = cfg?.provider
      if (!providers) {
        debug("config called but no providers found")
        return
      }
      debug("config called", { providerIds: Object.keys(providers) })

      for (const [id, p] of Object.entries<any>(providers)) {
        if (skip.has(id)) {
          debug("config skipping provider (api key set)", { id })
          continue
        }
        if (!p.options) p.options = {}

        const azure = (p.options.azureAuth ?? p.options.azureCliAuth ?? {}) as AzureAuthConfig
        delete p.options.azureAuth
        delete p.options.azureCliAuth

        const base = p?.api ?? p?.options?.baseURL
        const enabled = azure.enabled === true
        const inferred = id === "foundry" || looksAzureHost(base)
        const allow = enabled || inferred || (typeof base === "string" && match(base, azure.match))
        debug("config evaluating provider", {
          id,
          base,
          enabled,
          inferred,
          allow,
          clientId: azure.clientId,
          resource: azure.resource,
          tenant: azure.tenant,
        })
        if (!allow) continue

        if (p.options.apiKey && p.options.apiKey !== "azure-cli" && !enabled) {
          debug("config skipping provider (explicit apiKey set)", { id })
          continue
        }

        managed.set(id, azure)
        debug("config managing provider", { id, scope: loginScope(azure) })

        if (!p.options.apiKey) p.options.apiKey = "azure-cli"

        const original = p.options.fetch
        p.options.fetch = async (input: any, init?: any) => {
          const url = typeof input === "string" ? input : input?.url
          const should = enabled || looksAzureHost(url) || match(String(url ?? ""), azure.match)
          if (!should) {
            debug("fetch passthrough (not matching)", { url })
            return (original ?? fetch)(input, init)
          }
          debug("fetch injecting auth", { url })
          const t = await accessToken(azure)
          const res = await (original ?? fetch)(input, withAuth(withRequestHeaders(input, init), t.value))
          if (!res.ok) {
            debug("fetch response error", {
              url,
              status: res.status,
              statusText: res.statusText,
            })
            // Try to read the error body for diagnostics without consuming the
            // stream that the caller needs. We clone so the original response
            // remains readable.
            try {
              const body = await res.clone().text()
              if (body) {
                debug("fetch error body", body.slice(0, 2000))
              }
            } catch {
              // ignore – body may not be readable
            }
          } else {
            debug("fetch response ok", { url, status: res.status })
          }
          return res
        }
      }
    },
  }
}
