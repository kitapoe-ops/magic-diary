"use client"

import { useEffect } from "react"

const SPARKLES = ["✨", "⭐", "💜", "🌟", "💫"]

export function CursorSparkles() {
  useEffect(() => {
    let lastTime = 0
    function handleMove(e: MouseEvent) {
      const now = Date.now()
      if (now - lastTime < 60) return
      lastTime = now

      const sparkle = document.createElement("span")
      sparkle.className = "cursor-sparkle"
      sparkle.textContent = SPARKLES[Math.floor(Math.random() * SPARKLES.length)]
      sparkle.style.left = `${e.clientX}px`
      sparkle.style.top = `${e.clientY}px`
      document.body.appendChild(sparkle)
      window.setTimeout(() => sparkle.remove(), 900)
    }

    window.addEventListener("mousemove", handleMove)
    return () => window.removeEventListener("mousemove", handleMove)
  }, [])

  return null
}
