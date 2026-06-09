# ✨ Magic Diary

A magical diary web app for 11-year-old girls who love purple, sparkles, and magic.
Built on top of a [v0.dev](https://v0.dev) prototype and customised for a Hong Kong user.

## ✨ Features

- 🌐 **Bilingual UI** (English + 廣東話) — toggle via 🌐 button in header
- 🪄 **AI Companion** — Princess Lumi 露米公主 replies in character via DeepSeek
- 💜 **Magical aesthetic** — purple + gold, glassmorphism, animated stars, sparkles
- 📱 **Responsive** — desktop sidebar, mobile bottom nav
- 💾 **LocalStorage persistence** — entries survive refresh
- 🔒 **Token in browser only** — never touches server logs or `.env`
- 🛡️ **Safety-first** — 11-year-old safe filter (self-harm / bullying / personal data) with defence-in-depth

## 🚀 Deploy to Vercel (1-click)

1. Push this folder to a **new GitHub repo**:
   ```bash
   git init && git add . && git commit -m "feat: magic diary with i18n + Lumi AI"
   gh repo create magic-diary --public --source=. --push
   ```
2. Go to https://vercel.com/new → **Import** the repo
3. Vercel auto-detects Next.js, keep default settings
4. Click **Deploy** → wait ~2 min → live URL like `https://magic-diary-xxxx.vercel.app`

**No environment variables needed.** The DeepSeek token is set per-user in ⚙ Settings.

## 🛠 Local development

```bash
pnpm install --ignore-workspace
pnpm dev      # http://localhost:3000
pnpm build    # production build
pnpm start    # serve production build
```

> `--ignore-workspace` is needed because the parent `.openclaw/` directory has a `pnpm-workspace.yaml`.

## 🧚 Princess Lumi 露米公主 (character)

- 11 years old, same age as the user
- Lives in the Amethyst Castle, has a purple unicorn pet "Twinkle"
- Cantonese-flavored Chinese voice, first-person "我" only
- **Shares her own stories → gives a gentle opinion → ends with a question**
- Format: 3-5 sentences, max 80 words, opens with 🪄 ends with 💜
- If diary mentions self-harm, bullying, sexual content, drugs → emergency fallback triggers (both client + server)

## 🔒 Security design

- DeepSeek API token stored in `localStorage` only
- Token passed per-request via `x-deepseek-token` header
- Server never persists or logs the token
- `app/api/magic-reply` validates body shape + applies safety filter on both input AND output
- No secrets in `.env`, no secrets in git history

## 📁 Project structure

```
app/
  api/magic-reply/route.ts   # DeepSeek proxy + safety filter
  layout.tsx                  # root <html lang> = "en" (provider updates on change)
  page.tsx                    # diary feed
  achievements/page.tsx       # achievements
components/
  language-toggle.tsx         # 🌐 globe
  deepseek-settings.tsx       # ⚙ token modal
  entry-modal.tsx             # new/edit entry + "Summon Lumi" button
  diary-feed.tsx              # main feed + localStorage persistence
  diary-card.tsx              # single entry card
  header.tsx                  # logo + theme + lang + ⚙
  sidebar.tsx                 # desktop nav + mobile bottom nav
  floating-actions.tsx        # 4 FABs
  daily-spell-widget.tsx      # cast count
  achievements-view.tsx       # 12 achievements + level
  mood-tracker.tsx            # mood bar chart
  loading-screen.tsx          # hero image + 🧙‍♀️
  ... (theme-provider, toast-provider, providers, app-shell, etc.)
hooks/
  use-i18n.tsx                # I18nProvider + useI18n()
  use-chime.ts                # Web Audio magic chimes
lib/
  i18n.ts                     # bilingual dictionary (en + zh)
  magic-reply-prompt.ts       # Lumi system prompt + safety keywords
  mock-data.ts                # moods, stickers, demo entries
  spells.ts                   # 7 daily spells (one per weekday)
  achievements.ts             # 12 achievements + wizard level
  utils.ts                    # cn() tailwind-merge helper
public/
  images/                     # 4 image01 generated images (hero, empty-state, banner, decoration)
vercel.json                   # Vercel config (hkg1 + sin1 regions, image caching)
```

## 📜 License

Personal project. For 11-year-old use.
