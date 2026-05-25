import { z } from "zod";
import { VIDEO_MODELS } from "@/config/models";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE, formatBytes } from "@/lib/file";

export const generationSchema = z
  .object({
    mode: z.enum(["text-to-video", "image-to-video", "reference-to-video"], { required_error: "Selecciona un modo de generacion." }),
    model: z.string().min(1, "Selecciona un modelo."),
    prompt: z.string().trim().min(12, "Describe el video con al menos 12 caracteres.").max(4000, "El prompt no puede superar 4000 caracteres."),
    negativePrompt: z.string().max(1000, "El prompt negativo no puede superar 1000 caracteres.").optional(),
    duration: z.coerce.number({ required_error: "Selecciona la duracion." }).min(1, "Selecciona la duracion."),
    resolution: z.enum(["480p", "720p", "1080p", "auto"], { required_error: "Selecciona la resolucion." }),
    aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:3", "21:9"], { required_error: "Selecciona el aspect ratio." }),
    numVideos: z.coerce.number().int("Debe ser un numero entero.").min(1, "Genera al menos un video.").max(8, "Maximo 8 videos."),
    seed: z.coerce.number().int("La seed debe ser un numero entero.").optional().nullable(),
    style: z.string().optional(),
    camera: z.string().optional(),
    lighting: z.string().optional(),
    mood: z.string().optional(),
    motion: z.string().optional(),
    referenceImage: z
      .custom<File | null | undefined>((value) => value == null || value instanceof File, "Archivo de imagen invalido.")
      .refine((file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type), "Usa una imagen JPG, PNG o WebP.")
      .refine((file) => !file || file.size <= MAX_IMAGE_SIZE, `La imagen no puede superar ${formatBytes(MAX_IMAGE_SIZE)}.`)
      .optional()
      .nullable(),
  })
  .superRefine((values, ctx) => {
    const selectedModel = VIDEO_MODELS.find((model) => model.id === values.model);
    if (!selectedModel) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["model"], message: "Modelo desconocido." });
      return;
    }

    if (!selectedModel.modes.includes(values.mode)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["mode"], message: "El modelo no soporta este modo." });
    }
    if (!selectedModel.durations.includes(values.duration)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["duration"], message: "El modelo no soporta esta duracion." });
    }
    if (!selectedModel.resolutions.includes(values.resolution)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["resolution"], message: "El modelo no soporta esta resolucion." });
    }
    if (!selectedModel.aspectRatios.includes(values.aspectRatio)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["aspectRatio"], message: "El modelo no soporta este aspect ratio." });
    }

    if (selectedModel.supportsReferenceImage && (values.mode === "image-to-video" || values.mode === "reference-to-video") && !values.referenceImage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["referenceImage"],
        message: "Sube una imagen de referencia para Image/Reference to Video.",
      });
    }
  });

export type GenerationSchemaValues = z.infer<typeof generationSchema>;
