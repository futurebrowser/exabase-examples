import type { z } from "zod";
import {
  apiErrorSchema,
  createWorkspaceResponseSchema,
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

const w = (workspaceId: string) => `/api/w/${workspaceId}`;

export function getDocuments(workspaceId: string) {
  return fetchJson(
    `${w(workspaceId)}/documents`,
    undefined,
    documentsResponseSchema,
  );
}

export function getFlashcards(workspaceId: string) {
  return fetchJson(
    `${w(workspaceId)}/flashcards`,
    undefined,
    flashcardsResponseSchema,
  );
}

export function deleteAllFlashcards(workspaceId: string) {
  return fetchJson(
    `${w(workspaceId)}/flashcards`,
    { method: "DELETE" },
    deleteAllFlashcardsResponseSchema,
  );
}

export function postUpload(workspaceId: string, file: File) {
  const fd = new FormData();
  fd.set("file", file);
  return fetchJson(
    `${w(workspaceId)}/upload`,
    { method: "POST", body: fd },
    uploadResponseSchema,
  );
}

export function postGenerateFlashcards(
  workspaceId: string,
  body: { topic: string; count: number },
) {
  return fetchJson(
    `${w(workspaceId)}/flashcards/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    generateFlashcardsResponseSchema,
  );
}

export function postCreateWorkspace() {
  return fetchJson(
    "/api/workspaces",
    { method: "POST" },
    createWorkspaceResponseSchema,
  );
}
