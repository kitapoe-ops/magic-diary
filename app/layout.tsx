import type React from "react"
import type { Metadata, Viewport } from "next"
import { Quicksand, Pacifico } from "next/font/google"
import "./globals.css"

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  weight: ["400", "500", "600", "700"],
})

const pacifico = Pacifico({
  subsets: ["latin"],
  variable: "--font-pacifico",
  weight: ["400"],
})

export const metadata: Metadata = {
  title: "✨ Magic Diary ✨",
  description: "A magical diary full of sparkles, spells, and wonderful memories!",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#4C1D95",
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The I18nProvider (client) updates document.documentElement.lang on mount
  // and whenever the locale changes. Default to "en" for SSR consistency.
  return (
    <html lang="en" suppressHydrationWarning className={`${quicksand.variable} ${pacifico.variable} bg-background`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
