# Sales Memory Copilot using Exabase

This is a simple example of a memory-first sales copilot using Exabase, Next.js, AI SDK, shadcn/ui, and Tailwind CSS.

You create an isolated Exabase Base for the demo (your `baseId` is in the URL). You paste call notes and research; the app turns them into one or more memories. You then prepare the next conversation by searching those memories and generating a brief grounded on what was retrieved.

## How Exabase is used in this example

- Create a dedicated Base per demo session so everything is scoped under `/b/[baseId]`.
- Search memories for a client name and prep question, then pass the hits to the LLM as context.
- Save capture output as one or more memories so later prep can retrieve focused slices instead of one long note.

## Demo

https://github.com/user-attachments/assets/f50829ce-56db-4f33-80f6-4193774b1aa0

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffuturebrowser%2Fexabase-examples%2Ftree%2Fmain%2Fsales-memory-copilot&env=OPENAI_API_KEY,EXABASE_API_KEY&envDescription=Get%20your%20EXABASE_API_KEY%20from%20your%20console&envLink=https%3A%2F%2Fconsole.exabase.io%2Fapi-keys)

## Technologies

- Exabase: Bases for scoped isolation, memory search, and durable memory writes for sales context
- Next.js: Front-end and back-end
- AI SDK: AI capabilities (OpenAI model)
- shadcn/ui: Accessible UI components
- Tailwind CSS: Styling
- Biome: Lint and format

## Run locally

```bash
bun install
bun run dev
```

Create a `.env.local` file with `EXABASE_API_KEY` and `OPENAI_API_KEY`. Optional variables are described in `.env.example`.

Open `http://localhost:3000` and click **New base** to create an Exabase Base; you are redirected to `/b/<baseId>` where the app runs.
