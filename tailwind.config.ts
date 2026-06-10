import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-quicksand)", "system-ui", "sans-serif"],
        cursive: ["var(--font-pacifico)", "cursive"],
        // CJK-first handwriting stack: ZCOOL KuaiLe (web, Chinese
        // round-script) → Kalam (web, Latin) → system Chinese
        // fallbacks → cursive generic.
        handwriting: [
          "var(--font-zcool)",
          "var(--font-kalam)",
          "\"ZCOOL KuaiLe\"",
          "\"Comic Sans MS\"",
          "\"Bradley Hand\"",
          "\"Microsoft YaHei\"",
          "\"PingFang SC\"",
          "\"Hiragino Sans GB\"",
          "\"Noto Sans CJK SC\"",
          "cursive",
        ],
        // Hogwarts-style serif used for titles, page numbers, and
        // the spine label. Loaded via next/font/google in
        // app/layout.tsx; the CSS variable `--font-cinzel` is
        // defined there.
        cinzel: [
          "var(--font-cinzel)",
          "\"Cinzel\"",
          "\"Cinzel Decorative\"",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        // Parchment-friendly serif for body text on diary pages
        // (Roman-numeral page numbers, "Anno MMXXVI" tooling).
        crimson: [
          "var(--font-crimson)",
          "\"Crimson Text\"",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        // Iteration 6 — English handwriting for diary body / photo
        // captions / Lumi reply text. Caveat is a casual hand-
        // written script that feels like a real pen. Loaded via
        // next/font/google in app/layout.tsx as `--font-caveat`.
        caveat: [
          "var(--font-caveat)",
          "\"Caveat\"",
          "\"Caveat Brush\"",
          "cursive",
        ],
        // Iteration 6 — Chinese handwriting (XiaoWei = thin-elegant
        // brush style) for journal entries. Loaded via
        // next/font/google as `--font-xiaowei`.
        xiaowei: [
          "var(--font-xiaowei)",
          "\"ZCOOL XiaoWei\"",
          "\"Ma Shan Zheng\"",
          "\"KaiTi\"",
          "\"STKaiti\"",
          "\"Noto Serif CJK SC\"",
          "\"PingFang SC\"",
          "serif",
        ],
        // Iteration 6 — Chinese brush-style (Ma Shan Zheng) for
        // special / celebratory moments. Heavier than XiaoWei.
        mashanzheng: [
          "var(--font-mashanzheng)",
          "\"Ma Shan Zheng\"",
          "\"ZCOOL XiaoWei\"",
          "\"KaiTi\"",
          "\"STKaiti\"",
          "\"Noto Serif CJK SC\"",
          "\"PingFang SC\"",
          "cursive",
        ],
      },
      // Iteration 5: Hogwarts colour tokens. These are kept as
      // explicit hex values (not CSS variables) so they survive
      // without the theme attribute and can be used in plain
      // `bg-parchment` / `text-leather` Tailwind classes.
      // Merged with the existing HSL-driven theme tokens (gold,
      // primary, secondary, etc.) — Tailwind merges top-level
      // `colors` objects, so both namespaces coexist.
      colors: {
        // Light theme tokens
        parchment: "#f4e9c8",
        "parchment-warm": "#fdf6e3",
        "parchment-dim": "#c9a574",
        ink: "#3d2817",
        leather: "#6b4423",
        "leather-deep": "#3d2817",
        // Dark theme tokens
        "leather-night": "#1a0f0a",
        gold: "#d4a574",
        "gold-bright": "#fbbf24",
        "ink-light": "#e9d5ff",
        // Existing HSL tokens (kept untouched so component code
        // referencing `bg-primary` / `text-gold` / `text-accent`
        // still works).
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        // The hex `gold` token above (`#d4a574`) is what
        // `text-gold` / `bg-gold` resolves to. The HSL version
        // still lives in the CSS variable `--gold` for the few
        // components that reach for `hsl(var(--gold))` directly.
        magicpink: {
          DEFAULT: "hsl(var(--magic-pink))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.2", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(10deg)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "wand-wave": {
          "0%, 100%": { transform: "rotate(-12deg)" },
          "50%": { transform: "rotate(12deg)" },
        },
        "card-lift": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-6px)" },
        },
        "sparkle-pop": {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "scale(1.6) rotate(180deg)", opacity: "0" },
        },
        "rainbow-burst": {
          "0%": { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(3)", opacity: "0" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "60%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        twinkle: "twinkle 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 4s ease-in-out infinite",
        "wand-wave": "wand-wave 2s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        "bounce-in": "bounce-in 0.5s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
