export interface Spell {
  name: string
  incantation: string
  effect: string
  emoji: string
}

// One spell for each day of the week (index 0 = Sunday)
export const SPELLS: Spell[] = [
  {
    name: "Dreamy Sunday Sparkle",
    incantation: "Lumos Restus ✨",
    effect: "Say this 3 times to feel calm and ready for a brand new week!",
    emoji: "🌙",
  },
  {
    name: "Hocus Pocus Focus",
    incantation: "Hocus Pocus Focus ✨",
    effect: "Say this 3 times before homework to make your brain extra sparkly.",
    emoji: "🔮",
  },
  {
    name: "Brave Heart Charm",
    incantation: "Coraggio Magicus 💜",
    effect: "Whisper this when you feel nervous and feel your courage grow!",
    emoji: "🦁",
  },
  {
    name: "Kindness Glitter Spell",
    incantation: "Amica Sparkellio 🌈",
    effect: "Cast this to make a friend smile today. Watch the magic spread!",
    emoji: "🌈",
  },
  {
    name: "Super Star Study Spell",
    incantation: "Studyo Stellaris ⭐",
    effect: "Say this before a test to remember everything you learned.",
    emoji: "⭐",
  },
  {
    name: "Friday Fun Fizz",
    incantation: "Weekendo Funtastica 🎉",
    effect: "Cast this to make the weekend extra magical and full of joy!",
    emoji: "🎉",
  },
  {
    name: "Sweet Dreams Shield",
    incantation: "Sogno Dolce Protecto 🌟",
    effect: "Whisper this before bed for the sweetest unicorn dreams.",
    emoji: "🦄",
  },
]

export function getSpellForToday(): Spell {
  const day = new Date().getDay()
  return SPELLS[day]
}
