// POST /api/import-syllabus — reads a class PDF (syllabus, project brief,
// assignment sheet) with Claude and returns the project, deadlines, tasks and
// deliverables it describes as JSON for the student to review.
//
// The JSON is streamed as it's generated (with whitespace heartbeats while the
// model is thinking) so long PDFs don't hit the edge timeout. If something
// goes wrong mid-stream, the body ends with "@@ERROR@@" and a message.

import Anthropic from "@anthropic-ai/sdk";
import { json, getApiKey, MISSING_KEY, friendlyError } from "../lib/claude.js";

const MAX_PDF_CHARS = 6_500_000; // base64 length, about 4.8 MB of PDF

const CHECKLIST_KEYS = ["site-plan", "floor-plans", "sections", "elevations", "details", "renderings", "diagrams", "model", "board", "other"];
const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["project", "deadlines", "tasks", "deliverables", "requirements", "warnings"],
  properties: {
    project: {
      type: "object",
      additionalProperties: false,
      required: ["name", "course", "instructor", "summary", "finalDate", "finalTime"],
      properties: {
        name: { type: "string", description: "Short project title, e.g. 'Riverside Library'. For a whole-course syllabus, the course or main project name." },
        course: { type: "string", description: "Course or studio name/code, or empty string." },
        instructor: { type: "string", description: "Instructor or tutor names, or empty string." },
        summary: { type: "string", description: "2-4 sentence plain-language summary of what the student must do." },
        finalDate: { ...nullableString, description: "Final submission / final review date as YYYY-MM-DD, or null if none." },
        finalTime: { ...nullableString, description: "Final submission time as 24h HH:MM, or null." },
      },
    },
    deadlines: {
      type: "array",
      description: "Every dated milestone: reviews, pin-ups, crits, submissions, model or drawing due dates. Do not include the final submission here; it goes in project.finalDate.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "date", "time", "type", "details", "dateInferred"],
        properties: {
          title: { type: "string" },
          date: { type: "string", description: "YYYY-MM-DD" },
          time: { ...nullableString, description: "24h HH:MM or null" },
          type: { type: "string", enum: ["submission", "review", "model", "drawing", "studio"] },
          details: { type: "string", description: "What is due or what to bring, in one sentence." },
          dateInferred: { type: "boolean", description: "True if the date was worked out (e.g. from 'Week 5' or a date without a year) rather than written explicitly." },
        },
      },
    },
    tasks: {
      type: "array",
      description: "Concrete work items the student must produce (drawings, models, research, precedent studies). Give each a due date if the document implies one.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "kind", "due", "details"],
        properties: {
          title: { type: "string" },
          kind: { type: "string", enum: ["model", "drawing", "other"] },
          due: { ...nullableString, description: "YYYY-MM-DD or null" },
          details: { type: "string" },
        },
      },
    },
    deliverables: {
      type: "array",
      description: "Items required in the final submission set. Map each to the closest checklist key, or 'other' for anything else (e.g. 'Structural axonometric', 'Written report').",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["checklistKey", "label", "requirement"],
        properties: {
          checklistKey: { type: "string", enum: CHECKLIST_KEYS },
          label: { type: "string" },
          requirement: { type: "string", description: "Exact requirement: scale, sheet size, quantity, format, e.g. 'Two sections at 1:100, one through the atrium'." },
        },
      },
    },
    requirements: {
      type: "array",
      description: "General rules from the document: sheet sizes, formats, file naming, submission method, grading criteria, word counts.",
      items: { type: "string" },
    },
    warnings: {
      type: "array",
      description: "Anything the student should double-check: ambiguous dates, assumed years, missing information.",
      items: { type: "string" },
    },
  },
};

const SYSTEM = `You read architecture school documents — syllabi, studio project briefs, assignment sheets and schedules — and turn them into an organised plan for the student.
Extract only what the document actually says. Do not invent deadlines, deliverables or requirements.
Dates: output YYYY-MM-DD. If the document gives a date without a year, or a week number with a start date, work out the date and set dateInferred to true, and add a short warning. If a date can't be worked out at all, leave it out of deadlines and mention it in warnings.
Use clear, short titles a student would write in their planner (e.g. "Interim review", "Site model 1:500 due").`;

export default async (request) => {
  if (request.method !== "POST") return json(405, { error: "Use POST." });
  const apiKey = getApiKey();
  if (!apiKey) return json(500, { error: MISSING_KEY });

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Request body must be JSON." });
  }
  const pdf = payload?.pdf;
  if (typeof pdf !== "string" || !pdf.length) return json(400, { error: "No PDF was sent." });
  if (pdf.length > MAX_PDF_CHARS) return json(413, { error: "That PDF is too large (over about 4.5 MB). Try a compressed copy or just the pages with the brief and schedule." });

  const today = typeof payload.today === "string" ? payload.today.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const context = payload.existingProject
    ? `This document will be added to the student's existing project "${String(payload.existingProject).slice(0, 120)}".`
    : "This document will become a new project.";

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      let started = false;
      // Whitespace is valid before JSON, so it keeps the connection alive while Claude reads.
      const heartbeat = setInterval(() => { if (!started) controller.enqueue(encoder.encode(" ")); }, 8000);
      try {
        const stream = client.beta.messages.stream({
          model: "claude-opus-5-5",
          max_tokens: 16000,
          output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: SYSTEM,
          messages: [{
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf } },
              { type: "text", text: `Today's date is ${today}. ${context} Extract the plan from this document.` },
            ],
          }],
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            started = true;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n@@ERROR@@The AI couldn't read this document. Try a different PDF."));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("\n@@ERROR@@This document is very long — try uploading just the brief and schedule pages."));
        }
      } catch (err) {
        console.error(err);
        controller.enqueue(encoder.encode(`\n@@ERROR@@${friendlyError(err)}`));
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
};

export const config = { path: "/api/import-syllabus" };
