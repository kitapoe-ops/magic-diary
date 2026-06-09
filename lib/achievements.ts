export interface Achievement {
  id: string
  name: string
  description: string
  emoji: string
  unlocked: boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-entry", name: "First Entry", description: "Wrote your very first diary entry!", emoji: "📖", unlocked: true },
  { id: "week-streak", name: "Week Streak", description: "Wrote in your diary 7 days in a row.", emoji: "🔥", unlocked: true },
  { id: "mood-master", name: "Mood Master", description: "Tracked your mood 10 times.", emoji: "💖", unlocked: true },
  { id: "hundred-stickers", name: "100 Stickers", description: "Collected 100 magical stickers.", emoji: "⭐", unlocked: false },
  { id: "early-bird", name: "Early Bird", description: "Wrote an entry before 8am.", emoji: "🌅", unlocked: false },
  { id: "night-owl", name: "Night Owl", description: "Wrote an entry after sunset.", emoji: "🌙", unlocked: false },
  { id: "spell-caster", name: "Spell Caster", description: "Cast 25 daily magic spells.", emoji: "🪄", unlocked: false },
  { id: "best-friend", name: "Best Friend", description: "Wrote 5 friendship entries.", emoji: "💜", unlocked: false },
  { id: "unicorn-lover", name: "Unicorn Lover", description: "Used the unicorn sticker 20 times.", emoji: "🦄", unlocked: false },
  { id: "rainbow-maker", name: "Rainbow Maker", description: "Felt every mood in one week.", emoji: "🌈", unlocked: false },
  { id: "wizard-scholar", name: "Wizard Scholar", description: "Wrote 10 learning entries.", emoji: "🎓", unlocked: false },
  { id: "crown-jewel", name: "Crown Jewel", description: "Reached Level 5 Wizard!", emoji: "👑", unlocked: false },
]

export const WIZARD_LEVEL = {
  level: 3,
  title: "Wizard Apprentice",
  currentXp: 320,
  nextLevelXp: 500,
}
