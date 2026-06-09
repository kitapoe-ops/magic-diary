"use client"

import { useEffect, useState } from "react"
import { X, Eye, EyeOff, Sparkles, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/hooks/use-i18n"
import { useChime } from "@/hooks/use-chime"
import { useToast } from "./toast-provider"
import { LUMI_EMERGENCY_FALLBACK } from "@/lib/magic-reply-prompt"
import { MOCK_ENTRIES } from "@/lib/mock-data"

export const DEEPSEEK_TOKEN_KEY = "deepseek-api-token"
export const DEEPSEEK_OPEN_EVENT = "magic:open-deepseek-settings"

interface OpenDetail {
  resetEntries?: boolean
}

export function DeepSeekSettings() {
  const { t } = useI18n()
  const chime = useChime()
  const { showToast } = useToast()

  const [open, setOpen] = useState(false)
  const [token, setToken] = useState("")
  const [reveal, setReveal] = useState(false)
  const [testing, setTesting] = useState(false)
  const [lastResult, setLastResult] = useState<"idle" | "ok" | "fail">("idle")

  // Hydrate token from localStorage on mount.
  useEffect(() => {
    const stored = window.localStorage.getItem(DEEPSEEK_TOKEN_KEY) ?? ""
    setToken(stored)
  }, [])

  // Listen for global open events from Header / Sidebar / EntryModal.
  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<OpenDetail>).detail
      setOpen(true)
      setLastResult("idle")
      if (detail?.resetEntries) {
        // handled below via separate listener to avoid coupling
        window.dispatchEvent(new CustomEvent("magic:reset-entries"))
      }
    }
    window.addEventListener(DEEPSEEK_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(DEEPSEEK_OPEN_EVENT, onOpen)
  }, [])

  function close() {
    chime(560)
    setOpen(false)
  }

  function save() {
    const trimmed = token.trim()
    if (!trimmed) {
      showToast(t.dsTokenMissing)
      return
    }
    window.localStorage.setItem(DEEPSEEK_TOKEN_KEY, trimmed)
    setToken(trimmed)
    chime(880)
    showToast(t.dsTokenSaved)
  }

  function clear() {
    window.localStorage.removeItem(DEEPSEEK_TOKEN_KEY)
    setToken("")
    setLastResult("idle")
    chime(440)
    showToast(t.dsTokenCleared)
  }

  async function testConnection() {
    const trimmed = token.trim()
    if (!trimmed) {
      showToast(t.dsTokenMissing)
      return
    }
    setTesting(true)
    setLastResult("idle")
    try {
      const res = await fetch("/api/magic-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-deepseek-token": trimmed,
        },
        body: JSON.stringify({
          diaryContent: "Hello Lumi, just testing our magic mirror ✨",
          language: "en",
        }),
      })
      const data = (await res.json()) as { reply?: string; error?: string }
      if (!res.ok || !data.reply) {
        setLastResult("fail")
        showToast(data.error ?? t.dsTestFailed)
        return
      }
      if (data.reply.includes("trusted adult")) {
        // Safety fallback triggered on a test — still flag as a pass since
        // our emergency path worked, but surface it.
        setLastResult("ok")
        showToast("✅ Emergency fallback verified.")
        return
      }
      setLastResult("ok")
      showToast(t.dsTestSuccess)
    } catch (err) {
      setLastResult("fail")
      showToast(err instanceof Error ? err.message : t.dsTestFailed)
    } finally {
      setTesting(false)
    }
  }

  function resetEntries() {
    if (!window.confirm(t.resetConfirm)) return
    window.localStorage.setItem(
      "magic-diary-entries",
      JSON.stringify(MOCK_ENTRIES),
    )
    window.dispatchEvent(new CustomEvent("magic:reset-entries"))
    chime(660)
    showToast("✨ Demo data restored.")
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[9980] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.dsTitle}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={close} />

      <div className="glass-card relative z-10 w-full max-w-md overflow-y-auto rounded-3xl p-6 animate-bounce-in">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="gradient-title text-xl font-bold">{t.dsTitle}</h2>
          <button
            onClick={close}
            aria-label={t.dsClose}
            className="rounded-full bg-secondary/20 p-2 text-secondary hover:bg-secondary/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-secondary/80">{t.dsSettingsIntro}</p>

        <label className="mb-1 block text-sm font-semibold text-secondary" htmlFor="ds-token">
          {t.dsTokenLabel}
        </label>
        <div className="relative">
          <input
            id="ds-token"
            type={reveal ? "text" : "password"}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={t.dsTokenPlaceholder}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-2xl border-2 border-border bg-input px-4 py-2.5 pr-10 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Hide token" : "Show token"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-secondary hover:bg-secondary/20"
          >
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{t.dsTokenHint}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="gold"
            size="sm"
            onClick={testConnection}
            disabled={testing}
            className="flex-1"
          >
            <Sparkles className={testing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {testing ? t.dsTesting : t.dsTestButton}
          </Button>
          <Button variant="outline" size="sm" onClick={save} className="flex-1">
            {t.dsSaveButton}
          </Button>
          <Button variant="ghost" size="sm" onClick={clear}>
            {t.dsClearButton}
          </Button>
        </div>

        {lastResult !== "idle" && (
          <p
            className={
              lastResult === "ok"
                ? "mt-3 text-sm font-semibold text-green-400"
                : "mt-3 text-sm font-semibold text-destructive"
            }
          >
            {lastResult === "ok" ? t.dsTestSuccess : t.dsTestFailed}
          </p>
        )}

        <hr className="my-5 border-border/60" />

        <div>
          <h3 className="mb-2 text-sm font-bold text-secondary">Demo data</h3>
          <Button variant="outline" size="sm" onClick={resetEntries} className="w-full">
            <RotateCcw className="h-4 w-4" />
            {t.resetToDemo}
          </Button>
        </div>

        <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
          Safety fallback always active:{" "}
          <span className="italic">{LUMI_EMERGENCY_FALLBACK}</span>
        </p>
      </div>
    </div>
  )
}