import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";

import { hasOpenAiKey, resolveOpenAiModel } from "@/lib/ai";
import { personalAssistantSystemPrompt } from "@/lib/personal-assistant-system-prompt";
import { buildSupportMemoryTools } from "@/lib/server/support-chat-memory-tools";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!hasOpenAiKey()) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = body as {
    messages?: UIMessage[];
    baseId?: string;
  };

  const messages = parsed.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }

  const baseId = typeof parsed.baseId === "string" ? parsed.baseId.trim() : "";

  const tools = buildSupportMemoryTools(baseId);

  const result = streamText({
    model: openai(resolveOpenAiModel()),
    system: `${personalAssistantSystemPrompt(baseId)}`,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(12),
  });

  return result.toUIMessageStreamResponse();
}
