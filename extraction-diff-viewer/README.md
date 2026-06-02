# Extraction Diff Viewer using Exabase

This is a simple example of a document diff viewer using Exabase, Next.js, tRPC, shadcn/ui, and Tailwind CSS.

Enter two URLs or upload two files and click **Compare**. The app submits both to the Exabase Extraction API concurrently, polls until both jobs finish, then shows a side-by-side metadata comparison and a word-level text diff highlighting what changed between the two documents.

## How Exabase is used in this example

- Submit two URLs or files to the Extraction API concurrently, each returning a job ID.
- Poll both job states independently until each reaches a terminal state (completed or failed).
- Page through all extracted text chunks for each job to assemble the full document text for diffing.

## Technologies

- Exabase: Extraction API for submitting URLs and files, polling job state, and reading text chunks
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

Open `http://localhost:3000`, enter two URLs or drop two files, and click **Compare**.
