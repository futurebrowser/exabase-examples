import { openai } from "@ai-sdk/openai";
import { Kind, type ResourceDetail } from "@exabase/sdk";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateFlashcardsResponseSchema } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";
import {
  buildFlashcardContextFromDocs,
  extractPdfText,
  type FlashcardDocCandidate,
  MAX_SELECTED_DOCUMENTS,
  selectRelevantDocumentIds,
  truncateDocText,
} from "@/lib/flashcard-document-context";

function resolveOpenAiModel(): string {
  const raw = process.env.OPENAI_MODEL?.trim();
  return raw && raw.length > 0 ? raw : "gpt-4o-mini";
}

const flashcardGenerationSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
    }),
  ),
});

type RouteCtx = { params: Promise<{ baseId: string }> };
const MAX_RESOURCE_SCAN = 120;

function normalizeQuestion(front: string): string {
  const oneLine = front.replace(/\s+/g, " ").trim();
  if (!oneLine) return "";
  return oneLine.endsWith("?") ? oneLine : `${oneLine}?`;
}

function normalizeAnswer(back: string): string {
  return back.replace(/\s+/g, " ").trim();
}

function toFlashcardMemoryContent(front: string, back: string): string {
  return `${normalizeQuestion(front)}\n${normalizeAnswer(back)}`;
}

function isCompleted(state: string | null | undefined): boolean {
  return state === "completed";
}

function asCaption(resource: ResourceDetail): string | null {
  if (!("data" in resource)) return null;
  const caption = (
    resource.data as { caption?: string | null } | null | undefined
  )?.caption;
  const normalized = caption?.replace(/\s+/g, " ").trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function asPdfCandidate(
  resource: ResourceDetail,
): FlashcardDocCandidate | null {
  if (resource.kind !== "document") return null;
  if (
    !isCompleted(
      "stateProcessing" in resource ? resource.stateProcessing : null,
    )
  ) {
    return null;
  }
  const mimeType = "mimeType" in resource ? resource.mimeType : null;
  if ((mimeType ?? "").toLowerCase() !== "application/pdf") return null;
  const caption = asCaption(resource);
  if (!caption) return null;
  return {
    id: resource.id,
    name: resource.name || "(untitled)",
    caption,
  };
}

async function readPdfContext(params: {
  baseId: string;
  resourceId: string;
  name: string;
  caption: string;
}): Promise<{
  id: string;
  name: string;
  caption: string;
  text: string;
} | null> {
  const api = getExabase();
  const detail = await api.resources.get(
    { resourceId: params.resourceId },
    { baseId: params.baseId },
  );
  if (detail.kind !== "document") return null;
  if ((detail.mimeType ?? "").toLowerCase() !== "application/pdf") return null;
  const fileUrl = detail.fileUrl;
  if (!fileUrl) return null;

  const fileRes = await fetch(fileUrl);
  if (!fileRes.ok) {
    console.error(
      "[flashcards/generate] Failed to download PDF",
      params.resourceId,
      fileRes.status,
    );
    return null;
  }

  const rawText = await extractPdfText(
    Buffer.from(await fileRes.arrayBuffer()),
  );
  const text = truncateDocText(rawText);
  if (!text) return null;

  return {
    id: params.resourceId,
    name: params.name,
    caption: params.caption,
    text,
  };
}

export async function POST(request: Request, context: RouteCtx) {
  const { baseId } = await context.params;
  if (!baseId) {
    console.error("[flashcards/generate] Missing base");
    return NextResponse.json({ error: "Missing base" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { topic?: string; count?: number };

  const count = Math.min(Math.max(Number(body.count) || 8, 1), 20);
  const topic = typeof body.topic === "string" ? body.topic : "";

  const api = getExabase();
  const resources = await api.resources.filter(
    {
      kindExclude: [Kind.Folder, Kind.Notepad],
      limit: MAX_RESOURCE_SCAN,
    },
    { baseId },
  );
  const candidates = resources.resources
    .map(asPdfCandidate)
    .filter((value): value is FlashcardDocCandidate => value !== null);

  if (candidates.length === 0) {
    return NextResponse.json(
      {
        error:
          "No processed PDF documents with summaries were found. Upload PDFs and wait for processing to complete.",
      },
      { status: 400 },
    );
  }

  const selectedIds = await selectRelevantDocumentIds({
    docs: candidates,
    focus: topic,
    modelId: resolveOpenAiModel(),
  });
  const idsToRead =
    selectedIds.length > 0
      ? selectedIds
      : candidates.slice(0, MAX_SELECTED_DOCUMENTS).map((doc) => doc.id);
  const selectedDocs = idsToRead
    .map((id) => candidates.find((doc) => doc.id === id) ?? null)
    .filter((value): value is FlashcardDocCandidate => value !== null);

  const parsedDocs: Array<{
    id: string;
    name: string;
    caption: string;
    text: string;
  }> = [];
  for (const doc of selectedDocs) {
    try {
      const parsed = await readPdfContext({
        baseId,
        resourceId: doc.id,
        name: doc.name,
        caption: doc.caption,
      });
      if (parsed) parsedDocs.push(parsed);
    } catch (error) {
      console.error("[flashcards/generate] Failed to parse PDF", doc.id, error);
    }
  }

  if (parsedDocs.length === 0) {
    return NextResponse.json(
      {
        error:
          "Could not read text from selected PDF documents. Try different PDFs or wait for processing to complete.",
      },
      { status: 400 },
    );
  }

  const contextText = buildFlashcardContextFromDocs(parsedDocs);

  const { object: parsed } = await generateObject({
    model: openai(resolveOpenAiModel()),
    schema: flashcardGenerationSchema,
    temperature: 0.35,
    system:
      "You create study flashcards as clear question/answer pairs. Ground answers in the provided PDF context only.",
    prompt: `PDF context:

${contextText}

Instructions:
- Produce exactly ${count} cards.
- Front: short question that ends with a question mark.
- Back: concise answer (prefer one line).

Optional user focus: ${topic || "(none)"}`,
  });

  const cards = parsed.cards.slice(0, count);
  let created = 0;
  for (const card of cards) {
    const front = normalizeQuestion(card.front);
    const back = normalizeAnswer(card.back);
    if (!front || !back) continue;
    const content = toFlashcardMemoryContent(front, back);
    await api.memories.create(
      {
        source: "text",
        content,
        infer: false,
      } as Parameters<typeof api.memories.create>[0],
      { baseId },
    );
    created += 1;
  }

  const resBody = generateFlashcardsResponseSchema.parse({
    created,
    thinContext: parsedDocs.length < MAX_SELECTED_DOCUMENTS,
  });
  return NextResponse.json(resBody);
}
