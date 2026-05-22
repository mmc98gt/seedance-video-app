import { Control, Controller } from "react-hook-form";
import { VIDEO_MODELS } from "@/config/models";
import type { GenerationFormValues } from "@/types/generation.types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ModelSelector({ control }: { control: Control<GenerationFormValues> }) {
  return (
    <Controller
      control={control}
      name="model"
      render={({ field, fieldState }) => (
        <div className="space-y-2">
          <Label>Modelo</Label>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona modelo" />
            </SelectTrigger>
            <SelectContent>
              {VIDEO_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
        </div>
      )}
    />
  );
}
