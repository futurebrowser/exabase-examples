"use server";

import { Exabase } from "@exabase/sdk";

// Lazily initialize the API to ensure environment variables are correctly loaded
let apiInstance: Exabase | null = null;
function getApi() {
  if (!apiInstance) {
    apiInstance = new Exabase({
      apiKey: process.env.EXABASE_API_KEY || "MISSING",
      baseId: process.env.EXABASE_BASE_ID || undefined,
    });
  }
  return apiInstance;
}

export async function createTopicResearcher(topic: string) {
  const api = getApi();
  const baseId = process.env.EXABASE_BASE_ID;
  // Create a space for this topic's bookmarks
  const space = await api.folders.create(
    { name: `Research: ${topic}`, isPrivateRoot: true },
    { baseId: baseId as string },
  );
  const spaceId = space.id as string;

  // Create the worker inside the configured base
  const workerRes = await api.workers.create(
    {
      name: `Topic Researcher: ${topic}`,
      prompt: `You are a topic researcher. Find the newest information and articles on the web about "${topic}". Save 5-10 of the best articles as exabase bookmarks.`,
      accessResourceIds: [spaceId],
      frequency: null,
      day: null,
      hour: null,
    },
    { baseId: baseId as string },
  );

  return { workerId: workerRes.id, baseId: spaceId };
}

export async function listWorkers() {
  const api = getApi();
  const baseId = process.env.EXABASE_BASE_ID;
  const res = await api.workers.list({}, { baseId: baseId as string });
  return Array.isArray(res) ? res : [];
}

export async function runWorker(workerId: string, _spaceId: string) {
  const api = getApi();
  const baseId = process.env.EXABASE_BASE_ID;
  const res = await api.workers.run({ workerId }, { baseId });
  return res;
}

export async function getWorkerStatus(workerId: string, chatId: string) {
  const api = getApi();
  const baseId = process.env.EXABASE_BASE_ID;
  try {
    const res = await api.workers.listMessages(
      { workerId, chatId },
      { baseId: baseId as string },
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
  const api = getApi();
  const baseId = process.env.EXABASE_BASE_ID;
  // Delete the worker
  await api.workers.remove({ workerId }, { baseId: baseId as string });

  // Delete the space it was attached to
  try {
    await api.spaces.remove(
      { spaceId: workerSpaceId },
      { baseId },
    );
  } catch (e) {
    console.error("Error deleting space", e);
  }
}

export async function listWorkerItems(folderId: string) {
  const api = getApi();
  const baseId = process.env.EXABASE_BASE_ID;

  const res = await api.resources.filter(
    {
      kind: ["bookmark"],
      parentId: folderId,
    },
    { baseId },
  );

  return (res.resources ?? []).map((r) => ({
    id: r.id,
    title: r.name ?? `Untitled ${r.kind}`,
    url: r.originUrl ?? "",
    kind: r.kind ?? "bookmark",
    createdAt: r.createdAt,
  }));
}

export async function deleteResource(resourceId: string, _spaceId: string) {
  const api = getApi();
  const baseId = process.env.EXABASE_BASE_ID;
  await api.resources.remove(
    {
      resourceIds: [resourceId],
      archive: false,
    },
    { baseId },
  );
}
