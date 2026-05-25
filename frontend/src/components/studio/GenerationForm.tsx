import { zodResolver } from "@hookform/resolvers/zod";
import { Eraser, Loader2, Play } from "lucide-react";
import { useEffect, type MutableRefObject } from "react";
import { Controller, useForm, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_MODEL, VIDEO_MODELS } from "@/config/models";
import { estimateVideoCostUsd, formatCost } from "@/lib/pricing";
import { generationSchema } from "@/schemas/generation.schema";
import type { GenerationFormValues } from "@/types/generation.types";
import { AdvancedSettings } from "./AdvancedSettings";
import { ModelSelector } from "./ModelSelector";
import { PromptComposer } from "./PromptComposer";
import { ReferenceImageUploader } from "./ReferenceImageUploader";

const DEFAULT_VALUES: GenerationFormValues = {
  mode: "text-to-video",
  model: DEFAULT_MODEL.id,
  prompt: "",
  negativePrompt: "",
  duration: DEFAULT_MODEL.durations[0],
  resolution: DEFAULT_MODEL.resolutions[0],
  aspectRatio: DEFAULT_MODEL.aspectRatios[0],
  numVideos: 1,
  seed: null,
  style: "",
  camera: "",
  lighting: "",
  mood: "",
  motion: "",
  referenceImage: null,
};

interface GenerationFormProps {
  isSubmitting: boolean;
  onSubmit: (values: GenerationFormValues) => Promise<unknown>;
  formRef: MutableRefObject<UseFormReturn<GenerationFormValues> | null>;
}

export function GenerationForm({ isSubmitting, onSubmit, formRef }: GenerationFormProps) {
  const form = useForm<GenerationFormValues>({
    resolver: zodResolver(generationSchema),
    mode: "onChange",
    defaultValues: DEFAULT_VALUES,
  });
  formRef.current = form;

  const selectedModel = VIDEO_MODELS.find((model) => model.id === form.watch("model")) ?? DEFAULT_MODEL;
  const mode = form.watch("mode");
  const duration = form.watch("duration");
  const numVideos = form.watch("numVideos");
  const estimatedCost = estimateVideoCostUsd({
    pricing: selectedModel.pricing,
    durationSeconds: duration,
    numVideos,
  });

  useEffect(() => {
    const currentMode = form.getValues("mode");
    if (!selectedModel.modes.includes(currentMode)) {
      form.setValue("mode", selectedModel.modes[0], { shouldValidate: true });
    }
    if (!selectedModel.durations.includes(form.getValues("duration"))) {
      form.setValue("duration", selectedModel.durations[0], { shouldValidate: true });
    }
    if (!selectedModel.resolutions.includes(form.getValues("resolution"))) {
      form.setValue("resolution", selectedModel.resolutions[0], { shouldValidate: true });
    }
    if (!selectedModel.aspectRatios.includes(form.getValues("aspectRatio"))) {
      form.setValue("aspectRatio", selectedModel.aspectRatios[0], { shouldValidate: true });
    }
  }, [form, selectedModel]);

  return (
    <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
      <Card className="border-white/10 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
          <CardDescription>Modelo, modo y formato de salida.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            control={form.control}
            name="mode"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Modo</Label>
                <Tabs value={field.value} onValueChange={field.onChange}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text-to-video" disabled={!selectedModel.modes.includes("text-to-video")}>Text to Video</TabsTrigger>
                    <TabsTrigger value="image-to-video" disabled={!selectedModel.modes.includes("image-to-video")}>Image to Video</TabsTrigger>
                    <TabsTrigger value="reference-to-video" disabled={!selectedModel.modes.includes("reference-to-video")}>Reference to Video</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
          />
          <ModelSelector control={form.control} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Controller
              control={form.control}
              name="duration"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Duración</Label>
                  <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{selectedModel.durations.map((value) => <SelectItem key={value} value={String(value)}>{value}s</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="resolution"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Resolución</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{selectedModel.resolutions.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            />
          </div>
          <Controller
            control={form.control}
            name="aspectRatio"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Aspect ratio</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{selectedModel.aspectRatios.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          />
          <AdvancedSettings control={form.control} />
          <div className="rounded-md border border-white/10 bg-background/50 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Coste estimado</span>
              <span className="font-semibold">{formatCost(estimatedCost)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Coste estimado. El proveedor puede cambiar el precio real.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/80 backdrop-blur lg:col-start-2 lg:row-start-1">
        <CardHeader>
          <CardTitle>Prompt</CardTitle>
          <CardDescription>Define la escena y añade presets creativos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <PromptComposer control={form.control} setValue={form.setValue} watch={form.watch} />
          {(mode === "image-to-video" || mode === "reference-to-video") && (
            <Controller
              control={form.control}
              name="referenceImage"
              render={({ field, fieldState }) => <ReferenceImageUploader value={field.value} onChange={(file) => field.onChange(file)} error={fieldState.error?.message} />}
            />
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className="w-full sm:w-auto" disabled={!form.formState.isValid || isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Generar vídeo
            </Button>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => form.reset(DEFAULT_VALUES)}>
              <Eraser className="h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
