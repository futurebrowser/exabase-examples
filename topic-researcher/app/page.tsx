import { AlertTriangle } from "lucide-react";
import { TopicResearcher } from "@/components/topic-researcher";

export default function Home() {
  const isMissingApiKey = !process.env.EXABASE_API_KEY;
  const isMissingBaseId = !process.env.EXABASE_BASE_ID;
  const isMissingEnv = isMissingApiKey || isMissingBaseId;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-foreground flex justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl space-y-8">
        {isMissingEnv && (
          <div className="bg-red-950/50 border border-red-900 text-red-200 p-4 rounded-lg flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-red-400" />
            <div>
              <h3 className="font-semibold text-red-300">
                Configuration Required
              </h3>
              <p className="text-sm mt-1">
                You are missing required environment variables:{" "}
                {isMissingApiKey && (
                  <code className="bg-red-900/50 px-1 py-0.5 rounded mr-1">
                    EXABASE_API_KEY
                  </code>
                )}
                {isMissingBaseId && (
                  <code className="bg-red-900/50 px-1 py-0.5 rounded">
                    EXABASE_BASE_ID
                  </code>
                )}
                <br className="mb-1" />
                Please add them to your{" "}
                <code className="bg-red-900/50 px-1 py-0.5 rounded">.env</code>{" "}
                file to use this application.
              </p>
            </div>
          </div>
        )}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Topic Researcher
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Create background AI agents that research topics on the web and save
            the best articles using the Exabase Workers API.
          </p>
        </div>
        <TopicResearcher />
      </div>
    </main>
  );
}
