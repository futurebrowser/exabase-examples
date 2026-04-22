"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc/react";

export default function Home() {
  const createMutation = trpc.base.create.useMutation({
    onSuccess: (payload) => {
      window.location.href = `/b/${payload.data.baseId}`;
    },
  });

  function handleCreateBase() {
    createMutation.mutate(undefined);
  }

  const error =
    createMutation.error instanceof Error
      ? createMutation.error.message
      : createMutation.error
        ? String(createMutation.error)
        : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-20">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sales Memory Copilot</CardTitle>
          <CardDescription>
            Minimal memory-first demo: prepare a meeting from existing memories,
            add new call notes, then regenerate from updated memory.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            onClick={handleCreateBase}
            disabled={createMutation.isPending}
            className="w-full sm:w-auto"
          >
            {createMutation.isPending ? "Creating..." : "New base"}
          </Button>
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
