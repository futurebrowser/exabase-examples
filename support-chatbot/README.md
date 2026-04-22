
# Personal assistant using Exabase

This is a simple example of a memory-first personal assistant using Exabase, Next.js, tRPC, AI SDK, shadcn/ui, and Tailwind CSS.

You create an isolated Exabase Base for the demo (your `baseId` is in the URL). The app lists memories for that workspace, and the chat can **search** and **add** memories so answers stay grounded in what you have stored. You can seed a small set of sample “personal” memories to try the flow quickly.

## How Exabase is used in this example

- Create a dedicated Base per demo session so everything is scoped under `/b/[baseId]`.
- Search and retrieve memories when the model needs context.
- Store new details with explicit memory creation when it makes sense to remember them.
- Surface the same data in the UI: browse memories, remove one-off entries, and optionally repopulate sample data for demos.

## Demo

https://github.com/user-attachments/assets/d1fd733d-ed92-4b9f-af26-09191cc364bd

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffuturebrowser%2Fexabase-examples%2Ftree%2Fmain%2Fsupport-chatbot&env=OPENAI_API_KEY,EXABASE_API_KEY&envDescription=Get%20your%20EXABASE_API_KEY%20from%20your%20console&envLink=https%3A%2F%2Fconsole.exabase.io%2Fapi-keys)

## Technologies

- Exabase: Bases for scoped isolation, memory search, and durable memory writes for the assistant
- Next.js: Front-end and back-end
- tRPC: Type-safe APIs for the memory list, sample memory seed, and new-base creation
- AI SDK: Streaming chat with tool calling (search and add memory)
- shadcn/ui: Accessible UI components
- Tailwind CSS: Styling
- Biome: Lint and format

## Run locally

```bash
bun install
bun run dev
```

Create a `.env.local` file with `EXABASE_API_KEY` and `OPENAI_API_KEY`. Optional variables (including the OpenAI model name) are described in `.env.example`.

Open `http://localhost:3000` and click **New base** to create an Exabase Base; you are redirected to `/b/<baseId>` where the app runs.
