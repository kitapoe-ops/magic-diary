"use client"

import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react"

type Theme = "night" | "day"

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** SSR-safe initial theme. Browser picks up the stored value in
 *  the lazy initializer below. */
function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "night"
  const stored = window.localStorage.getItem("magic-theme")
  if (stored === "day" || stored === "night") return stored
  return "night"
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  // Apply the theme class to <html> on every change so the
  // Tailwind `dark:` variants flip immediately and the legacy
  // `.day`-prefixed CSS rules also fire. useLayoutEffect runs
  // before paint so there's no light-mode flash.
  useLayoutEffect(() => {
    const root = document.documentElement
    if (theme === "day") {
      root.classList.add("day")
      root.classList.remove("dark")
    } else {
      root.classList.add("dark")
      root.classList.remove("day")
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("magic-theme", theme)
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === "night" ? "day" : "night"))

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
