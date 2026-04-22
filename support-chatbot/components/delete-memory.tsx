import { RiDeleteBin2Line } from "@remixicon/react";
import { Loader2Icon } from "lucide-react";
import { trpc } from "@/lib/trpc/react";
import { Button } from "./ui/button";

export const DeleteMemoryButton = ({
  memoryId,
  baseId,
  className,
}: {
  memoryId: string;
  baseId: string;
  className?: string;
}) => {
  const utils = trpc.useUtils();
  const deleteMutation = trpc.memory.delete.useMutation({
    onSuccess: () => {
      void utils.memory.list.invalidate({ baseId: baseId });
    },
  });

  return (
    <Button
      variant="destructive"
      className={className}
      onClick={() =>
        deleteMutation.mutate({ baseId: baseId, memoryId: memoryId })
      }
      disabled={deleteMutation.isPending}
    >
      {deleteMutation.isPending ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <RiDeleteBin2Line className="size-4" />
      )}
    </Button>
  );
};
