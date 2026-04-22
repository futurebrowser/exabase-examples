"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FlashcardPreview } from "@/components/flashcard-preview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/react";
import { postUploadPdf } from "@/lib/upload-rest";
import { cn } from "@/lib/utils";

function processingLabel(state: string | null): string {
  if (!state) return "ready";
  if (state === "completed") return "ready";
  if (state === "failed") return "failed";
  return state;
}

function statusBadgeVariant(
  label: string,
): "secondary" | "destructive" | "outline" {
  if (label === "failed") return "destructive";
  if (label === "ready") return "secondary";
  return "outline";
}

function documentsNeedPoll(
  data: { documents: { stateProcessing: string | null }[] } | undefined | null,
): boolean {
  if (!data?.documents.length) return false;
  return data.documents.some((d) => {
    const s = d.stateProcessing;
    return s === "pending" || s === "processing";
  });
}

export function Page({ baseId }: { baseId: string }) {
  const utils = trpc.useUtils();
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(8);
  const [notice, setNotice] = useState<string | null>(null);

  const documentsQuery = trpc.flashcard.documents.useQuery(
    { baseId },
    {
      refetchInterval: (query) =>
        documentsNeedPoll(query.state.data?.data) ? 4000 : false,
    },
  );

  const flashcardsQuery = trpc.flashcard.flashcards.useQuery(
    { baseId },
    { refetchInterval: 10_000 },
  );

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) =>
      Promise.all(files.map((file) => postUploadPdf(baseId, file))),
    onSuccess: (data) => {
      setNotice(
        data.length === 1
          ? `Uploaded PDF: ${data[0]?.name ?? "file.pdf"}`
          : `Uploaded ${data.length} PDFs.`,
      );
      void utils.flashcard.documents.invalidate({ baseId });
    },
  });

  const generateMutation = trpc.flashcard.generate.useMutation({
    onSuccess: (data) => {
      if (data.data.thinContext) {
        setNotice(
          `Created ${data.data.created} cards. Context was limited — try again after PDF processing completes.`,
        );
      } else {
        setNotice(`Created ${data.data.created} cards.`);
      }
      void utils.flashcard.flashcards.invalidate({ baseId });
    },
  });

  const deleteAllMutation = trpc.flashcard.deleteAll.useMutation({
    onSuccess: (data) => {
      setNotice(`Deleted ${data.data.deleted} flashcard(s).`);
      void utils.flashcard.flashcards.invalidate({ baseId });
    },
  });

  const documents = documentsQuery.data?.data.documents ?? [];
  const flashcards = flashcardsQuery.data?.data.flashcards ?? [];
  const uploadingCount = uploadMutation.variables?.length ?? 0;

  const busy =
    uploadMutation.isPending ||
    generateMutation.isPending ||
    deleteAllMutation.isPending;

  const queryError = useMemo(() => {
    const dErr = documentsQuery.error;
    const fErr = flashcardsQuery.error;
    if (dErr instanceof Error) return dErr.message;
    if (fErr instanceof Error) return fErr.message;
    return null;
  }, [documentsQuery.error, flashcardsQuery.error]);

  const mutationError = useMemo(() => {
    const u = uploadMutation.error;
    const g = generateMutation.error;
    const d = deleteAllMutation.error;
    if (u instanceof Error) return u.message;
    if (g instanceof Error) return g.message;
    if (d instanceof Error) return d.message;
    return null;
  }, [uploadMutation.error, generateMutation.error, deleteAllMutation.error]);

  const err = queryError ?? mutationError;

  async function refreshAll() {
    setNotice(null);
    await Promise.all([
      utils.flashcard.documents.invalidate({ baseId }),
      utils.flashcard.flashcards.invalidate({ baseId }),
    ]);
  }

  async function refreshFlashcards() {
    setNotice(null);
    await utils.flashcard.flashcards.invalidate({ baseId });
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-6 px-4 py-16">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "w-fit",
        )}
      >
        Back to home
      </Link>
      <Card>
        <CardHeader className="flex min-w-0 flex-row flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle>Base</CardTitle>
            <CardDescription>
              Link-only access (demo). Anyone with this URL can use this base.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard.writeText(
                window?.location.href ?? `/b/${baseId}`,
              );
              setNotice("Copied URL");
            }}
          >
            Copy URL
          </Button>
        </CardHeader>
        <CardContent className="min-w-0">
          <Badge variant="outline">
            {window?.location.href ?? `/b/${baseId}`}
          </Badge>
        </CardContent>
      </Card>

      {err ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="break-all font-mono">
            {err}
          </AlertDescription>
        </Alert>
      ) : null}
      {notice ? (
        <Alert>
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription className="break-all font-mono">
            {notice}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
          <CardDescription>
            Upload PDF files to Exabase (presigned URL, then register).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            id={`upload-${baseId}`}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="sr-only size-0"
            disabled={busy}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (files.length > 0) uploadMutation.mutate(files);
            }}
          />
          <Label
            htmlFor={`upload-${baseId}`}
            className={cn(
              "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border px-4 py-8 text-center transition-colors hover:bg-muted/30",
              busy && "pointer-events-none opacity-50",
            )}
          >
            {uploadMutation.isPending ? (
              <span
                role="status"
                aria-live="polite"
                className="text-xs text-muted-foreground"
              >
                Uploading {uploadingCount || "selected"} file
                {uploadingCount === 1 ? "" : "s"}...
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Drop or choose PDF file(s)
              </span>
            )}
          </Label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex min-w-0 flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <div className="min-w-0">
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Processing state from Exabase.
              {documentsQuery.isFetching ? " Updating…" : null}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="font-mono"
            onClick={() => void refreshAll()}
          >
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-0">
          {documentsQuery.isLoading ? (
            <p className="font-mono text-xs text-muted-foreground">Loading…</p>
          ) : documents.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">None yet.</p>
          ) : (
            <ul className="min-w-0 divide-y divide-border rounded-none border border-border">
              {documents.map((d) => {
                const label = processingLabel(d.stateProcessing);
                return (
                  <li key={d.id}>
                    <span className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <span className="min-w-0 flex-1 truncate font-mono text-xs">
                        {d.name ?? d.id}
                      </span>
                      <Badge
                        variant={statusBadgeVariant(label)}
                        className="shrink-0 text-[10px] uppercase"
                      >
                        {label}
                      </Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate flashcards</CardTitle>
          <CardDescription>
            AI selects up to 3 relevant PDF summaries, reads those PDFs, then
            saves each generated card as a memory.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Focus (optional)</Label>
            <Input
              id="topic"
              type="text"
              placeholder="Topic or keywords"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="count">Count</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-20 font-mono"
              />
            </div>
            <Button
              type="button"
              disabled={busy}
              onClick={() => {
                setNotice(null);
                generateMutation.mutate({
                  baseId,
                  topic,
                  count,
                });
              }}
            >
              {generateMutation.isPending ? "…" : "Generate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex min-w-0 flex-row flex-wrap items-start justify-between gap-2 space-y-0">
          <div className="min-w-0">
            <CardTitle>Flashcards</CardTitle>
            <CardDescription>
              Pick a card number, then click the preview card to flip it.
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="font-mono"
              onClick={() => void refreshFlashcards()}
            >
              Refresh
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={flashcards.length === 0 || busy}
              onClick={() => {
                if (
                  !confirm(
                    "Delete all flashcards in this base? This cannot be undone.",
                  )
                ) {
                  return;
                }
                setNotice(null);
                deleteAllMutation.mutate({ baseId });
              }}
            >
              {deleteAllMutation.isPending ? "…" : "Delete all"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {flashcardsQuery.isLoading ? (
            <p className="font-mono text-xs text-muted-foreground">Loading…</p>
          ) : (
            <FlashcardPreview flashcards={flashcards} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
