import "server-only";
import { Exabase } from "@exabase/sdk";

/**
 * Shared Exabase API key auth — not end-user login. Base access is whoever has
 * the URL (`/b/:baseId`); fine for a demo, not multi-tenant security.
 */
export function getExabase(): Exabase {
  const apiKey = process.env.EXABASE_API_KEY;
  if (!apiKey) {
    throw new Error("EXABASE_API_KEY is not set");
  }
  return new Exabase({
    apiKey,
    basePath: process.env.EXABASE_BASE_PATH || undefined,
    middleware: [
      {
        post: async (context) => {
          let response = "";
          try {
            response = JSON.stringify(await context.response.json(), null, 2);
          } catch {
            response = await context.response.text();
          }
          const init = context.init;
          const url = context.url;
          const status = context.response.status;
          console.log(
            "\n\n####### RESPONSE FROM EXABASE API #######\nUrl: ",
            url,
            "\nStatus: ",
            status,
            "\nInit: ",
            init,
            "\n\nResponse:\n",
            response,
          );
        },
      },
    ],
  });
}
