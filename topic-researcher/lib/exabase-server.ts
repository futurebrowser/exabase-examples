import { Exabase } from "@exabase/sdk";

/**
 * Shared Exabase API key auth.
 */
export function getExabase(): Exabase {
  const apiKey = process.env.EXABASE_API_KEY;
  if (!apiKey) {
    throw new Error("EXABASE_API_KEY is not set");
  }
  return new Exabase({
    apiKey,
    basePath: process.env.EXABASE_BASE_PATH || undefined,
  });
}
