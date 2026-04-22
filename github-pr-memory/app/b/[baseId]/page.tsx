"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DeleteMemoryButton } from "@/components/delete-memory";
import { MemoryItem } from "@/components/memory-item";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getStoredRepoUrl,
  setStoredRepoUrl,
} from "@/lib/client/github-repo-url";
import { trpc } from "@/lib/trpc/react";
import Chat from "./_chat";

export default function Page() {
  const { baseId } = useParams();
  const baseIdStr = baseId?.toString() ?? "";
  const [repoUrl, setRepoUrl] = useState("");

  const utils = trpc.useUtils();

  useEffect(() => {
    if (!baseIdStr) return;
    const s = getStoredRepoUrl(baseIdStr);
    if (s) {
      setRepoUrl(s);
    }
  }, [baseIdStr]);

  const memoriesQuery = trpc.memory.list.useQuery(
    { baseId: baseIdStr },
    { enabled: Boolean(baseIdStr), staleTime: 15_000 },
  );

  const populateMutation = trpc.memory.populateSamples.useMutation({
    onSuccess: () => {
      void utils.memory.list.invalidate({ baseId: baseIdStr });
    },
  });

  const ingestMutation = trpc.memory.ingestFromPublicRepo.useMutation({
    onSuccess: (res) => {
      if (res.success) {
        setStoredRepoUrl(baseIdStr, repoUrl.trim());
      }
      void utils.memory.list.invalidate({ baseId: baseIdStr });
    },
  });

  return (
    <div className="grid lg:grid-cols-2 w-full h-full ">
      <main className="flex h-screen w-full px-6 py-20 flex-col gap-6 overflow-y-auto">
        <div className="flex flex-col gap-6 max-w-3xl mx-auto shrink-0">
          <Link href={"/"}>
            <Button variant="outline" className={"w-fit"}>
              Back to home
            </Button>
          </Link>
          <Card className="shrink-0">
            <CardHeader>
              <CardTitle>GitHub PR + memory</CardTitle>
              <CardDescription>
                Paste a <strong>public</strong> GitHub repository URL. The app
                fetches up to 5 of the most recently updated PRs (issue + file
                review comments), then uses your configured OpenAI model to{" "}
                <strong>distill</strong> only durable review themes,
                preferences, and guardrails into memories. Optional{" "}
                <code className="text-xs">GITHUB_TOKEN</code> for higher GitHub
                rate limits.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="repo-url">
                  Repository URL (saved in this browser)
                </Label>
                <Input
                  id="repo-url"
                  type="url"
                  name="repoUrl"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  onBlur={() => {
                    if (baseIdStr && repoUrl.trim()) {
                      setStoredRepoUrl(baseIdStr, repoUrl);
                    }
                  }}
                  placeholder="https://github.com/owner/repo"
                  className="font-mono text-sm"
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  className="w-fit"
                  disabled={
                    !baseIdStr || ingestMutation.isPending || !repoUrl.trim()
                  }
                  onClick={() =>
                    ingestMutation.mutate({ baseId: baseIdStr, repoUrl })
                  }
                >
                  {ingestMutation.isPending
                    ? "Fetching & synthesizing…"
                    : "Ingest & synthesize from PRs"}
                </Button>
                <p className="text-xs text-muted-foreground sm:max-w-md">
                  Unauthenticated GitHub access works for public data but is
                  rate-limited; a token is recommended.
                </p>
              </div>
              <Badge variant="outline">Session ID: {baseId}</Badge>
              {ingestMutation.error ? (
                <Alert variant="destructive">
                  <AlertTitle>Could not ingest from GitHub</AlertTitle>
                  <AlertDescription>
                    {ingestMutation.error.message}
                  </AlertDescription>
                </Alert>
              ) : null}
              {ingestMutation.data?.success ? (
                <p className="text-xs text-muted-foreground">
                  {ingestMutation.data.message} (
                  {ingestMutation.data.data.created} created)
                </p>
              ) : null}
            </CardContent>
          </Card>
          <Card className="shrink-0">
            <CardHeader>
              <CardTitle>Demo data</CardTitle>
              <CardDescription>
                Seeded, fictional PR thread snippets to try retrieval before
                hitting the GitHub API.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button
                type="button"
                variant="secondary"
                className="w-fit"
                disabled={!baseIdStr || populateMutation.isPending}
                onClick={() => populateMutation.mutate({ baseId: baseIdStr })}
              >
                {populateMutation.isPending
                  ? "Adding samples…"
                  : "Populate sample PR memories"}
              </Button>
              {populateMutation.error ? (
                <Alert variant="destructive">
                  <AlertTitle>Could not seed memories</AlertTitle>
                  <AlertDescription>
                    {populateMutation.error.message}
                  </AlertDescription>
                </Alert>
              ) : null}
              {populateMutation.data?.success ? (
                <p className="text-xs text-muted-foreground">
                  {populateMutation.data.message}.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Memories in this base
              </h2>
              <Button
                variant="outline"
                className="w-fit"
                onClick={() => void memoriesQuery.refetch()}
                disabled={memoriesQuery.isFetching}
              >
                {memoriesQuery.isFetching ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
            {memoriesQuery.isPending ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : null}
            {memoriesQuery.error ? (
              <Alert variant="destructive">
                <AlertTitle>Could not load memories</AlertTitle>
                <AlertDescription>
                  {memoriesQuery.error.message}
                </AlertDescription>
              </Alert>
            ) : null}
            {memoriesQuery.data?.success &&
            memoriesQuery.data.data.length === 0 ? (
              <p className="text-xs text-muted-foreground p-8 max-w-lg text-center mx-auto">
                No memories yet. Ingest a public repo, use “Populate sample PR
                memories”, or ask the chat to remember a follow-up in{" "}
                <strong>addMemory</strong>.
              </p>
            ) : null}
            {memoriesQuery.data?.success &&
            memoriesQuery.data.data.length > 0 ? (
              <ul className="flex flex-col gap-2 pr-1">
                {memoriesQuery.data.data.map((memory) => (
                  <li key={memory.id} className="flex items-center gap-4">
                    <MemoryItem memory={memory} className="flex-1" />
                    <DeleteMemoryButton
                      memoryId={memory.id}
                      baseId={baseIdStr}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </main>
      <aside className="w-full h-screen bg-card lg:border-l border-t lg:border-t-0">
        {baseId ? <Chat baseId={baseId?.toString()} /> : "No session ID"}
      </aside>
    </div>
  );
}
