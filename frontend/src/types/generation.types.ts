export type GenerationMode = "text-to-video" | "image-to-video";

export type GenerationStatus =
  | "idle"
  | "validating"
  | "uploading"
  | "queued"
  | "generating"
  | "completed"
  | "failed"
  | "cancelled";

export type VideoResolution = "480p" | "720p" | "1080p";
export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "21:9";

export interface VideoModel {
  id: string;
  label: string;
  description?: string;
  modes: GenerationMode[];
  durations: number[];
  resolutions: VideoResolution[];
  aspectRatios: AspectRatio[];
}

export interface GenerationFormValues {
  mode: GenerationMode;
  model: string;
  prompt: string;
  negativePrompt?: string;
  duration: number;
  resolution: VideoResolution;
  aspectRatio: AspectRatio;
  seed?: number | null;
  style?: string;
  camera?: string;
  lighting?: string;
  mood?: string;
  motion?: string;
  referenceImage?: File | null;
}

export interface GenerationRequest {
  mode: GenerationMode;
  model: string;
  prompt: string;
  negativePrompt?: string;
  duration: number;
  resolution: VideoResolution;
  aspectRatio: AspectRatio;
  seed?: number;
  referenceImageUrl?: string;
  style?: string;
  camera?: string;
  lighting?: string;
  mood?: string;
  motion?: string;
}

export interface GenerationJob {
  id: string;
  status: GenerationStatus;
  progress?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt?: string;
  request: GenerationRequest;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  model: string;
  mode: GenerationMode;
  resolution: VideoResolution;
  aspectRatio: AspectRatio;
  duration: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  createdAt: string;
  status: GenerationStatus;
  request: GenerationRequest;
}
