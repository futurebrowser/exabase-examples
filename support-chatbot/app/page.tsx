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
          <CardTitle>Personal assistant demo</CardTitle>
          <CardDescription>
            Memory-first personal assistant: create a workspace, seed personal
            context, and ask questions that depend on what the assistant knows
            about your life and work.
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
