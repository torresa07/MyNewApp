// Shared helpers for the Netlify edge functions that call Claude.

import Anthropic from "@anthropic-ai/sdk";

export function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export function getApiKey() {
  return globalThis.Netlify?.env.get("ANTHROPIC_API_KEY") ?? globalThis.process?.env?.ANTHROPIC_API_KEY;
}

export const MISSING_KEY =
  "AI features aren't set up yet: add an ANTHROPIC_API_KEY environment variable in your Netlify site settings, then redeploy.";

export function friendlyError(err) {
  if (err instanceof Anthropic.AuthenticationError) return "The ANTHROPIC_API_KEY in Netlify isn't valid.";
  if (err instanceof Anthropic.RateLimitError) return "Too many requests right now — wait a minute and try again.";
  if (err instanceof Anthropic.BadRequestError) return "The AI service couldn't read this file (it may be too large, password-protected or unsupported).";
  if (err instanceof Anthropic.APIError) return `The AI service returned an error (${err.status}). Please try again.`;
  return "Something went wrong talking to the AI service. Please try again.";
}
