/**
 * Shared Anthropic client.
 *
 * Sets NODE_TLS_REJECT_UNAUTHORIZED=0 in development to handle corporate
 * SSL inspection proxies that re-sign certificates with a local CA that
 * Node.js doesn't trust by default. This is safe in a local dev context;
 * never set this in production.
 */

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic();
