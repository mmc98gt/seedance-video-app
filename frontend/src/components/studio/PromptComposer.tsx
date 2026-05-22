import { Copy, WandSparkles } from "lucide-react";
import { Control, Controller, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CAMERA_PRESETS, LIGHTING_PRESETS, MOOD_PRESETS, MOTION_PRESETS, STYLE_PRESETS } from "@/config/generation-presets";
import type { GenerationFormValues } from "@/types/generation.types";

interface PresetGroupProps {
  label: string;
  values: string[];
  active?: string;
  onPick: (value: string) => void;
}

function PresetGroup({ label, values, active, onPick }: PresetGroupProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <Button key={value} type="button" size="sm" variant={active === value ? "default" : "outline"} onClick={() => onPick(active === value ? "" : value)}>
            {value}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function PromptComposer({ control, setValue, watch }: { control: Control<GenerationFormValues>; setValue: UseFormSetValue<GenerationFormValues>; watch: UseFormWatch<GenerationFormValues> }) {
  const prompt = watch("prompt");
  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    toast.success("Prompt copiado.");
  };

  return (
    <div className="space-y-5">
      <Controller
        control={control}
        name="prompt"
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="prompt">Prompt principal</Label>
              <span className="text-xs text-muted-foreground">{field.value.length}/4000</span>
            </div>
            <Textarea id="prompt" rows={8} placeholder="Describe escena, sujeto, movimiento, iluminación, estilo, emoción y detalles de cámara." {...field} />
            {fieldState.error ? <p className="text-xs text-destructive">{fieldState.error.message}</p> : <p className="text-xs text-muted-foreground">Los prompts más concretos suelen producir resultados más consistentes.</p>}
          </div>
        )}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => setValue("prompt", `${prompt}${prompt ? ", " : ""}high detail, cinematic composition`, { shouldValidate: true })}>
          <WandSparkles className="h-4 w-4" />
          Enriquecer prompt
        </Button>
        <Button type="button" variant="outline" onClick={copyPrompt} disabled={!prompt}>
          <Copy className="h-4 w-4" />
          Copiar prompt
        </Button>
      </div>

      <PresetGroup label="Estilo" values={STYLE_PRESETS} active={watch("style")} onPick={(value) => setValue("style", value)} />
      <PresetGroup label="Cámara" values={CAMERA_PRESETS} active={watch("camera")} onPick={(value) => setValue("camera", value)} />
      <PresetGroup label="Iluminación" values={LIGHTING_PRESETS} active={watch("lighting")} onPick={(value) => setValue("lighting", value)} />
      <PresetGroup label="Atmósfera" values={MOOD_PRESETS} active={watch("mood")} onPick={(value) => setValue("mood", value)} />
      <PresetGroup label="Movimiento" values={MOTION_PRESETS} active={watch("motion")} onPick={(value) => setValue("motion", value)} />
    </div>
  );
}
