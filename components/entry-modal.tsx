"use client"

import { useEffect, useState } from "react"
import { X, Sparkles, Settings as SettingsIcon } from "lucide-react"
import { MOODS, STICKERS, type DiaryEntry, type MoodKey } from "@/lib/mock-data"
import type { Dict } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useChime } from "@/hooks/use-chime"
import { useI18n } from "@/hooks/use-i18n"
import { DEEPSEEK_OPEN_EVENT, DEEPSEEK_TOKEN_KEY } from "./deepseek-settings"

interface EntryModalProps {
  open: boolean
  onClose: () => void
  onSave: (entry: Omit<DiaryEntry, "id" | "dateLabel" | "category">) => void
  initial?: DiaryEntry | null
}

// Narrow the dictionary to string-valued keys only so we can safely index
// `t[moodLabelKey]` and pass the result to aria-label.
type StringKey<T> = {
  [K in keyof T]: T[K] extends string ? K : never
}[keyof T]
type StringDictKey = StringKey<Dict>

const MOOD_LABEL_KEY: Record<MoodKey, StringDictKey> = {
  sad: "moodLabelSad",
  meh: "moodLabelMeh",
  happy: "moodLabelHappy",
  excited: "moodLabelExcited",
  loved: "moodLabelLoved",
}

export function EntryModal({ open, onClose, onSave, initial }: EntryModalProps) {
  const { t, locale, setLocale } = useI18n()
  const chime = useChime()

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [mood, setMood] = useState<MoodKey>("happy")
  const [selectedStickers, setSelectedStickers] = useState<string[]>([])

  const [casting, setCasting] = useState(false)
  const [lumiLoading, setLumiLoading] = useState(false)
  const [lumiReply, setLumiReply] = useState<string | null>(null)
  const [lumiError, setLumiError] = useState<string | null>(null)
  const [aiLang, setAiLang] = useState<"en" | "zh">(locale === "zh" ? "zh" : "en")

  useEffect(() => {
    setAiLang(locale === "zh" ? "zh" : "en")
  }, [locale])

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "")
      setBody(initial?.body ?? "")
      setMood(initial?.mood ?? "happy")
      setSelectedStickers(initial?.stickers ?? [])
      setCasting(false)
      setLumiReply(null)
      setLumiError(null)
    }
  }, [open, initial])

  if (!open) return null

  function toggleSticker(s: string) {
    setSelectedStickers((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.length < 5 ? [...prev, s] : prev,
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setCasting(true)
    chime(990)
    window.setTimeout(() => {
      onSave({
        title: title.trim(),
        body: body.trim(),
        mood,
        stickers: selectedStickers.length ? selectedStickers : ["✨"],
      })
      onClose()
    }, 700)
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
      chime(1180)
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
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />

      <div className="glass-card relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 animate-bounce-in">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="gradient-title text-xl font-bold">
            <span className="emoji">🪄</span> {initial ? t.modalEditTitle : t.modalNewTitle}
          </h2>
          <button
            onClick={onClose}
            aria-label={t.dsClose}
            className="rounded-full bg-secondary/20 p-2 text-secondary hover:bg-secondary/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-secondary" htmlFor="title">
              {t.modalLabelTitle}
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.modalPlaceholderTitle}
              className="rounded-2xl border-2 border-border bg-input px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-secondary" htmlFor="body">
              {t.modalLabelBody}
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder={t.modalPlaceholderBody}
              className="resize-none rounded-2xl border-2 border-border bg-input px-4 py-2.5 leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
            />
          </div>

          {/* mood selector */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-secondary">{t.modalLabelMood}</span>
            <div className="flex items-center justify-between gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    chime(720)
                    setMood(m.key)
                  }}
                  aria-label={t[MOOD_LABEL_KEY[m.key]]}
                  aria-pressed={mood === m.key}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-2xl border-2 p-2 transition-all",
                    mood === m.key
                      ? "border-gold bg-gold/10 gold-glow"
                      : "border-transparent hover:bg-accent/20",
                  )}
                >
                  <span
                    className={cn(
                      "text-2xl transition-transform",
                      mood === m.key && "scale-150",
                    )}
                  >
                    {m.emoji}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* sticker picker */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-secondary">
              {t.modalLabelStickers} <span className="text-xs text-muted-foreground">{t.modalStickersHint}</span>
            </span>
            <div className="grid grid-cols-8 gap-1.5">
              {STICKERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSticker(s)}
                  aria-pressed={selectedStickers.includes(s)}
                  className={cn(
                    "aspect-square rounded-xl text-xl transition-all hover:scale-110",
                    selectedStickers.includes(s)
                      ? "bg-accent/40 gold-glow scale-110"
                      : "bg-secondary/10",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="gold"
            size="lg"
            disabled={casting}
            className={cn("mt-2 w-full text-base", casting && "animate-pulse")}
          >
            <Sparkles className={cn("h-5 w-5", casting && "animate-spin")} />
            {casting ? t.modalCasting : t.modalCast}
            <Sparkles className={cn("h-5 w-5", casting && "animate-spin")} />
          </Button>
        </form>

        {/* Lumi divider */}
        <div className="my-5 flex items-center gap-2">
          <hr className="flex-1 border-border/60" />
          <span className="text-xs font-semibold text-gold">Princess Lumi</span>
          <hr className="flex-1 border-border/60" />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-secondary">
              {t.modalAiLanguage}:{" "}
              <span className="text-secondary/70">{t.modalAiLanguageHint}</span>
            </span>
            <div className="inline-flex overflow-hidden rounded-full border-2 border-gold/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAiLang("zh")}
                className={cn(
                  "px-3 py-1 transition-all",
                  aiLang === "zh" ? "gold-gradient text-gold-foreground" : "text-gold hover:bg-gold/10",
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
                  aiLang === "en" ? "gold-gradient text-gold-foreground" : "text-gold hover:bg-gold/10",
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
            className="w-full border-accent text-secondary hover:bg-accent/20"
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
            <div className="rounded-2xl border-2 border-gold/40 bg-gold/10 p-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gold">
                {t.modalLumiSays}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-secondary">
                {lumiReply}
              </p>
              <button
                type="button"
                onClick={() => setLocale(aiLang)}
                className="mt-2 text-[11px] font-semibold text-gold underline"
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