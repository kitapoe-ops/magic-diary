# PHASE 11 — Remove V10 Stamps + Fix Desktop Page-Turn

**Status:** ✅ Complete (build green, tsc 0 errors, awaiting main-agent commit)
**Branch:** `master`
**Subagent:** MiniMax M3 (M2 hand-off standard)
**Date:** 2026-06-10 ~23:10 GMT+8
**Iteration:** 11 of 11

---

## 🎯 What changed (TL;DR)

Two unrelated user-reported issues, fixed in one pass:

| # | Issue | Fix |
|---|-------|-----|
| **1** | "岩岩加既圖片取消佢" — V10 stamps added in PHASE 10 must be removed | Full V10 reversion (same pattern as V8 photo removal) |
| **2** | "翻頁功能唔見有" — desktop page-turn not visible | `useDesktop` hook now defaults to `true` (optimistic desktop), so the SSR HTML contains the 3D markup |

---

## 📁 Files Modified / Deleted

### Deleted (4 paths)
| Path | What it was | Lines |
|------|-------------|-------|
| `components/diary-stamp.tsx` | Reusable stamp component (4 corner + inline) | -127 |
| `public/images/diary-stamps/` (entire dir) | 10 image01 jpg stamps + manifest.json | -10 jpg + manifest |
| `scripts/gen-stamps.ps1` | PowerShell generator (image01 via gen_image.py) | -45 |
| `scripts/resize-stamps.py` | Pillow post-processing (1024² → 256² @ JPEG Q85) | -60 |

### Modified (7 paths)
| Path | Δ Lines | What changed |
|------|---------|--------------|
| `lib/mock-data.ts` | +0 / -23 | Removed `stamp?: { src; alt; emoji }` field from `DiaryEntry`; removed 3 demo-entry stamp assignments (broom / potion / scroll) |
| `components/diary-card.tsx` | +0 / -39 | Removed `import { DiaryStamp } from "./diary-stamp"`; removed 4 corner `<DiaryStamp>` blocks (sorting-hat / wand / owl / spellbook); removed inline `entry.stamp` badge |
| `components/page-turn.tsx` | +37 / -25 | Removed `import { DiaryStamp }`; removed 3 editor corner accents (candle / key / mandrake) in `EditorPage`; **replaced `useDesktop` initial state `null` → `true`** + new JSDoc explaining the fix |
| `components/diary-feed.tsx` | +0 / -22 | Removed `STAMP_BY_ENTRY_ID` constant + stamp migration logic; reverted `loadEntries()` to the V9 shape (Lumi migration kept) |
| `app/layout.tsx` | +0 / -28 | Removed the 10 `<link rel="preload" as="image">` tags for `/images/diary-stamps/*.jpg`; `<head />` is now empty |
| `app/globals.css` | +0 / -20 | Removed the `.diary-stamp` rule + the "2b. Diary stamps (Iteration 10)" comment block (lines 553-572 in pre-edit version) |
| `.gitignore` | +0 / -3 | Removed `output/stamps-raw/` entry (V10 raw-stamp workdir no longer needed) |

**Net diff:** ~189 lines of stamp code removed + 12 lines of `useDesktop` fix added = **−177 lines**.

---

## 🐛 Issue 2 — Root Cause + Fix

### Root cause (verified by reading code + checking production HTML)

The `useDesktop()` hook (V9 design) returned `null` during SSR + first client render to "avoid a hydration mismatch":

```tsx
// V9 (the broken one):
const [isDesktop, setIsDesktop] = useState<boolean | null>(null)
```

The `PageTurn` component then gated on `if (!isDesktop)`, which is **truthy for `null`** — so during SSR, it always rendered `<MobileEntryList>` (the vertical stack). The `useEffect` then ran, set `isDesktop` to the actual viewport value, and triggered a re-render.

**Why the user couldn't see the page-turn on desktop:**

1. **The SSR HTML never contained the 3D page-turn markup.** The user (and any OCR/curl QA tool) saw only the mobile-list structure in view-source. The `page-turn-stage` class was only in the client JS bundle (`app/page-*.js`), not in the HTML payload. This matched the brief's OCR finding exactly: "HTML **DOES NOT** contain `page-turn-stage`" — and was the smoking gun.

2. **A real (if fast) "flash of mobile content" on desktop.** On first paint, all 3 entries stacked vertically; one frame later, the 3D spread snapped in. This made the desktop view feel janky and looked like "no page-turn".

3. **On actual small viewports (< 768px) the user really did get the mobile list** and would never see the 3D flip — because the mobile branch is the correct path for that viewport size. The user might be on a smaller laptop browser window than 768px wide.

### Fix applied

