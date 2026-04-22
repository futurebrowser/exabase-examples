import type { ResourceDetail } from "@exabase/sdk";
import "server-only";
import { Kind } from "@exabase/sdk";

import { documentsResponseSchema } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";

function caption(r: ResourceDetail): string | null {
  if (!("data" in r)) return null;
  const block = r.data as { caption?: string | null } | null | undefined;
  return block?.caption?.trim() || null;
}

export async function listWorkspaceDocuments(baseId: string) {
  const api = getExabase();

  const res = await api.resources.filter(
    {
      kindExclude: [Kind.Folder, Kind.Notepad],
      limit: 80,
    },
    { baseId },
  );

  const documents = res.resources.map((r) => ({
    id: r.id,
    kind: r.kind,
    mimeType: r.mimeType,
    name: r.name,
    caption: caption(r),
    data: r.data,
    stateProcessing: r.stateProcessing,
  }));

  return documentsResponseSchema.parse({ documents });
}
