"use client"

import { useCallback, useEffect, useRef } from "react"

// Plays a gentle magical chime using the Web Audio API.
export function useChime() {
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    return () => {
      ctxRef.current?.close()
    }
  }, [])

  const play = useCallback((base = 880) => {
    try {
      if (!ctxRef.current) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext
        if (!Ctx) return
        ctxRef.current = new Ctx()
      }
      const ctx = ctxRef.current
      if (ctx.state === "suspended") void ctx.resume()

      // two soft notes for a sparkly chime
      ;[0, 0.08].forEach((offset, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = base * (i === 0 ? 1 : 1.5)
        gain.gain.setValueAtTime(0, ctx.currentTime + offset)
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + offset + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.35)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + offset)
        osc.stop(ctx.currentTime + offset + 0.35)
      })
    } catch {
      // silently ignore audio errors
    }
  }, [])

  return play
}
