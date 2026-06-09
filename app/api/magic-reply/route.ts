import { NextResponse } from "next/server"
import {
  LUMI_EMERGENCY_FALLBACK,
  LUMI_SYSTEM_PROMPT_EN,
  LUMI_SYSTEM_PROMPT_ZH,
  detectEmergency,
} from "@/lib/magic-reply-prompt"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface MagicReplyRequest {
  diaryContent: string
  language?: "en" | "zh"
  characterIntro?: string
}

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/v1/chat/completions"

export async function POST(request: Request) {
  // The client supplies its own token via header. We NEVER persist or log it
  // server-side. If it's missing we refuse immediately.
  const token = request.headers.get("x-deepseek-token")?.trim()
  if (!token) {
    return NextResponse.json(
      { error: "Missing DeepSeek token. Add one in Settings." },
      { status: 401 },
    )
  }

  let body: MagicReplyRequest
  try {
    body = (await request.json()) as MagicReplyRequest
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const diaryContent = body.diaryContent?.trim()
  if (!diaryContent) {
    return NextResponse.json({ error: "diaryContent is required." }, { status: 400 })
  }

  const language = body.language === "zh" ? "zh" : "en"
  const systemPrompt =
    body.characterIntro && body.characterIntro.trim().length > 0
      ? body.characterIntro
      : language === "zh"
        ? LUMI_SYSTEM_PROMPT_ZH
        : LUMI_SYSTEM_PROMPT_EN

  // Defence-in-depth: refuse to forward unsafe content to DeepSeek and short
  // circuit with our emergency fallback so a misconfigured prompt can never
  // produce harmful output.
  if (detectEmergency(diaryContent)) {
    return NextResponse.json({
      reply: LUMI_EMERGENCY_FALLBACK,
      safety: "emergency",
    })
  }

  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Here's the diary entry:\n"""${diaryContent}"""\n\nReply as Lumi in ${language === "zh" ? "Cantonese-flavored Chinese" : "English"}.`,
    },
  ]

  try {
    const upstream = await fetch(DEEPSEEK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 1.0,
        max_tokens: 400,
      }),
    })

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "")
      return NextResponse.json(
        {
          error: `DeepSeek returned ${upstream.status}`,
          detail: detail.slice(0, 500),
        },
        { status: upstream.status },
      )
    }

    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const reply = data.choices?.[0]?.message?.content?.trim()
    if (!reply) {
      return NextResponse.json(
        { error: "Empty reply from DeepSeek." },
        { status: 502 },
      )
    }

    // Final safety net: if DeepSeek somehow mirrors back unsafe content,
    // override with our fallback before returning.
    if (detectEmergency(reply)) {
      return NextResponse.json({
        reply: LUMI_EMERGENCY_FALLBACK,
        safety: "post-check",
      })
    }

    return NextResponse.json({ reply, safety: "ok" })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}