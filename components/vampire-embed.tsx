"use client";

/**
 * Vampire Live2D Widget Embed
 * ----------------------------------------------------------------------------
 * Cross-origin embed of the vampire.kitahim.uk Live2D virtual-human widget
 * into magic-diary-alpha.vercel.app pages. Injects a single <script> tag that
 * pulls the embed loader from the vampire host; the loader itself does all
 * the work (creates the bubble, iframe, model loader, TTS engine).
 *
 * Why useEffect (not <Script strategy="afterInteractive">)?
 *   - <Script> in Next.js 14 may attempt SSR for inline scripts; using
 *     useEffect with manual DOM injection guarantees the script tag only
 *     exists client-side, avoiding hydration mismatches with magic-diary's
 *     existing React tree (I18nProvider, ThemeProvider, ToastProvider).
 *   - Allows us to attach an onerror hook to surface load failures in
 *     dev tools — useful for the "MIME 404" class of bug that surfaced on
 *     vampire.kitahim.uk on 2026-06-12.
 *
 * Cache busting:
 *   - The `?v=20260612v10` query string is bumped when embed.js changes.
 *   - The widget itself also has a build version internally (20260612v09
 *     in widgetUrl construction); both layers are intentionally versioned
 *     so a stale parent (this component) doesn't drag in a stale child.
 *
 * Cross-origin behavior (verified 2026-06-12 23:38 GMT+8):
 *   - vampire.kitahim.uk/embed.js serves ACAO: * (any origin allowed)
 *   - CORS: no preflight needed (simple GET request, no custom headers)
 *   - magic-diary vercel.json has no CSP `script-src` restriction, so the
 *     <script> tag will execute without browser-side blocking.
 *
 * What works out-of-the-box (no user setup):
 *   - Widget bubble + iframe load
 *   - Live2D 吸血鬼 model loads (URL-encoded 吸血鬼.model3.json)
 *   - Web Speech API (browser TTS, default route) — free, OS-built-in voices
 *
 * What requires user setup:
 *   - LLM (chat brain): user supplies `deepseek_key` in widget modal
 *   - MiniMax neural TTS: user supplies `minimax_tts_key` + `minimax_group_id`
 *     and toggles TTS route to "neural" in widget header
 *
 * Rollback:
 *   - Delete this file
 *   - Remove <VampireEmbed /> from app/layout.tsx
 *   - git commit + push
 *
 * See: memory/2026-06-12-audit.md (Incident #4 + #5 for context)
 * ----------------------------------------------------------------------------
 */

import { useEffect } from "react";

const VAMPIRE_EMBED_URL =
  "https://vampire.kitahim.uk/static/embed/embed.js?v=20260612v10";

export function VampireEmbed() {
  useEffect(() => {
    // Guard: only inject once. React 18 strict mode double-invokes effects
    // in dev; this prevents two <script> tags being appended.
    if (document.querySelector(`script[src="${VAMPIRE_EMBED_URL}"]`)) {
      return;
    }

    const script = document.createElement("script");
    script.src = VAMPIRE_EMBED_URL;
    script.async = true;
    script.defer = true;
    // data-* attributes can be added here if you want to override the
    // embed.js defaults (e.g. data-api, data-model, data-knowledge).
    // For magic-diary we keep defaults — the user configures the widget
    // through its own in-page UI, not at injection time.
    script.crossOrigin = "anonymous";
    script.setAttribute("data-embed-host", "vampire.kitahim.uk");
    script.setAttribute("data-injected-by", "magic-diary");

    // Surface load failures in console — useful for diagnosing the
    // "MIME 404" class of bug if it ever recurs.
    script.onerror = () => {
      // eslint-disable-next-line no-console
      console.error(
        "[VampireEmbed] Failed to load embed.js from",
        VAMPIRE_EMBED_URL,
        "— check CORS / Content-Type / network."
      );
    };

    script.onload = () => {
      // eslint-disable-next-line no-console
      console.info(
        "[VampireEmbed] embed.js loaded; widget should appear in <1s."
      );
    };

    document.body.appendChild(script);

    // No cleanup needed: we want the widget to persist across SPA route
    // changes (magic-diary is currently a single-page app but may grow
    // client-side routing). The script tag is idempotent — embed.js
    // checks for an existing #avatar-widget-root and reuses it.
  }, []);

  // This component renders nothing — it only side-effects on the DOM.
  return null;
}

export default VampireEmbed;
