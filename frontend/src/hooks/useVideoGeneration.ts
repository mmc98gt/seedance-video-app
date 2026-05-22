import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { toUserMessage } from "@/lib/errors";
import { formToRequest } from "@/lib/validators";
import { useGenerationStore } from "@/stores/generation.store";
import { useHistoryStore } from "@/stores/history.store";
import type { GenerationFormValues, GenerationJob, GenerationRequest } from "@/types/generation.types";
import { createVideoJob, getVideoJob, jobToHistoryItem } from "@/services/video.service";

const TERMINAL_STATUSES = ["completed", "failed", "cancelled"];

export function useVideoGeneration() {
  const queryClient = useQueryClient();
  const { currentJob, setCurrentJob, setStatus, resetCurrentJob } = useGenerationStore();
  const addHistoryItem = useHistoryStore((state) => state.addItem);
  const [request, setRequest] = useState<GenerationRequest | undefined>();

  const createMutation = useMutation({
    mutationFn: async (values: GenerationFormValues) => {
      setStatus(values.referenceImage ? "uploading" : "validating");
      const finalRequest = formToRequest(values);
      setRequest(finalRequest);
      return createVideoJob(finalRequest, values.referenceImage);
    },
    onSuccess: (job) => {
      setCurrentJob(job);
      toast.success("Generación enviada al servidor.");
    },
    onError: (error) => {
      setStatus("failed");
      toast.error(toUserMessage(error));
    },
  });

  const jobQuery = useQuery({
    queryKey: ["video-job", currentJob?.id],
    enabled: Boolean(currentJob?.id && !TERMINAL_STATUSES.includes(currentJob.status)),
    queryFn: () => getVideoJob(currentJob!.id, request ?? currentJob?.request),
    refetchInterval: (query) => {
      const data = query.state.data as GenerationJob | undefined;
      return data && TERMINAL_STATUSES.includes(data.status) ? false : 3000;
    },
  });

  useEffect(() => {
    if (!jobQuery.data || jobQuery.data.updatedAt === currentJob?.updatedAt) return;
    setCurrentJob(jobQuery.data);
    if (jobQuery.data.status === "completed") {
      addHistoryItem(jobToHistoryItem(jobQuery.data));
      toast.success("Vídeo generado correctamente.");
    }
    if (jobQuery.data.status === "failed") {
      toast.error(jobQuery.data.errorMessage ?? "La generación ha fallado. Inténtalo de nuevo.");
    }
  }, [addHistoryItem, currentJob?.updatedAt, jobQuery.data, setCurrentJob]);

  return {
    currentJob,
    isSubmitting: createMutation.isPending,
    error: createMutation.error ?? jobQuery.error,
    generate: createMutation.mutateAsync,
    retry: () => currentJob && queryClient.invalidateQueries({ queryKey: ["video-job", currentJob.id] }),
    reset: resetCurrentJob,
  };
}
