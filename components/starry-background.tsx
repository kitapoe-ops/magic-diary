"use client"

import { useEffect, useState } from "react"

interface Star {
  id: number
  top: string
  left: string
  size: number
  delay: string
  duration: string
}

interface FloatItem {
  id: number
  emoji: string
  top: string
  left: string
  delay: string
  duration: string
  size: number
}

const FLOAT_EMOJIS = ["✨", "⭐", "🌟", "💫", "🪄", "🦄", "🔮"]

export function StarryBackground() {
  const [stars, setStars] = useState<Star[]>([])
  const [floats, setFloats] = useState<FloatItem[]>([])

  useEffect(() => {
    const s: Star[] = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      delay: `${Math.random() * 3}s`,
      duration: `${Math.random() * 2 + 2}s`,
    }))
    const f: FloatItem[] = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      emoji: FLOAT_EMOJIS[i % FLOAT_EMOJIS.length],
      top: `${Math.random() * 90}%`,
      left: `${Math.random() * 95}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 4 + 5}s`,
      size: Math.random() * 14 + 14,
    }))
    setStars(s)
    setFloats(f)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden magic-bg">
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        />
      ))}
      {floats.map((f) => (
        <span
          key={f.id}
          className="absolute select-none animate-float opacity-70"
          style={{
            top: f.top,
            left: f.left,
            fontSize: f.size,
            animationDelay: f.delay,
            animationDuration: f.duration,
          }}
          aria-hidden="true"
        >
          {f.emoji}
        </span>
      ))}
    </div>
  )
}
