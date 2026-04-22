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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-20">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>GitHub PR + memory</CardTitle>
          <CardDescription>
            Create a workspace, point it at a public repository, and ingest
            recent pull-request comments as memories. Chat uses Exabase to
            search and add more context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="w-full sm:w-auto"
          >
            {createMutation.isPending ? "Creating..." : "New base"}
          </Button>
          {createMutation.error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {createMutation.error.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
