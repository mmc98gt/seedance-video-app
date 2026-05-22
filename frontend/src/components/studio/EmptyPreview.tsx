import { Clapperboard } from "lucide-react";

export function EmptyPreview() {
  return (
    <div className="flex aspect-video min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-muted/30 p-8 text-center">
      <Clapperboard className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="text-base font-semibold">Tu vídeo aparecerá aquí</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">Escribe un prompt detallado, ajusta el modelo y genera una primera versión para ver el resultado.</p>
    </div>
  );
}
