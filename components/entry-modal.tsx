"use client"

import { useEffect, useRef, useState } from "react"
import { X, Sparkles, Settings as SettingsIcon } from "lucide-react"
import { type DiaryEntry } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"
import { DEEPSEEK_OPEN_EVENT, DEEPSEEK_TOKEN_KEY } from "./deepseek-settings"
import { MagicPenWriting } from "./magic-pen-writing"
import { EntryForm, type EntryFormValues } from "./entry-form"
import { PageCorner } from "./page-corner"

interface EntryModalProps {
  open: boolean
  onClose: () => void
  /**
   * Save handler. The payload includes the optional Lumi reply
   * fields (`lumiReply`, `lumiLanguage`) so the parent's persisted
   * entry (localStorage) keeps Lumi's response across reloads. We
   * `Pick<DiaryEntry, "lumiReply" | "lumiLanguage">` to widen the
   * base `Omit<...>` type without losing type-safety on the rest
   * of the payload. Iteration 8: photos removed from the model.
   */
  onSave: (
    entry: Omit<DiaryEntry, "id" | "dateLabel" | "category"> &
      Pick<DiaryEntry, "lumiReply" | "lumiLanguage">,
  ) => void
  initial?: DiaryEntry | null
}

/**
 * EntryModal
 * ----------
 * Pop-up modal for the header "+" button. Iteration 8: the form
 * fields (mood, title, body, stickers, save) are delegated to
 * <EntryForm>; this component is just the modal chrome (overlay,
 * scroll container, page corners, header) + the Lumi reply
 * section, which is a modal-only affordance (the in-page editor
 * on the last spread doesn't summon Lumi).
 */
