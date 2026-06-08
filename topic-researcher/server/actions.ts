"use server";

import { Exabase } from "@exabase/sdk";

const apiKey = process.env.EXABASE_API_KEY;
const baseId = process.env.EXABASE_BASE_ID;

const api = new Exabase({
  apiKey: apiKey || "MISSING",
  baseId: baseId || undefined,
});

// Helper for raw fetch to Exabase API
async function exabaseFetch(
  endpoint: string,
  options: RequestInit = {},
  targetBaseId?: string,
) {
  const headers = new Headers(options.headers);
  headers.set("X-Api-Key", apiKey as string);
  headers.set("Content-Type", "application/json");
  if (targetBaseId || baseId) {
    headers.set("X-Exabase-Base-Id", targetBaseId || (baseId as string));
  }

  const res = await fetch(`https://api.exabase.io${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Exabase API Error (${endpoint}):`, res.status, text);
    throw new Error(`Exabase API Error: ${res.status} ${res.statusText}`);
  }

  // Some endpoints like delete might return 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

export async function createTopicResearcher(topic: string) {
  // Create a space for this topic's bookmarks
  const space = await api.spaces.create(
    { name: `Research: ${topic}`, isPrivate: true },
    { baseId: baseId as string },
  );
  const spaceId = space.id as string;

  // Create the worker inside the configured base
  const workerRes = await exabaseFetch(
    "/v2/workers",
    {
      method: "POST",
      body: JSON.stringify({
        name: `Topic Researcher: ${topic}`,
        prompt: `You are a topic researcher. Find the newest information and articles on the web about "${topic}". Save 5-10 of the best articles as exabase bookmarks.`,
        accessResourceIds: [spaceId],
      }),
    },
    baseId as string,
  );

  return { workerId: workerRes.id, baseId: spaceId };
}

export async function listWorkers() {
  const res = await exabaseFetch("/v2/workers", {
    method: "GET",
  });
  return res || [];
}

export async function runWorker(workerId: string, _spaceId: string) {
  const res = await exabaseFetch(
    `/v2/workers/${workerId}/run`,
    {
      method: "POST",
    },
    baseId as string,
  );
  return res;
}

export async function getWorkerStatus(workerId: string, chatId: string) {
  try {
    const res = await exabaseFetch(
      `/v2/workers/${workerId}/chats/${chatId}/messages`,
      {
        method: "GET",
      },
      baseId as string,
    );

    const messages = res.messages || [];
    const lastMessage = messages[messages.length - 1];

    // If the last message is from the assistant, it's done
    return {
      isRunning: lastMessage?.role !== "assistant",
      messages: messages,
    };
  } catch (err) {
    console.error("Failed to get worker status", err);
    return { isRunning: false, error: String(err) };
  }
}

export async function deleteWorker(workerId: string, workerSpaceId: string) {
  // Delete the worker
  await exabaseFetch(
    `/v2/workers/${workerId}`,
    {
      method: "DELETE",
    },
    baseId as string,
  );

  // Delete the space it was attached to
  try {
    await api.spaces.remove(
      { spaceId: workerSpaceId },
      { baseId: baseId as string },
    );
  } catch (e) {
    console.error("Error deleting space", e);
  }
}

export async function listWorkerItems(spaceId: string) {
  const params: Record<string, any> = { kind: ["bookmark", "notepad"] };
  if (spaceId !== baseId) {
    params.rootId = spaceId;
  }

  const res = await api.resources.filter(params);

  return (res.resources ?? []).map((r: any) => ({
    id: r.id,
    title: r.name ?? `Untitled ${r.kind}`,
    url: r.originUrl ?? "",
    content: r.content ?? "",
    kind: r.kind ?? "bookmark",
    createdAt: r.createdAt,
  }));
}

export async function deleteResource(resourceId: string, _spaceId: string) {
  await exabaseFetch(
    "/v2/resources/delete",
    {
      method: "POST",
      body: JSON.stringify({
        resourceIds: [resourceId],
        archive: false,
      }),
    },
    baseId as string,
  );
}
