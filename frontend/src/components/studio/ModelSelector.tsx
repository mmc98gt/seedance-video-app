import { Control, Controller, useWatch } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VIDEO_MODELS } from "@/config/models";
import { estimateVideoCostUsd, formatCost, qualityTierLabel } from "@/lib/pricing";
import type { GenerationFormValues, VideoModel } from "@/types/generation.types";

function modelSubtitle(model: VideoModel) {
  const exampleDuration = model.durations.includes(10) ? 10 : model.durations[0];
  const cost = estimateVideoCostUsd({ pricing: model.pricing, durationSeconds: exampleDuration });
  const durationLabel = model.pricing?.type === "per_video" ? "video" : `${exampleDuration}s`;
  return `${model.provider} - ${qualityTierLabel(model.qualityTier)} - ${formatCost(cost)} / ${durationLabel}`;
}

export function ModelSelector({ control }: { control: Control<GenerationFormValues> }) {
  const selectedId = useWatch({ control, name: "model" });
  const selectedModel = VIDEO_MODELS.find((model) => model.id === selectedId);

  return (
    <Controller
      control={control}
      name="model"
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <Label>Modelo</Label>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="h-auto min-h-10">
              <SelectValue placeholder="Selecciona modelo" />
            </SelectTrigger>
            <SelectContent className="max-h-96 min-w-[360px]">
              {VIDEO_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id} className="py-2">
                  <div className="flex flex-col gap-1">
                    <span>{model.label}</span>
                    <span className="text-xs text-muted-foreground">{modelSubtitle(model)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedModel && (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{selectedModel.provider}</Badge>
              <Badge variant={selectedModel.qualityTier === "economy" ? "success" : "secondary"}>{qualityTierLabel(selectedModel.qualityTier)}</Badge>
              <span>{selectedModel.modes.join(", ")}</span>
              <span>{selectedModel.pricingDescription}</span>
            </div>
          )}
          {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
        </div>
      )}
    />
  );
}
