"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { ExtractInput } from "@/components/extract-input";
import { ExtractResult } from "@/components/extract-result";
import { isTerminal } from "@/components/job-state-badge";
import { RecentJobs } from "@/components/recent-jobs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { postUpload } from "@/lib/client/extract-rest";
import { trpc } from "@/lib/trpc/react";

export default function Home() {
  const utils = trpc.useUtils();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const listQuery = trpc.extract.list.useQuery({});

  const jobQuery = trpc.extract.get.useQuery(
    { jobId: activeJobId ?? "" },
    {
      enabled: activeJobId !== null,
      refetchInterval: (query) => {
        const state = query.state.data?.data.state ?? null;
        return isTerminal(state) ? false : 1500;
      },
    },
  );

  const job = jobQuery.data?.data ?? null;
  const jobId = job?.id;
  const jobState = job?.state;

  // Refresh the recent-jobs list once a polled job reaches a terminal state.
  useEffect(() => {
    if (jobId && isTerminal(jobState ?? null)) {
      void utils.extract.list.invalidate();
    }
  }, [jobId, jobState, utils]);

  const createUrlMutation = trpc.extract.create.useMutation({
    onSuccess: (payload) => {
      setNotice(`Submitted: ${payload.data.url ?? payload.data.id}`);
      setActiveJobId(payload.data.id);
      void utils.extract.list.invalidate();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => postUpload(file),
    onSuccess: (created) => {
      setNotice(`Submitted: ${created.name ?? created.id}`);
      setActiveJobId(created.id);
      void utils.extract.list.invalidate();
    },
  });

  const reprocessMutation = trpc.extract.reprocess.useMutation({
    onSuccess: () => {
      setNotice("Reprocessing triggered.");
      if (activeJobId)
        void utils.extract.get.invalidate({ jobId: activeJobId });
    },
  });

  const busy = uploadMutation.isPending || createUrlMutation.isPending;

  const err =
    (createUrlMutation.error instanceof Error &&
      createUrlMutation.error.message) ||
    (uploadMutation.error instanceof Error && uploadMutation.error.message) ||
    (reprocessMutation.error instanceof Error &&
      reprocessMutation.error.message) ||
    (jobQuery.error instanceof Error && jobQuery.error.message) ||
    (listQuery.error instanceof Error && listQuery.error.message) ||
    null;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-xl flex-col gap-6 px-4 py-16">
      <div className="space-y-1">
        <h1 className="font-semibold text-lg">Extraction Explorer</h1>
        <p className="font-mono text-muted-foreground text-xs">
          Submit a URL or file to Exabase Extraction. No login, no base — just
          your API key.
        </p>
      </div>

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

      <ExtractInput
        busy={busy}
        onSubmitUrl={(url) => {
          setNotice(null);
          createUrlMutation.mutate({ url });
        }}
        onSubmitFile={(file) => {
          setNotice(null);
          uploadMutation.mutate(file);
        }}
      />

      {job ? (
        <ExtractResult
          key={job.id}
          job={job}
          reprocessing={reprocessMutation.isPending}
          onReprocess={() => {
            if (activeJobId) reprocessMutation.mutate({ jobId: activeJobId });
          }}
        />
      ) : null}

      <RecentJobs
        jobs={listQuery.data?.data.items ?? []}
        activeId={activeJobId}
        onSelect={(id) => {
          setNotice(null);
          setActiveJobId(id);
        }}
      />
    </div>
  );
}
