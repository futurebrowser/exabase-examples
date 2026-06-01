# Extraction Explorer

Submit a URL or file to the Exabase **Extraction API**, long-poll the job until it
finishes, then browse the extracted data — metadata, caption, keywords, document/
media/web details — download all attachments as a ZIP, and lazily page through the
extracted text chunks.

Extraction is workspace-level: it works with just your API key, no base required.

## How Exabase is used in this example

- `exabase.extract.create({ url, name })` — submit a URL for extraction.
- `exabase.extract.createFromFile({ file, name })` — submit an uploaded file (server-side, streamed).
- `exabase.extract.get({ jobId })` — poll job state until terminal.
- `exabase.extract.list()` — list recent extraction jobs.
- `exabase.extract.getChunks({ jobId, start, end })` — lazy-load text chunks.
- `exabase.extract.downloadAttachments({ jobId })` — stream a ZIP of all attachments.
- `exabase.extract.reprocess({ jobId })` — retry a failed job.

The Exabase API key is server-only; the browser talks only to this app's tRPC
procedures and route handlers, which call the SDK with `getExabase()`.

## Technologies

Next.js 16, React 19, tRPC, @tanstack/react-query, Tailwind CSS v4, shadcn/ui,
biome, and `@exabase/sdk`.

## Run locally

```bash
bun install
cp .env.example .env.local   # set EXABASE_API_KEY
bun run dev
```

Open http://localhost:3000 and submit a URL or file — there is no login (demo only).
