import { Exabase } from "@exabase/sdk";
import "server-only";

/**
 * Shared Exabase API key auth — not end-user login. Extraction is workspace-level
 * and needs no base; the API key alone is enough. Fine for a demo, not multi-tenant
 * security.
 */
function requireApiKey(): string {
  const apiKey = process.env.EXABASE_API_KEY;
  if (!apiKey) {
    throw new Error("EXABASE_API_KEY is not set");
  }
  return apiKey;
}

/** Exabase client authenticated with the API key (no base scope). */
export function getExabase(): Exabase {
  return new Exabase({
    apiKey: requireApiKey(),
    basePath: process.env.EXABASE_BASE_PATH || undefined,
  });
}
