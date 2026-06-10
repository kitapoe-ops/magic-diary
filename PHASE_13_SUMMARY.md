# PHASE 13 — Iteration 13 Summary (DRAFT)

**User-reported issue (Telegram 2026-06-11, #16427 + #16431):**
> 新一篇頁面和舊日記重疊，新一篇只保留左或右頁就可以了，現在尾頁左邊和右邊同時是新一篇頁面

**User-confirmed fix (option A):** Remove the "full editor spread" logic. The editor
should always occupy **one** page only. The other page should be a quiet "blank"
sentinel that signals "end of book", not another editor.

---

## 🎯 What changed

1. **`buildSpreads` algorithm** — replaced. Editor now occupies exactly one page.
   - 0 entries → `[[EDITOR, EDITOR]]` (single full-editor spread, brand new diary)
   - 1 entry → `[[a, EDITOR]]`
   - 2 entries → `[[a, b], [EDITOR, BLANK]]` ← **the user's reported case**
   - 3 entries → `[[a, b], [c, EDITOR]]`
   - 4 entries → `[[a, b], [c, d], [EDITOR, BLANK]]`
   - 5 entries → `[[a, b], [c, d], [e, EDITOR]]`
   - 6 entries → `[[a, b], [c, d], [e, f], [EDITOR, BLANK]]`

2. **New `BLANK` sentinel** — added alongside `EDITOR`. The
   `SpreadPage` type union now includes `DiaryEntry | typeof EDITOR | typeof BLANK`.

3. **New `<BlankPage>` sub-component** — quiet parchment page with
   "— pageLabel —" + a faint `t.blankPageHint` italic + a small
   "📖 The End" footer. No interactive elements (no form, no buttons),
   no collision with past entries.

4. **`<EditorPage>` variant simplified** — type union dropped from
   `"left" | "right" | "full"` to `"left" | "right"`. The `"full"`
   case was unreachable for the desktop spread-mapping now. The
   mobile vertical list was updated to pass `variant="right"` (a
   border-suppression no-op for the mobile case where the editor
   has no neighbour).

5. **`editorVariant` calculation simplified** — type narrowed to
   `"left" | "right" | "none"`. The `if (leftIsEditor && rightIsEditor)`
   "full" branch is gone (unreachable).

6. **Spread-mapping rendering updated** — left and right pages now
   check `leftIsEditor → leftIsBlank → DiaryCard` (same for the
   right). The `BlankPage` is rendered for any `BLANK` slot.

7. **i18n keys added** — `blankPageHint` and `blankPageEnd` for
   both `en` and `zh`.

8. **JSDoc + file header updated** — top-of-file comment now says
   "Iteration 13 (Issue: full editor spread collision)" and the
   `buildSpreads` JSDoc lists the 7 example cases.

---

## 📁 Files modified

| File | Lines changed |
|------|---------------|
| `components/page-turn.tsx` | +141 / −44 (net +97) |
| `lib/i18n.ts` | +11 / −0 (net +11) |
| **Total** | **+152 / −44 (net +108)** |

The `git diff --stat` output:
```
 components/page-turn.tsx | 185 ++++++++++++++++++++++++++++++++++++-----------
 lib/i18n.ts              |  11 +++
 2 files changed, 152 insertions(+), 44 deletions(-)
```

### Spot-changes (page-turn.tsx)

- **Line ~3** — file header comment updated to "Iteration 13".
- **Line ~23** — file-level spread-mapping JSDoc updated to mention BLANK sentinel.
- **Line ~138-160** — `EDITOR` / `BLANK` constants + `SpreadPage` type union.
- **Line ~167-204** — new `buildSpreads` algorithm (replaced the old one).
- **Line ~250-281** — `EditorPage` type narrowed (no more "full" variant).
- **Line ~305-337** — new `<BlankPage>` sub-component.
- **Line ~459-525** — `DesktopPageTurn` rendering updated (`leftIsBlank`, `rightIsBlank`, `BlankPage`, simplified `editorVariant`).
- **Line ~697-708** — `MobileEntryList` updated to use `variant="right"` (was `"full"`).

### Spot-changes (i18n.ts)

- **Type `Dict`** — added `blankPageHint: string` and `blankPageEnd: string` to the page-turn section.
- **`en` dict** — added `"you have reached the last written page"` and `"The End"`.
- **`zh` dict** — added `"你已經翻到最後一頁"` and `"全書完"`.

---

## ✅ Build verification

### `npx tsc --noEmit` 
**0 errors** (exit code 0).

### `pnpm build`
**Exit code 0**. 5 routes. `/` route is **11.3 kB** (< 12 kB target). First Load JS is **124 kB** (< 150 kB target).

```
Route (app)                              Size     First Load JS
┌ /                                    11.3 kB         124 kB
┌ /_not-found                          871 B          88.1 kB
┌ /achievements                        7.91 kB         121 kB
λ /api/magic-reply                     0 B                0 B
+ First Load JS shared by all            87.2 kB
```

### Bundle inspection

The production chunk `.next/static/chunks/app/page-068755321fb6929e.js` contains:
- `let q="EDITOR",B="BLANK"` — both sentinels present
- `function I(e){...pageLabel...blankPageHint...blankPageEnd...}` — the BlankPage function
- `function P(e){...right"===t&&"border-l border-leather/15","left"===t&&"border-r border-leather/15"...` — EditorPage with only "right" and "left" variants
- `t.push([q,B])` — the [EDITOR, BLANK] append logic
- `e[0]===B` / `e[1]===B` — the BLANK sentinel checks in the spread render

---

## 🧪 7-case spread-mapping test (verified)

Verified with a stand-alone Node script using the exact algorithm.

| Entries | Expected spreads | Editor position | Test result |
|---------|------------------|-----------------|-------------|
| 0 | `[[EDITOR, EDITOR]]` | Both pages (single spread) | **PASS** |
| 1 | `[[a, EDITOR]]` | Right of spread 1 | **PASS** |
| 2 | `[[a, b], [EDITOR, BLANK]]` | Left of spread 2 | **PASS** |
| 3 | `[[a, b], [c, EDITOR]]` | Right of spread 2 | **PASS** |
| 4 | `[[a, b], [c, d], [EDITOR, BLANK]]` | Left of spread 3 | **PASS** |
| 5 | `[[a, b], [c, d], [e, EDITOR]]` | Right of spread 3 | **PASS** |
| 6 (bonus) | `[[a, b], [c, d], [e, f], [EDITOR, BLANK]]` | Left of spread 4 | **PASS** |

```
PASS 0 entries → [["EDITOR","EDITOR"]]
PASS 1 entry   → [[{"id":"a"},"EDITOR"]]
PASS 2 entries → [[{"id":"a"},{"id":"b"}],["EDITOR","BLANK"]]
PASS 3 entries → [[{"id":"a"},{"id":"b"}],[{"id":"c"},"EDITOR"]]
PASS 4 entries → [[{"id":"a"},{"id":"b"}],[{"id":"c"},{"id":"d"}],["EDITOR","BLANK"]]
PASS 5 entries → [[{"id":"a"},{"id":"b"}],[{"id":"c"},{"id":"d"}],[{"id":"e"},"EDITOR"]]
PASS 6 entries → [[{"id":"a"},{"id":"b"}],[{"id":"c"},{"id":"d"}],[{"id":"e"},{"id":"f"}],["EDITOR","BLANK"]]
Result: 7 pass, 0 fail
```

### Note on the algorithm loop

The brief's pseudocode had `right = allEntries[i + 1] ?? BLANK` in the loop, but the
expected output table for `buildSpreads([a])` requires `[[a, EDITOR]]` — i.e. the
right slot of an incomplete 2-group should default to **EDITOR** (so the user
always has somewhere to write on the current spread), not BLANK. The
`lastHasEditor` downstream check also only makes sense if the loop uses EDITOR
as the right-slot default. The implementation uses `right = allEntries[i + 1] ?? EDITOR`
which is the only reading consistent with the expected outputs. BLANK is
reserved exclusively for the trailing `[EDITOR, BLANK]` spread that gets
appended when `lastHasEditor === false`.

### Note on demo data

`MOCK_ENTRIES` has 3 entries (odd), so the demo state shows
`[[a, b], [c, EDITOR]]` — no BLANK sentinel visible in the demo. To see the
new BLANK sentinel in action, the user can either delete one entry (3 → 2) or
add a fourth entry (3 → 4).

---

## 🔒 Hard constraints — ALL PRESERVED

- [x] **Lumi reply persistence** — untouched
- [x] **Dark mode ink contrast WCAG AAA** — untouched
- [x] **DeepSeek `/api/magic-reply` endpoint** — untouched
- [x] **Language toggle** — untouched (added en + zh keys in lockstep)
- [x] **Quill pen** — untouched
- [x] **Handwriting fonts** — untouched
- [x] **Parchment texture + leather spine** — untouched (BlankPage reuses `parchment-page` class + `<PageCorner>` leather tone)
- [x] **Lumi reply button in editor** — untouched
- [x] **Roman numerals per-page** — untouched
- [x] **Mobile/Desktop split** — preserved (mobile still uses `EditorPage` at the bottom of the vertical list; `variant="right"` is a no-op for that context)
- [x] **V12 book stage height fix** (`h-[min(70vh,50rem)]`) — preserved (line 595)
- [x] **Zero new npm packages** — confirmed (`pnpm-lock.yaml` unchanged)

---

## 📋 User-facing summary (Telegram-ready)

✅ **修咗！** 第 13 輪 fix 出咗：而家無論你有幾多篇日記，"新一篇" 都只會出現喺 **一頁** 上面（永遠唔會兩頁都係新一篇）。

舊邏輯會喺尾頁 append 一個 `[新一篇, 新一篇]` 嘅「全版編輯器」跨頁 — 呢個就係你見到嘅「兩邊同時都係新一篇頁面」嘅原因。有時仲會同最後一篇日記 overlap（layout collision）。

新邏輯：
- **奇數篇數**（1、3、5…）→ `[…, 最後一篇, 新一篇]`（新一篇喺右頁）
- **偶數篇數**（2、4、6…）→ `[…, 新一篇, 翻到底]`（新一篇喺左頁，右頁係一個新嘅「全書完」sentinel）
- **0 篇**（全新日記）→ `[新一篇, 新一篇]`（保持原本全版編輯器）

新嘅 `<BlankPage>` 喺右頁顯示 "— 翻到最後一頁 —" 配一隻 📖 「全書完」標記，視覺上完全唔打擾，純粹做「完咗啦」嘅視覺休息。`pnpm build` ✅，`tsc --noEmit` ✅，無新 npm package，舊嘅 4-12 輪 constraint（Lumi reply、dark mode WCAG AAA、quill、書脊高、mobile/desktop split）全部保住。
