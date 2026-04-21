import type { z } from "zod";
import {
  apiErrorSchema,
  createBaseResponseSchema,
  deleteAllFlashcardsResponseSchema,
  documentsResponseSchema,
  flashcardsResponseSchema,
  generateFlashcardsResponseSchema,
  uploadResponseSchema,
} from "./schemas";

export class ApiParseError extends Error {
  constructor(
    message: string,
    public readonly zodError?: z.ZodError,
  ) {
    super(message);
    this.name = "ApiParseError";
  }
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  successSchema: z.ZodType<T>,
): Promise<T> {
  const res = await fetch(input, init);
  const json = await readJson(res);

  if (!res.ok) {
    const errParsed = apiErrorSchema.safeParse(json);
    throw new Error(
      errParsed.success
        ? errParsed.data.error
        : `Request failed (${res.status})`,
    );
  }

  const parsed = successSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiParseError(
      `Invalid response: ${parsed.error.message}`,
      parsed.error,
    );
  }
  return parsed.data;
}

const baseApi = (baseId: string) => `/api/b/${baseId}`;

export function getDocuments(baseId: string) {
  return fetchJson(
    `${baseApi(baseId)}/documents`,
    undefined,
    documentsResponseSchema,
  );
}

export function getFlashcards(baseId: string) {
  return fetchJson(
    `${baseApi(baseId)}/flashcards`,
    undefined,
    flashcardsResponseSchema,
  );
}

export function deleteAllFlashcards(baseId: string) {
  return fetchJson(
    `${baseApi(baseId)}/flashcards`,
    { method: "DELETE" },
    deleteAllFlashcardsResponseSchema,
  );
}

export function postUpload(baseId: string, file: File) {
  const fd = new FormData();
  fd.set("file", file);
  return fetchJson(
    `${baseApi(baseId)}/upload`,
    { method: "POST", body: fd },
    uploadResponseSchema,
  );
}

export function postGenerateFlashcards(
  baseId: string,
  body: { topic: string; count: number },
) {
  return fetchJson(
    `${baseApi(baseId)}/flashcards/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    generateFlashcardsResponseSchema,
  );
}

export function postCreateBase() {
  return fetchJson(
    "/api/workspaces",
    { method: "POST" },
    createBaseResponseSchema,
  );
}