export function EntryModal({ open, onClose, onSave, initial }: EntryModalProps) {
  const { t, locale, setLocale } = useI18n()

  // Lumi state lives here in the modal (not in <EntryForm>)
  // because the Lumi section is part of the modal chrome.
  const [lumiLoading, setLumiLoading] = useState(false)
  const [lumiReply, setLumiReply] = useState<string | null>(null)
  const [lumiError, setLumiError] = useState<string | null>(null)
  const [aiLang, setAiLang] = useState<"en" | "zh">(locale === "zh" ? "zh" : "en")

  // Bump to replay the Lumi reply typewriter animation.
  const [lumiReplayKey, setLumiReplayKey] = useState(0)

  // Ref into the inner form so the "Summon Lumi" button (which
  // lives outside the form) can read the current title / body
  // without us having to lift state to the modal.
  const formRef = useRef<{ getValues: () => { title: string; body: string } } | null>(
    null,
  )

  useEffect(() => {
    setAiLang(locale === "zh" ? "zh" : "en")
  }, [locale])

  useEffect(() => {
    if (open) {
      setLumiReply(null)
      setLumiError(null)
    }
  }, [open])

  if (!open) return null

  function handleFormSubmit(values: EntryFormValues) {
    // Edit-mode: if the user did not summon Lumi again this
    // session, keep whatever Lumi reply was already on the
    // entry (initial). New-mode: persist whatever the user
    // just summoned (or null).
    const replyToSave = lumiReply ?? initial?.lumiReply ?? null
    const langToSave = replyToSave
      ? lumiReply
        ? aiLang
        : initial?.lumiLanguage ?? null
      : null
    onSave({
      title: values.title,
      body: values.body,
      mood: values.mood,
      stickers: values.stickers,
      lumiReply: replyToSave,
      lumiLanguage: langToSave,
    })
    onClose()
  }

  async function summonLumi() {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem(DEEPSEEK_TOKEN_KEY)?.trim()
        : null
    if (!token) {
      setLumiError(t.modalNoToken)
      return
    }
    const { title, body } = formRef.current?.getValues() ?? { title: "", body: "" }
    const diaryContent = [
      title.trim() && `Title: ${title.trim()}`,
      body.trim() && `Story: ${body.trim()}`,
    ]
      .filter(Boolean)
      .join("\n")
    if (!diaryContent) {
      setLumiError(t.modalPlaceholderTitle)
      return
    }

    setLumiLoading(true)
    setLumiError(null)
    setLumiReply(null)
    try {
      const res = await fetch("/api/magic-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-deepseek-token": token,
        },
        body: JSON.stringify({
          diaryContent,
          language: aiLang,
        }),
      })
      const data = (await res.json()) as { reply?: string; error?: string }
      if (!res.ok || !data.reply) {
        setLumiError(data.error ?? t.modalAiError)
        return
      }
      setLumiReply(data.reply)
      setLumiReplayKey((k) => k + 1)
    } catch (err) {
      setLumiError(err instanceof Error ? err.message : t.modalAiError)
    } finally {
      setLumiLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? t.modalEditTitle : t.modalNewTitle}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="notebook-paper relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-2 border-leather/60 p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] dark:border-gold/50">
        <PageCorner position="top-right" tone="leather" />
        <PageCorner position="bottom-left" tone="leather" />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-cinzel text-2xl font-bold tracking-widest text-leather-deep dark:text-gold">
            <span className="mr-1">🪄</span>
            {initial ? t.modalEditTitle : t.modalNewTitle}
          </h2>
          <button
            onClick={onClose}
            aria-label={t.dsClose}
            className="rounded-full border border-leather/40 bg-leather/10 p-2 text-leather hover:bg-leather/20 dark:border-gold/40 dark:bg-gold/10 dark:text-gold dark:hover:bg-gold/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <EntryForm
          initial={initial ?? undefined}
          onSubmit={handleFormSubmit}
          ref={formRef}
        />

        {/* Lumi divider */}
        <div className="my-5 flex items-center gap-2">
          <hr className="flex-1 border-leather/30 dark:border-gold/30" />
          <span className="font-cinzel text-xs font-bold uppercase tracking-widest text-gold">
            Princess Lumi
          </span>
          <hr className="flex-1 border-leather/30 dark:border-gold/30" />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-cinzel text-[10px] font-bold uppercase tracking-widest text-leather-deep dark:text-gold">
              {t.modalAiLanguage}:{" "}
              <span className="font-crimson text-xs italic font-normal text-leather/70 dark:text-gold/70">
                {t.modalAiLanguageHint}
              </span>
            </span>
            <div className="inline-flex overflow-hidden rounded-full border-2 border-gold/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAiLang("zh")}
                className={cn(
                  "px-3 py-1 transition-all",
                  aiLang === "zh" ? "bg-gold text-leather-night" : "text-gold hover:bg-gold/10",
                )}
                aria-pressed={aiLang === "zh"}
              >
                中
              </button>
              <button
                type="button"
                onClick={() => setAiLang("en")}
                className={cn(
                  "px-3 py-1 transition-all",
                  aiLang === "en" ? "bg-gold text-leather-night" : "text-gold hover:bg-gold/10",
                )}
                aria-pressed={aiLang === "en"}
              >
                EN
              </button>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={lumiLoading}
            onClick={summonLumi}
            className="w-full border-gold/60 text-gold hover:bg-gold/10"
          >
            <Sparkles className={cn("h-5 w-5", lumiLoading && "animate-spin")} />
            {lumiLoading ? t.modalSummoningLumi : t.modalSummonLumi}
          </Button>

          {lumiError && (
            <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <p>{lumiError}</p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent(DEEPSEEK_OPEN_EVENT))}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold underline"
              >
                <SettingsIcon className="h-3 w-3" /> {t.modalOpenAiSettings}
              </button>
            </div>
          )}

          {lumiReply && (
            <div className="rounded-2xl border-2 border-gold/40 bg-gold/10 p-4 dark:border-gold/60 dark:bg-purple-500/10">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-cinzel text-[10px] font-bold uppercase tracking-widest text-gold">
                  {t.modalLumiSays}
                </p>
                <button
                  type="button"
                  onClick={() => setLumiReplayKey((k) => k + 1)}
                  aria-label={aiLang === "zh" ? "重新觀看" : "Replay"}
                  className="rounded-full border border-gold/50 px-2 py-0.5 text-[11px] font-semibold text-gold transition-colors hover:bg-gold/20"
                >
                  🔄 {aiLang === "zh" ? "重新觀看" : "Replay"}
                </button>
              </div>
              <MagicPenWriting
                text={lumiReply}
                replayKey={lumiReplayKey}
                speed={45}
                notebook={true}
                onComplete={() => {
                  // The chime fires when summonLumi receives the reply;
                  // this hook is here for future hooks.
                }}
              />
              <button
                type="button"
                onClick={() => setLocale(aiLang)}
                className="mt-3 text-[11px] font-semibold text-gold underline"
              >
                {aiLang === "zh" ? "切換介面到中文" : "Switch UI to Chinese"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
