// Bilingual dictionary for Magic Diary.
// Cantonese-flavored zh-HK text so it feels natural for an 11-year-old reader
// (the on-page voice intentionally avoids formal / bureaucratic phrasing).

export type Locale = "en" | "zh"

export const LOCALES: Locale[] = ["en", "zh"]
export const DEFAULT_LOCALE: Locale = "en"
export const LOCALE_STORAGE_KEY = "magic-locale"

export type Dict = {
  // Shared
  appTitle: string
  madeWithMagic: string

  // Header
  switchToDayMode: string
  switchToNightMode: string
  toggleLanguage: string

  // Sidebar
  navMyDiary: string
  navSpells: string
  navMood: string
  navAchievements: string

  // DiaryFeed
  feedHeading: string
  feedSubheading: string
  emptyHeading: string
  emptyBody: string
  emptyCta: string
  toastSaved: string
  toastUpdated: string
  toastDeleted: string
  resetToDemo: string
  resetConfirm: string

  // DiaryCard
  cardEdit: string
  cardDelete: string

  // EntryModal
  modalNewTitle: string
  modalEditTitle: string
  modalLabelTitle: string
  modalLabelBody: string
  modalPlaceholderTitle: string
  modalPlaceholderBody: string
  modalLabelMood: string
  modalLabelStickers: string
  modalStickersHint: string
  modalCasting: string
  modalCast: string
  modalSummonLumi: string
  modalSummoningLumi: string
  modalLumiSays: string
  // Iteration 9: in-page "Ask Lumi" button label (used in
  // the editor embedded on the last page-turn spread).
  askLumiCta: string
  // Card-level label for the persisted Lumi reply that renders under
  // the diary card body. Bilingual heading in EN, single-line in zh.
  lumiSays: string
  // Iteration 8: photos removed from the diary model. The two
  // photo-slot i18n keys above are also removed (no component
  // references them anymore).
  // Quill pen / new entry / page navigation
  bookPageNew: string
  bookPageFeed: string
  newEntryHeading: string
  newEntrySubheading: string
  // Iteration 8: page-turn spread navigation (Prev/Next spread
  // buttons + the spread count label) + the in-page editor
  // copy shown on the last spread.
  bookPrev: string
  bookNext: string
  bookPrevSpread: string
  bookNextSpread: string
  // Iteration 17: First (Home) spread button — snaps back to
  // spread 0 (Entry 1 / Entry 2 side-by-side) without a flip
  // animation. i18n for both the visible label and the
  // aria-label.
  bookFirst: string
  bookFirstSpread: string
  spreadLabel: (current: number, total: number) => string
  editorInviteCta: string
  editorPageLabel: string
  // Iteration 13: blank-page sentinel copy (rendered on the
  // right side of a [EDITOR, BLANK] spread when entries is
  // even, so the editor never collides with past entries).
  blankPageHint: string
  blankPageEnd: string
  modalAiLanguage: string
  modalAiLanguageHint: string
  modalAiError: string
  modalNoToken: string
  modalOpenAiSettings: string

  // DailySpellWidget
  spellBadge: string
  spellCastCount: (n: number) => string
  spellCastBtn: string
  spellCastMsg: string
  spellToastReminder: string

  // Achievements
  achHeading: string
  achSubheading: (unlocked: number, total: number) => string
  achLevel: (n: number) => string
  achXpLabel: (cur: number, next: number) => string
  achUnlockedTag: string

  // MoodTracker
  moodTitle: string

  // FloatingActions
  fabNewEntry: string
  fabAddSticker: string
  fabMood: string
  fabMagicSpell: string

  // LoadingScreen
  loadingTitle: string

  // DeepSeek settings
  dsTitle: string
  dsTokenLabel: string
  dsTokenPlaceholder: string
  dsTokenHint: string
  dsTestButton: string
  dsClearButton: string
  dsSaveButton: string
  dsTesting: string
  dsTestSuccess: string
  dsTestFailed: string
  dsTokenMissing: string
  dsTokenSaved: string
  dsTokenCleared: string
  dsSettingsIntro: string
  dsLangChinese: string
  dsLangEnglish: string
  dsClose: string

  // Mood labels (referenced from MOODS mock data)
  moodLabelSad: string
  moodLabelMeh: string
  moodLabelHappy: string
  moodLabelExcited: string
  moodLabelLoved: string

  // Categories
  catDiary: string
  catMath: string
  catFriendship: string
  catAchievement: string
  catMagic: string
  catDreams: string
}

