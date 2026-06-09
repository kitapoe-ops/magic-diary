"use client"

import { cn } from "@/lib/utils"

interface NotebookPageProps {
  children: React.ReactNode
  className?: string
  /**
   * Visual variant. Both variants share the same paper + ruled lines
   * + margin line; the paper background + ink colour are driven by
   * CSS custom properties (`--paper-bg`, `--handwriting-ink`) so
   * dark vs light mode flips automatically. `reply` uses a slightly
   * different paper tone via inline classes to make Lumi's page
   * feel distinct, while still inheriting the theme-aware ink.
   */
  variant?: "diary" | "reply"
  /**
   * Whether to render the vertical margin line + the spine shadow
   * on the left. Default `true`. Set to `false` if the page is
   * rendered edge-to-edge inside another container.
   */
  showSpine?: boolean
}

/**
 * NotebookPage
 * ------------
 * A reusable "lined paper" container. The paper color, ruled lines,
 * margin line and left-side spine shadow are all rendered with pure
 * CSS (`app/globals.css` defines `.notebook-paper`, `.notebook-spine`,
 * `.notebook-margin`) so we don't ship any image asset and so dark /
 * light mode switches are theme-pure — no JS branching needed.
 *
 *   • Paper: cream gradient in light mode (`#fdf6e3 → #f3e9c8`),
 *            deep purple gradient in dark mode (`#1e1b4b → #0b0717`)
 *   • Ruled lines: repeating-linear-gradient at line-height 2rem
 *   • Margin line: a 1px div on the left
 *   • Spine: inset box-shadow on the left edge to suggest a binding
 *
 * Children should set their own line-height to 2rem (Tailwind
 * `leading-8`) so the text baseline aligns with the ruled lines.
 */
export function NotebookPage({
  children,
  className,
  variant = "diary",
  showSpine = true,
}: NotebookPageProps) {
  return (
    <div
      className={cn(
        // Paper colour + ruled lines + spine shadow + subtle paper
        // texture. All three classes live in globals.css and are
        // driven by CSS custom properties that flip between
        // `:root` (dark) and `.day` (light).
        "notebook-paper rounded-md",
        showSpine && "notebook-spine",
        // Subtle paper texture using two radial-gradient blobs (no
        // image asset, just cheap CSS noise to add warmth in light
        // mode; in dark mode the texture falls back to a faint
        // starlit grain).
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_15%_20%,rgba(180,83,9,0.06),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(76,29,149,0.05),transparent_50%)] before:content-['']",
        className,
      )}
    >
      {/* Vertical margin line on the left (1.75rem from the left
          edge to mimic a real ruled-notebook margin). Rendered as
          an explicit element so it can be styled via the
          `--paper-margin` CSS variable and so the parent can
          position it independently of the `::before` texture
          pseudo-element. */}
      {showSpine && (
        <div
          aria-hidden="true"
          className="notebook-margin pointer-events-none absolute left-7 top-0 bottom-0 w-px"
        />
      )}

      <div
        className={cn(
          "relative z-10",
          // Padding: extra left padding when the spine/margin line is
          // visible so text never sits on top of the margin line.
          showSpine ? "pl-10 pr-4 py-3" : "px-4 py-3",
          // line-height matches the 2rem background line spacing so
          // each baseline sits exactly on a ruled line.
          "leading-8",
          // Reply variant uses a slightly tighter vertical padding
          // because the Lumi reply is usually a single paragraph.
          variant === "reply" && "py-4",
        )}
      >
        {children}
      </div>
    </div>
  )
}

export default NotebookPage
