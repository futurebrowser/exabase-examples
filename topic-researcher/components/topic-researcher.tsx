"use client";

import {
  Bot,
  ExternalLink,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createTopicResearcher,
  deleteResource,
  deleteWorker,
  getWorkerStatus,
  listWorkerItems,
  listWorkers,
  runWorker,
} from "@/server/actions";

interface Worker {
  id: string;
  name: string;
  createdAt: string;
  accessResourceIds: string[];
}

interface Resource {
  id: string;
  title: string;
  url: string;
  content: string;
  kind: string;
  createdAt: string;
}

export function TopicResearcher() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [items, setItems] = useState<Resource[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  const [topicInput, setTopicInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [runningWorkers, setRunningWorkers] = useState<Record<string, string>>(
    {},
  );
  const [deletingWorkers, setDeletingWorkers] = useState<
    Record<string, boolean>
  >({});
  const [deletingItems, setDeletingItems] = useState<Record<string, boolean>>(
    {},
  );

  const loadWorkers = useCallback(async () => {
    setIsLoadingWorkers(true);
    try {
      const data = await listWorkers();
      setWorkers(data);
    } catch (err) {
      console.error("Failed to load workers", err);
    } finally {
      setIsLoadingWorkers(false);
    }
  }, []);

  useEffect(() => {
    loadWorkers();
  }, [loadWorkers]);

  const loadItems = useCallback(async (worker: Worker) => {
    if (!worker.accessResourceIds || worker.accessResourceIds.length === 0)
      return;

    setIsLoadingItems(true);
    try {
      const workerBaseId = worker.accessResourceIds[0];
      const data = await listWorkerItems(workerBaseId);
      setItems(data);
    } catch (err) {
      console.error("Failed to load items", err);
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWorkerId) {
      const worker = workers.find((w) => w.id === selectedWorkerId);
      if (worker) {
        loadItems(worker);
      }
    } else {
      setItems([]);
    }
  }, [selectedWorkerId, workers, loadItems]);

  // Periodic polling for running workers
  useEffect(() => {
    const runningWorkerIds = Object.keys(runningWorkers);
    if (runningWorkerIds.length === 0) return;

    const interval = setInterval(async () => {
      for (const workerId of runningWorkerIds) {
        const chatId = runningWorkers[workerId];
        if (!chatId || chatId === "starting") continue;

        try {
          const status = await getWorkerStatus(workerId, chatId);

          // Refresh items if this is the selected worker
          if (selectedWorkerId === workerId) {
            const worker = workers.find((w) => w.id === workerId);
            if (worker) {
              loadItems(worker);
            }
          }

          if (!status.isRunning) {
            setRunningWorkers((prev) => {
              const next = { ...prev };
              delete next[workerId];
              return next;
            });
          }
        } catch (err) {
          console.error(`Failed to poll status for worker ${workerId}`, err);
        }
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [runningWorkers, selectedWorkerId, workers, loadItems]);

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() || isCreating) return;

    setIsCreating(true);
    try {
      await createTopicResearcher(topicInput.trim());
      setTopicInput("");
      await loadWorkers();
    } catch (err) {
      console.error("Failed to create worker", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRunWorker = async (worker: Worker) => {
    if (!worker.accessResourceIds || worker.accessResourceIds.length === 0)
      return;

    setRunningWorkers((prev) => ({ ...prev, [worker.id]: "starting" }));
    setSelectedWorkerId(worker.id);
    try {
      const workerBaseId = worker.accessResourceIds[0];
      const runRes = await runWorker(worker.id, workerBaseId);
      const chatId = runRes.chatId;

      if (chatId) {
        setRunningWorkers((prev) => ({ ...prev, [worker.id]: chatId }));
      } else {
        // Fallback if no chatId returned, refresh workers
        setTimeout(() => {
          if (selectedWorkerId === worker.id) {
            loadItems(worker);
          }
          setRunningWorkers((prev) => {
            const next = { ...prev };
            delete next[worker.id];
            return next;
          });
        }, 5000);
      }
    } catch (err) {
      console.error("Failed to run worker", err);
      setRunningWorkers((prev) => {
        const next = { ...prev };
        delete next[worker.id];
        return next;
      });
    }
  };

  const handleDeleteWorker = async (worker: Worker) => {
    if (!worker.accessResourceIds || worker.accessResourceIds.length === 0)
      return;

    setDeletingWorkers((prev) => ({ ...prev, [worker.id]: true }));
    try {
      const workerBaseId = worker.accessResourceIds[0];
      await deleteWorker(worker.id, workerBaseId);
      setRunningWorkers((prev) => {
        const next = { ...prev };
        delete next[worker.id];
        return next;
      });
      if (selectedWorkerId === worker.id) {
        setSelectedWorkerId(null);
      }
      await loadWorkers();
    } catch (err) {
      console.error("Failed to delete worker", err);
    } finally {
      setDeletingWorkers((prev) => ({ ...prev, [worker.id]: false }));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const worker = workers.find((w) => w.id === selectedWorkerId);
    if (!worker?.accessResourceIds || worker.accessResourceIds.length === 0)
      return;

    setDeletingItems((prev) => ({ ...prev, [itemId]: true }));
    try {
      const workerBaseId = worker.accessResourceIds[0];
      await deleteResource(itemId, workerBaseId);
      await loadItems(worker);
    } catch (err) {
      console.error("Failed to delete item", err);
    } finally {
      setDeletingItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Create Worker Section */}
      <Card className="border-white/5 bg-black/40 backdrop-blur-xl py-4">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            New Topic Researcher
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter a topic to create an AI agent that will scour the web and
            curate bookmarks for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateWorker} className="flex gap-3">
            <Input
              placeholder="e.g. Quantum computing"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              className="bg-black/50 border-white/10 text-white placeholder:text-gray-500 flex-1 h-11 px-4 text-base rounded-md"
              disabled={isCreating}
            />
            <Button
              type="submit"
              disabled={!topicInput.trim() || isCreating}
              className="h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-all"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Worker
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Workers List Section */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bot className="w-5 h-5" /> Your Agents
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={loadWorkers}
              disabled={isLoadingWorkers}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingWorkers ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          <div className="space-y-3">
            {isLoadingWorkers && workers.length === 0 ? (
              <div className="py-12 text-center text-gray-500 flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin mb-4 opacity-50" />
                <p>Loading your agents...</p>
              </div>
            ) : workers.length === 0 ? (
              <div className="py-12 text-center text-gray-500 bg-black/20 rounded-xl border border-white/5">
                <p>No agents yet. Create one above!</p>
              </div>
            ) : (
              workers.map((worker) => (
                <Card
                  key={worker.id}
                  className={`border-white/10 bg-black/40 backdrop-blur transition-all cursor-pointer hover:bg-black/60 ${selectedWorkerId === worker.id ? "ring-2 ring-blue-500 border-transparent" : ""}`}
                  onClick={() => setSelectedWorkerId(worker.id)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="min-w-0 pr-4">
                      <h3 className="font-medium text-white truncate text-base">
                        {worker.name.replace("Topic Researcher: ", "")}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Created{" "}
                        {new Date(worker.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunWorker(worker);
                        }}
                        disabled={runningWorkers[worker.id]}
                        title="Run Worker Now"
                      >
                        {runningWorkers[worker.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWorker(worker);
                        }}
                        disabled={deletingWorkers[worker.id]}
                        title="Delete Worker"
                      >
                        {deletingWorkers[worker.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              Found Results{" "}
              {selectedWorkerId && items.length > 0 && (
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full ml-2">
                  {items.length}
                </span>
              )}
            </h2>
            {selectedWorkerId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const w = workers.find((w) => w.id === selectedWorkerId);
                  if (w) loadItems(w);
                }}
                disabled={isLoadingItems}
                className="text-gray-400 hover:text-white"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoadingItems ? "animate-spin" : ""}`}
                />
              </Button>
            )}
          </div>

          <Card className="border-white/5 bg-black/40 backdrop-blur-xl min-h-[400px]">
            <CardContent className="p-0">
              {!selectedWorkerId ? (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  Select an agent to view its research results
                </div>
              ) : isLoadingItems && items.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 opacity-50" />
                  <p>Loading results...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-gray-500">
                  <p className="mb-2">No results found yet.</p>
                  <p className="text-sm">Try running the agent to find some!</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-white/[0.02] transition-colors flex items-start gap-4 group"
                    >
                      <div className="flex-1 min-w-0">
                        {item.kind === "bookmark" ? (
                          <>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-2 text-base leading-tight mb-1"
                            >
                              {item.title}
                              <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </a>
                            <p
                              className="text-sm text-gray-500 truncate"
                              title={item.url}
                            >
                              {item.url}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-green-400 text-base leading-tight mb-1">
                              {item.title}
                            </p>
                            {item.content && (
                              <p className="text-sm text-gray-500 line-clamp-3">
                                {item.content}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={deletingItems[item.id]}
                      >
                        {deletingItems[item.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
