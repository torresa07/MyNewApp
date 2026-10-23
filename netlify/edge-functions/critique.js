// POST /api/critique — sends a student's final submission checklist, notes and
// up to 4 drawings to Claude and streams back written crit feedback.
// Needs the ANTHROPIC_API_KEY environment variable set in Netlify.

import Anthropic from "@anthropic-ai/sdk";

const MAX_IMAGES = 4;
const MAX_IMAGE_CHARS = 2_000_000; // base64 length, roughly 1.5 MB per image

const SYSTEM = `You are an experienced, encouraging architecture studio tutor giving a desk crit to a student before their final review.
You receive the student's project brief, their final submission checklist (status, notes and which quality checks they have and haven't met for each drawing), their design journal, and sometimes images of their work.

Write feedback that is specific, practical and kind. Use these markdown sections:
## Overall impression
## What's working
## What's missing
## How to improve each drawing
## Priorities before the deadline

Rules:
- Refer to the actual drawings, notes and images you were given. If an image is provided, comment on what you can see (line weights, hierarchy, composition, legibility, representation).
- Never invent details that weren't provided; if something can't be judged from the information, say what you'd need to see.
- Keep bullets short. Use plain language a second-year student understands.
- In "Priorities", give a numbered order of what to do first, sized to the time left before the final date.`;

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export default async (request) => {
  if (request.method !== "POST") return json(405, { error: "Use POST." });

  const apiKey = globalThis.Netlify?.env.get("ANTHROPIC_API_KEY") ?? globalThis.process?.env?.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(500, { error: "AI feedback isn't set up yet: add an ANTHROPIC_API_KEY environment variable in your Netlify site settings, then redeploy." });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Request body must be JSON." });
  }
  if (!payload?.project || !Array.isArray(payload.items)) {
    return json(400, { error: "Missing project or checklist items." });
  }

  const images = (Array.isArray(payload.images) ? payload.images : [])
    .filter((img) => typeof img?.data === "string" && img.data.length < MAX_IMAGE_CHARS)
    .slice(0, MAX_IMAGES);

  const content = [];
  for (const img of images) {
    content.push({ type: "text", text: `Image — ${String(img.label || "drawing").slice(0, 80)}:` });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: img.data } });
  }
  const details = {
    project: payload.project,
    today: new Date().toISOString().slice(0, 10),
    checklist: payload.items,
    designJournal: Array.isArray(payload.journal) ? payload.journal.slice(-30) : [],
  };
  content.push({
    type: "text",
    text: `Here is my final submission so far. Please give me a crit.\n\n${JSON.stringify(details, null, 2).slice(0, 60_000)}`,
  });

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.beta.messages.stream({
          model: "claude-opus-5-5",
          max_tokens: 16000,
          output_config: { effort: "medium" },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: SYSTEM,
          messages: [{ role: "user", content }],
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\nSorry — the AI couldn't review this submission. Try removing an image or rewording your notes."));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("\n\n(Feedback was cut short — run it again for the rest.)"));
        }
      } catch (err) {
        let message = "Something went wrong talking to the AI service. Please try again.";
        if (err instanceof Anthropic.AuthenticationError) message = "The ANTHROPIC_API_KEY in Netlify isn't valid.";
        else if (err instanceof Anthropic.RateLimitError) message = "Too many requests right now — wait a minute and try again.";
        else if (err instanceof Anthropic.BadRequestError) message = "The AI service couldn't read this submission (an image may be too large or unsupported).";
        else if (err instanceof Anthropic.APIError) message = `The AI service returned an error (${err.status}). Please try again.`;
        console.error(err);
        controller.enqueue(encoder.encode(`\n\n${message}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
};

export const config = { path: "/api/critique" };
