# Topic Researcher Worker

This demo showcases how to use the Exabase **Workers API** to create background AI agents.

## Overview

The Topic Researcher allows you to spin up on-demand background agents that will autonomously scour the web for a given topic, curating and saving the best articles as bookmarks in an Exabase Base. 

This project demonstrates:
- **Base Creation**: Programmatically creating isolated bases (spaces) for specific tasks.
- **Worker Management**: Creating, listing, running, and deleting Workers via the Exabase API.
- **SDK Integration**: Using the `@exabase/sdk` to filter and list resources (bookmarks) created by the workers.

## Running the App

```bash
bun install
cp .env.example .env  # then set EXABASE_API_KEY and EXABASE_BASE_ID in .env
bun run dev
```

Navigate to `http://localhost:3000` to interact with the demo.
