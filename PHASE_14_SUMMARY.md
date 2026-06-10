# PHASE 14 — Iteration 14 Summary (DRAFT)

**User-reported issue (Telegram 2026-06-11, #16437):**
> 閃左一閃係左右分頁，之後變返下拉式
> (Translation: "I see a flash of left-right page layout, then it changes to dropdown style")

**Root cause:** The V11/V12 `useDesktop()` hook used a media-query
listener that could flip `isDesktop` from `true` → `false` on
mount, which swapped `<DesktopPageTurn>` for `<MobileEntryList>`
in a single re-render. The V12 `h-[min(70vh,50rem)]` book stage
fix made the flash visible because the desktop 3D is now
actually rendered at a real height before being unmounted.

**User-confirmed fix (option A):** **Force desktop 3D always.**
Remove the `useDesktop()` hook's media-query effect entirely. The
mobile vertical-list fallback is the source of the flash and is
unused by the user. Always render `<DesktopPageTurn>`.

---

## 🎯 What changed

1. **`useDesktop()` simplified to a constant `true`** — the
   `useState` + `useEffect` + `matchMedia` listener is gone. The
   function is now a one-liner that always returns `true`. The
   `<MobileEntryList>` render branch in `<PageTurn>` becomes
   unreachable in normal operation.

2. **`MD_BREAKPOINT_PX` constant removed** — it was only used by
   the media-query listener that no longer exists. (Verified via
   `Get-ChildItem ... | Select-String "MD_BREAKPOINT_PX"` — only
   the declaration site and the now-removed listener used it.)

3. **`<MobileEntryList>` and `DefaultMobileEmpty` kept in the
   file as dead-but-reachable code** — the `if (!isDesktop)`
   guard in `<PageTurn>` is preserved as a one-line future hook
   so a future mobile UX can be reintroduced by flipping
   `useDesktop` back to a media-query listener, with no
   render-tree changes required.

4. **`useEffect` import preserved** — still used by
   `DesktopPageTurn` for the `animTimer` cleanup.

5. **JSDoc + file header updated** — top-of-file comment now
   says "Iteration 14 (Issue: flash of 3D then snap to mobile)"
   and the `useDesktop` JSDoc explains the new contract.

6. **Inline comment near `if (!isDesktop)` updated** — the V11
   text said "useEffect refines the state to the actual viewport
   size" which is no longer accurate. The new comment explains
   the unreachable-but-preserved guard.

---

## 📁 Files modified

| File | Lines changed |
|------|---------------|
| `components/page-turn.tsx` | +80 / −75 (net +5) |

```
$ git diff --stat
 components/page-turn.tsx | 155 ++++++++++++++++++++++++-----------------------
 1 file changed, 80 insertions(+), 75 deletions(-)
```

### Spot-changes (page-turn.tsx)

- **Line ~3** — file header comment updated to add "Iteration 14
  (Issue: flash of 3D then snap to mobile)".
- **Line ~64-66** — `MD_BREAKPOINT_PX = 768` constant **removed**
  (was unused after the hook simplification).
- **Line ~213-249** — `useDesktop()` JSDoc rewritten; function
  body collapsed from `useState + useEffect + matchMedia +
  addEventListener` (12 lines) to `return true` (1 line).
- **Line ~715-725** — `<PageTurn>` JSDoc updated; inline comment
  near `if (!isDesktop)` updated to reflect V14 reality.

### What was NOT changed (preserved)

- `useEffect`, `useState`, `useRef` imports — all still used by
  `DesktopPageTurn` (animTimer state, current spread state,
  cleanup effect).
- `ANIM_MS = 800` constant — preserved.
- `useI18n` import — preserved.
- `MobileEntryList` and `DefaultMobileEmpty` function
  definitions — kept as dead-but-reachable code.
- All V12 / V13 work (`h-[min(70vh,50rem)]`, `buildSpreads`,
  `BLANK` sentinel, `<BlankPage>`, spread-mapping, Roman
  numerals, leather spine, parchment texture, dark mode WCAG
  AAA, Lumi reply, quill pen, handwriting fonts) — preserved.

---

## ✅ Build verification

### `npx tsc --noEmit`
**0 errors** (exit code 0). Output file is 0 bytes.

### `pnpm build`
**Exit code 0**. 5 routes. `/` route is **11.1 kB** (< 12 kB
target). First Load JS is **124 kB** (< 150 kB target).

```
Route (app)                              Size     First Load JS
┌ /                                    11.1 kB         124 kB
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
| Contains `book-page-right` with `transform: rotateY(0deg)` | **YES** ✅ |
| Contains `book-mini-spine` class | **YES** ✅ |
| Contains `h-[min(70vh,50rem)]` (V12 height fix) | **YES** ✅ |
| Contains `MobileEntryList` JSX output | **NO** ✅ (0 matches) |
| Contains `DefaultMobileEmpty` JSX output | **NO** ✅ (0 matches) |

The 3D page-turn is now in the SSR HTML at full fidelity — no
mobile-list markup, no second-pass render, no flash.

---

## 🔒 Hard constraints — ALL PRESERVED

- [x] **Lumi reply persistence** — untouched
- [x] **Dark mode ink contrast WCAG AAA** — untouched
- [x] **DeepSeek `/api/magic-reply` endpoint** — untouched
- [x] **Language toggle** — untouched
- [x] **Quill pen** — untouched
- [x] **Handwriting fonts** — untouched
- [x] **Parchment texture + leather spine** — untouched
- [x] **Lumi reply button in editor** — untouched
- [x] **Roman numerals per-page** — untouched
- [x] **V12 book stage height fix** (`h-[min(70vh,50rem)]`) —
      preserved (verified in SSR HTML)
- [x] **V13 BLANK sentinel + new buildSpreads** — preserved
- [x] **Zero new npm packages** — confirmed (`pnpm-lock.yaml`
      unchanged)

---

## 📋 User-facing summary (Telegram-ready)

✅ **修咗！** 第 14 輪 fix 出咗：而家「閃一閃左右分頁，再變下拉式」嘅 bug 已經消失。

舊邏輯（V11/V12）會喺 component mount 之後 run 一個 `matchMedia` listener，
如果 viewport 細過 768px 就會將 `isDesktop` 由 `true` 變 `false`，即刻 swap 去
`<MobileEntryList>` 嘅下拉式 list。V12 嘅 `h-[min(70vh,50rem)]` book stage
fix 令到 desktop 3D 真係 render 到實際高度，所以「閃一閃」就明顯咗俾你睇到。

新邏輯（V14）簡單直接：`useDesktop()` 永遠 return `true`，component tree
無條件 render `<DesktopPageTurn>`。無 `useEffect`、無 `matchMedia`、無
second-pass swap，SSR HTML 同 client render 完全一致。

`<MobileEntryList>` 仲喺度（保留 `!isDesktop` 一行 guard），但永遠唔會被
render — 如果將來有真正 mobile user 想用，先決定加 `hidden md:block` 嘅
CSS-only 隱藏，唔好再 swap component。

`pnpm build` ✅（11.1 kB / 124 kB First Load JS），`tsc --noEmit` ✅（0
errors），無新 npm package，所有 V4-V13 嘅 constraint（Lumi reply、dark
mode WCAG AAA、quill、書脊高、V13 BLANK sentinel、Roman numerals）全部保住。
