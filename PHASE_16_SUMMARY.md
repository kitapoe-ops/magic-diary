# PHASE 16 — Iteration 16 Summary (DRAFT)

**User-reported issue (Telegram 2026-06-11, #16450):**
> 又到返舊日記重疊
> (Translation: "The old diary overlap is back")

**Context:** V15 fixed the click-zone `pointer-events` bug that
made the textarea untypable. With that fixed, the user could
actually type into the editor — but the **visual overlap between
the current spread and the future (not-yet-revealed) spread was
still there**. V15's subagent identified hypothesis A (click-zone)
as the root cause of the typing bug, but the visual overlap has a
**different, deeper root cause** that V15 did not touch.

---

## 🎯 Root cause

**Confirmed by SSR HTML inspection of production
`https://magic-diary-alpha.vercel.app/?v=15`.**

The two `.book-spread-flipper` elements rendered in the DOM:

```
book-spread-flipper #1:  z-index:3; pointer-events:auto; visibility:visible   ← current spread (Entry 1+2)
book-spread-flipper #2:  z-index:0; pointer-events:none; visibility:visible   ← future spread (Entry 3 + Editor)
```

**Both spreads have `visibility: visible`.** The current spread
sits at z-index 3 on top; the future spread sits at z-index 0
underneath — but it's still fully rendered. With both fully
visible, the user sees the editor page of spread 2 sitting
behind the right page of spread 1, producing the "old diary
overlapping the new editor" perception.

### Source

In `components/page-turn.tsx` `DesktopPageTurn`, the spread
visibility rule was:

```tsx
visibility:
  isPast || isBeingHidden ? "hidden" : "visible",
```

This makes any non-past, non-being-hidden spread `visible`. But
the **future spread** (not yet revealed) is not past and is not
being hidden — so it was rendered as `visibility: visible` from
the very first frame. Two `visibility: visible` spreads at the
same time = visual overlap.

### Why V15 didn't fix it

V15's subagent correctly diagnosed hypothesis A (click-zone
pointer-events) as the cause of the textarea being untypable.
That fix made the form actually focusable + typeable. But V15's
hypotheses B/C ruled out the visual overlap as a separate
cause — the visual overlap WAS a separate cause that V15 didn't
touch. The V15 subagent's diagnostic was scoped to the typing
bug, not the rendering bug. Hence "the old diary overlap is
back" — because it never actually left; V15 only fixed one of
the two overlapping symptoms.

---

## 🧱 Fix

**File:** `components/page-turn.tsx`

Replaced the visibility rule inside `DesktopPageTurn`'s spread
mapping. The new rule makes only the spread the user is
currently looking at (or the one mid-flip) visible — every other
spread is `visibility: hidden`.

### Before (V15 — overlap bug)

```tsx
visibility:
  isPast || isBeingHidden ? "hidden" : "visible",
```

### After (V16 — fixed)

```tsx
// Iteration 16 (Issue: future spread overlapping the
// current spread). Previously the visibility was
// `isPast || isBeingHidden ? "hidden" : "visible"`,
// which meant every non-past spread (including the
// FUTURE spread waiting to be revealed) was rendered
// with `visibility: visible`. Two fully-rendered
// spreads at the same time → visual overlap on the
// editor page.
//
// Fix: only the CURRENT spread, the spread being
// REVEALED (forward flip mid-animation) and the
// spread being HIDDEN (backward flip mid-animation)
// are visible. Past spreads + future spreads that
// are not yet in the middle of being flipped to are
// `visibility: hidden`. This keeps the visual
// surface to exactly one fully-rendered spread at a
// time, eliminating the overlap.
visibility:
  isCurrent || isBeingRevealed || isBeingHidden
    ? "visible"
    : "hidden",
```

### Why the 3-condition OR is correct

| Spread state | `isCurrent` | `isBeingRevealed` | `isBeingHidden` | New visibility |
|---|---|---|---|---|
| Current (user reading it) | ✅ | — | — | **visible** ✅ |
| Past (already flipped away) | ❌ | — | — | hidden ✅ |
| Future, not yet touched | ❌ | ❌ | — | hidden ✅ |
| Future, mid forward-flip animation | ❌ | ✅ | — | **visible** ✅ |
| Currently-current, mid backward-flip (the page being flipped away from) | ❌ | — | ✅ | **visible** ✅ |

- `isCurrent`: the spread the user is reading — must be visible.
- `isBeingRevealed`: the spread being flipped TO during a forward
  flip (`animating === "forward" && spreadIdx === safeSpread + 1`)
  — must be visible so the user sees the new spread arriving.
- `isBeingHidden`: the spread that was just flipped away during a
  backward flip (`animating === "backward" && spreadIdx === safeSpread - 1`)
  — must be visible so the user sees the page being flipped away.

All other spreads (past + future-not-yet-flipped-to) are hidden.

### What was NOT changed

- `aria-hidden={!isCurrent}` — already correct (only current spread
  is exposed to screen readers). Kept as-is.
- z-index logic — already correct (current=3, future-being-revealed=1,
  past=0, future-not-yet=0). Kept as-is. Now that future spreads are
  `visibility: hidden`, the z-index for future spreads is irrelevant
  for the overlap symptom, but it's still semantically correct and
  left intact for the in-progress reveal animation.
