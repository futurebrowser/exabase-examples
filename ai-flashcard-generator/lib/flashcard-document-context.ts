import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const MAX_SELECTED_DOCUMENTS = 3;
export const MAX_DOC_CONTEXT_CHARS = 10_000;

const MAX_SUMMARY_CHARS = 1_000;

export type FlashcardDocCandidate = {
  id: string;
  name: string;
  caption: string;
};

const selectDocumentSchema = z.object({
  documentIds: z.array(z.string()).max(MAX_SELECTED_DOCUMENTS),
});

function singleLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function summarizeCaption(caption: string): string {
  const oneLine = singleLine(caption);
  if (oneLine.length <= MAX_SUMMARY_CHARS) return oneLine;
  return `${oneLine.slice(0, MAX_SUMMARY_CHARS)}…`;
}

export async function selectRelevantDocumentIds(params: {
  docs: FlashcardDocCandidate[];
  focus: string;
  modelId: string;
}): Promise<string[]> {
  const { docs, focus, modelId } = params;
  if (docs.length === 0) return [];

  const candidates = docs
    .map((doc, i) => {
      const name = doc.name || "(untitled)";
      return `${i + 1}. id=${doc.id}\nname=${name}\nsummary=${summarizeCaption(doc.caption)}`;
    })
    .join("\n\n");

  const { object } = await generateObject({
    model: openai(modelId),
    schema: selectDocumentSchema,
    temperature: 0,
    system:
      "You pick the most relevant documents for flashcard generation. Use only the IDs provided. Return up to 3 IDs.",
    prompt: `User focus: ${focus.trim() || "(none provided)"}\n\nCandidates:\n\n${candidates}\n\nReturn up to ${MAX_SELECTED_DOCUMENTS} IDs that best match the user focus. If no focus is provided, pick the most useful broad study set.`,
  });

  const allowed = new Set(docs.map((d) => d.id));
  const deduped: string[] = [];
  for (const id of object.documentIds) {
    if (!allowed.has(id) || deduped.includes(id)) continue;
    deduped.push(id);
    if (deduped.length >= MAX_SELECTED_DOCUMENTS) break;
  }
  return deduped;
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parsed = new PDFParse({
    data: buffer,
  });
  return singleLine(
    (await parsed.getText()).pages.map((p) => p.text).join("\n\n") ?? "",
  );
}

export function truncateDocText(text: string): string {
  const normalized = singleLine(text);
  if (normalized.length <= MAX_DOC_CONTEXT_CHARS) return normalized;
  return `${normalized.slice(0, MAX_DOC_CONTEXT_CHARS)}…`;
}

export function buildFlashcardContextFromDocs(
  docs: Array<{ id: string; name: string; caption: string; text: string }>,
): string {
  return docs
    .map((doc) =>
      [
        `Document ID: ${doc.id}`,
        `Title: ${doc.name || "(untitled)"}`,
        `Summary: ${doc.caption}`,
        `Extracted text:`,
        doc.text,
      ].join("\n"),
    )
    .join("\n\n---\n\n");
}
