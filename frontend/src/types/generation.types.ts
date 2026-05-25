export type GenerationMode = "text-to-video" | "image-to-video" | "reference-to-video";
export type VideoProvider = "seedance" | "fal";
export type QualityTier = "economy" | "balanced" | "premium";

export type GenerationStatus =
  | "idle"
  | "validating"
  | "uploading"
  | "queued"
  | "generating"
  | "completed"
  | "failed"
  | "cancelled";

export type VideoResolution = "480p" | "720p" | "1080p" | "auto";
export type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "21:9";

export type VideoPricing =
  | { type: "per_second"; pricePerSecondUsd: number; pricePerVideoUsd?: never }
  | { type: "per_video"; pricePerVideoUsd: number; pricePerSecondUsd?: never };

export interface VideoModel {
  id: string;
  label: string;
  provider: VideoProvider;
  endpoint: string;
  description?: string;
  modes: GenerationMode[];
  durations: number[];
  resolutions: VideoResolution[];
  aspectRatios: AspectRatio[];
  pricing?: VideoPricing;
  qualityTier: QualityTier;
  supportsAudio: boolean;
  supportsReferenceImage: boolean;
  supportsTextPrompt: boolean;
  pricingDescription?: string;
}

export interface GenerationFormValues {
  mode: GenerationMode;
  model: string;
  prompt: string;
  negativePrompt?: string;
  duration: number;
  resolution: VideoResolution;
  aspectRatio: AspectRatio;
  numVideos: number;
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
  provider?: VideoProvider;
  prompt: string;
  negativePrompt?: string;
  duration: number;
  resolution: VideoResolution;
  aspectRatio: AspectRatio;
  numVideos: number;
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
  numVideos?: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  createdAt: string;
  status: GenerationStatus;
  request: GenerationRequest;
}
