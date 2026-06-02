# Simple Extraction Demo

Submit a URL or upload a file, and browse extracted metadata, caption, keywords, and document details, page through the text chunks, download all attachments as a ZIP, or reprocess any failed jobs.

The demo app sends it to the Exabase Extraction API and polls until the job finishes

A webhook panel lets you configure a delivery URL and inspect or re-fire individual deliveries.

This example showcases Exabase Extract – extract standardized, structured data from any source.

## What is Exabase Extract?

Exabase Extract turns any source into structured data with a single API call. Exabase Extract turns any source into structured data with a single API call. Send a URL, file, image, audio, or video and get clean JSON back with tables, metadata, and text hierarchy intact. No parsers to write, no edge cases to handle, no post-processing pipeline to maintain.

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