const en: Dict = {
  appTitle: "Magic Diary",

  madeWithMagic: "Made with 💜 and a little bit of magic",

  switchToDayMode: "Switch to day mode",
  switchToNightMode: "Switch to night mode",
  toggleLanguage: "切換中文 / Toggle language",

  navMyDiary: "My Diary",
  navSpells: "Spells",
  navMood: "Mood",
  navAchievements: "Achievements",

  feedHeading: "My Magical Diary",
  feedSubheading: "All your sparkly memories in one place ✨",
  emptyHeading: "Your magical journey begins here!",
  emptyBody: "Tap the wand to write your first entry and start collecting sparkly memories.",
  emptyCta: "Write First Entry",
  toastSaved: "✨ Your magic has been saved!",
  toastUpdated: "✨ Your magic has been updated!",
  toastDeleted: "🌙 Entry vanished into the stars",
  resetToDemo: "Reset to demo data",
  resetConfirm: "Reset all entries back to the demo set?",

  cardEdit: "Edit entry",
  cardDelete: "Delete entry",

  modalNewTitle: "Write New Magic",
  modalEditTitle: "Edit Your Magic",
  modalLabelTitle: "Title",
  modalLabelBody: "Your story",
  modalPlaceholderTitle: "What magical thing happened?",
  modalPlaceholderBody: "Tell your diary all about it...",
  modalLabelMood: "How do you feel?",
  modalLabelStickers: "Add stickers",
  modalStickersHint: "(up to 5)",
  modalCasting: "Casting...",
  modalCast: "Cast Spell",
  modalSummonLumi: "✨ Summon Princess Lumi",
  modalSummoningLumi: "🪄 Summoning Lumi...",
  modalLumiSays: "Princess Lumi says...",
  askLumiCta: "🪄 Ask Lumi for advice",
  lumiSays: "🪄 Princess Lumi says:",
  bookPageNew: "New Entry",
  bookPageFeed: "Past Whispers",
  newEntryHeading: "I. New Entry",
  newEntrySubheading: "Begin a fresh page...",
  // Iteration 8: spread navigation
  bookPrev: "Previous",
  bookNext: "Next",
  bookPrevSpread: "Previous spread",
  bookNextSpread: "Next spread",
  // Iteration 17: First (Home) spread button
  bookFirst: "First",
  bookFirstSpread: "Go to first page",
  spreadLabel: (current, total) => `Spread ${current} of ${total}`,
  editorInviteCta: "Begin a fresh page...",
  editorPageLabel: "New",
  // Iteration 13: blank-page sentinel copy
  blankPageHint: "you have reached the last written page",
  blankPageEnd: "The End",
  modalAiLanguage: "Reply language",
  modalAiLanguageHint: "Chinese / English",
  modalAiError: "Lumi couldn't reply right now — please try again 💜",
  modalNoToken: "Add your DeepSeek token in ⚙ Settings first!",
  modalOpenAiSettings: "Open Settings",

  spellBadge: "Daily Spell",
  spellCastCount: (n) => `🪄 ${n} cast`,
  spellCastBtn: "Cast Spell!",
  spellCastMsg: "✨ Spell Cast! ✨",
  spellToastReminder: "🪄 Check the Daily Spell in your sidebar!",

  achHeading: "My Achievements",
  achSubheading: (u, t) => `You've unlocked ${u} of ${t} magical badges!`,
  achLevel: (n) => `Level ${n}`,
  achXpLabel: (cur, next) => `${cur} / ${next} XP`,
  achUnlockedTag: "Unlocked!",

  moodTitle: "Mood Tracker",

  fabNewEntry: "New Entry",
  fabAddSticker: "Add Sticker",
  fabMood: "Mood Tracker",
  fabMagicSpell: "Magic Spell",

  loadingTitle: "Magical Loading...",

  dsTitle: "✨ DeepSeek Settings",
  dsTokenLabel: "DeepSeek API Token",
  dsTokenPlaceholder: "sk-...",
  dsTokenHint: "Stored only in your browser. Never sent anywhere except DeepSeek.",
  dsTestButton: "Test Connection",
  dsClearButton: "Clear Token",
  dsSaveButton: "Save Token",
  dsTesting: "Testing...",
  dsTestSuccess: "✅ Connected! Lumi is ready to chat.",
  dsTestFailed: "❌ Connection failed. Check your token.",
  dsTokenMissing: "Please paste a token first.",
  dsTokenSaved: "✨ Token saved!",
  dsTokenCleared: "Token cleared.",
  dsSettingsIntro: "Connect DeepSeek so Princess Lumi can reply to your diary.",
  dsLangChinese: "中文",
  dsLangEnglish: "English",
  dsClose: "Close",

  moodLabelSad: "Sad",
  moodLabelMeh: "Okay",
  moodLabelHappy: "Happy",
  moodLabelExcited: "Excited",
  moodLabelLoved: "Loved",

  catDiary: "Diary",
  catMath: "Math",
  catFriendship: "Friendship",
  catAchievement: "Achievement",
  catMagic: "Magic",
  catDreams: "Dreams",
}

