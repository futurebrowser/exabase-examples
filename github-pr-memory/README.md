# GitHub PR memory using Exabase

This is a simple example of ingesting public pull-request discussion and review comments into Exabase memories, then chatting with that context using Exabase, Next.js, tRPC, AI SDK, shadcn/ui, and Tailwind CSS.

You create an isolated Exabase Base (your `baseId` is in the URL). Paste a **public** `github.com` repository URL, then **Ingest & synthesize from PRs** to load recent issue-thread and file-level review text from up to five of the most recently updated pull requests. An OpenAI model (via the AI SDK) **reads** that text and only creates memories for high-signal, durable team knowledge—review themes, conventions, things to avoid, and similar—rather than one memory per raw comment. The chat can **search** and **add** more memories. **Populate sample PR memories** is a no-GitHub demo pack.

## How Exabase is used in this example

- Create a dedicated Base per demo session so everything is scoped under `/b/[baseId]`.
- **create** memories by combining the GitHub REST API (fetch) with a structured `generateObject` call that filters and condenses review discussion into a small set of plain-text memories (`infer: false` on Exabase create).
- **search** and **add** from the chat so the assistant can reason over that distilled context and store new follow-ups.

## Demo

This README does not include a screencast. Run the app, create a base, optional sample seed, then ingest a public repo and ask the chat about review decisions or nits.

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffuturebrowser%2Fexabase-examples%2Ftree%2Fmain%2Fgithub-pr-memory&env=OPENAI_API_KEY,EXABASE_API_KEY&envDescription=Get%20your%20EXABASE_API_KEY%20from%20your%20console&envLink=https%3A%2F%2Fconsole.exabase.io%2Fapi-keys)

Add `GITHUB_TOKEN` in the Vercel project settings if you hit unauthenticated GitHub rate limits; public data does not require a token but limits are low.

## Technologies

- Exabase: Bases for scoped isolation, batch memory creation, search, and writes
- Next.js: Front-end and back-end
- tRPC: Type-safe APIs for memory list, sample seed, GitHub ingest, and new-base creation
- GitHub REST API: Public repository pulls, issues comments, and pull review comments
- AI SDK: Structured synthesis (`generateObject`) for ingest, plus streaming chat and tool calling (search and add memory)
- shadcn/ui: Accessible UI components
- Tailwind CSS: Styling
- Biome: Lint and format

## Run locally

```bash
bun install
bun run dev
```

Create a `.env.local` file with `EXABASE_API_KEY` and `OPENAI_API_KEY`. Optional: `OPENAI_MODEL`, `GITHUB_TOKEN` (see `.env.example`).

Open `http://localhost:3000` and click **New base**; you are redirected to `/b/<baseId>` where the app runs.
