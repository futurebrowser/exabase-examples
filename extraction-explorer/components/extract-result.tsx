"use client";

import { ExtractChunks } from "@/components/extract-chunks";
import { isTerminal, JobStateBadge } from "@/components/job-state-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WebhookLogs } from "@/components/webhook-logs";
import type { ExtractJobDto, PresignedRef } from "@/lib/api/schemas";
import { downloadHref } from "@/lib/client/extract-rest";
import { cn } from "@/lib/utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex flex-wrap justify-between gap-2 py-1">
      <span className="font-mono text-[10px] uppercase text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 break-all text-right text-xs">{value}</span>
    </div>
  );
}

function Link({ label, ref }: { label: string; ref: PresignedRef | null }) {
  if (!ref) return null;
  return (
    <Row
      label={label}
      value={
        <a
          href={ref.url}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          open
        </a>
      }
    />
  );
}

export function ExtractResult({
  job,
  onReprocess,
  reprocessing,
  webhookConfigured,
}: {
  job: ExtractJobDto;
  onReprocess: () => void;
  reprocessing: boolean;
  webhookConfigured: boolean;
}) {
  const done = job.state === "completed";

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div className="min-w-0 flex-1 space-y-1">
          <CardTitle className="break-all">{job.name ?? job.id}</CardTitle>
          <CardDescription className="break-all">
            {job.url ?? job.kind}
          </CardDescription>
        </div>
        <JobStateBadge state={job.state} />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shell fields, always available */}
        <div className="border border-border px-3 py-1">
          <Row label="kind" value={job.kind} />
          <Row label="created" value={job.createdAt} />
          {job.common ? (
            <>
              <Row label="mime" value={job.common.mimeType} />
              <Row
                label="size"
                value={job.common.size != null ? `${job.common.size} B` : null}
              />
            </>
          ) : null}
        </div>

        {job.state === "failed" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={reprocessing}
            onClick={onReprocess}
          >
            {reprocessing ? "…" : "Reprocess"}
          </Button>
        ) : null}
        {job.state === "cleaned" ? (
          <p className="font-mono text-xs text-muted-foreground">
            This item was cleaned and cannot be reprocessed.
          </p>
        ) : null}

        {/* While processing: skeletons for the not-yet-available data */}
        {!isTerminal(job.state) ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : null}

        {done && job.common ? (
          <div className="space-y-3">
            {job.common.thumbnail ? (
              // biome-ignore lint/performance/noImgElement: presigned remote URL, demo
              <img
                src={job.common.thumbnail}
                alt=""
                className="max-h-48 border border-border object-contain"
              />
            ) : null}
            {job.common.caption ? (
              <p className="text-sm">{job.common.caption}</p>
            ) : null}
            {job.common.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {job.common.keywords.map((k) => (
                  <Badge key={k} variant="outline" className="text-[10px]">
                    {k}
                  </Badge>
                ))}
              </div>
            ) : null}

            {job.document ? (
              <div className="border border-border px-3 py-1">
                <Row label="pages" value={job.document.pages} />
                <Row label="title" value={job.document.title} />
                <Row label="author" value={job.document.author} />
                <Link label="pdf render" ref={job.document.pdfRender} />
              </div>
            ) : null}

            {job.media ? (
              <div className="border border-border px-3 py-1">
                <Row
                  label="dimensions"
                  value={
                    job.media.width && job.media.height
                      ? `${job.media.width}×${job.media.height}`
                      : null
                  }
                />
                <Row label="duration" value={job.media.duration} />
                <Row label="codec" value={job.media.codec} />
                <Link label="transcript" ref={job.media.transcript} />
                <Link label="screenshot" ref={job.media.screenshot} />
                {job.media.ocr ? (
                  <Row label="ocr" value={job.media.ocr} />
                ) : null}
              </div>
            ) : null}

            {job.web ? (
              <div className="border border-border px-3 py-1">
                <Row label="title" value={job.web.title} />
                <Row label="site" value={job.web.siteName} />
                <Row label="description" value={job.web.description} />
                <Link label="image" ref={job.web.image} />
                <Link label="reader" ref={job.web.reader} />
                <Link label="html" ref={job.web.html} />
              </div>
            ) : null}

            {job.hasDownload ? (
              <a
                href={downloadHref(job.id)}
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                )}
              >
                Download attachments (ZIP)
              </a>
            ) : null}

            <ExtractChunks jobId={job.id} chunkCount={job.chunkCount} />
          </div>
        ) : null}

        {webhookConfigured ? <WebhookLogs jobId={job.id} /> : null}
      </CardContent>
    </Card>
  );
}
