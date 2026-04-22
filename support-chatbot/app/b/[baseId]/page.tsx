"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
import { trpc } from "@/lib/trpc/react";
import Chat from "./_chat";

export default function Page() {
  const { baseId } = useParams();
  const baseIdStr = baseId?.toString() ?? "";

  const utils = trpc.useUtils();

  const memoriesQuery = trpc.memory.list.useQuery(
    { baseId: baseIdStr },
    { enabled: Boolean(baseIdStr), staleTime: 15_000 },
  );

  const populateMutation = trpc.memory.populateSamples.useMutation({
    onSuccess: () => {
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
              <CardTitle>Personal assistant · demo workspace</CardTitle>
              <CardDescription>
                General-purpose assistant chat. Seed personal sample memories to
                test retrieval, or chat and ask the assistant to remember new
                details.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Badge variant="outline">Session ID: {baseId}</Badge>
              <Button
                type="button"
                variant="secondary"
                className="w-fit"
                disabled={!baseIdStr || populateMutation.isPending}
                onClick={() => populateMutation.mutate({ baseId: baseIdStr })}
              >
                {populateMutation.isPending
                  ? "Adding samples…"
                  : "Populate sample memories"}
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
                No memories yet, use “Populate sample memories” above or ask the
                chat to remember something.
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