Changed the `useDesktop` initial state from `null` to `true` (the brief's "optimistic desktop" approach):

```tsx
// V11 (the fix):
const [isDesktop, setIsDesktop] = useState<boolean>(true)
```

**Why this works:**
- SSR now renders `<DesktopPageTurn>` → the production HTML contains the full 3D markup (`page-turn-stage`, `book-spread-flipper`, `book-stage`, the 2-column grid, the parchment pages).
- The first client render matches the SSR (no hydration mismatch).
- The `useEffect` then refines the state to the actual viewport. True mobile users get a one-frame flash of desktop-3D before the mobile list takes over — the standard "optimistic desktop" trade-off that the brief explicitly authorised.
- The user (and OCR / view-source) can now find the `page-turn-stage` class in the production HTML.

**Hydration safety:** initial state `true` on both server and client → server-rendered HTML matches first client render exactly → no React hydration warning.

### Verification (post-fix)

| Check | Before fix | After fix |
|-------|------------|-----------|
| `page-turn-stage` in production HTML (`/.next/server/app/index.html`) | **0** | **1** ✓ |
| `book-spread-flipper` in production HTML | 0 | 1 ✓ |
| `book-stage` in production HTML | 0 | 1 ✓ |
| `book-cover` in production HTML | 0 | 1 ✓ |
| `diary-stamp` in production HTML | 0 | 0 ✓ |
| `perspective` count in compiled CSS (`0a3e243743c64d61.css`) | 2 | 2 ✓ |
| `page-turn-stage` count in compiled CSS | 1 | 1 ✓ |
| `book-page-right` count in compiled CSS | 5 | 5 ✓ |

The brief's hard self-verification checks (#4 and #5) are now both green.

---

## ✅ Self-Verification (from brief)

| # | Check | Result |
|---|-------|--------|
| 1 | `grep -c "DiaryStamp" components/` | **0** ✓ |
| 2 | `grep -c "useDesktop" components/page-turn.tsx` | **5** ✓ (1 decl + 1 call + 3 in JSDoc) |
| 3 | `grep -c "perspective" app/globals.css` | **5** ✓ (1 in rule + 4 in comments) |
| 4 | Production HTML does NOT contain `diary-stamp` preloads | ✓ (0 matches) |
| 5 | Production HTML DOES contain `page-turn-stage` | ✓ (1 match in `index.html`) |

---

## 🧪 Build Output

```
Route (app)                              Size     First Load JS
┌ ○ /                                    11.2 kB         124 kB
┌ ○ /_not-found                          871 B          88.1 kB
┌ ○ /achievements                        7.91 kB         121 kB
┌ ƒ /api/magic-reply                     0 B                0 B
+ First Load JS shared by all            87.2 kB
```

| Metric | V10 baseline | V11 result | Target | Status |
|--------|--------------|------------|--------|--------|
| Build exit code | 0 | **0** | 0 | ✅ |
| `pnpm build` | clean | **clean** | clean | ✅ |
| `npx tsc --noEmit` | 0 errors | **0 errors** | 0 errors | ✅ |
| Routes | 5 | **5** | 5 | ✅ |
| `/` size | 11.8 kB | **11.2 kB** (↓ 0.6 kB) | < 12 kB | ✅ |
| First Load JS | 125 kB | **124 kB** (↓ 1 kB) | < 150 kB | ✅ |

`/` size dropped 0.6 kB and First Load JS dropped 1 kB — both due to the V10 stamp code removal. The page-turn fix is essentially code-neutral (one boolean default change).

---

## 🔒 Hard-Constraint Audit (Iteration 4-9 work preserved)

| # | Constraint | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Lumi reply persistence (`lumiReply` / `lumiLanguage`) | ✅ | Fields still in `lib/mock-data.ts`; migration in `diary-feed.tsx` line 32-33 |
| 2 | Dark mode ink contrast WCAG AAA | ✅ | No changes to `.handwriting` / `.handwriting-bold` ink tokens |
| 3 | DeepSeek `/api/magic-reply` endpoint | ✅ | `app/api/magic-reply/route.ts` not touched |
| 4 | Language toggle (中英) | ✅ | `components/language-toggle.tsx` not touched |
| 5 | Quill pen (no comb look) | ✅ | `components/quill-pen.tsx` not touched |
| 6 | Handwriting fonts (Caveat / ZCOOL XiaoWei) | ✅ | `app/layout.tsx` font loaders unchanged |
| 7 | Parchment texture + leather spine | ✅ | `notebook-paper`, `notebook-spine`, `book-mini-spine` CSS preserved |
| 8 | Lumi reply button in editor | ✅ | `entry-form.tsx` not touched |
| 9 | Roman numerals per-page | ✅ | `toRoman()` helper + `.page-number` CSS preserved |
| 10 | Zero new npm packages | ✅ | `package.json` untouched |

---

## 📊 Build Artifacts Saved

- `build-output-iter11.txt` — full `pnpm build` output
- `tscheck-iter11.txt` — `npx tsc --noEmit` output (0 errors)

---

## 👤 User-Facing Summary (1 paragraph)

I removed all 10 V10 image01 diary stamps and fixed the desktop page-turn so it's actually visible now. The stamps (4 corner decorations per page, 3 editor accents, and the 3 inline entry badges) are gone — every file, every import, every CSS rule, every localStorage migration hook, and the 10 `<link rel="preload">` tags in `<head>` have all been reverted, exactly like we did for the V8 photos. For the page-turn, the cause was a small bug in the V9 `useDesktop` hook: it returned `null` during SSR, so the production HTML only ever contained the mobile-list markup — the 3D page-turn only existed in the JS bundle, never in the HTML. I changed the initial state from `null` to `true` ("optimistic desktop"), so the SSR HTML now contains the full `page-turn-stage` markup and the 3D flip is visible from the very first paint on desktop. Build is green, `/` dropped from 11.8 kB → 11.2 kB, First Load JS dropped 125 kB → 124 kB, and tsc reports 0 errors. Ready to commit and push.

---

## 🚀 Next-Iteration Hooks (out of scope, FYI only)

1. **Make the 3D effect more obvious at rest** — the right page is currently `rotateY(0deg)` until clicked; a subtle resting tilt (-2° to -5°) would advertise the 3D context immediately. Risky (could affect click zones / spine alignment), defer to user feedback.
2. **Replace `opacity-0 hover:opacity-100` click zones with always-on translucent arrows** — currently the user has to know to hover over the right half of the page. The always-visible nav bar is a fine substitute but a direct arrow icon on the right edge would be more discoverable.
3. **localStorage schema-versioning** — every iteration we add ad-hoc migrations. A `schemaVersion: number` field in the persisted entries would centralise this. Not blocking, just hygiene.
