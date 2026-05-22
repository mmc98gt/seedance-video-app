import { useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useVideoGeneration } from "@/hooks/useVideoGeneration";
import type { GenerationFormValues } from "@/types/generation.types";
import { GenerationForm } from "./GenerationForm";
import { HistoryGrid } from "./HistoryGrid";
import { VideoPreview } from "./VideoPreview";

export function StudioPage() {
  const { currentJob, isSubmitting, generate, retry } = useVideoGeneration();
  const formRef = useRef<UseFormReturn<GenerationFormValues> | null>(null);

  const reuseValues = (values: Partial<GenerationFormValues>) => {
    if (!formRef.current) return;
    formRef.current.reset({ ...formRef.current.getValues(), ...values, referenceImage: null });
    toast.success("Configuración reutilizada.");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
        <div className="xl:col-span-2">
          <GenerationForm isSubmitting={isSubmitting} onSubmit={generate} formRef={formRef} />
        </div>
        <aside className="xl:col-start-3 xl:row-start-1">
          <VideoPreview job={currentJob} onReuse={reuseValues} onRetry={retry} />
        </aside>
      </div>
      <HistoryGrid onReuse={reuseValues} />
    </div>
  );
}
