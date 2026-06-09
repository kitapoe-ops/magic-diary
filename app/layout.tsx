import type React from "react"
import type { Metadata, Viewport } from "next"
import { Quicksand, Pacifico, Kalam } from "next/font/google"
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

// Handwriting font — used for diary body / titles so the page feels like
// a real journal written with a magic pen.
const kalam = Kalam({
  subsets: ["latin"],
  variable: "--font-kalam",
  weight: ["400", "700"],
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${quicksand.variable} ${pacifico.variable} ${kalam.variable} bg-background`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
