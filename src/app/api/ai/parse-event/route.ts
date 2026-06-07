/**
 * POST /api/ai/parse-event
 *
 * Accepts a natural language description of an event and returns structured
 * form fields (title, description, date, maxCapacity) ready to pre-fill the
 * create-event form.
 *
 * Example input:  "team lunch next Friday at noon, max 20 people"
 * Example output: { title, description, date (ISO), maxCapacity }
 */

import { NextResponse } from "next/server";
import { anthropic } from "@/lib/ai";
import { errorResponse, parseJsonBody } from "@/lib/utils/api";

export async function POST(req: Request): Promise<NextResponse> {
  const body = await parseJsonBody<{ prompt: string }>(req);

  if (!body?.prompt?.trim()) {
    return errorResponse("prompt is required.", 400);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return errorResponse("ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.", 500);
  }

  const now = new Date();
  const centralTime = now.toLocaleString("en-US", { timeZone: "America/Chicago" });

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `The current date and time in Central Time (America/Chicago) is: ${centralTime}.

Parse this event description into structured fields. All dates must be in Central Time.

Event description: "${body.prompt}"

Respond with a JSON object only — no explanation, no markdown, just raw JSON:
{
  "title": "concise event title (max 80 chars)",
  "description": "1-2 sentence event description",
  "date": "ISO 8601 datetime string in Central Time, must be in the future",
  "maxCapacity": integer between 1 and 50
}

If a field cannot be inferred, use a sensible default:
- date: next weekday at 10:00 AM Central Time
- maxCapacity: 20
- title: derive from the description
- description: expand the prompt into a clear sentence`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return errorResponse("Failed to parse AI response.", 500);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Clamp maxCapacity to our business rule
    if (parsed.maxCapacity > 50) parsed.maxCapacity = 50;
    if (parsed.maxCapacity < 1) parsed.maxCapacity = 1;

    return NextResponse.json({ success: true, data: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed.";
    const cause = err instanceof Error && (err as any).cause ? String((err as any).cause) : undefined;
    console.error("[AI parse-event]", message, cause ?? "");
    return errorResponse(cause ? `${message} (${cause})` : message, 500);
  }
}
