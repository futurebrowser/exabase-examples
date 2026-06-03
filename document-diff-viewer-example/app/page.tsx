"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { CompareDiff } from "@/components/compare-diff";
import { CompareMeta } from "@/components/compare-meta";
import type { DiffSideValue } from "@/components/diff-side";
import { DiffSide } from "@/components/diff-side";
import { isTerminal } from "@/components/job-state-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { postUpload } from "@/lib/client/extract-rest";
import { computeWordDiff } from "@/lib/diff";
import { trpc } from "@/lib/trpc/react";

export default function Home() {
  const [inputA, setInputA] = useState<DiffSideValue | null>(null);
  const [inputB, setInputB] = useState<DiffSideValue | null>(null);
  const [jobIdA, setJobIdA] = useState<string | null>(null);
  const [jobIdB, setJobIdB] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUrlA = trpc.extract.create.useMutation({
    onSuccess: (payload) => setJobIdA(payload.data.id),
    onError: (e) => setError(e.message),
  });
  const createUrlB = trpc.extract.create.useMutation({
    onSuccess: (payload) => setJobIdB(payload.data.id),
    onError: (e) => setError(e.message),
  });
  const uploadA = useMutation({
    mutationFn: (file: File) => postUpload(file),
    onSuccess: (created) => setJobIdA(created.id),
    onError: (e: Error) => setError(e.message),
  });
  const uploadB = useMutation({
    mutationFn: (file: File) => postUpload(file),
    onSuccess: (created) => setJobIdB(created.id),
    onError: (e: Error) => setError(e.message),
  });

  const jobAQuery = trpc.extract.get.useQuery(
    { jobId: jobIdA ?? "" },
    {
      enabled: jobIdA !== null,
      refetchInterval: (query) => {
        const state = query.state.data?.data.state ?? null;
        return isTerminal(state) ? false : 1500;
      },
    },
  );
  const jobBQuery = trpc.extract.get.useQuery(
    { jobId: jobIdB ?? "" },
    {
      enabled: jobIdB !== null,
      refetchInterval: (query) => {
        const state = query.state.data?.data.state ?? null;
        return isTerminal(state) ? false : 1500;
      },
    },
  );

  const jobA = jobAQuery.data?.data ?? null;
  const jobB = jobBQuery.data?.data ?? null;
  const bothCompleted =
    jobA?.state === "completed" && jobB?.state === "completed";
  const eitherFailed = jobA?.state === "failed" || jobB?.state === "failed";

  const chunksAQuery = trpc.extract.allChunks.useQuery(
    { jobId: jobIdA ?? "" },
    { enabled: bothCompleted },
  );
  const chunksBQuery = trpc.extract.allChunks.useQuery(
    { jobId: jobIdB ?? "" },
    { enabled: bothCompleted },
  );

  const diffReady =
    bothCompleted && !chunksAQuery.isLoading && !chunksBQuery.isLoading;
  const changes = diffReady
    ? computeWordDiff(
        chunksAQuery.data?.data.text ?? "",
        chunksBQuery.data?.data.text ?? "",
      )
    : [];

  const submitting =
    createUrlA.isPending ||
    createUrlB.isPending ||
    uploadA.isPending ||
    uploadB.isPending;

  const canCompare = inputA !== null && inputB !== null && !submitting;
  const loading = comparing && !diffReady && !eitherFailed && !error;
  const showReset = comparing && (eitherFailed || error !== null);

  function handleCompare() {
    if (!inputA || !inputB) return;
    setError(null);
    setComparing(true);
    if ("url" in inputA) createUrlA.mutate({ url: inputA.url });
    else uploadA.mutate(inputA.file);
    if ("url" in inputB) createUrlB.mutate({ url: inputB.url });
    else uploadB.mutate(inputB.file);
  }

  function handleReset() {
    setInputA(null);
    setInputB(null);
    setJobIdA(null);
    setJobIdB(null);
    setComparing(false);
    setError(null);
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-6 px-4 py-16">
      <div className="space-y-1">
        <h1 className="font-semibold text-lg">Extraction Diff Viewer</h1>
        <p className="font-mono text-muted-foreground text-xs">
          Submit two items to compare their extracted content side by side.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="break-all font-mono">
            {error}
          </AlertDescription>
        </Alert>
      ) : null}

      <DiffSide label="Version A" disabled={comparing} onChange={setInputA} />
      <DiffSide label="Version B" disabled={comparing} onChange={setInputB} />

      {!comparing ? (
        <Button type="button" disabled={!canCompare} onClick={handleCompare}>
          {submitting ? "Submitting…" : "Compare"}
        </Button>
      ) : null}

      {showReset ? (
        <Button type="button" variant="outline" onClick={handleReset}>
          Reset and try again
        </Button>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : null}

      {diffReady && jobA && jobB ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <CompareMeta jobA={jobA} jobB={jobB} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Text diff</CardTitle>
            </CardHeader>
            <CardContent>
              <CompareDiff changes={changes} />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
