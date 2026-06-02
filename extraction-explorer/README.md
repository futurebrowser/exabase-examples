# Extraction Explorer using Exabase

This is a simple example of an extraction explorer using Exabase, Next.js, tRPC, shadcn/ui, and Tailwind CSS.

Submit a URL or upload a file; the app sends it to the Exabase Extraction API and polls until the job finishes. Browse extracted metadata, caption, keywords, and document details, page through the text chunks, download all attachments as a ZIP, and reprocess failed jobs. A webhook panel lets you configure a delivery URL and inspect or re-fire individual deliveries.

## How Exabase is used in this example

- Submit a URL or file to the Extraction API and receive a job ID.
- Poll the job state until it reaches a terminal state (completed or failed).
- List recent extraction jobs to restore previous results across page loads.
- Page through extracted text chunks lazily so large documents load incrementally.
- Stream all attachments as a ZIP download via a server-side route handler.
- Reprocess a failed job with a single click.
- Read and update the workspace webhook URL via the extraction settings API.
- List webhook delivery logs per job, inspect request and response payloads, and manually re-trigger a delivery.

## Technologies

- Exabase: Extraction API for submitting URLs and files, polling job state, reading chunks, downloading attachments, and managing webhook settings
- Next.js: Front-end and back-end
- tRPC: Type-safe API layer between client and server
- shadcn/ui: Accessible UI components
- Tailwind CSS: Styling
- Biome: Lint and format

## Run locally

```bash
bun install
cp .env.example .env.local   # set EXABASE_API_KEY
bun run dev
```

Open `http://localhost:3000` and submit a URL or drop a file — there is no login (demo only).
