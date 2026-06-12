import type React from "react"
import type { Metadata, Viewport } from "next"
import { Quicksand, Pacifico, Kalam, ZCOOL_KuaiLe, Cinzel, Crimson_Text, Caveat, ZCOOL_XiaoWei, Ma_Shan_Zheng } from "next/font/google"
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

// Iteration 5 — Hogwarts aesthetic. Cinzel is a classical Roman
// serif that reads as "old parchment title"; we use it for the
// app title, page numbers, and the spine label. Two weights is
// plenty for our needs (regular + bold).
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "600", "700"],
})

// Crimson Text — a more readable serif for diary body / page
// subheadings. Loads regular + italic + bold.
const crimson = Crimson_Text({
  subsets: ["latin"],
  variable: "--font-crimson",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
})

// Iteration 6 — English handwriting (Bug 2). Caveat is a casual
// hand-written script that feels like a real pen. Used for diary
// body, photo slot captions, and Lumi reply text. Two weights
// (regular + bold) is plenty.
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["400", "600", "700"],
})

// Iteration 6 — Chinese handwriting (Bug 2). ZCOOL XiaoWei is
// Google Fonts' elegant thin brush-style face — reads like real
// Chinese calligraphy. Used for journal entries.
const xiaowei = ZCOOL_XiaoWei({
  subsets: ["latin"],
  variable: "--font-xiaowei",
  weight: ["400"],
})

// Iteration 6 — Chinese brush-style (Bug 2). Ma Shan Zheng is a
// heavier, more dramatic Chinese brush face. Used for "special
// moments" / celebratory headings. next/font/google only
// exposes the `latin` subset for this family; the actual CJK
// glyphs come from the system fallback chain in tailwind.config.
const mashanzheng = Ma_Shan_Zheng({
  subsets: ["latin"],
  variable: "--font-mashanzheng",
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
      className={`${quicksand.variable} ${pacifico.variable} ${kalam.variable} ${zcool.variable} ${cinzel.variable} ${crimson.variable} ${caveat.variable} ${xiaowei.variable} ${mashanzheng.variable}`}
    >
      <head />
      <body className="font-sans antialiased text-leather-deep min-h-screen">
        {children}
      </body>
    </html>
  )
}
