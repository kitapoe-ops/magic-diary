"use client"

import { cn } from "@/lib/utils"

interface NotebookPageProps {
  children: React.ReactNode
  className?: string
  /**
   * Visual variant. Both variants share the cream paper + ruled lines
   * + red margin line; `reply` uses slightly tighter padding to make
   * the magic-pen writing feel like Lumi's personal note page.
   */
  variant?: "diary" | "reply"
  /**
   * Whether to render the red vertical margin line + the dark spine
   * shadow on the left. Default `true`. Set to `false` if the page
   * is rendered edge-to-edge inside another container.
   */
  showSpine?: boolean
}

/**
 * NotebookPage
 * ------------
 * A reusable "lined paper" container. The paper color, ruled lines,
 * red margin and left-side spine shadow are all rendered with pure
 * CSS (gradients + box-shadow) so we don't ship any image asset.
 *
 *   • Paper: cream gradient (light → slightly darker at edges)
 *   • Ruled lines: repeating-linear-gradient at line-height 2rem
 *   • Red margin: a 1px pseudo-element on the left
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
        "notebook-page relative overflow-hidden rounded-md",
        // Paper colour — warm cream gradient. Slightly more saturated
        // for `reply` to visually distinguish Lumi's pages.
        variant === "reply"
          ? "bg-gradient-to-br from-[#fff7d6] via-[#faecc4] to-[#f4dfa8]"
          : "bg-gradient-to-br from-[#fdf6e3] via-[#f7efd8] to-[#f3e9c8]",
        // Spine shadow on the left edge — suggests a bound book.
        showSpine &&
          "shadow-[inset_10px_0_14px_-6px_rgba(76,29,149,0.28),inset_-1px_0_0_rgba(180,83,9,0.08)]",
        // Ruled lines — repeating-linear-gradient. Light mode uses a
        // warmer sepia line; dark mode keeps the same hue at lower
        // opacity so the lines still read against a deep purple bg.
        "bg-[linear-gradient(transparent_calc(2rem_-_1px),rgba(180,83,9,0.22)_calc(2rem_-_1px),rgba(180,83,9,0.22)_2rem,transparent_2rem)]",
        "bg-[length:100%_2rem]",
        "dark:bg-[linear-gradient(transparent_calc(2rem_-_1px),rgba(250,204,21,0.14)_calc(2rem_-_1px),rgba(250,204,21,0.14)_2rem,transparent_2rem)]",
        // Subtle paper texture using two radial-gradient blobs (no
        // image asset, just cheap CSS noise to add warmth).
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_15%_20%,rgba(180,83,9,0.06),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(76,29,149,0.05),transparent_50%)] before:content-['']",
        // Red vertical margin line on the left (1.75rem from the
        // left edge to mimic a real ruled-notebook margin).
        showSpine &&
          "after:absolute after:left-7 after:top-0 after:bottom-0 after:w-px after:bg-rose-300/50 after:content-['']",
        className,
      )}
    >
      <div
        className={cn(
          "relative z-10",
          // Padding: extra left padding when the spine/margin line is
          // visible so text never sits on top of the red line.
          showSpine ? "pl-10 pr-4 py-3" : "px-4 py-3",
          // line-height matches the 2rem background line spacing so
          // each baseline sits exactly on a ruled line.
          "leading-8",
          // Reply variant uses a slightly tighter horizontal padding
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
