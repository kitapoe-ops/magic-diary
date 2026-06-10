"use client"

import { useEffect, useRef, useState } from "react"
import { X, Sparkles, Settings as SettingsIcon, PenLine } from "lucide-react"
import { MOODS, STICKERS, type DiaryEntry, type MoodKey } from "@/lib/mock-data"
import type { Dict } from "@/lib/i18n"
import type { DiaryPhoto, PhotoSlotKind } from "@/lib/photo-sizes"
import { PHOTO_SLOT_SIZES, getPhotoSlotSize } from "@/lib/photo-sizes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useChime } from "@/hooks/use-chime"
import { useI18n } from "@/hooks/use-i18n"
import { DEEPSEEK_OPEN_EVENT, DEEPSEEK_TOKEN_KEY } from "./deepseek-settings"
import { MagicPenWriting } from "./magic-pen-writing"
import { QuillPen } from "./quill-pen"
import { PhotoSlot } from "./photo-slot"
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
   * of the payload. Iteration 5 also adds the optional `photos`
   * array.
   */
  onSave: (
    entry: Omit<DiaryEntry, "id" | "dateLabel" | "category"> &
      Pick<DiaryEntry, "lumiReply" | "lumiLanguage"> & {
        photos?: DiaryPhoto[]
      },
  ) => void
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

/** The order in which photo slots are exposed in the modal. */
const PHOTO_SLOT_ORDER: PhotoSlotKind[] = [
  "wide-banner",
  "portrait-3x4",
  "landscape-4x3",
  "square-stamp",
]

/**
 * Iteration 6 (Bug 4): the four image01-generated photos that
 * pre-fill the diary. These live in `public/images/quill-slots/`
 * and are generated in parallel by Subagent A; the <PhotoSlot>
 * component gracefully falls back to the "Tap to add photo"
 * placeholder when the file is missing.
 */
const DEFAULT_PHOTOS: DiaryPhoto[] = [
  { url: "/images/quill-slots/portrait-wand.jpg", w: 300, h: 400, slot: "portrait-3x4" },
  { url: "/images/quill-slots/landscape-broom.jpg", w: 400, h: 300, slot: "landscape-4x3" },
  { url: "/images/quill-slots/square-hat.jpg", w: 200, h: 200, slot: "square-stamp" },
  { url: "/images/quill-slots/banner-owl.jpg", w: 600, h: 200, slot: "wide-banner" },
]

/**
 * Tiny wrapper that defers rendering the <QuillPen> until the
 * textarea ref has actually been populated. We can't just write
 * `bodyRef.current && <QuillPen />` in JSX because refs aren't
 * populated during the same render pass; the wrapper uses a
 * one-shot state flag to force a re-render after mount.
 */
function QuillPenBody({
  hostRef,
}: {
  hostRef: React.MutableRefObject<HTMLTextAreaElement | null>
}) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (hostRef.current) setReady(true)
  }, [hostRef])
  if (!ready) return null
  return <QuillPen textareaRef={hostRef as React.RefObject<HTMLTextAreaElement>} />
}

