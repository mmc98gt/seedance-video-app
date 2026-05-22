import type { GenerationJob, GenerationStatus } from "./generation.types";

export interface ApiErrorPayload {
  detail?: string | Array<{ msg?: string }>;
  error?: string;
  message?: string;
}

export interface LegacyGenerationResponse {
  local_id: string;
  status: string;
  status_url?: string;
}

export interface LegacyMediaFile {
  filename: string;
  url: string;
  kind?: string;
}

export interface LegacyGenerationStatus {
  local_id: string;
  status: string;
  created_at: string;
  prompt: string;
  model: string;
  videos?: LegacyMediaFile[];
  error?: string | null;
  upstream_id?: string | null;
}

export interface LegacyGenerationHistory {
  generations: LegacyGenerationStatus[];
}

export interface UploadResponse {
  url: string;
}

export interface CreateJobResponse extends Partial<GenerationJob> {
  id: string;
  status: GenerationStatus;
  createdAt: string;
}