const zh: Dict = {
  appTitle: "魔法日記",

  madeWithMagic: "用 💜 同一啲魔法整嘅",

  switchToDayMode: "轉去日間模式",
  switchToNightMode: "轉去夜晚模式",
  toggleLanguage: "切換中文 / Toggle language",

  navMyDiary: "我本日記",
  navSpells: "魔法咒語",
  navMood: "心情",
  navAchievements: "成就",

  feedHeading: "我嘅魔法日記",
  feedSubheading: "你嘅閃令令回憶都喺晒度 ✨",
  emptyHeading: "你嘅魔法旅程由呢度開始啦！",
  emptyBody: "撳一撳支魔杖，寫低你第一篇日記，開始儲閃石回憶啦。",
  emptyCta: "寫第一篇",
  toastSaved: "✨ 已經儲低你嘅魔法啦！",
  toastUpdated: "✨ 已經更新你嘅魔法！",
  toastDeleted: "🌙 呢篇日記飄走咗去星星度",
  resetToDemo: "重設返 demo 範例",
  resetConfirm: "確定要重設晒所有日記，換返 demo 範例？",

  cardEdit: "改呢篇",
  cardDelete: "刪除呢篇",

  modalNewTitle: "寫新魔法",
  modalEditTitle: "改你嘅魔法",
  modalLabelTitle: "標題",
  modalLabelBody: "你嘅故事",
  modalPlaceholderTitle: "今日發生咗咩魔法事？",
  modalPlaceholderBody: "同你本日記講晒出嚟啦...",
  modalLabelMood: "你依家心情點？",
  modalLabelStickers: "加啲貼紙",
  modalStickersHint: "(最多 5 個)",
  modalCasting: "變緊魔法...",
  modalCast: "施法啦",
  modalSummonLumi: "✨ 召喚露米公主",
  modalSummoningLumi: "🪄 緊嚟緊嚟...",
  modalLumiSays: "露米公主話...",
  askLumiCta: "🪄 問吓露米公主",
  lumiSays: "🪄 露米公主話：",
  bookPageNew: "新一篇",
  bookPageFeed: "舊回憶",
  newEntryHeading: "I. 新一篇",
  newEntrySubheading: "展開新嘅一頁...",
  // Iteration 8: spread navigation
  bookPrev: "上一頁",
  bookNext: "下一頁",
  bookPrevSpread: "上一個跨頁",
  bookNextSpread: "下一個跨頁",
  // Iteration 17: First (Home) spread button
  bookFirst: "首頁",
  bookFirstSpread: "跳到首頁",
  spreadLabel: (current, total) => `第 ${current} 個跨頁，共 ${total} 個`,
  editorInviteCta: "展開新嘅一頁...",
  editorPageLabel: "新",
  // Iteration 13: blank-page sentinel copy
  blankPageHint: "你已經翻到最後一頁",
  blankPageEnd: "全書完",
  modalAiLanguage: "AI 回覆語言",
  modalAiLanguageHint: "中文 / 英文",
  modalAiError: "露米依家覆唔到你，遲啲再試 💜",
  modalNoToken: "先去 ⚙ 設定嗰度貼你嘅 DeepSeek token！",
  modalOpenAiSettings: "打開設定",

  spellBadge: "今日咒語",
  spellCastCount: (n) => `🪄 已施 ${n} 次`,
  spellCastBtn: "施法啦！",
  spellCastMsg: "✨ 咒語已施！✨",
  spellToastReminder: "🪄 睇吓側邊欄嘅今日咒語呀！",

  achHeading: "我嘅成就",
  achSubheading: (u, t) => `你已經解鎖咗 ${u} 個徽章，總共 ${t} 個！`,
  achLevel: (n) => `第 ${n} 級`,
  achXpLabel: (cur, next) => `${cur} / ${next} 經驗值`,
  achUnlockedTag: "解鎖咗！",

  moodTitle: "心情追蹤",

  fabNewEntry: "寫新嘢",
  fabAddSticker: "加貼紙",
  fabMood: "心情追蹤",
  fabMagicSpell: "魔法咒語",

  loadingTitle: "魔法載入緊...",

  dsTitle: "✨ DeepSeek 設定",
  dsTokenLabel: "DeepSeek API Token",
  dsTokenPlaceholder: "sk-...",
  dsTokenHint: "淨係儲喺你部機嘅瀏覽器度，唔會傳送去其他地方。",
  dsTestButton: "測試連接",
  dsClearButton: "清除 token",
  dsSaveButton: "儲存 token",
  dsTesting: "測試緊...",
  dsTestSuccess: "✅ 連到啦！露米準備好同你傾計。",
  dsTestFailed: "❌ 連接失敗，檢查吓你嘅 token。",
  dsTokenMissing: "請先貼一個 token。",
  dsTokenSaved: "✨ Token 已儲存！",
  dsTokenCleared: "Token 已清除。",
  dsSettingsIntro: "連 DeepSeek，等露米公主可以覆你嘅日記。",
  dsLangChinese: "中文",
  dsLangEnglish: "英文",
  dsClose: "關",

  moodLabelSad: "喊緊",
  moodLabelMeh: "一般",
  moodLabelHappy: "開心",
  moodLabelExcited: "超興奮",
  moodLabelLoved: "暖笠笠",

  catDiary: "日記",
  catMath: "數學",
  catFriendship: "友誼",
  catAchievement: "成就",
  catMagic: "魔法",
  catDreams: "夢想",
}

export const dictionaries: Record<Locale, Dict> = { en, zh }

// Convenience: locale metadata for the toggle UI.
export const LOCALE_META: Record<Locale, { label: string; flag: string }> = {
  en: { label: "EN", flag: "🇬🇧" },
  zh: { label: "中", flag: "🇭🇰" },
}