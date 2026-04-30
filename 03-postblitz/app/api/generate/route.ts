import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  buildSystemPrompt,
  buildUserPrompt,
  splitVariants,
  type GenerateInput,
} from "@/lib/prompt";
import {
  checkRateLimit,
  getClientIp,
  HOUR_LIMIT,
  DAY_LIMIT,
} from "@/lib/rateLimit";

// In-memory rate limit needs a single, long-running Node process.
export const runtime = "nodejs";

const client = new Anthropic();

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    const message =
      limit.reason === "day"
        ? `Tageslimit erreicht (${DAY_LIMIT} Anfragen/Tag). Bitte morgen erneut versuchen.`
        : `Stundenlimit erreicht (${HOUR_LIMIT} Anfragen/Stunde). Bitte später erneut versuchen.`;
    return NextResponse.json(
      { error: message },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      },
    );
  }

  const body = (await req.json()) as Partial<GenerateInput>;

  if (!body.profile || !body.thema) {
    return NextResponse.json(
      { error: "profile und thema sind erforderlich" },
      { status: 400 },
    );
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: buildSystemPrompt(body.profile),
    messages: [{ role: "user", content: buildUserPrompt(body.thema) }],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return NextResponse.json({ varianten: splitVariants(text) });
}
