# Iteration 7 — Background Photos + Real Book Page-Turn (FINAL)

**Phase:** PHASE_7
**Date:** 2026-06-10
**Branch:** `master`
**Finalized by:** Main agent (subagent C completed in 10m45s within cap — first time!)
**Vercel:** Will auto-deploy on `git push` to `master`

---

## 1. User-Reported Issues (Telegram 2026-06-10, ~20:43)

| # | Issue | Resolution |
|---|-------|-----------|
| 1 | "原來排版嘅圖片太過突兀，應該設為背景圖片較好" (inline photos are too jarring) | ✅ Photos now subtle `background-image` watermarks with parchment overlay (75% opacity default) |
| 2 | "翻頁效果參考 https://ithelp.ithome.com.tw/m/articles/1027971" (real book page-turn) | ✅ Real book: 2-page mini-spread, right page rotates 180° from `transform-origin: left center` (the spine) |

**User approved defaults:**
- Photo variant: **1A subtle (watermark-style)**
- Click zones: right half = next, left half = previous
- Photo-to-entry mapping: deterministic (Entry 1 → wand, 2 → broom, 3 → hat)

---

## 2. Implementation Detail

### 2.1 Background Image System (Fix 1)

**File:** `components/photo-slot.tsx` (rewrite)
- Renders as `<div>` with `background-image: url(...)` + `background-size: cover` + `background-position: center`
- **Blend mode:** `mix-blend-mode: multiply` (light) / `normal` (dark)
- **Overlay layer:** absolute-positioned `<div>` with parchment `rgba(244, 233, 200, 0.75)` (default `subtle` variant) or leather-night `rgba(26, 15, 10, 0.75)` in dark mode
- **W×H label** preserved in top-left corner (gold text on dark bg)
- **Error fallback:** hidden 1×1 `<img onError>` preloads to detect 404 early

**File:** `app/globals.css` (modified)
- Added `.dark .photo-slot` override for leather-night overlay
- Photo slots respect both day/night mode automatically

**Photo-to-Entry mapping** (`lib/mock-data.ts`):
- `getPhotoForEntry(entryId)` → returns `/images/quill-slots/{name}.jpg`
- Entry 1 (fractions) → `portrait-wand.jpg`
- Entry 2 (bracelet) → `landscape-broom.jpg`
- Entry 3 (spelling) → `square-hat.jpg`
- Fallback → `banner-owl.jpg`

### 2.2 Real Book Page-Turn (Fix 2)

**File:** `components/page-turn.tsx` (rewrite)

**Architecture:**
- All spreads (groups of 2 entries) live in a flat stack with `position: absolute`
- Container: `perspective: 1200px`
- Each page: `transform-style: preserve-3d` + `backface-visibility: hidden`
- Active spread visible; future spreads wait underneath; past spreads flipped to back

