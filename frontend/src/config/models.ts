import type { VideoModel } from "@/types/generation.types";

export const VIDEO_MODELS: VideoModel[] = [
  {
    id: "seedance-2.0-text-to-video",
    label: "Seedance 2.0 Text-to-Video",
    description: "Generación de vídeo desde prompt de texto con audio nativo.",
    modes: ["text-to-video"],
    durations: [5, 10],
    resolutions: ["480p", "720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "21:9"],
  },
  {
    id: "seedance-2.0-image-to-video",
    label: "Seedance 2.0 Image-to-Video",
    description: "Generación desde imagen inicial (opcional frame final).",
    modes: ["image-to-video"],
    durations: [5, 10],
    resolutions: ["480p", "720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "21:9"],
  },
  {
    id: "seedance-2.0-reference-to-video",
    label: "Seedance 2.0 Reference-to-Video",
    description: "Generación multimodal desde referencias con edición/extensión.",
    modes: ["reference-to-video"],
    durations: [5, 10],
    resolutions: ["480p", "720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "21:9"],
  },
  {
    id: "seedance-2.0-fast-text-to-video",
    label: "Seedance 2.0 Fast Text-to-Video",
    description: "Variante rápida para producción e iteración.",
    modes: ["text-to-video"],
    durations: [5, 10],
    resolutions: ["480p", "720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "21:9"],
  },
  {
    id: "seedance-2.0-fast-image-to-video",
    label: "Seedance 2.0 Fast Image-to-Video",
    description: "Variante rápida desde imagen inicial.",
    modes: ["image-to-video"],
    durations: [5, 10],
    resolutions: ["480p", "720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "21:9"],
  },
  {
    id: "seedance-2.0-fast-reference-to-video",
    label: "Seedance 2.0 Fast Reference-to-Video",
    description: "Variante rápida multimodal para referencias.",
    modes: ["reference-to-video"],
    durations: [5, 10],
    resolutions: ["480p", "720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "21:9"],
  },
];

export const DEFAULT_MODEL = VIDEO_MODELS[0];
