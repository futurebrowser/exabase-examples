# AI Flashcard generator using Exabase

This is a simple example of an AI flashcard generator using Exabase, Next.js, AI SDK, shadcn/ui, and Tailwind CSS.

Users upload PDFs, the app chooses the most relevant documents for a prompt, and the AI generates flashcards that are saved back to Exabase memories in the base.

## How Exabase is used in this example

- Store uploaded PDF files in the base.
- Extract and store a summary for each document so the LLM can choose which documents to use for flashcard generation.
- Save generated flashcards as memories for retrieval and reuse.

## Demo

https://github.com/user-attachments/assets/6a96635f-6905-479f-86ab-a1aca2025bcc

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffuturebrowser%2Fexabase-examples%2Ftree%2Fmain%2Fai-flashcard-generator&env=OPENAI_API_KEY,EXABASE_API_KEY&envDescription=Get%20your%20EXABASE_API_KEY%20from%20your%20console&envLink=https%3A%2F%2Fconsole.exabase.io%2Fapi-keys)

## Technologies

- Exabase: Headless cloud filesystem, automatic content extraction, memory generation and retrieval
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
