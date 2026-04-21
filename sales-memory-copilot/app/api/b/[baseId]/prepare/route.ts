import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { hasOpenAiKey, resolveOpenAiModel } from "@/lib/ai";
import { prepareRequestSchema, prepareResponseSchema } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";

type RouteCtx = { params: Promise<{ baseId: string }> };

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

  const parsedBody = prepareRequestSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
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

  const body = prepareResponseSchema.parse({
    brief: text.trim(),
    memoriesUsed,
  });
  return NextResponse.json(body);
}
