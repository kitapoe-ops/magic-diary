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
 *   • "Ask Lumi" button + inline Lumi reply card (Iteration 9)
 *   • submit (Save)
 *
 * Iteration 9: the "Ask Lumi" button now lives in the form
 * itself (not just the modal) so the in-page editor on the
 * last page-turn spread can summon Lumi while writing. The
 * reply is rendered as a gold-bordered card below the
 * button; it persists with the entry when the form is
 * submitted (the form forwards `lumiReply` + `lumiLanguage`
 * to its `onSubmit` payload).
 *
 * The <EntryModal> still has its own richer Lumi section
 * (language toggle, typewriter animation, replay button)
 * because the modal has the screen real-estate for it. The
 * form's Lumi affordance is intentionally minimal: one
 * button + one card, with the default UI language.
 *
 * Mobile fallback: the form is fully responsive; the page-turn
 * version stacks vertically (just like the modal does).
 */

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Sparkles, PenLine, Loader2 } from "lucide-react"
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
import { useToast } from "./toast-provider"
import { DEEPSEEK_TOKEN_KEY } from "./deepseek-settings"
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
 *
 * Iteration 9: add optional Lumi reply fields. The in-page
 * editor can summon Lumi (via the "Ask Lumi" button) while
 * the user is writing, and the reply is persisted with the
 * entry when the form is submitted. `null` means "no reply
 * was summoned this session".
 */
export interface EntryFormValues {
  title: string
  body: string
  mood: MoodKey
  stickers: string[]
  /**
   * Iteration 9: Lumi reply that was summoned via the
   * "Ask Lumi" button. `null` when the user did not summon
   * Lumi. Forwarded to the parent's onSave handler so the
   * reply is persisted on the entry.
   */
  lumiReply?: string | null
  /**
   * The language Lumi's reply was written in (`"en"` or
   * `"zh"`). `null` when `lumiReply` is also `null`.
   */
  lumiLanguage?: "en" | "zh" | null
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
  initial?: Pick<DiaryEntry, "title" | "body" | "mood" | "stickers"> &
    Pick<DiaryEntry, "lumiReply" | "lumiLanguage">
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
  const { t, locale } = useI18n()
  const chime = useChime()
  const { showToast } = useToast()

  const [title, setTitle] = useState(initial?.title ?? "")
  const [body, setBody] = useState(initial?.body ?? "")
  const [mood, setMood] = useState<MoodKey>(initial?.mood ?? "happy")
  const [selectedStickers, setSelectedStickers] = useState<string[]>(
    initial?.stickers ?? [],
  )

  const [casting, setCasting] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)

  // Iteration 9: Lumi reply (Ask Lumi) state. Lives in the
  // form so the user can summon Lumi while writing. The reply
  // is persisted via the form's onSubmit payload.
  const [lumiReply, setLumiReply] = useState<{
    text: string
    language: "en" | "zh"
  } | null>(null)
  const [lumiLoading, setLumiLoading] = useState(false)

  // Hydrate the Lumi reply from `initial` (edit-mode) so an
  // existing entry's persisted reply shows up.
  useEffect(() => {
    if (initial?.lumiReply) {
      setLumiReply({
        text: initial.lumiReply,
        language: initial.lumiLanguage ?? (locale === "zh" ? "zh" : "en"),
      })
    }
  }, [initial?.lumiReply, initial?.lumiLanguage, locale])

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
        // Iteration 9: forward Lumi reply fields so the
        // parent's persisted entry keeps the reply.
        lumiReply: lumiReply?.text ?? null,
        lumiLanguage: lumiReply?.language ?? null,
      })
    }, 700)
  }

  /**
   * Ask Lumi — Iteration 9 (Issue 3).
   *
   * Posts the current body (and title, if any) to
   * `/api/magic-reply` and stores the response in component
   * state. The reply is rendered inline as a gold-bordered
   * card so the user can read it before saving the entry.
   * When the form is submitted, the reply + its language
   * are passed to the parent's onSave handler so the
   * reply persists alongside the entry.
   *
   * The endpoint contract is `{ diaryContent, language }`;
   * the diary content combines title + body so Lumi has
   * the full context (matching what the modal does in
   * <EntryModal>).
   */
  async function handleAskLumi() {
    const diaryContent = [
      title.trim() && `Title: ${title.trim()}`,
      body.trim() && `Story: ${body.trim()}`,
    ]
      .filter(Boolean)
      .join("\n")
    if (!diaryContent) {
      showToast(t.modalPlaceholderTitle ?? "✍️ Write something first ✨")
      return
    }
    // DeepSeek token — same source as the modal uses. If it's
    // missing, we surface a hint to open Settings.
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem(DEEPSEEK_TOKEN_KEY)?.trim()
        : null
    if (!token) {
      showToast(t.modalNoToken ?? "Add your DeepSeek token in ⚙ Settings first!")
      return
    }
    setLumiLoading(true)
    try {
      const language: "en" | "zh" = locale === "zh" ? "zh" : "en"
      const res = await fetch("/api/magic-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-deepseek-token": token,
        },
        body: JSON.stringify({ diaryContent, language }),
      })
      const data = (await res.json()) as {
        reply?: string
        error?: string
      }
      if (!res.ok || !data.reply) {
        showToast(
          data.error ?? t.modalAiError ?? "Lumi couldn't reply right now 💜",
        )
        return
      }
      setLumiReply({ text: data.reply, language })
      chime(1200)
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.modalAiError ?? "Lumi is sleeping 😴",
      )
    } finally {
      setLumiLoading(false)
    }
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

      {/* Iteration 9: Ask Lumi button + reply card.
          Sits between the stickers and the submit button, so
          the user can summon Lumi while writing and read the
          reply inline. Disabled when there's no body / when
          Lumi is already loading. The reply is persisted
          alongside the entry on submit (see handleSubmit). */}
      <div className="flex flex-col items-start gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleAskLumi}
          disabled={lumiLoading || (!title.trim() && !body.trim())}
          className="w-full border-gold/60 font-caveat text-base text-gold hover:bg-gold/10"
        >
          {lumiLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.modalSummoningLumi}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {t.askLumiCta}
            </>
          )}
        </Button>

        {lumiReply && (
          <div
            className="w-full rounded-2xl border-2 border-gold/60 bg-parchment/50 p-3 dark:border-gold/80 dark:bg-leather-night/30"
            role="note"
            aria-label={t.lumiSays}
          >
            <p className="mb-1 font-cinzel text-[10px] font-bold uppercase tracking-widest text-gold">
              {t.lumiSays}
            </p>
            <p className="handwriting text-sm leading-relaxed text-leather-deep dark:text-ink-light">
              {lumiReply.text}
            </p>
          </div>
        )}
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