**Flip physics:**
- `transform-origin: left center` (the spine)
- Right page animates `rotateY(0deg) → rotateY(-180deg)` over **0.8s** (slightly slower than Iter 6's 0.7s for book-feel)
- Click right half → forward; click left half → backward
- Z-index layering: current=3, next-being-revealed=1, past/future=0

**Animation guard:**
- `animating: 'forward' | 'backward' | null` state machine
- `setTimeout(800ms)` blocks re-clicks mid-flip
- Prevents state desync if user spams buttons

**Roman numerals:** Re-derived per spread via `toRoman(spreadIdx * 2 + 1/2)` — stable when entries are added/removed

**Mobile fallback:** `< md` viewport → flat list (no 3D flip, snappy touch)

**Book spread structure:** Each "spread" is a 2-page mini-book:
- Left page = `spread[0]` (the "left page" of the spread)
- Right page = `spread[1]` (the "right page" of the spread)
- If `spread[1]` is undefined, show "— blank —" placeholder

**Spine effect:** Center column boundary has a thin dark vertical line + soft shadow (CSS in globals.css)

### 2.3 What was NOT changed (preserved)

- Lumi reply persistence (Iteration 4)
- Quill pen (Iteration 6 fix)
- Handwriting fonts (Caveat / ZCOOL XiaoWei)
- Dark mode ink contrast (WCAG AAA)
- DeepSeek `/api/magic-reply` endpoint
- Language toggle
- Roman numeral stability
- Photo W×H labels (still shown in top-left of slot)
- Zero new npm packages

---

## 3. Files Modified

| File | Lines (now) | Δ | What |
|------|------------:|--:|------|
| `app/globals.css` | ~26 KB | +109 / −59 | Photo-slot overlay CSS, book-mini-spine, .book-page-right 3D helpers; dropped legacy .page-turn-leaf CSS |
| `components/photo-slot.tsx` | ~7.5 KB | +138 / −56 | Background-image rendering, 3 variants (subtle/medium/strong), onRemove, hidden img onError preload |
| `components/page-turn.tsx` | ~17.8 KB | +314 / −170 | 2-page mini-spread, transform-origin: left center, mid-animation guard, 800ms |
| `components/diary-card.tsx` | ~6.4 KB | +11 / −6 | variant="subtle" on each PhotoSlot |
| `components/entry-modal.tsx` | ~22.2 KB | +6 / −11 | variant="medium" + onRemove; dropped manual ✕ wrapper |
| `components/diary-feed.tsx` | ~10.5 KB | +17 / −21 | New PageTurn API: currentSpread / onSpreadChange |
| `lib/mock-data.ts` | ~6 KB | +38 / 0 | getPhotoForEntry + photo mapping table |
| `lib/photo-sizes.ts` | ~2.6 KB | +9 / 0 | Re-export PhotoSlotVariant type |

**Total: 8 files modified, +642 / -323 lines. No new files. No new dependencies.**

---

## 4. Build Output

```
✓ pnpm build — exit 0
✓ npx tsc --noEmit — exit 0
✓ 5 routes (4 static + 1 dynamic)
✓ `/` route 12 kB (cap: 15 kB, +0.5 kB vs Iter 6)
✓ First Load JS 125 kB (cap: 150 kB, same as Iter 6)

Route (app)                              Size     First Load JS
┌ ○ /                                    12 kB           125 kB
├ ○ /_not-found                          871 B          88.1 kB
├ ○ /achievements                        7.34 kB         121 kB
└ ƒ /api/magic-reply                     0 B                0 B  (Dynamic)
+ First Load JS shared by all            87.2 kB
```

**Subagent's 8 key decisions:**
1. **Right page is the flipper, left page stays put** — BookSpread's left is FIXED editor (hard constraint #9)
2. **Mid-animation re-click guard** — `animating` state + 800ms `setTimeout` blocks re-clicks
3. **`visibility: hidden` on past spreads** — DOM stays mounted, no remount cost
4. **Photo preload via hidden `<img onError>`** — detects 404s early
5. **`mix-blend-mode: multiply` (light) / `normal` (dark)** — natural fade on parchment, no pitch-black on dark
6. **Roman numerals re-derived per spread** — `toRoman(spreadIdx * 2 + 1/2)`, stable when entries change
7. **0.8s flip duration** (was 0.7s in Iter 6) — reads as "page turn" not "card flip"
8. **Default variant = "subtle"** — user OK'd the watermark look

---

## 5. Hard-Constraint Checklist

| # | Constraint | Status |
|---|-----------|--------|
| 1 | Lumi reply persistence | ✅ Preserved |
| 2 | Dark mode ink contrast WCAG AAA | ✅ Preserved |
| 3 | DeepSeek `/api/magic-reply` unchanged | ✅ Not touched |
| 4 | Language toggle preserved | ✅ Not touched |
| 5 | Photo slot W×H labels | ✅ Still shown in top-left |
| 6 | All 4 photos in `public/images/quill-slots/` | ✅ Referenced via background-image |
| 7 | Quill pen (no comb look) | ✅ Not touched |
| 8 | Handwriting fonts | ✅ Not touched |
| 9 | BookSpread left page = "I. New Entry" fixed | ✅ Left page never rotates |
| 10 | Roman numerals | ✅ Re-derived per spread |
| 11 | Zero new npm packages | ✅ Confirmed (no package.json changes) |
| 12 | Mobile responsive | ✅ `< md` → vertical scroll fallback |
| 13 | Vercel build < 150 kB | ✅ 125 kB First Load |
| 14 | Page-turn is real book (not side-by-side) | ✅ 2-page mini-spread, right page rotates from spine |
| 15 | Photos as background (not inline) | ✅ background-image + multiply blend |

---

## 6. M2 Hand-off Audit (Subagent Postmortem)

- **Subagent runtime:** **10m45s** ← FIRST subagent to finish within cap (no timeout!)
- **Code work completed:** 100% (8 modified, +642 / -323, on disk)
- **Build verified:** YES (`pnpm build` exit 0, saved to `build-output-iter7.txt`)
- **TS check verified:** YES (`npx tsc --noEmit` exit 0)
- **Summary draft written:** YES (PHASE_7_SUMMARY_DRAFT.md)
- **Main agent finalization completed:** summary written, ready for commit
- **Cumulative subagent record (2026-06-05 → 2026-06-10):** 20/20 within cap or recoverable, 0 disk work lost

**M2 template works:** Subagent did 100% of risky code work + verification. Main agent does safe finalization (rename DRAFT, commit message, push). This iteration the subagent even wrote the DRAFT before stopping — next iteration the subagent can write the FINAL directly.

---

## 7. One-Paragraph Summary (User-Facing)

**Iteration 7 is complete.** Photos in diary cards and the entry-modal are no longer inline `<img>` stickers — they're now subtle `background-image` watermarks with a parchment overlay on top (75% opacity by default), so the photo looks like a faint memory embedded in the page rather than something slapped on it. Day mode uses cream parchment as the overlay; night mode uses `leather-night` for the same ghosted effect. The W×H label is preserved in the top-left corner. The page-turn is now a real book: the right pane is a 2-page mini-book (left page = "spread[0]", right page = "spread[1]"), and clicking the right half rotates the right page 180° from `transform-origin: left center` (the spine) to reveal the next spread underneath; clicking the left half flips backward. Pure CSS `rotateY` + transition (no framer-motion), 800ms, with a mid-animation re-click guard. Mobile falls back to vertical scroll. `pnpm build` exits 0 with 5 routes and **125 kB First Load JS** (same as Iter 6, +0.5 kB on `/`). Awaiting `git push` to trigger Vercel auto-deploy.
