"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "night" | "day"

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("night")

  useEffect(() => {
    const stored = localStorage.getItem("magic-theme") as Theme | null
    if (stored) setTheme(stored)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === "day") root.classList.add("day")
    else root.classList.remove("day")
    localStorage.setItem("magic-theme", theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === "night" ? "day" : "night"))

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