export function EntryModal({ open, onClose, onSave, initial }: EntryModalProps) {
  const { t, locale, setLocale } = useI18n()
  const chime = useChime()

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [mood, setMood] = useState<MoodKey>("happy")
  const [selectedStickers, setSelectedStickers] = useState<string[]>([])
  const [photos, setPhotos] = useState<DiaryPhoto[]>([])

  const [casting, setCasting] = useState(false)
  const [lumiLoading, setLumiLoading] = useState(false)
  const [lumiReply, setLumiReply] = useState<string | null>(null)
  const [lumiError, setLumiError] = useState<string | null>(null)
  const [aiLang, setAiLang] = useState<"en" | "zh">(locale === "zh" ? "zh" : "en")

  // Bump to replay the Lumi reply typewriter animation.
  const [lumiReplayKey, setLumiReplayKey] = useState(0)

  // Ref for the QuillPen to follow the body textarea.
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  // Refs for each photo slot's hidden file input.
  const fileInputRefs = useRef<Record<PhotoSlotKind, HTMLInputElement | null>>({
    "portrait-3x4": null,
    "landscape-4x3": null,
    "square-stamp": null,
    "wide-banner": null,
  })

  useEffect(() => {
    setAiLang(locale === "zh" ? "zh" : "en")
  }, [locale])

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "")
      setBody(initial?.body ?? "")
      setMood(initial?.mood ?? "happy")
      setSelectedStickers(initial?.stickers ?? [])
      // Iteration 6 (Bug 4): when the user opens "New Entry"
      // (no `initial` passed), pre-fill the four photo slots
      // with the image01-generated placeholders so the editor
      // shows real images on first open. If the user is editing
      // an existing entry, we use that entry's `photos` array
      // (which may already have user-attached images or the
      // pre-filled placeholders from the demo data).
      if (initial?.photos && initial.photos.length > 0) {
        setPhotos(initial.photos)
      } else if (!initial) {
        setPhotos(DEFAULT_PHOTOS)
      } else {
        setPhotos([])
      }
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
      // Edit-mode: if the user did not summon Lumi again this session,
      // keep whatever Lumi reply was already on the entry (initial).
      // New-mode: persist whatever the user just summoned (or null).
      const replyToSave = lumiReply ?? initial?.lumiReply ?? null
      const langToSave = replyToSave
        ? (lumiReply ? aiLang : initial?.lumiLanguage ?? null)
        : null
      onSave({
        title: title.trim(),
        body: body.trim(),
        mood,
        stickers: selectedStickers.length ? selectedStickers : ["✨"],
        lumiReply: replyToSave,
        lumiLanguage: langToSave,
        photos: photos.length > 0 ? photos : [],
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
      setLumiReplayKey((k) => k + 1)
      chime(1180)
    } catch (err) {
      setLumiError(err instanceof Error ? err.message : t.modalAiError)
    } finally {
      setLumiLoading(false)
    }
  }

  function pickPhotoFile(kind: PhotoSlotKind) {
    fileInputRefs.current[kind]?.click()
  }

  function onPhotoSelected(kind: PhotoSlotKind, file: File) {
    const url = URL.createObjectURL(file)
    const size = getPhotoSlotSize(kind)
    const next: DiaryPhoto = { url, w: size.w, h: size.h, slot: kind }
    setPhotos((prev) => {
      // If a photo is already in this slot, replace it.
      const filtered = prev.filter((p) => p.slot !== kind)
      return [...filtered, next]
    })
  }

  function removePhoto(kind: PhotoSlotKind) {
    setPhotos((prev) => prev.filter((p) => p.slot !== kind))
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              className="font-cinzel text-xs font-bold uppercase tracking-widest text-leather-deep dark:text-gold"
              htmlFor="title"
            >
              {t.modalLabelTitle}
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.modalPlaceholderTitle}
              className="rounded-2xl border-2 border-leather/30 bg-leather/5 px-4 py-2.5 font-crimson text-leather-deep placeholder:italic placeholder:text-leather/40 focus:border-gold focus:outline-none dark:border-gold/40 dark:bg-leather-night/20 dark:text-ink-light dark:placeholder:text-gold/40"
              autoFocus
            />
          </div>

          {/* body — QuillPen annotation overlay. The wrapper is
              relative so the pen + canvas can layer on top of the
              textarea. The textarea itself is the QuillPen's
              anchor. */}
          <div className="flex flex-col gap-1.5">
            <label
              className="font-cinzel text-xs font-bold uppercase tracking-widest text-leather-deep dark:text-gold"
              htmlFor="body"
            >
              {t.modalLabelBody}
            </label>
            <div className="relative">
              <textarea
                ref={bodyRef}
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder={t.modalPlaceholderBody}
                className="block w-full resize-none rounded-2xl border-2 border-leather/30 bg-leather/5 px-4 py-2.5 font-crimson leading-relaxed text-leather-deep placeholder:italic placeholder:text-leather/40 focus:border-gold focus:outline-none dark:border-gold/40 dark:bg-leather-night/20 dark:text-ink-light dark:placeholder:text-gold/40"
              />
              <QuillPenBody hostRef={bodyRef} />
            </div>
          </div>

          {/* mood selector */}
          <div className="flex flex-col gap-2">
            <span className="font-cinzel text-xs font-bold uppercase tracking-widest text-leather-deep dark:text-gold">
              {t.modalLabelMood}
            </span>
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
                      ? "border-gold bg-gold/20"
                      : "border-leather/20 hover:bg-leather/10 dark:border-gold/20 dark:hover:bg-gold/10",
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
            <span className="font-cinzel text-xs font-bold uppercase tracking-widest text-leather-deep dark:text-gold">
              {t.modalLabelStickers}{" "}
              <span className="font-crimson text-xs italic text-leather/60 dark:text-gold/60">
                {t.modalStickersHint}
              </span>
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
                      ? "bg-gold/30 ring-2 ring-gold scale-110"
                      : "bg-leather/10 dark:bg-gold/10",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* photo slots — one per preset, click to attach. We
              keep all four slots visible so the user understands
              the size options; an attached photo replaces the
              placeholder for that slot. */}
          <div className="flex flex-col gap-2">
            <span className="font-cinzel text-xs font-bold uppercase tracking-widest text-leather-deep dark:text-gold">
              Photos
            </span>
            <div className="flex flex-wrap items-end gap-3">
              {PHOTO_SLOT_ORDER.map((kind) => {
                const attached = photos.find((p) => p.slot === kind)
                return (
                  <div key={kind} className="flex flex-col items-center gap-1">
                    {attached ? (
                      <div className="relative">
                        <PhotoSlot kind={kind} url={attached.url} />
                        <button
                          type="button"
                          onClick={() => removePhoto(kind)}
                          className="absolute -right-2 -top-2 rounded-full border border-destructive/50 bg-destructive/20 p-1 text-destructive hover:bg-destructive/40"
                          aria-label="Remove photo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <PhotoSlot kind={kind} onClick={() => pickPhotoFile(kind)} />
                    )}
                    <input
                      ref={(el) => {
                        fileInputRefs.current[kind] = el
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onPhotoSelected(kind, file)
                        // reset value so picking the same file again
                        // still triggers onChange
                        e.target.value = ""
                      }}
                    />
                    <span className="font-cinzel text-[9px] font-bold uppercase tracking-widest text-leather/60 dark:text-gold/60">
                      {PHOTO_SLOT_SIZES[kind].label}
                    </span>
                  </div>
                )
              })}
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

          {/* Casting "書寫中" overlay — a magic pen wipes across the
              entry title while sparkles spin at both ends. */}
          {casting && (
            <div
              className="relative mt-2 overflow-hidden rounded-2xl border-2 border-gold/40 bg-gold/5 px-4 py-3 dark:border-gold/60 dark:bg-purple-500/10"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2">
                <span className="casting-sparkle text-lg" aria-hidden="true">🪄</span>
                <span className="handwriting flex-1 truncate text-sm text-leather-deep dark:text-ink-light">
                  {title.trim() || t.modalPlaceholderTitle}
                </span>
                <span className="casting-sparkle text-lg" aria-hidden="true">✨</span>
              </div>
              <span
                className="pen-wipe"
                style={{ filter: "drop-shadow(0 0 6px hsla(43,96%,56%,0.7))" }}
                aria-hidden="true"
              >
                <PenLine className="h-5 w-5 -translate-y-1 text-gold" />
              </span>
            </div>
          )}
        </form>

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
