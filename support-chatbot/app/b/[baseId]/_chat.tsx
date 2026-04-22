"use client";

import { useChat } from "@ai-sdk/react";
import { RiErrorWarningLine } from "@remixicon/react";
import {
  DefaultChatTransport,
  getToolName,
  isToolUIPart,
  type UIMessage,
} from "ai";
import { Loader2Icon } from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const STARTER_PROMPTS = [
  "What do you remember about my family and kids' schedules this week?",
  "Based on my work profile, what should I focus on in tomorrow's leadership meeting?",
  "What are my recurring personal commitments and how should I plan around them?",
  "What strengths do I have that I should highlight in my performance review?",
  "Using what you know about my routine, draft a realistic plan for tomorrow.",
];

function renderUserMessageParts(message: UIMessage): ReactNode[] {
  const nodes: ReactNode[] = [];
  let ordinal = 0;
  for (const part of message.parts) {
    if (part.type !== "text") continue;
    const key = `${message.id}-text-${ordinal}`;
    ordinal += 1;
    nodes.push(
      <span key={key} className="whitespace-pre-wrap">
        {part.text}
      </span>,
    );
  }
  return nodes;
}

function renderAssistantMessageParts(message: UIMessage): ReactNode[] {
  const nodes: ReactNode[] = [];
  let ordinal = 0;
  for (const part of message.parts) {
    const key = `${message.id}-p-${ordinal}`;
    ordinal += 1;

    if (part.type === "text") {
      nodes.push(<MessageResponse key={key}>{part.text}</MessageResponse>);
      continue;
    }

    if (isToolUIPart(part)) {
      const name = getToolName(part);

      let argsJson: string | null = null;
      if ("input" in part && part.input !== undefined) {
        try {
          argsJson = JSON.stringify(
            part.input as Record<string, unknown>,
            null,
            2,
          );
        } catch {
          argsJson = String(part.input);
        }
      }

      let body: string;
      if (part.state === "output-available") {
        body = JSON.stringify(part.output, null, 2);
      } else if (part.state === "output-error") {
        body = part.errorText ?? "Tool error";
      } else {
        body = `… (${part.state})`;
      }

      nodes.push(
        <div
          key={key}
          className="border border-border bg-muted/35 px-3 py-2 text-xs"
        >
          <div className="font-medium text-muted-foreground">{name}</div>
          {argsJson !== null ? (
            <div className="mt-2 space-y-1 border-b border-border/50 pb-2">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {name === "searchMemory" ? "Search" : "Arguments"}
              </div>
              <pre className="max-h-28 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-snug text-muted-foreground">
                {argsJson}
              </pre>
            </div>
          ) : null}
          <div className="mt-2 space-y-1">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Result
            </div>
            <pre className="max-h-36 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-snug">
              {body}
            </pre>
          </div>
        </div>,
      );
    }
  }
  return nodes;
}

function renderMessageParts(message: UIMessage): ReactNode[] {
  return message.role === "user"
    ? renderUserMessageParts(message)
    : renderAssistantMessageParts(message);
}

export default function Chat({ baseId }: { baseId: string }) {
  const [input, setInput] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { baseId },
      }),
    [baseId],
  );

  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    clearError,
    setMessages,
  } = useChat({ transport });

  const busy = status === "submitted" || status === "streaming";

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || busy) return;
      clearError();
      sendMessage({ text });
      setInput("");
    },
    [input, busy, sendMessage, clearError],
  );

  const onSuggestion = useCallback(
    (suggestion: string) => {
      clearError();
      sendMessage({ text: suggestion });
    },
    [sendMessage, clearError],
  );

  const newConversation = useCallback(() => {
    stop();
    clearError();
    setMessages([]);
  }, [stop, clearError, setMessages]);

  return (
    <Card className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden ring-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>Chat</CardTitle>
        <Button
          type="button"
          variant="outline"
          className="w-fit shrink-0"
          onClick={newConversation}
        >
          New conversation
        </Button>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 p-0">
        {error ? (
          <Alert
            className="mx-4 mt-4 border-destructive/50"
            variant="destructive"
          >
            <RiErrorWarningLine className="size-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{error.message}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => clearError()}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <Conversation className="min-h-0 flex-1">
          <ConversationContent className="pb-16 md:pb-20">
            {messages.length === 0 ? (
              <div className="flex flex-col text-base gap-4 py-4">
                <p className="leading-relaxed text-muted-foreground">
                  This chat is a general personal assistant. It helps with
                  planning, reminders, work context, and day-to-day questions.
                  It can search and save memories in this workspace so responses
                  stay tailored to you.
                </p>
                <p className="text-muted-foreground">
                  Try a suggestion below or type your own question.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>{renderMessageParts(message)}</MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="shrink-0 space-y-3 bg-card p-4 overflow-hidden">
          <Suggestions className="gap-2 max-w-0">
            {STARTER_PROMPTS.map((prompt) => (
              <Suggestion
                key={prompt}
                suggestion={prompt}
                onClick={onSuggestion}
                disabled={busy}
              />
            ))}
          </Suggestions>

          <form onSubmit={onSubmit} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              disabled={busy}
              autoComplete="off"
              name="message"
            />
            {busy ? (
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={() => stop()}
              >
                Stop
              </Button>
            ) : (
              <Button
                type="submit"
                className="shrink-0"
                disabled={!input.trim()}
              >
                Send
              </Button>
            )}
            {status === "submitted" ? (
              <Loader2Icon
                className="size-4 shrink-0 animate-spin text-muted-foreground"
                aria-hidden
              />
            ) : null}
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
