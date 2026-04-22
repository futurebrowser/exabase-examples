import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import "server-only";

import { hasOpenAiKey, resolveOpenAiModel } from "@/lib/ai";
import {
  type CaptureResponse,
  captureRequestSchema,
  captureResponseSchema,
  type PrepareResponse,
  prepareRequestSchema,
  prepareResponseSchema,
} from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";
import { memoryIdFromCreateJob } from "@/lib/memory-job";

export async function runPrepareMeeting(
  baseId: string,
  rawInput: unknown,
): Promise<PrepareResponse> {
  if (!hasOpenAiKey()) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const parsedBody = prepareRequestSchema.safeParse(rawInput);
  if (!parsedBody.success) {
    throw new Error("Invalid request body");
  }

  const { clientName, ask, limit } = parsedBody.data;
  const query =
    `${clientName} ${ask ?? "prep notes objections next step blocker"}`.trim();

  const api = getExabase();
  const searchRes = await api.memories.search(
    {
      query,
      limit,
      order: { property: "createdAt", direction: "DESC" },
    },
    { baseId },
  );

  const memoriesUsed = searchRes.hits.map((hit) => ({
    id: hit.id,
    name: hit.name ?? null,
    content: (hit.content ?? "").trim(),
    createdAt: hit.createdAt ?? null,
  }));

  const memoryText =
    memoriesUsed.length === 0
      ? "(No relevant memories found.)"
      : memoriesUsed
          .map((memory, index) => {
            const title = memory.name || `Memory ${index + 1}`;
            return `### ${title}\n${memory.content}`;
          })
          .join("\n\n");

  const { text } = await generateText({
    model: openai(resolveOpenAiModel()),
    temperature: 0.2,
    system:
      "You are a sales meeting prep copilot. Use only provided memories. Keep output concise and actionable.",
    prompt: `Client: ${clientName}
User ask: ${ask || "Prepare me for the next customer conversation."}

Memories:
${memoryText}

Return a concise prep brief with sections:
- Key context
- Risks / blockers
- Suggested questions
- Next-step recommendation`,
  });

  return prepareResponseSchema.parse({
    brief: text.trim(),
    memoriesUsed,
  });
}

function formatMemoryContent(clientName: string, formattedNotes: string) {
  return `Client: ${clientName}\n${formattedNotes.trim()}`.trim();
}

function parseMemoryBlocks(
  raw: string,
): Array<{ title: string; content: string }> {
  const matches = [...raw.matchAll(/\[MEMORY\]([\s\S]*?)\[\/MEMORY\]/g)];
  const parsed = matches
    .map((match, index) => {
      const block = match[1]?.trim() || "";
      if (!block) return null;

      const titleMatch = block.match(/^Title:\s*(.+)$/im);
      const contentMatch = block.match(/Content:\s*([\s\S]*)$/im);
      const title = titleMatch?.[1]?.trim() || `sales-memory-${index + 1}`;
      const content = contentMatch?.[1]?.trim() || block;
      if (!content) return null;

      return { title, content };
    })
    .filter(
      (value): value is { title: string; content: string } => value !== null,
    );

  if (parsed.length > 0) return parsed;

  const fallback = raw.trim();
  if (!fallback) return [];
  return [{ title: "sales-memory", content: fallback }];
}

export async function runCaptureNotes(
  baseId: string,
  rawInput: unknown,
): Promise<CaptureResponse> {
  if (!hasOpenAiKey()) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const parsedBody = captureRequestSchema.safeParse(rawInput);
  if (!parsedBody.success) {
    throw new Error("Invalid request body");
  }

  const { clientName, notes } = parsedBody.data;
  const api = getExabase();

  const { text: rawMemories } = await generateText({
    model: openai(resolveOpenAiModel()),
    temperature: 0.2,
    system:
      "You create retrieval-friendly sales memories from noisy call and research context.",
    prompt: `Client: ${clientName}

Input context (may include call transcript, research notes, CRM updates, and internal comments):
${notes}

Create multiple focused memory entries when useful (for example: business context, stakeholders, objections, risks, commitments, next steps).
Each entry should be concise and useful for future prep.

Return one or more blocks using EXACT delimiters:
[MEMORY]
Title: <short title>
Content:
Summary: <1-2 lines>
Signals:
- <bullet>
Risks:
- <bullet or n/a>
Next step:
- <bullet or n/a>
[/MEMORY]

Return plain text only.`,
  });

  const toCreate = parseMemoryBlocks(rawMemories);
  if (toCreate.length === 0) {
    toCreate.push({
      title: "sales-memory",
      content: notes.trim(),
    });
  }
  const created: Array<{
    memoryId: string;
    memoryTitle: string;
    memoryContent: string;
  }> = [];

  for (const entry of toCreate) {
    const memoryTitle = `sales-memory: ${clientName} - ${entry.title}`;
    const memoryContent = formatMemoryContent(clientName, entry.content);
    const job = await api.memories.create(
      {
        source: "text",
        content: memoryContent,
        infer: false,
      } as Parameters<typeof api.memories.create>[0],
      { baseId },
    );
    const memoryId = await memoryIdFromCreateJob(api, job, baseId);
    await api.memories.update(
      { memoryId, name: memoryTitle } as Parameters<
        typeof api.memories.update
      >[0],
      { baseId },
    );

    created.push({
      memoryId,
      memoryTitle,
      memoryContent,
    });
  }

  return captureResponseSchema.parse({
    created,
    totalCreated: created.length,
  });
}
