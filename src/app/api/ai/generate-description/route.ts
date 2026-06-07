/**
 * POST /api/ai/generate-description
 *
 * Accepts an event title and returns a polished 1-2 sentence description
 * suitable for use in the event form.
 */

import { NextResponse } from "next/server";
import { anthropic } from "@/lib/ai";
import { errorResponse, parseJsonBody } from "@/lib/utils/api";

export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseJsonBody<{ title: string }>(req);

  if (!body?.title?.trim()) {
    return errorResponse("title is required.", 400);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return errorResponse("ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.", 500);
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Write a concise, professional 1-2 sentence description for an event called "${body.title.trim()}".

Requirements:
- Clear and informative
- Suitable for a company or community event listing
- No fluff, no filler phrases like "Join us for..."
- Plain text only, no markdown

Respond with just the description text, nothing else.`,
        },
      ],
    });

    const description =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    if (!description) {
      return errorResponse("Failed to generate description.", 500);
    }

    return NextResponse.json({ success: true, data: { description } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed.";
    return errorResponse(message, 500);
  }
}
