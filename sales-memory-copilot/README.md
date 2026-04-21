
# Sales Memory Copilot using Exabase

This is a minimal example of a **memory-first sales copilot** using Exabase, Next.js, AI SDK, shadcn-style UI (Base UI primitives), and Tailwind CSS.

You create an isolated **Exabase Base** for the demo (your `baseId` is in the URL). You paste rich call and research notes; the app turns them into **one or more durable memories**. You then **prepare the next conversation** by searching those memories and generating a short brief grounded only on what was retrieved.

## How Exabase is used in this example

- **Bases**: create a dedicated Base per demo session so all data is scoped under `/b/[baseId]` (same “URL is the key” pattern as the flashcard example).
- **Memory search**: run a relevance search over memories for a **client name** plus your prep question, then pass the hits to the LLM as context.
- **Memory creation**: after the model splits the input into focused blocks, each block is saved as its own memory (title + body) so future prep can retrieve the right slice instead of one giant blob.

## Demo

https://github.com/user-attachments/assets/f50829ce-56db-4f33-80f6-4193774b1aa0

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffuturebrowser%2Fexabase-examples%2Ftree%2Fmain%2Fsales-memory-copilot&env=OPENAI_API_KEY,EXABASE_API_KEY&envDescription=Get%20your%20EXABASE_API_KEY%20from%20your%20console&envLink=https%3A%2F%2Fconsole.exabase.io%2Fapi-keys)

## Technologies

- **Exabase**: Bases for scoped storage, Memory API for search and durable sales notes
- **Next.js**: Front-end and back-end (App Router, API routes)
- **AI SDK**: OpenAI-backed generation for capture and prep
- **shadcn-style UI**: Accessible components built on `@base-ui/react`
- **Tailwind CSS**: Styling
- **Biome**: Lint and format

## Run locally

```bash
bun install
bun run dev
```

Create `.env.local` with `EXABASE_API_KEY` and `OPENAI_API_KEY` (see `.env.example` for optional `OPENAI_MODEL` and `EXABASE_BASE_PATH`).

Open `http://localhost:3000`, click **New base** (creates a Base via `POST /api/workspaces`), then use `/b/<baseId>` to capture memories and prepare from them.
