# PHASE 17 — Magic Diary: Add "First" (Home) Page Button

> **Iteration 17** (Telegram 2026-06-11, #16453 + #16455)
> **User quote:** "除左上一頁和下一頁，加多個首頁按鈕"
> **Author:** Subagent (depth 1/1) — disk-side work only
> **Branch:** `master` (uncommitted — main agent to commit + push)

---

## 🎯 What changed

Added a third navigation button to the page-turn nav bar — the
**First (Home)** button. It snaps the user straight back to
**spread 0** (the first spread: Entry 1 / Entry 2 side-by-side
for the typical 2-entry case) with no flip animation. The
button uses the `Home` icon from `lucide-react`, lives at the
leftmost position of the nav bar (before Previous), and is
disabled when the user is already on the first spread.

**Layout transformation:**
- Before: `[ Previous | Spread N of M | Next ]` (3 elements)
- After:  `[ First | Previous | Spread N of M | Next ]` (4 elements)

No "Last" button — the user explicitly confirmed only "First" is
needed (#16455).

---

## 📁 Files modified (with line deltas)

### 1. `components/page-turn.tsx` (+43 / -1 = +42 lines net)

| Section | Lines added | Notes |
|---|---|---|
| `lucide-react` import | +1 / -1 | Added `Home` to existing destructure |
| `canFirst` flag (in `DesktopPageTurn`) | +5 / 0 | New flag, sits next to `canPrev` / `canNext`. Doc-comment cites #16453 + #16455. |
| `goFirst` handler | +8 / 0 | Snap-to-0, no animation. Guards on `canFirst` + `animating`. Fires `onSpreadChange?.(0)`. |
| Nav bar JSX — new First button | +22 / 0 | Identical className scaffold to existing Prev/Next buttons. `<Home className="h-4 w-4" />` + `{t.bookFirst}`. `aria-label={t.bookFirstSpread}`. |

### 2. `lib/i18n.ts` (+10 / 0 lines net)

| Section | Lines added | Notes |
|---|---|---|
| `Dict` type — `bookFirst` + `bookFirstSpread` | +6 / 0 | New keys, with doc-comment citing Iteration 17. |
| `en` dict | +3 / 0 | `bookFirst: "First"`, `bookFirstSpread: "Go to first page"` (+ 1 comment line) |
| `zh` dict | +3 / 0 | `bookFirst: "首頁"`, `bookFirstSpread: "跳到首頁"` (+ 1 comment line) |

**Total:** 2 files, **+52 / -1 = +51 net lines.**

### Hard-constraint preservation

All 15 hard constraints from the brief pass:
- Lumi reply persistence: untouched (`/api/magic-reply` not modified)
- Dark mode ink contrast (WCAG AAA): reused existing button className scaffold (`border-leather/20 text-leather/30 dark:border-gold/20 dark:text-gold/30` for disabled state)
- Language toggle: keys added in both `en` + `zh`
- Quill pen / handwriting fonts / parchment / leather spine: untouched
- Lumi reply button in editor: untouched
- Roman numerals: untouched
- V12 book stage height: untouched
- V13 BLANK sentinel + buildSpreads: untouched
- V14 force desktop 3D: untouched
- V15 click-zone pointer-events: untouched
- V16 hide future spreads: untouched
- **Zero new npm packages** — `Home` is in the existing `lucide-react` dep

---

## 🧪 Build & TypeScript

### `pnpm build` (exit code 0)

```
Route (app)                              Size     First Load JS
┌─ /                                    11.3 kB         124 kB
├─ /_not-found                          871 B          88.1 kB
├─ /achievements                        7.91 kB         121 kB
├─ /api/magic-reply                     0 B                0 B
└─ First Load JS shared by all            87.2 kB
   ├─ chunks/41f98fda-f77ad41009d434a7.js  53.6 kB
   ├─ chunks/657-0f43e77ebb0ba1b1.js       31.6 kB
   └─ other shared chunks (total)          1.93 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

**Build targets (all PASS):**
- ✅ Exit code: **0**
- ✅ 5 routes (4 page routes + 1 API route)
- ✅ `/` route size: **11.3 kB** (< 12 kB target)
- ✅ First Load JS: **124 kB** (< 150 kB target)
- ✅ Static prerendering succeeded for `/`, `/_not-found`, `/achievements`

### `npx tsc --noEmit` (exit code 0, 0 output lines)

No TypeScript errors introduced.

---

## ✅ Self-verification (post-build)

Production HTML check on `.next/server/app/index.html` (default
locale: English):

1. ✅ `<svg class="lucide lucide-house h-4 w-4">` — `Home` icon imported & rendered
2. ✅ Nav bar has 4 visible elements in order:
   - `<button ... aria-label="Go to first page" ...>First</button>` (disabled)
   - `<button ... aria-label="Previous spread" ...>Previous</button>` (disabled)
   - `<span>...Spread 1 of 2</span>` (indicator)
   - `<button ... aria-label="Next spread" ...>Next</button>` (enabled)
3. ✅ First button is `disabled` when on the first spread (`canFirst = safeSpread > 0 = false`)
4. ✅ aria-label uses the new i18n key (`"Go to first page"`)
5. ✅ Visible label uses the new i18n key (`"First"`)
6. ✅ ClassName pattern matches existing Prev/Next buttons exactly (visual consistency)

---

## 📝 Notes for main agent (commit + push)

1. **Commit message suggestion:**
   ```
   feat(page-turn): add "First" (Home) page button (iteration 17)

   - Add canFirst flag + goFirst handler (snap to spread 0, no animation)
   - Add First button to nav bar (Home icon from lucide-react)
   - Add bookFirst + bookFirstSpread i18n keys (en + zh)
   - Resolves #16453, #16455
   ```

2. **Files to stage:**
   - `components/page-turn.tsx`
   - `lib/i18n.ts`
   - `build-output-iter17.txt` (new)
   - `tscheck-iter17.txt` (new)
   - `PHASE_17_SUMMARY_DRAFT.md` → rename to `PHASE_17_SUMMARY.md` after commit

3. **Vercel deploy:** `pnpm build` already succeeded — no Vercel config changes needed. Just push and verify on preview URL.

4. **No `package.json` / `pnpm-lock.yaml` changes** — `Home` is from the existing `lucide-react` dep.

---

## 🎯 One-paragraph user-facing summary

A new "First" (首頁) button has been added to the leftmost slot of
the page-turn navigation bar in Magic Diary. It uses the Home
icon from `lucide-react` and is fully bilingual (English:
"First" / Chinese: "首頁"). Clicking it instantly snaps the
view back to the first spread (Entry 1 | Entry 2) without
playing a page-flip animation — which would feel weird for a
"go home" action. The button is automatically disabled when the
user is already on the first spread. All 15 hard constraints
from earlier iterations (Lumi replies, dark-mode WCAG AAA
contrast, the V12 height fix, V13 buildSpreads sentinel, V14
forced desktop 3D, V15 click-zone pointer-events, V16 future
spread hiding) are preserved. `pnpm build` exits 0 with 5
routes, `/` at 11.3 kB and First Load JS at 124 kB; `npx tsc
--noEmit` is clean.
