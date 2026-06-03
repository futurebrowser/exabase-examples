"use client";

import { JobStateBadge } from "@/components/job-state-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ExtractJobDto } from "@/lib/api/schemas";

export function RecentJobs({
  jobs,
  activeId,
  onSelect,
}: {
  jobs: ExtractJobDto[];
  activeId: string | null;
  onSelect: (jobId: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent jobs</CardTitle>
        <CardDescription>Extraction jobs in this base.</CardDescription>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground">None yet.</p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {jobs.map((j) => (
              <li key={j.id}>
                <button
                  type="button"
                  onClick={() => onSelect(j.id)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/30 ${
                    j.id === activeId ? "bg-muted/40" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">
                    {j.name ?? j.url ?? j.id}
                  </span>
                  <JobStateBadge state={j.state} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
