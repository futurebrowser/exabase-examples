import { Exabase } from "@exabase/sdk";

let exabaseInstance: Exabase | null = null;

/**
 * Shared Exabase API key auth. Reuses the instance if already created.
 */
export function getExabase(): Exabase {
  if (exabaseInstance) {
    return exabaseInstance;
  }

  const apiKey = process.env.EXABASE_API_KEY;
  if (!apiKey) {
    throw new Error("EXABASE_API_KEY is not set");
  }

  exabaseInstance = new Exabase({
    apiKey,
    basePath: process.env.EXABASE_BASE_PATH || undefined,
    baseId: process.env.EXABASE_BASE_ID || undefined,
  });

  return exabaseInstance;
}
