import { Download, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { GenerationFormValues, HistoryItem } from "@/types/generation.types";

export function HistoryCard({ item, onReuse, onRemove }: { item: HistoryItem; onReuse: (values: Partial<GenerationFormValues>) => void; onRemove: (id: string) => void }) {
  return (
    <Card className="overflow-hidden border-white/10 bg-card/70">
      <div className="aspect-video bg-muted">
        {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : item.videoUrl ? <video src={item.videoUrl} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sin preview</div>}
      </div>
      <CardContent className="space-y-3 p-4">
        <div>
          <p className="line-clamp-2 text-sm font-medium">{item.prompt}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.model} · {item.duration}s · {item.resolution} · {new Date(item.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => onReuse(item.request)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button asChild size="sm" variant="outline" disabled={!item.videoUrl}>
            <a href={item.videoUrl ?? "#"} download aria-label="Descargar vídeo"><Download className="h-4 w-4" /></a>
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => onRemove(item.id)} aria-label="Eliminar del historial">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
