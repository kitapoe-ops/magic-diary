import type React from "react"
import type { Metadata, Viewport } from "next"
import { Quicksand, Pacifico, Kalam, ZCOOL_KuaiLe } from "next/font/google"
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

// Chinese handwriting font — Kalam's next/font/google only ships the
// `latin` subset, so CJK glyphs would otherwise fall through to the
// system default. ZCOOL KuaiLe is a playful round-script Chinese face
// from Google Fonts; we load the latin subset (the only subset the
// next/font types expose for this family) and rely on the named
// "ZCOOL KuaiLe" + system CJK fallbacks for the actual CJK glyphs.
const zcool = ZCOOL_KuaiLe({
  subsets: ["latin"],
  variable: "--font-zcool",
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${quicksand.variable} ${pacifico.variable} ${kalam.variable} ${zcool.variable} bg-background`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
