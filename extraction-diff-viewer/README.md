# Document Diff Viewer Example

Enter two URLs or upload two files and click **Compare**. The demo app submits both to the Exabase Extraction API 
concurrently, polls until both jobs finish, then shows a side-by-side metadata comparison and a word-level text diff highlighting what changed between the two documents.

## What is Exabase Extract?

Exabase Extract turns any source into structured data with a single API call. Exabase Extract turns any source into structured data with a single API call. Send a URL, file, image, audio, or video and get clean JSON back with tables, metadata, and text hierarchy intact. No parsers to write, no edge cases to handle, no post-processing pipeline to maintain.

## How Exabase is used in this example

- Submit two URLs or files to the Extraction API concurrently, each returning a job ID.
- Poll both job states independently until each reaches a terminal state (completed or failed).
- Paginate through all extracted text chunks for each job to assemble the full document text for diffing.

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
