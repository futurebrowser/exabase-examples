import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { hasOpenAiKey, resolveOpenAiModel } from "@/lib/ai";
import { captureRequestSchema, captureResponseSchema } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";
import { memoryIdFromCreateJob } from "@/lib/memory-job";

type RouteCtx = { params: Promise<{ baseId: string }> };

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

export async function POST(request: Request, context: RouteCtx) {
  const { baseId } = await context.params;
  if (!baseId) {
    return NextResponse.json({ error: "Missing base" }, { status: 400 });
  }

  if (!hasOpenAiKey()) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const parsedBody = captureRequestSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
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

  const body = captureResponseSchema.parse({
    created,
    totalCreated: created.length,
  });
  return NextResponse.json(body);
}
