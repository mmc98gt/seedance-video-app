import { Control, Controller } from "react-hook-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GenerationFormValues } from "@/types/generation.types";

export function AdvancedSettings({ control }: { control: Control<GenerationFormValues> }) {
  return (
    <Accordion type="single" collapsible defaultValue="advanced">
      <AccordionItem value="advanced" className="border-white/10">
        <AccordionTrigger>Parámetros avanzados</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <Controller
            control={control}
            name="negativePrompt"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label htmlFor="negativePrompt">Prompt negativo</Label>
                <Textarea id="negativePrompt" rows={3} placeholder="low quality, artifacts, blurry..." {...field} />
                {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
              </div>
            )}
          />
          <Controller
            control={control}
            name="seed"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label htmlFor="seed">Seed opcional</Label>
                <Input id="seed" type="number" placeholder="12345" value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : null)} />
                {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
              </div>
            )}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
