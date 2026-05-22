import type { VideoModel } from "@/types/generation.types";

export const VIDEO_MODELS: VideoModel[] = [
  {
    id: "seedance-pro",
    label: "Seedance Pro",
    description: "Modelo avanzado para generación de vídeo de alta calidad.",
    modes: ["text-to-video", "image-to-video"],
    durations: [5, 10],
    resolutions: ["480p", "720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "21:9"],
  },
  {
    id: "seedance-lite",
    label: "Seedance Lite",
    description: "Modelo rápido para pruebas, iteración y previews.",
    modes: ["text-to-video", "image-to-video"],
    durations: [5, 10],
    resolutions: ["480p", "720p"],
    aspectRatios: ["16:9", "9:16", "1:1"],
  },
];

export const DEFAULT_MODEL = VIDEO_MODELS[0];
