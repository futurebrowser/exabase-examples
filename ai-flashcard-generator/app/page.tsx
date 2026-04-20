"use client";

import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { postCreateWorkspace } from "@/lib/api/client";

export default function Home() {
  const createMutation = useMutation({
    mutationFn: postCreateWorkspace,
    onSuccess: (data) => {
      window.location.href = `/w/${data.workspaceId}`;
    },
  });

  const err =
    createMutation.error instanceof Error ? createMutation.error.message : null;

  return (
    <div className="flex min-h-full min-w-0 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Flashcards</CardTitle>
          <CardDescription>
            Upload PDFs to Exabase, wait for processing, then generate cards
            with the AI SDK. No login — your workspace id is in the URL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="w-full sm:w-auto"
          >
            {createMutation.isPending ? "…" : "New workspace"}
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
