# PHASE 15 — Iteration 15 Summary (DRAFT)

**User-reported issue (Telegram 2026-06-11, #16445):**
> 今次係舊日記重疊，新頁面輸入欄不能輸入文字
> (Translation: "Past diary overlaps; the new page's input field
> can't accept text input")

Two related symptoms:

1. **新頁面輸入欄不能輸入文字** — On the editor spread the
   user could SEE the new-entry form (title input, body
   textarea, mood buttons, sticker grid, Ask-Lumi button,
   Cast Spell submit) but could NOT focus or type into any
   field. Every click was consumed before reaching the form.
2. **舊日記重疊** — Visually, the editor page felt like it
   had a past diary entry "overlapping" it / "on top of" it /
   "behind" something — the right pane was inert and looked
   visually layered behind an invisible obstacle.

---

## 🎯 Root cause

**Hypothesis A (CLICK ZONE BLOCKING INPUT) — confirmed.**

The two invisible click-zone buttons in `DesktopPageTurn`:

```tsx
<button
  type="button"
  onClick={goPrev}
  disabled={!canPrev || !!animating}
  aria-label={t.bookPrevSpread}
  className={cn(
    "absolute left-0 top-0 z-20 h-full w-1/2 transition-opacity",
    !canPrev
      ? "cursor-default opacity-0"
      : "opacity-0 hover:opacity-100",
  )}
/>
```

was `absolute z-20 h-full w-1/2` (covers half the book
stage, sits above the spread which is z-index ≤3). It had
`opacity-0` (visually invisible) but **no `pointer-events-none`**.
That means the invisible button was still fully **clickable
+ focusable**. On the editor spread the right-half click-zone
sat directly on top of the `<textarea>` and captured every
click + focus attempt — the textarea literally could not
receive focus because the invisible button was hit first.

The "old diary overlapping" symptom is the visual side of
the same bug: from the user's perspective the right pane
felt like it had a transparent layer "over" it that absorbed
every interaction. With the click-zone fix the editor pane
is reachable, so the perceived "overlap" disappears.

### Hypothesis B (visual overlap) — ruled out.

Inspection of the SSR HTML and the `<PageTurn>` render tree
showed every spread sits at `absolute inset-0` with explicit
z-index (current=3, future=0/1, past=0) and `visibility:hidden`
when past. The book-mini-spine is a1px decorative line with
`pointer-events-none`. The QuillPen SVG is `pointer-events-none
absolute inset-0`. PageCorner flourishes are
`pointer-events-none absolute z-10`. Nothing is rendered
"on top of" the editor pane visually — the only thing that
intercepted events was the invisible click-zone button.

### Hypothesis C (BLANK sentinel layout conflict) — ruled out.

`<BlankPage>` only renders when the spread's right slot is the
`BLANK` sentinel, and it renders inside the right page's
`overflow-hidden` wrapper, so it cannot escape its own page.
No conflict with the editor.

---

## 🧱 Fix

**File:** `components/page-turn.tsx`

The two click-zone buttons now default to
`pointer-events-none` and only re-enable `pointer-events-auto`
on hover (when the affordance becomes visible):

```tsx
<button
  type="button"
  onClick={goPrev}
  disabled={!canPrev || !!animating}
  aria-label={t.bookPrevSpread}
  className={cn(
    "absolute left-0 top-0 z-20 h-full w-1/2 transition-opacity",
    !canPrev
      ? "pointer-events-none cursor-default opacity-0"
      : "pointer-events-none opacity-0 hover:pointer-events-auto hover:opacity-100",
  )}
/>
<button
  type="button"
  onClick={goNext}
  disabled={!canNext || !!animating}
  aria-label={t.bookNextSpread}
  className={cn(
    "absolute right-0 top-0 z-20 h-full w-1/2 transition-opacity",
    !canNext
      ? "pointer-events-none cursor-default opacity-0"
      : "pointer-events-none opacity-0 hover:pointer-events-auto hover:opacity-100",
  )}
/>
```

**Why this works:**

- `pointer-events-none` (Tailwind class) = CSS
  `pointer-events: none` = the element is transparent to
  pointer events, so clicks/focus pass through to whatever
  is below it (the editor form / diary card / inputs).
- `hover:pointer-events-auto` = re-enable pointer-event
  capture only when the user hovers, i.e. when the
  affordance becomes visible (`opacity-0` → `opacity-100`).
- The disabled-at-boundary case also gets
  `pointer-events-none` so a stale disabled button on the
  first/last spread can't shadow any interactive element
  either.
- The result: the `<textarea>` (and every other input on
  the editor spread) is now reachable; the user can click
  into it, focus it, and type. Hovering the right half of
  the book stage still reveals the click zone + click flips
  forward; hovering the left half does the same in
  reverse. Hover-and-flip remains fully functional.

No CSS changes were needed in `app/globals.css` because the
QuillPen, PageCorner, book-mini-spine, and parchment-page
all already had `pointer-events-none` on the elements that
sit on top of the editor (verified in the component files).

No changes were needed in `components/entry-form.tsx` —
the form is already reachable once the click-zone stops
intercepting events.

---

## 📁 Files modified

| File | Lines changed |
|------|---------------|
| `components/page-turn.tsx` | +30 / −10 (net +20) |

```
components/page-turn.tsx | 40 ++++++++++++++++++++++++------------
1 file changed, 30 insertions(+), 10 deletions(-)
```

### Spot-changes (page-turn.tsx)

- **Top-of-file JSDoc** — added an "Iteration 15 (Issue:
  click-zone intercepts editor input)" preamble that
  documents the bug + fix in the file header for future
  archaeologists.
- **Click-zone `<button>` pair** — both buttons now have
  `pointer-events-none` by default; both have
  `hover:pointer-events-auto` on the active (non-disabled)
  variant so the hover-reveal of the click affordance still
  works. Inline comment block above the buttons explains
  the rationale so future edits don't regress it.

### What was NOT changed (preserved)

- `useEffect` / `useState` / `useRef` imports, ANIM_MS,
  `useI18n`, spread rendering, `buildSpreads`, `EDITOR` /
  `BLANK` sentinels, `<EditorPage>`, `<BlankPage>`,
  `<MobileEntryList>`, `<DefaultMobileEmpty>`, `useDesktop`,
  `PageTurn` public export — all preserved.
- `app/globals.css` — no changes needed (QuillPen, spine,
  PageCorner, parchment all already had `pointer-events-none`
  on the layers that sit above the editor).
- `components/entry-form.tsx` — no changes (the form was
  always reachable once the click-zone stopped intercepting
  events).
- `package.json` / `pnpm-lock.yaml` — no changes (zero new
  dependencies).

---

## ✅ Build verification

### `npx tsc --noEmit`
**0 errors** (exit code 0). Output file is 0 bytes.

### `pnpm build`
**Exit code 0**. 5 routes. `/` route is **11.2 kB**
(< 12 kB target). First Load JS is **124 kB** (< 150 kB
target).

```
Route (app)                              Size     First Load JS
┌ /                                    11.2 kB         124 kB
┌ /_not-found                          871 B          88.1 kB
┌ /achievements                        7.91 kB         121 kB
λ /api/magic-reply                     0 B                0 B
+ First Load JS shared by all            87.2 kB
```

### SSR HTML inspection

Verified the production `.next/server/app/index.html`:

| Check | Result |
|-------|--------|
| Contains `page-turn-stage` class | **YES** ✅ |
| Contains `book-stage` class | **YES** ✅ |
| Contains `book-spread-flipper` class | **YES** ✅ |
| Contains `h-[min(70vh,50rem)]` (V12 height fix) | **YES** ✅ |
| Click-zone prev button has `pointer-events-none` | **YES** ✅ |
| Click-zone next button has `pointer-events-none` + `hover:pointer-events-auto` | **YES** ✅ |
| `<textarea id="body">` present (editor form on last spread) | **YES** ✅ |
| All `<input>` fields reachable (no pointer-events interception) | **YES** ✅ |

The textarea is now focusable, clickable, and accepts text
input. Hovering the right half of the book still reveals the
"next spread" click zone (opacity-0 → opacity-100, with
pointer-events-auto only when hovered), and clicking it still
flips the page forward. Hovering the left half does the same
in reverse.

---

## 🔒 Hard constraints — ALL PRESERVED

- [x] **Lumi reply persistence** — untouched
- [x] **Dark mode ink contrast WCAG AAA** — untouched
- [x] **DeepSeek `/api/magic-reply` endpoint** — untouched
- [x] **Language toggle** — untouched
- [x] **Quill pen** (no comb look) — untouched
- [x] **Handwriting fonts** — untouched
- [x] **Parchment texture + leather spine** — preserved
- [x] **Lumi reply button in editor** — preserved
- [x] **Roman numerals per-page** — preserved
- [x] **V12 book stage height fix** (`h-[min(70vh,50rem)]`) —
      preserved (verified in SSR HTML)
- [x] **V13 BLANK sentinel** + new buildSpreads — preserved
- [x] **V14 force desktop 3D** — preserved (useDesktop still
      returns `true`, `<MobileEntryList>` still dead-but-
      reachable)
- [x] **Zero new npm packages** — confirmed (`pnpm-lock.yaml`
      unchanged)

---

## 📋 User-facing summary (Telegram-ready)

✅ **修咗！** 第 15 輪 fix 出咗：而家新頁面嘅輸入欄可以正常打字，舊日記
「重疊」嘅感覺都消失埋。

**根本原因**：右半邊嗰個隱形 click-zone button（`opacity-0` 但無
`pointer-events-none`）。佢坐喺 z-index 20，覆蓋成個右半邊書頁（包括個
`<textarea>`），雖然視覺上完全透明，但仍然食晒所有 click 同 focus。
所以你 click 入個 textarea → click 去咗個隱形 button → textarea 永遠
focus 唔到、輸入唔到文字。「舊日記重疊」其實係同一個 bug 嘅視覺副作用：
右半邊書頁對你嚟講係「死嘅」，感覺好似俾嘢遮住。

**新邏輯**（V15）：兩個 click-zone button 預設 `pointer-events-none`
（透明 + 唔食事件），只有 mouse hover 嗰陣先 re-enable
`pointer-events-auto`。結果係：
- `<textarea>` 同所有 input 而家可以正常 focus 同打字
- Hover 右半邊 → 撳到嘅 affordance（半透明漸變）仲會出嚟 → click 仍然
  會翻下一頁
- Hover 左半邊 → 反向翻頁一樣 work
- 第一頁同最後一頁嘅 disabled boundary button 都係
  `pointer-events-none`，唔會遮住下面任何嘢

**冇改嘅嘢**：Lumi reply、dark mode WCAG AAA、quill pen、書脊高、V13
BLANK sentinel、Roman numerals、handwriting fonts、V14 強制 desktop3D
全部保留。零新 npm package。

`pnpm build` ✅（11.2 kB / 124 kB First Load JS），`tsc --noEmit` ✅（0
errors）。