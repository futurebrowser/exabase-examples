"use client";

import { Badge } from "@/components/ui/badge";
import type { ExtractJobDto } from "@/lib/api/schemas";

function MetaRow({
  label,
  a,
  b,
}: {
  label: string;
  a: React.ReactNode;
  b: React.ReactNode;
}) {
  if (a == null && b == null) return null;
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-1 pr-4 font-mono text-[10px] uppercase text-muted-foreground">
        {label}
      </td>
      <td className="py-1 pr-4 text-right text-xs">{a ?? "—"}</td>
      <td className="py-1 text-right text-xs">{b ?? "—"}</td>
    </tr>
  );
}

export function CompareMeta({
  jobA,
  jobB,
}: {
  jobA: ExtractJobDto;
  jobB: ExtractJobDto;
}) {
  const kwA = new Set(jobA.common?.keywords ?? []);
  const kwB = new Set(jobB.common?.keywords ?? []);
  const shared = [...kwA].filter((k) => kwB.has(k));
  const onlyA = [...kwA].filter((k) => !kwB.has(k));
  const onlyB = [...kwB].filter((k) => !kwA.has(k));

  return (
    <div className="space-y-4">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-1 text-left font-mono text-[10px] uppercase text-muted-foreground" />
            <th className="pb-1 text-right font-mono text-[10px] uppercase text-muted-foreground">
              A
            </th>
            <th className="pb-1 text-right font-mono text-[10px] uppercase text-muted-foreground">
              B
            </th>
          </tr>
        </thead>
        <tbody>
          <MetaRow label="Kind" a={jobA.kind} b={jobB.kind} />
          <MetaRow
            label="MIME"
            a={jobA.common?.mimeType}
            b={jobB.common?.mimeType}
          />
          <MetaRow
            label="Size"
            a={jobA.common?.size != null ? `${jobA.common.size} B` : null}
            b={jobB.common?.size != null ? `${jobB.common.size} B` : null}
          />
          <MetaRow
            label="Pages"
            a={jobA.document?.pages}
            b={jobB.document?.pages}
          />
          <MetaRow
            label="Title"
            a={jobA.document?.title}
            b={jobB.document?.title}
          />
          <MetaRow
            label="Author"
            a={jobA.document?.author}
            b={jobB.document?.author}
          />
          <MetaRow
            label="Duration"
            a={jobA.media?.duration}
            b={jobB.media?.duration}
          />
          <MetaRow label="Created" a={jobA.createdAt} b={jobB.createdAt} />
          <MetaRow label="Chunks" a={jobA.chunkCount} b={jobB.chunkCount} />
        </tbody>
      </table>

      {(shared.length > 0 || onlyA.length > 0 || onlyB.length > 0) && (
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase text-muted-foreground">
            Keywords
          </p>
          {shared.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {shared.map((k) => (
                <Badge key={k} variant="outline" className="text-[10px]">
                  {k}
                </Badge>
              ))}
            </div>
          )}
          {onlyA.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {onlyA.map((k) => (
                <Badge
                  key={k}
                  className="border-red-200 bg-red-100 text-[10px] text-red-800"
                >
                  {k}
                </Badge>
              ))}
            </div>
          )}
          {onlyB.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {onlyB.map((k) => (
                <Badge
                  key={k}
                  className="border-green-200 bg-green-100 text-[10px] text-green-800"
                >
                  {k}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
