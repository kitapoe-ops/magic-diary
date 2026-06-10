import type { DiaryPhoto } from "./photo-sizes"

export type MoodKey = "sad" | "meh" | "happy" | "excited" | "loved"

export interface Mood {
  key: MoodKey
  emoji: string
  label: string
}

export const MOODS: Mood[] = [
  { key: "sad", emoji: "😢", label: "Sad" },
  { key: "meh", emoji: "😐", label: "Okay" },
  { key: "happy", emoji: "😊", label: "Happy" },
  { key: "excited", emoji: "🤩", label: "Excited" },
  { key: "loved", emoji: "🥰", label: "Loved" },
]

export const STICKERS: string[] = [
  "🦄",
  "⭐",
  "💜",
  "✨",
  "🌈",
  "👑",
  "🔮",
  "🌟",
  "💖",
  "🧚",
  "🪄",
  "🌙",
  "🍀",
  "🦋",
  "🌸",
  "💎",
]

export interface DiaryEntry {
  id: string
  title: string
  body: string
  category: string
  dateLabel: string
  mood: MoodKey
  stickers: string[]
  /**
   * Optional Princess Lumi reply that was summoned when the entry was
   * first written (or last edited). Persisted alongside the entry so
   * closing the modal / refreshing the page / switching devices does
   * not lose Lumi's response. May be `null` for entries that never
   * summoned Lumi, or for legacy entries that pre-date this field.
   */
  lumiReply?: string | null
  /**
   * The language Lumi's reply was written in (`"en"` or `"zh"`).
   * `null` when `lumiReply` is also `null`. Persisted so the reply
   * can be rendered / replayed with the correct language hint.
   */
  lumiLanguage?: "en" | "zh" | null
  /**
   * Optional photo slots attached to this entry. Each entry can
   * carry zero or more photos; the `slot` field records which
   * preset the photo was placed in (portrait-3x4, landscape-4x3,
   * square-stamp, wide-banner) so the diary card can reserve the
   * exact W×H frame when rendering the placeholder or the image.
   *
   * Iteration 5: the editor exposes a `PhotoSlot` for each
   * preset; this array is what gets persisted to localStorage.
   * Default `[]` for entries that don't have any photos.
   */
  photos?: DiaryPhoto[]
}

export const MOCK_ENTRIES: DiaryEntry[] = [
  {
    id: "1",
    title: "Today I learned about fractions!",
    body: "Math class was actually SO fun today. We cut up a pizza into eighths and I finally understand what 3/4 means. My teacher said I was the fastest in class to solve the puzzle. I feel like a math wizard!",
    category: "Math",
    dateLabel: "June 8",
    mood: "happy",
    stickers: ["🌈", "⭐", "✨"],
    lumiReply: null,
    lumiLanguage: null,
    photos: [],
  },
  {
    id: "2",
    title: "My best friend gave me a bracelet 💜",
    body: "Lily made me the prettiest purple beaded bracelet during recess. It has a tiny unicorn charm on it! We promised to be best friends forever and ever. I'm never taking it off.",
    category: "Friendship",
    dateLabel: "June 7",
    mood: "loved",
    stickers: ["💜", "💖", "🦄", "🌸"],
    lumiReply: null,
    lumiLanguage: null,
    photos: [],
  },
  {
    id: "3",
    title: "I beat the level 5 spelling test!",
    body: "I studied my spelling words every night this week and today I got every single one right! The word 'mysterious' was the trickiest but I spelled it perfectly. I earned a gold star sticker!",
    category: "Achievement",
    dateLabel: "June 6",
    mood: "excited",
    stickers: ["⭐", "👑", "🌟", "✨"],
    lumiReply: null,
    lumiLanguage: null,
    photos: [],
  },
]

export const CATEGORIES = ["Diary", "Math", "Friendship", "Achievement", "Magic", "Dreams"]

export function formatCuteDate(date: Date): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
}
