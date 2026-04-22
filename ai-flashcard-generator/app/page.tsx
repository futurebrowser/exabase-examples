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
  const createMutation = trpc.workspace.create.useMutation({
    onSuccess: (payload) => {
      window.location.href = `/b/${payload.data.baseId}`;
    },
  });

  const err =
    createMutation.error instanceof Error
      ? createMutation.error.message
      : createMutation.error
        ? String(createMutation.error)
        : null;

  return (
    <div className="flex min-h-full min-w-0 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Flashcards</CardTitle>
          <CardDescription>
            Upload PDFs to Exabase, wait for processing, then generate cards
            with the AI SDK. No login — your base id is in the URL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="w-full sm:w-auto"
          >
            {createMutation.isPending ? "…" : "New base"}
          </Button>
          {err ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="font-mono">{err}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
