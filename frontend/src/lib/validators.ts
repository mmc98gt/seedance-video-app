import { VIDEO_MODELS } from "@/config/models";
import type { GenerationFormValues, GenerationRequest } from "@/types/generation.types";

function appendIfMissing(parts: string[], value?: string) {
  const cleaned = value?.trim();
  if (!cleaned) return;
  const exists = parts.some((part) => part.toLocaleLowerCase() === cleaned.toLocaleLowerCase());
  if (!exists) parts.push(cleaned);
}

export function buildEnhancedPrompt(values: GenerationFormValues): string {
  const parts = [values.prompt.trim()];
  appendIfMissing(parts, values.style);
  appendIfMissing(parts, values.camera);
  appendIfMissing(parts, values.lighting);
  appendIfMissing(parts, values.mood);
  appendIfMissing(parts, values.motion);
  return parts.join(", ");
}

export function formToRequest(values: GenerationFormValues, referenceImageUrl?: string): GenerationRequest {
  const selectedModel = VIDEO_MODELS.find((model) => model.id === values.model);
  return {
    mode: values.mode,
    model: values.model,
    provider: selectedModel?.provider,
    prompt: buildEnhancedPrompt(values),
    negativePrompt: values.negativePrompt?.trim() || undefined,
    duration: values.duration,
    resolution: values.resolution,
    aspectRatio: values.aspectRatio,
    numVideos: values.numVideos,
    seed: values.seed ?? undefined,
    referenceImageUrl,
    style: values.style,
    camera: values.camera,
    lighting: values.lighting,
    mood: values.mood,
    motion: values.motion,
  };
}
