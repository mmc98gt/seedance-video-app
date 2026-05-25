import { apiRequest } from "@/lib/api-client";
import type {
  CreateJobResponse,
  LegacyGenerationHistory,
  LegacyGenerationResponse,
  LegacyGenerationStatus,
  UploadResponse,
} from "@/types/api.types";
import type { GenerationJob, GenerationRequest, GenerationStatus, HistoryItem } from "@/types/generation.types";

function mapStatus(status: string): GenerationStatus {
  if (status === "pending") return "queued";
  if (status === "running" || status === "processing") return "generating";
  if (status === "error") return "failed";
  if (["idle", "validating", "uploading", "queued", "generating", "completed", "failed", "cancelled"].includes(status)) {
    return status as GenerationStatus;
  }
  return "queued";
}

function firstVideo(status: LegacyGenerationStatus) {
  return status.videos?.find((media) => media.kind === "video") ?? status.videos?.[0];
}

function requestFromLegacy(status: LegacyGenerationStatus): GenerationRequest {
  return {
    mode: status.mode ?? "text-to-video",
    model: status.model || "seedance-pro",
    prompt: status.prompt || "",
    duration: 5,
    resolution: "720p",
    aspectRatio: "16:9",
  };
}

export function legacyToJob(status: LegacyGenerationStatus, fallbackRequest?: GenerationRequest): GenerationJob {
  const media = firstVideo(status);
  return {
    id: status.local_id,
    status: mapStatus(status.status),
    progress: mapStatus(status.status) === "completed" ? 100 : undefined,
    videoUrl: media?.url,
    thumbnailUrl: status.videos?.find((item) => item.kind === "thumbnail")?.url,
    errorMessage: status.error ?? undefined,
    createdAt: status.created_at,
    updatedAt: new Date().toISOString(),
    request: fallbackRequest ?? requestFromLegacy(status),
  };
}

export function jobToHistoryItem(job: GenerationJob): HistoryItem {
  return {
    id: job.id,
    prompt: job.request.prompt,
    model: job.request.model,
    mode: job.request.mode,
    resolution: job.request.resolution,
    aspectRatio: job.request.aspectRatio,
    duration: job.request.duration,
    thumbnailUrl: job.thumbnailUrl,
    videoUrl: job.videoUrl,
    createdAt: job.createdAt,
    status: job.status,
    request: job.request,
  };
}

export async function uploadReferenceImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.set("file", file);
  return apiRequest<UploadResponse>("/upload", { method: "POST", body: formData, timeoutMs: 60000 });
}

export async function createVideoJob(payload: GenerationRequest, referenceImage?: File | null): Promise<GenerationJob> {
  try {
    const response = await apiRequest<CreateJobResponse>("/video/generate", {
      method: "POST",
      body: JSON.stringify(payload),
      timeoutMs: 60000,
    });
    return {
      id: response.id,
      status: response.status,
      progress: response.progress,
      videoUrl: response.videoUrl,
      thumbnailUrl: response.thumbnailUrl,
      errorMessage: response.errorMessage,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      request: payload,
    };
  } catch {
    const formData = new FormData();
    formData.set("prompt", payload.prompt);
    formData.set("model", payload.model);
    formData.set("duration", String(payload.duration));
    formData.set("resolution", payload.resolution);
    formData.set("aspect_ratio", payload.aspectRatio);
    formData.set("mode", payload.mode);
    formData.set("num_videos", "1");
    formData.set("advanced", JSON.stringify({ negative_prompt: payload.negativePrompt, style: payload.style, camera: payload.camera, lighting: payload.lighting, mood: payload.mood, motion: payload.motion }));
    if (payload.seed !== undefined) formData.set("seed", String(payload.seed));
    if (referenceImage) formData.set("reference_image", referenceImage);
    const legacy = await apiRequest<LegacyGenerationResponse>("/generations", { method: "POST", body: formData, timeoutMs: 60000 });
    return {
      id: legacy.local_id,
      status: mapStatus(legacy.status),
      createdAt: new Date().toISOString(),
      request: payload,
    };
  }
}

export async function getVideoJob(jobId: string, request?: GenerationRequest): Promise<GenerationJob> {
  try {
    const job = await apiRequest<CreateJobResponse>(`/video/jobs/${jobId}`);
    return { ...job, request: job.request ?? request ?? requestFromLegacy({ local_id: jobId, status: job.status, created_at: job.createdAt, prompt: "", model: "" }) };
  } catch {
    const legacy = await apiRequest<LegacyGenerationStatus>(`/generations/${jobId}`);
    return legacyToJob(legacy, request);
  }
}

export async function cancelVideoJob(jobId: string): Promise<void> {
  await apiRequest(`/video/jobs/${jobId}/cancel`, { method: "POST" });
}

export async function listRemoteHistory(): Promise<HistoryItem[]> {
  const history = await apiRequest<LegacyGenerationHistory>("/generations");
  return history.generations.map((item) => jobToHistoryItem(legacyToJob(item)));
}