- `pointerEvents: isCurrent ? "auto" : "none"` — already correct
  (V15 fix). Kept as-is.
- `isBeingHidden` semantics — kept identical. The variable still
  represents "the spread that was just flipped away from during a
  backward flip"; the visibility rule just now correctly keeps it
  visible during that mid-animation phase.

---

## ✅ Hard constraints preserved (Iteration 4-15 work intact)

| Constraint | Status |
|---|---|
| 1. Lumi reply persistence | ✅ untouched |
| 2. Dark mode ink contrast WCAG AAA | ✅ untouched |
| 3. DeepSeek `/api/magic-reply` endpoint | ✅ untouched |
| 4. Language toggle | ✅ untouched |
| 5. Quill pen (no comb look) | ✅ untouched |
| 6. Handwriting fonts | ✅ untouched |
| 7. Parchment texture + leather spine | ✅ untouched |
| 8. Lumi reply button in editor | ✅ untouched |
| 9. Roman numerals per-page | ✅ untouched |
| 10. V12 book stage height fix (`h-[min(70vh,50rem)]`) | ✅ untouched |
| 11. V13 BLANK sentinel + new buildSpreads | ✅ untouched |
| 12. V14 force desktop 3D | ✅ untouched |
| 13. V15 click-zone pointer-events | ✅ untouched (still `pointer-events-none` default) |
| 14. Zero new npm packages | ✅ no `package.json` change |

---

## 📁 Files modified

| File | Δ lines | Description |
|---|---|---|
| `components/page-turn.tsx` | +25 / −4 | File-header comment block extended with Iteration 16 section; one expression inside the spread `<div style={...}>` replaced (visibility expression + JSDoc-style inline comment). No other code touched. |

(The net diff is +25 / −4: 22 lines added for the V16 documentation
block in the file header + 3 lines added for the inline comment +
1 expression change. Total file size: 32,162 → ~32,200 bytes.)

---

## 🧪 Build targets

| Target | Required | Actual |
|---|---|---|
| `pnpm build` exit code | 0 | **0** ✅ |
| Number of routes | 5 | **5** ✅ |
| `/` route size | < 12 kB | **11.2 kB** ✅ |
| First Load JS (`/`) | < 150 kB | **124 kB** ✅ |
| `npx tsc --noEmit` exit code | 0 | **0** ✅ |

Build output (truncated):

```
Route (app)                              Size     First Load JS
┌ /                                    11.2 kB         124 kB
┌ /_not-found                          871 B          88.1 kB
┌ /achievements                        7.91 kB         121 kB
┌ /api/magic-reply                     0 B                0 B
+ First Load JS shared by all            87.2 kB
```

---

## 🎯 Self-verification (after main agent commits + Vercel deploys)

The production HTML for `https://magic-diary-alpha.vercel.app/?v=16`
should now have **only ONE** `.book-spread-flipper` with
`visibility: visible` — the current spread. The other spread(s)
should have `visibility: hidden` in their inline `style` attribute
(unless one of them is currently mid-animation, in which case that
one will also be `visible`).

Previously (V15):

```
book-spread-flipper #1:  z-index:3; pointer-events:auto; visibility:visible   ← current
book-spread-flipper #2:  z-index:0; pointer-events:none; visibility:visible   ← FUTURE (BUG: should be hidden)
```

After V16 fix:

```
book-spread-flipper #1:  z-index:3; pointer-events:auto; visibility:visible   ← current
book-spread-flipper #2:  z-index:0; pointer-events:none; visibility:hidden    ← FUTURE (correctly hidden)
```

The user's eye will only ever see the contents of spread #1 (current).
Spread #2 only becomes visible during the brief 800 ms reveal
animation when the user clicks Next, which is when the flip should
be visible.

---

## 📝 Hand-off fields

### 1. Files modified (with line deltas)

- `components/page-turn.tsx`: +25 / −4 (file-header V16 documentation
  block + one inline visibility expression + 3-line inline comment)

### 2. Build output (`pnpm build`)

- Exit code: **0**
- 5 routes (`/`, `/_not-found`, `/achievements`, `/api/magic-reply`)
- `/` route size: **11.2 kB** (< 12 kB target)
- First Load JS: **124 kB** (< 150 kB target)

### 3. TypeScript check output (`npx tsc --noEmit`)

- Exit code: **0**

### 4. One-paragraph user-facing summary

V16 fixes the visual overlap between the current diary spread and
the future (not-yet-revealed) editor spread. The cause was in
`components/page-turn.tsx`: the spread `visibility` rule was
`isPast || isBeingHidden ? "hidden" : "visible"`, which rendered
every non-past spread as `visibility: visible` — so two fully
rendered spreads existed at once, producing the "old diary sitting
behind the editor" effect. The fix changes the rule to
`isCurrent || isBeingRevealed || isBeingHidden ? "visible" : "hidden"`,
so only the spread the user is reading, the one mid-forward-flip
into view, or the one mid-backward-flip out of view is rendered
visible. Past spreads and future spreads waiting their turn are
now hidden, so only one spread occupies the visual surface at any
moment. The click-zone fix from V15 (textarea now typeable) is
preserved, along with all earlier iteration work (Lumi replies,
dark-mode contrast, parchment texture, BLANK sentinel, etc.).
Build passes (5 routes, 11.2 kB / 124 kB First Load) and
`tsc --noEmit` is clean.