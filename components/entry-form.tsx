"use client"

/**
 * EntryForm
 * ---------
 * Shared form fields used by BOTH the <EntryModal> (pop-up from
 * the header "+" button) and the in-page <EditorPage> rendered
 * by <PageTurn> on the last empty spread.
 *
 * Iteration 8 (Bug 1): photos are no longer part of the diary
 * model. The form exposes only the core writing fields:
 *   • title (text input)
 *   • body (textarea with QuillPen annotation)
 *   • mood (5-button picker)
 *   • stickers (8×2 grid, max 5)
 *   • submit (Save)
 *
 * The Lumi reply section is intentionally kept inside
 * <EntryModal> — summoning Lumi is a modal-only affordance
 * (needs more vertical space, the casting overlay, and the
 * tokenizer animation).
 *
 * Mobile fallback: the form is fully responsive; the page-turn
 * version stacks vertically (just like the modal does).
 */

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Sparkles, PenLine } from "lucide-react"
import {
  MOODS,
  STICKERS,
  type DiaryEntry,
  type MoodKey,
} from "@/lib/mock-data"
import type { Dict } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useChime } from "@/hooks/use-chime"
import { useI18n } from "@/hooks/use-i18n"
import { QuillPen } from "./quill-pen"

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

/**
 * Shape of the form payload. The parent (modal OR EditorPage)
 * supplies its own save handler; the form only emits the data
 * the parent already knows how to persist.
 *
 * The `initial` prop is optional — when undefined, the form
 * renders a "new entry" empty state. When provided, the form
 * hydrates from the entry's fields (used by the modal for
 * "edit existing" mode).
 */
export interface EntryFormValues {
  title: string
  body: string
  mood: MoodKey
  stickers: string[]
}

/**
 * Imperative handle exposed via `ref`. Lets a parent (e.g. the
 * modal's "Summon Lumi" button) read the current form values
 * WITHOUT having to lift state up to the modal — the form
 * keeps its own state and just publishes it on demand.
 */
export interface EntryFormHandle {
  getValues: () => { title: string; body: string }
}

export interface EntryFormProps {
  /** Optional initial values; when omitted, the form starts empty. */
  initial?: Pick<DiaryEntry, "title" | "body" | "mood" | "stickers">
  /**
   * Called on submit. The parent is responsible for the actual
   * persistence (the modal wires this to its `onSave`; the
   * in-page editor wires this to <PageTurn>'s `onSave`).
   */
  onSubmit: (values: EntryFormValues) => void
  /**
   * Optional override for the submit button label. Default is
   * `t.modalCast` ("Save Spell" / "儲存魔法").
   */
  submitLabel?: string
  /**
   * Variant tweak. `page` is used by the in-page <EditorPage>
   * (denser layout, smaller padding, fits inside a parchment
   * book page). `modal` is the default — used by <EntryModal>.
   */
  variant?: "modal" | "page"
  /** Optional className for the wrapping <form>. */
  className?: string
}

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

export const EntryForm = forwardRef<EntryFormHandle, EntryFormProps>(function EntryForm(
  {
    initial,
    onSubmit,
    submitLabel,
    variant = "modal",
    className,
  },
  ref,
) {
  const { t } = useI18n()
  const chime = useChime()

  const [title, setTitle] = useState(initial?.title ?? "")
  const [body, setBody] = useState(initial?.body ?? "")
  const [mood, setMood] = useState<MoodKey>(initial?.mood ?? "happy")
  const [selectedStickers, setSelectedStickers] = useState<string[]>(
    initial?.stickers ?? [],
  )

  const [casting, setCasting] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)

  // Publish the current form values via the imperative handle
  // so the modal's "Summon Lumi" button can read them without
  // the form having to lift state up.
  useImperativeHandle(
    ref,
    () => ({
      getValues: () => ({ title, body }),
    }),
    [title, body],
  )

  function toggleSticker(s: string) {
    setSelectedStickers((prev) =>
      prev.includes(s)
        ? prev.filter((x) => x !== s)
        : prev.length < 5
          ? [...prev, s]
          : prev,
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setCasting(true)
    chime(990)
    window.setTimeout(() => {
      onSubmit({
        title: title.trim(),
        body: body.trim(),
        mood,
        stickers: selectedStickers.length ? selectedStickers : ["✨"],
      })
    }, 700)
  }

  const isPage = variant === "page"

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col gap-4",
        isPage && "gap-3",
        className,
      )}
    >
      {/* title */}
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

      {/* body — QuillPen annotation overlay */}
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
            rows={isPage ? 4 : 5}
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

      <Button
        type="submit"
        variant="gold"
        size="lg"
        disabled={casting}
        className={cn("mt-2 w-full text-base", casting && "animate-pulse")}
      >
        <Sparkles className={cn("h-5 w-5", casting && "animate-spin")} />
        {casting ? t.modalCasting : (submitLabel ?? t.modalCast)}
        <Sparkles className={cn("h-5 w-5", casting && "animate-spin")} />
      </Button>

      {/* Casting "書寫中" overlay */}
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
  )
})

export default EntryForm
